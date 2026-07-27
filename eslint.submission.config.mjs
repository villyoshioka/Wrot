// Local reproduction of the Obsidian community submission review.
// Not part of `npm run lint`: eslint-plugin-obsidianmd is installed ad hoc for this check only
// (`npm i --no-save eslint-plugin-obsidianmd`), because it drags in a large advisory-laden tree.
//   npx eslint --config eslint.submission.config.mjs "src/**/*.ts"
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
  { ignores: ["main.js", "dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
