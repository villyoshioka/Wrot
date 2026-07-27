// Single definition of the CSS minification policy, shared by the esbuild build (which
// minifies `/* @css */` template literals) and the release step (which minifies styles.css).
// Keeping one copy avoids the release asset and dist/ drifting apart.

/**
 * Whitespace around + and - is preserved: collapsing it inside calc()
 * invalidates the expression and drops the whole rule.
 */
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,>~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s+!important/g, "!important")
    .trim();
}
