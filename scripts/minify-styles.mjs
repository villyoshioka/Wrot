// Run by the release workflow before asset upload; refuses outside CI because the repo copy is the editable source.
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
