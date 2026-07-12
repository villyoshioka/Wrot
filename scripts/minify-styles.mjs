// Minifies styles.css in place; run by the release workflow just before asset
// upload (the repo copy stays unminified — do not run locally).
// Whitespace around + / - is preserved: collapsing it inside calc() drops the
// whole rule (same policy as minifyCss in esbuild.config.mjs).
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
