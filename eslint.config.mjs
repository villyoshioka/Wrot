// Type-aware lint for src/. The rule set is the one the existing eslint-disable comments in the
// source were written against (typescript-eslint's recommended type-checked rules), so those
// comments now actually suppress something.
//
// Note: the Obsidian community submission review additionally runs eslint-plugin-obsidianmd.
// That plugin is not a dependency here -- it pulls in a large advisory-laden tree -- so it stays
// an ad-hoc, install-when-submitting step (see .claude/OBSIDIAN_DEVELOPMENT.md).
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["main.js", "dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      // typescript-eslint turns no-undef off for TS. It is re-enabled here so this config agrees
      // with the submission review, which reports `require` under that rule.
      globals: {
        ...globals.browser,
        activeDocument: "readonly",
        activeWindow: "readonly",
        createEl: "readonly",
        createDiv: "readonly",
        createSpan: "readonly",
        createFragment: "readonly",
        moment: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
    },
  },
  {
    // Build scripts are plain ESM run by Node, outside the TypeScript project.
    files: ["*.mjs", "scripts/**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  }
);
