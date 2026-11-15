import esbuild from "esbuild";
import path from "path";

// esbuild plugin: each locale becomes a value array in ja.ts key order, with the key list shipped once, so the bundle carries the keys one time. Sources stay as they are.

const I18N_DIR = path.resolve("src/i18n");
const KEYS_MODULE = "wr-i18n-keys";
// Go regex syntax (no lookahead): index.ts is skipped inside the handler instead.
const I18N_FILE = /src[\\/]i18n[\\/][\w-]+\.ts$/;
// Locales packed as a diff over another locale (en-GB spreads en in its source).
const DIFF_BASES = { "en-GB": "en" };

// Bundles one locale file on its own (en-GB pulls in en) and evaluates it to the object.
async function evalDict(file) {
  const result = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: "cjs",
    platform: "node",
    logLevel: "silent",
  });
  const mod = { exports: {} };
  new Function("module", "exports", result.outputFiles[0].text)(mod, mod.exports);
  return mod.exports.default;
}

export function i18nPackPlugin() {
  return {
    name: "wr-i18n-pack",
    setup(build) {
      const dicts = new Map();
      const dictOf = (file) => {
        if (!dicts.has(file)) dicts.set(file, evalDict(file));
        return dicts.get(file);
      };
      const keysPromise = dictOf(path.join(I18N_DIR, "ja.ts")).then((ja) => Object.keys(ja));

      build.onResolve({ filter: new RegExp(`^${KEYS_MODULE}$`) }, () => ({
        path: KEYS_MODULE,
        namespace: "wr-i18n",
      }));

      build.onLoad({ filter: /.*/, namespace: "wr-i18n" }, async () => {
        const keys = await keysPromise;
        return {
          contents:
            `export const K=${JSON.stringify(keys)};` +
            // Values sit in a function body the engine only skims; the object is built on first lookup.
            `export const D=(f)=>{let o=null;return new Proxy({},{get:(_,k)=>{if(o===null){const v=f();o={};for(let i=0;i<K.length;i++)o[K[i]]=v[i];}return o[k];}});};`,
          loader: "js",
        };
      });

      build.onLoad({ filter: I18N_FILE }, async (args) => {
        if (path.basename(args.path) === "index.ts") return undefined;
        const [keys, dict] = await Promise.all([keysPromise, dictOf(args.path)]);
        const own = Object.keys(dict);
        const missing = keys.filter((k) => !(k in dict));
        const extra = own.filter((k) => !keys.includes(k));
        if (missing.length || extra.length) {
          throw new Error(
            `${path.basename(args.path)}: keys differ from ja.ts` +
              (missing.length ? ` (missing: ${missing.join(", ")})` : "") +
              (extra.length ? ` (extra: ${extra.join(", ")})` : "")
          );
        }
        const values = keys.map((k) => dict[k]);
        const base = DIFF_BASES[path.basename(args.path, ".ts")];
        if (base) {
          // Ship only the entries that differ from the base locale; the rest is read through it.
          const baseDict = await dictOf(path.join(I18N_DIR, `${base}.ts`));
          const diff = {};
          keys.forEach((k, i) => {
            if (dict[k] !== baseDict[k]) diff[i] = dict[k];
          });
          return {
            contents:
              `import {D,K} from "${KEYS_MODULE}";import b from "./${base}.ts";` +
              `export default D(()=>{const o=${JSON.stringify(diff)};return K.map((k,i)=>i in o?o[i]:b[k]);});`,
            loader: "js",
            resolveDir: I18N_DIR,
          };
        }
        return {
          contents:
            `import {D} from "${KEYS_MODULE}";` +
            `export default D(()=>${JSON.stringify(values)});`,
          loader: "js",
        };
      });
    },
  };
}
