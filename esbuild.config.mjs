import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";

const prod = process.argv[2] === "production";

function minifyCss(css) {
  // + や - はセレクタ結合子としても使われるが、 calc(a + b) などの値式でも
  // 使われる。値式での前後の空白を潰すと calc が無効化されてルール全体が
  // 破棄されるため、 + - はここでは詰めない。
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,>~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function buildStyles() {
  const src = fs.readFileSync("styles.css", "utf8");
  const out = minifyCss(src);
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync(path.join("dist", "styles.css"), out);
}

// `/* @css */` マーカー付き template literal をビルド時にミニファイする esbuild プラグイン。
// 例: `` `/* @css */ body { color: ${c}; } ` `` の中身を圧縮する。
// バックティック内の `${...}` プレースホルダは保持して、その周辺の空白だけ詰める。
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

// プレースホルダ内のコードに含まれるネスト template literal も圧縮する。
// 親が `/* @css */` の中にある以上、入れ子のテンプレートも CSS とみなして再帰処理する。
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
  // 完全圧縮版（リリースアセット用）: JS圧縮 + 動的CSS(@cssマーカー)も圧縮
  await esbuild.build({
    ...baseBuildOptions,
    outfile: "dist/main.js",
    minify: true,
    sourcemap: false,
    plugins: [cssEvalPlugin],
  });
  // 半圧縮版（リポジトリ追跡用）: JSは圧縮するが、動的CSSのテンプレートリテラルは
  // 元の改行・空白のまま残す。差分追跡・デバッグ時に CSS が読めるようにする。
  await esbuild.build({
    ...baseBuildOptions,
    outfile: "main.js",
    minify: true,
    sourcemap: false,
  });
  buildStyles();
  process.exit(0);
} else {
  // watch モード: リポジトリ版と同じ半圧縮
  const context = await esbuild.context({
    ...baseBuildOptions,
    outfile: "main.js",
    minify: true,
    sourcemap: "inline",
  });
  await context.watch();
}
