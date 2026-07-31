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
 * A runtime stylesheet, adopted into documents rather than injected as a <style> tag.
 *
 * Adopted sheets sort after every document stylesheet, so these rules keep the last word without
 * needing to be re-appended on every update. A sheet belongs to the realm it was constructed in,
 * so every window Wrot can appear in — the main one plus any popout, including the settings
 * window — gets its own copy of the same CSS.
 */
export class WrStyleSheet {
  private sheets = new Map<Document, CSSStyleSheet>();
  // Kept so a newly opened window can be given the current CSS without recomputing it.
  private css: string | null = null;

  /** `marker` is emitted as a custom property so the sheet stays identifiable in DevTools. */
  constructor(private readonly marker: string) {}

  apply(css: string, docs: Document[]): void {
    this.css = css;
    this.sync(docs);
  }

  /** Re-adopts the current CSS into `docs`, dropping the sheets of documents no longer listed. */
  sync(docs: Document[]): void {
    if (this.css === null) return;
    const wanted = new Set(docs);

    for (const doc of this.sheets.keys()) {
      if (!wanted.has(doc)) this.removeFrom(doc);
    }

    for (const doc of wanted) {
      const win = doc.defaultView;
      if (!win) continue;
      let sheet = this.sheets.get(doc);
      if (!sheet) {
        sheet = new win.CSSStyleSheet();
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
        this.sheets.set(doc, sheet);
      }
      sheet.replaceSync(`:root { --${this.marker}: 1; }\n${this.css}`);
    }
  }

  remove(): void {
    for (const doc of [...this.sheets.keys()]) this.removeFrom(doc);
    this.css = null;
  }

  private removeFrom(doc: Document): void {
    const sheet = this.sheets.get(doc);
    if (sheet) {
      doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== sheet);
    }
    this.sheets.delete(doc);
  }
}
