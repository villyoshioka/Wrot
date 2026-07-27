// Minifies styles.css in place; run by the release workflow just before asset upload.
// The repo copy stays unminified, so running this locally would rewrite the source file.
// It refuses to run outside CI for that reason; pass --force if that is really the intent.
import fs from "fs";
import process from "process";
import { minifyCss } from "./css-minify.mjs";

const forced = process.argv.includes("--force");
if (!process.env.CI && !forced) {
  console.error(
    "minify-styles: refusing to rewrite styles.css outside CI (the repo copy is the editable source).\n" +
      "Pass --force if you really mean to minify it in place."
  );
  process.exit(1);
}

const src = fs.readFileSync("styles.css", "utf8");
const out = minifyCss(src);
fs.writeFileSync("styles.css", out);
console.log(`styles.css minified: ${src.length} -> ${out.length} bytes`);
