// リリース用に styles.css をその場で圧縮する。リポジトリの styles.css は
// 非圧縮（人間が読む版・残置 !important の理由コメント込み）のまま管理し、
// このスクリプトは GitHub Actions のリリースワークフローがアセット添付の
// 直前に実行する。ローカルでは実行不要。コメントは配布物では全削除する。
// + や - はセレクタ結合子としても使われるが、calc(a + b) などの値式でも
// 使われる。値式での前後の空白を潰すと calc が無効化されてルール全体が
// 破棄されるため、+ - はここでは詰めない (esbuild.config.mjs の minifyCss と同じ方針)。
import fs from "fs";

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,>~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s+!important/g, "!important")
    .trim();
}

const src = fs.readFileSync("styles.css", "utf8");
const out = minifyCss(src);
fs.writeFileSync("styles.css", out);
console.log(`styles.css minified: ${src.length} -> ${out.length} bytes`);
