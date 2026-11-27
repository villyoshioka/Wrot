// Shared by the esbuild build and the release step so the release asset and dist/ never drift.

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
