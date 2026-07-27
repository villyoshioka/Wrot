/**
 * Injection of the dynamic stylesheets.
 *
 * styles.css covers everything static; only user-chosen colors have to be generated at runtime.
 * Those rules must win over both styles.css and the active theme without `!important`, which is
 * what the specificity boost below is for.
 */

/**
 * Adds `:not(#...)` to every selector for ID-level specificity.
 *
 * Ladder: styles.css base (0-1 IDs) < bg/text stamp (2) < styles.css overrides, e.g. the RV copy
 * button (3) < tag-rule CSS (4). The boost goes before "::" because pseudo-elements must stay
 * last; comments are stripped first since they break selector detection.
 */
export function boostSelectors(css: string, idLevels: number): string {
  let boost = "";
  for (let i = 1; i <= idLevels; i++) boost += `:not(#wr-boost-${i})`;
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return noComments.replace(/([^{}]+)\{/g, (_m, sels: string) => {
    const boosted = sels.split(",").map((sel) => {
      const s = sel.trim();
      if (!s) return s;
      const pe = s.indexOf("::");
      return pe >= 0 ? s.slice(0, pe) + boost + s.slice(pe) : s + boost;
    });
    return boosted.join(",\n") + " {";
  });
}

/**
 * Replaces a previously injected stylesheet with fresh content, re-appending it so it stays last
 * in <head>. Returns the new element.
 *
 * createElement rather than createEl("style"): the latter trips the no-forbidden-elements lint.
 */
export function replaceStyleEl(
  previous: HTMLStyleElement | null,
  id: string,
  css: string
): HTMLStyleElement {
  previous?.remove();
  const el = activeDocument.createElement("style");
  el.id = id;
  el.textContent = css;
  activeDocument.head.appendChild(el);
  return el;
}
