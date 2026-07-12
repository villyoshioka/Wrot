import esbuild from "esbuild";
import process from "process";
import fs from "fs";

const prod = process.argv[2] === "production";

function minifyCss(css) {
  // Whitespace around + and - is preserved: collapsing it inside calc()
  // invalidates the expression and drops the whole rule.
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,>~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s+!important/g, "!important")
    .trim();
}

// Repo-root styles.css stays unminified (hand-edited; CI minifies it at release
// via scripts/minify-styles.mjs), so this build never touches it.

// esbuild plugin: minifies template literals starting with a `/* @css */` marker,
// preserving `${...}` placeholders while collapsing the CSS around them.
const cssEvalPlugin = {
  name: "wr-css-eval",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      let text = await fs.promises.readFile(args.path, "utf8");
      if (text.includes("/* @css */")) {
        text = inlineCssMarkers(text);
      }
      return { contents: text, loader: "ts" };
    });
  },
};

function inlineCssMarkers(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    if (source[i] === "`") {
      const tickEnd = findTemplateEnd(source, i);
      if (tickEnd < 0) { out += source.slice(i); break; }
      const body = source.slice(i + 1, tickEnd);
      const marker = body.match(/^\s*\/\*\s*@css\s*\*\//);
      if (marker) {
        const rest = body.slice(marker[0].length);
        out += "`" + minifyTemplateBody(rest) + "`";
      } else {
        out += source.slice(i, tickEnd + 1);
      }
      i = tickEnd + 1;
    } else {
      out += source[i];
      i++;
    }
  }
  return out;
}

function findTemplateEnd(s, start) {
  let i = start + 1;
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") { i += 2; continue; }
    if (c === "$" && s[i + 1] === "{") {
      i += 2;
      let depth = 1;
      while (i < s.length && depth > 0) {
        const cc = s[i];
        if (cc === "{") depth++;
        else if (cc === "}") depth--;
        i++;
      }
      continue;
    }
    if (c === "`") return i;
    i++;
  }
  return -1;
}

function minifyTemplateBody(body) {
  const placeholders = [];
  let out = "";
  let i = 0;
  while (i < body.length) {
    if (body[i] === "$" && body[i + 1] === "{") {
      let depth = 1, j = i + 2;
      while (j < body.length && depth > 0) {
        if (body[j] === "{") depth++;
        else if (body[j] === "}") depth--;
        if (depth === 0) break;
        j++;
      }
      const ph = body.slice(i, j + 1);
      const token = `__WR_CSS_PH_${placeholders.length}__`;
      placeholders.push(minifyNestedTemplates(ph));
      out += token;
      i = j + 1;
    } else {
      out += body[i];
      i++;
    }
  }
  const minified = minifyCss(out);
  return minified.replace(/__WR_CSS_PH_(\d+)__/g, (_, idx) => placeholders[Number(idx)]);
}

// Templates nested inside placeholders are still CSS (the parent is `/* @css */`),
// so minify them recursively.
function minifyNestedTemplates(code) {
  let out = "";
  let i = 0;
  while (i < code.length) {
    if (code[i] === "`") {
      const tickEnd = findTemplateEnd(code, i);
      if (tickEnd < 0) { out += code.slice(i); break; }
      const body = code.slice(i + 1, tickEnd);
      const marker = body.match(/^\s*\/\*\s*@css\s*\*\//);
      const cssBody = marker ? body.slice(marker[0].length) : body;
      out += "`" + minifyTemplateBody(cssBody) + "`";
      i = tickEnd + 1;
    } else {
      out += code[i];
      i++;
    }
  }
  return out;
}

const externalDeps = [
  "obsidian",
  "electron",
  "@codemirror/autocomplete",
  "@codemirror/collab",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/lint",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/lr",
];

const baseBuildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: externalDeps,
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  treeShaking: true,
};

if (prod) {
  // Full minified build (tracked in repo, doubles as the release asset):
  // JS plus dynamic `/* @css */` templates.
  await esbuild.build({
    ...baseBuildOptions,
    outfile: "main.js",
    minify: true,
    sourcemap: false,
    plugins: [cssEvalPlugin],
  });
  // Mirror the release trio into dist/ (untracked) for local checks; the CSS
  // minifier matches CI, so dist/ contents equal the release assets.
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/styles.css", minifyCss(fs.readFileSync("styles.css", "utf8")));
  fs.copyFileSync("main.js", "dist/main.js");
  fs.copyFileSync("manifest.json", "dist/manifest.json");
  process.exit(0);
} else {
  // Dev watch: JS minified, dynamic CSS template literals left intact for debugging.
  const context = await esbuild.context({
    ...baseBuildOptions,
    outfile: "main.js",
    minify: true,
    sourcemap: "inline",
  });
  await context.watch();
}
