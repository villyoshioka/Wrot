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
 * A runtime stylesheet, adopted into the active document rather than injected as a <style> tag.
 *
 * Adopted sheets sort after every document stylesheet, so these rules keep the last word without
 * needing to be re-appended on every update. The sheet belongs to the realm it was constructed in,
 * hence the re-adoption when the active document changes (popout windows).
 */
export class WrStyleSheet {
  private sheet: CSSStyleSheet | null = null;
  private doc: Document | null = null;

  /** `marker` is emitted as a custom property so the sheet stays identifiable in DevTools. */
  constructor(private readonly marker: string) {}

  apply(css: string): void {
    const doc = activeDocument;
    if (this.doc !== doc) this.remove();
    const win = doc.defaultView;
    if (!win) return;
    const sheet = this.sheet ?? new win.CSSStyleSheet();
    sheet.replaceSync(`:root { --${this.marker}: 1; }\n${css}`);
    if (this.doc === null) {
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      this.doc = doc;
      this.sheet = sheet;
    }
  }

  remove(): void {
    const sheet = this.sheet;
    if (this.doc && sheet) {
      this.doc.adoptedStyleSheets = this.doc.adoptedStyleSheets.filter((s) => s !== sheet);
    }
    this.sheet = null;
    this.doc = null;
  }
}
