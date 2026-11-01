import { EditorView, WidgetType } from "@codemirror/view";
import type { App } from "obsidian";
import { MarkdownView, editorInfoField, loadPrism, renderMath, finishRenderMath } from "obsidian";
import type WrotPlugin from "../main";
import { isMathJaxReady, requestMathJax } from "../utils/mathjax";
import {
  renderImagePreview,
  renderOGPCard,
  renderTwitterCard,
  isSafeUrl,
  type ParsedUrl,
} from "../utils/urlRenderer";
import { renderQuoteCard } from "../utils/quoteCard";
import { parseListLine } from "../utils/listParser";
import type { OGPCache } from "../utils/ogpCache";

/**
 * Live Preview widgets.
 *
 * Each replaces a stretch of raw markdown inside a ```wr fence with its rendered form, mirroring
 * what Reading View shows. They hold no state beyond their constructor arguments, which is what
 * `eq` compares to decide whether CodeMirror can keep the existing DOM.
 */

/**
 * Nesting offset for a list marker.
 *
 * One line is one .cm-line here, so a nested item cannot be wrapped in a child list the way
 * reading view does. The marker carries the indent instead, and the text after it follows.
 */
function indentClass(depth: number): string {
  return depth > 0 ? ` wrot-lp-indent-${depth}` : "";
}

export class BulletWidget extends WidgetType {
  constructor(private depth: number = 0) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = `wrot-lp-marker wrot-lp-bullet${indentClass(this.depth)}`;
    return span;
  }
  eq(other: BulletWidget): boolean { return this.depth === other.depth; }
}

export class CheckboxWidget extends WidgetType {
  constructor(private checked: boolean, private depth: number = 0) { super(); }
  toDOM(view: EditorView): HTMLElement {
    const wrap = createSpan();
    wrap.className = `wrot-lp-marker wrot-lp-check${indentClass(this.depth)}`;
    const cb = createEl("input");
    cb.type = "checkbox";
    cb.checked = this.checked;
    cb.addEventListener("click", (e) => {
      // updateDOM reuses DOM, so derive state from the doc at click time (listener may be stale).
      // No preventDefault: the browser would roll checked back afterward, leaving the box stale.
      // The marker is re-found from the line rather than from the widget position, which an
      // indented item shares with the hidden indent before it.
      const line = view.state.doc.lineAt(view.posAtDOM(wrap));
      const quotePrefix = /^(?:>\s?)+/.exec(line.text)?.[0].length ?? 0;
      const info = parseListLine(line.text.slice(quotePrefix), true);
      if (!info || info.kind !== "check") {
        // Position not identifiable: skip the doc write and revert the box.
        e.preventDefault();
        return;
      }
      // The char inside "[ ]" sits three characters into the marker.
      const statePos = line.from + quotePrefix + info.indentLength + 3;
      const next = view.state.doc.sliceString(statePos, statePos + 1) === " ";
      cb.checked = next;
      view.dispatch({ changes: { from: statePos, to: statePos + 1, insert: next ? "x" : " " } });
      // Written now rather than on Obsidian's delayed autosave, so the timeline follows at once.
      const owner = view.state.field(editorInfoField, false);
      if (owner instanceof MarkdownView) void owner.save();
    });
    wrap.appendChild(cb);
    return wrap;
  }
  // Reuse the DOM instead of replacing the widget; only diff the checked state.
  updateDOM(dom: HTMLElement): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- assertion needed for cross-version Obsidian typings
    const cb = dom.querySelector("input[type=\"checkbox\"]") as HTMLInputElement | null;
    if (!cb) return false;
    if (cb.checked !== this.checked) cb.checked = this.checked;
    return true;
  }
  eq(other: CheckboxWidget): boolean {
    return this.checked === other.checked && this.depth === other.depth;
  }
  // Keep events from the editor: a mousedown would move the cursor into the block,
  // opening it as raw text and diverging from RV.
  ignoreEvent(): boolean { return true; }
}

/**
 * Runs fn on a click or a tap. A tap is taken at touchend with its default stopped: left to the
 * browser, it puts the caret in the editor and opens the block as raw text before the click
 * arrives. A touch that moved (a scroll) is left alone.
 */
function onTap(el: HTMLElement, fn: () => void): void {
  let start: { x: number; y: number } | null = null;
  el.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    start = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (!start || Math.hypot(t.clientX - start.x, t.clientY - start.y) > 10) return;
    e.preventDefault();
    e.stopPropagation();
    fn();
  });
  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  });
}

// Read-mode tag; click opens global search. A clickable mark would open the block raw
// on mousedown, so use an ignoreEvent widget. While editing it stays plain text + tagMark.
export class TagWidget extends WidgetType {
  constructor(private tag: string, private plugin: WrotPlugin) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan({ cls: "wrot-tag-highlight wrot-tag-clickable", text: this.tag });
    onTap(span, () => {
      // Press feedback: remove class and force reflow so rapid clicks re-trigger the flash.
      span.classList.remove("wrot-tag-flash");
      void span.offsetWidth;
      span.classList.add("wrot-tag-flash");
      this.plugin.openTagSearch(this.tag);
    });
    return span;
  }
  eq(other: TagWidget): boolean { return this.tag === other.tag; }
  ignoreEvent(): boolean { return true; }
}

export class OlMarkerWidget extends WidgetType {
  constructor(private label: string, private depth: number = 0) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = `wrot-lp-marker wrot-lp-ol${indentClass(this.depth)}`;
    span.textContent = this.label;
    return span;
  }
  eq(other: OlMarkerWidget): boolean {
    return this.label === other.label && this.depth === other.depth;
  }
}

export class ObsidianLinkWidget extends WidgetType {
  constructor(
    private url: string,
    private displayName: string,
    private unresolved: boolean = false
  ) { super(); }
  toDOM(): HTMLElement {
    const link = createEl("a");
    link.className = this.unresolved
      ? "wrot-internal-link wrot-internal-link-unresolved"
      : "wrot-internal-link";
    link.textContent = this.displayName;
    onTap(link, () => {
      if (isSafeUrl(this.url)) window.open(this.url);
    });
    return link;
  }
  eq(other: ObsidianLinkWidget): boolean {
    return this.url === other.url && this.unresolved === other.unresolved;
  }
  // A mousedown reaching the editor would put the caret in the block and open it as raw
  // text before the click lands, as with tags and checkboxes.
  ignoreEvent(): boolean { return true; }
}

export class MdLinkWidget extends WidgetType {
  constructor(private label: string, private url: string) { super(); }
  toDOM(): HTMLElement {
    const link = createEl("a");
    link.className = "wrot-url-highlight";
    link.textContent = this.label;
    onTap(link, () => {
      if (isSafeUrl(this.url)) window.open(this.url, "_blank");
    });
    return link;
  }
  eq(other: MdLinkWidget): boolean {
    return this.url === other.url && this.label === other.label;
  }
  ignoreEvent(): boolean { return true; }
}

export class InternalLinkWidget extends WidgetType {
  constructor(
    private fileName: string,
    private display: string,
    private app: App,
    private resolved: boolean
  ) { super(); }
  toDOM(): HTMLElement {
    const link = createEl("a");
    link.className = this.resolved
      ? "wrot-internal-link"
      : "wrot-internal-link wrot-internal-link-unresolved";
    link.textContent = this.display;
    onTap(link, () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.app.workspace.openLinkText(this.fileName, "", false);
    });
    return link;
  }
  eq(other: InternalLinkWidget): boolean {
    return this.fileName === other.fileName && this.display === other.display && this.resolved === other.resolved;
  }
  ignoreEvent(): boolean { return true; }
}

export class EmbedMissingWidget extends WidgetType {
  constructor(private fileName: string) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = "wrot-embed-missing";
    span.textContent = `![[${this.fileName}]]`;
    return span;
  }
  eq(other: EmbedMissingWidget): boolean {
    return this.fileName === other.fileName;
  }
  ignoreEvent(): boolean { return false; }
}

export class MathWidget extends WidgetType {
  // MathJax loads lazily; including readiness in eq() makes post-load rebuilds
  // replace fallback-rendered widgets.
  private hadMathJax = isMathJaxReady();
  constructor(private tex: string) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = "wrot-math";
    try {
      // Branch explicitly instead of relying on renderMath's behavior when MathJax is missing.
      if (!this.hadMathJax) throw new Error("MathJax not loaded yet");
      const rendered = renderMath(this.tex, false);
      span.appendChild(rendered);
      void finishRenderMath();
    } catch {
      span.classList.add("wrot-math-fallback");
      span.textContent = `$${this.tex}$`;
      requestMathJax();
    }
    return span;
  }
  eq(other: MathWidget): boolean { return this.tex === other.tex && this.hadMathJax === other.hadMathJax; }
}

export class CodeBlockWidget extends WidgetType {
  constructor(
    private code: string,
    private lang: string,
    private ruleClass: string | null
  ) { super(); }
  toDOM(): HTMLElement {
    const container = createDiv();
    container.className = "wrot-codeblock-display wrot-lp-codeblock wrot-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);

    const pre = container.createEl("pre");
    if (this.lang) pre.className = `language-${this.lang}`;
    const codeEl = pre.createEl("code");
    if (this.lang) codeEl.className = `language-${this.lang}`;
    codeEl.textContent = this.code;

    // Prism token colors are already defined in Obsidian's app.css.
    if (this.lang) {
      loadPrism().then((Prism: { highlightElement: (el: HTMLElement) => void }) => {
        Prism.highlightElement(codeEl);
      }).catch(() => {});
    }

    return container;
  }
  eq(other: CodeBlockWidget): boolean {
    return this.code === other.code && this.lang === other.lang && this.ruleClass === other.ruleClass;
  }
  ignoreEvent(): boolean { return false; }
}

export class MathBlockWidget extends WidgetType {
  // As in MathWidget: eq() includes MathJax readiness so lazy-load rebuilds the DOM.
  private hadMathJax = isMathJaxReady();
  constructor(private tex: string, private ruleClass: string | null) { super(); }
  toDOM(): HTMLElement {
    const container = createDiv();
    container.className = "wrot-math-display wrot-lp-mathblock wrot-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    try {
      // Branch explicitly instead of relying on renderMath's behavior when MathJax is missing.
      if (!this.hadMathJax) throw new Error("MathJax not loaded yet");
      const rendered = renderMath(this.tex, true);
      container.appendChild(rendered);
      void finishRenderMath();
    } catch {
      container.classList.add("wrot-math-fallback");
      container.textContent = this.tex;
      requestMathJax();
    }
    return container;
  }
  eq(other: MathBlockWidget): boolean {
    return this.tex === other.tex && this.ruleClass === other.ruleClass && this.hadMathJax === other.hadMathJax;
  }
  ignoreEvent(): boolean { return false; }
}


export class EmbedImageWidget extends WidgetType {
  constructor(
    private images: { src: string; alt: string }[],
    private ruleClass: string | null
  ) { super(); }
  toDOM(): HTMLElement {
    const container = createDiv();
    // Avoids CSS :has(): children always contain wrot-embed-img, so set the state class directly.
    container.className = "wrot-media-area wrot-lp-media wrot-has-img";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    for (const { src, alt } of this.images) {
      const img = createEl("img");
      img.className = "wrot-embed-img";
      img.src = src;
      img.alt = alt;
      img.loading = "lazy";
      container.appendChild(img);
    }
    return container;
  }
  eq(other: EmbedImageWidget): boolean {
    if (this.ruleClass !== other.ruleClass) return false;
    if (this.images.length !== other.images.length) return false;
    return this.images.every((img, i) => img.src === other.images[i].src);
  }
  ignoreEvent(): boolean { return true; }
}

// Inline image for quote-marker posts, rendered at its written position.
export class InlineEmbedImageWidget extends WidgetType {
  constructor(private src: string, private alt: string) { super(); }
  toDOM(): HTMLElement {
    const wrapper = createDiv();
    wrapper.className = "wrot-lp-inline-img-wrapper";
    const img = createEl("img");
    img.className = "wrot-embed-img wrot-lp-inline-img";
    img.src = this.src;
    img.alt = this.alt;
    img.loading = "lazy";
    wrapper.appendChild(img);
    return wrapper;
  }
  eq(other: InlineEmbedImageWidget): boolean {
    return this.src === other.src && this.alt === other.alt;
  }
  ignoreEvent(): boolean { return true; }
}



export class UrlPreviewWidget extends WidgetType {
  private cachedSnapshot: boolean[];

  constructor(
    private parsedUrls: ParsedUrl[],
    private ogpCache: OGPCache,
    private ruleClass: string | null,
    private resolveImagePath: (fileName: string) => string | null
  ) {
    super();
    this.cachedSnapshot = parsedUrls.map(
      (pu) => {
        const d = ogpCache.get(pu.url);
        return !!(d && (d.title || d.description));
      }
    );
  }

  eq(other: UrlPreviewWidget): boolean {
    if (this.ruleClass !== other.ruleClass) return false;
    if (this.parsedUrls.length !== other.parsedUrls.length) return false;
    for (let i = 0; i < this.parsedUrls.length; i++) {
      if (this.parsedUrls[i].url !== other.parsedUrls[i].url) return false;
      if (this.cachedSnapshot[i] !== other.cachedSnapshot[i]) return false;
    }
    return true;
  }

  toDOM(): HTMLElement {
    const container = createDiv();
    container.className = "wrot-media-area wrot-lp-media";
    if (this.ruleClass) container.classList.add(this.ruleClass);

    for (const pu of this.parsedUrls) {
      if (pu.type === "image") {
        renderImagePreview(container, pu.url, this.resolveImagePath);
      } else {
        const cached = this.ogpCache.get(pu.url);
        if (cached && (cached.title || cached.description)) {
          if (pu.type === "twitter") {
            renderTwitterCard(container, cached);
          } else {
            renderOGPCard(container, cached);
          }
        }
      }
    }

    return container;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// Block widget at endLine.to for quote-marker posts: URL previews first, quote card last
// ("quote at the bottom"). The in-body marker is hidden separately to avoid double rendering.
export class QuoteBlockWidget extends WidgetType {
  private cachedSnapshot: boolean[];

  constructor(
    private fileName: string,
    private blockId: string,
    private parsedUrls: ParsedUrl[],
    private app: App,
    private currentFilePath: string,
    private ruleClass: string | null,
    private timestampFormat: string,
    private ogpCache: OGPCache,
    private resolveImagePath: (fileName: string) => string | null,
    private resolveQuoteRuleClass: (content: string) => string | null,
    private resolveQuoteRuleAccent: (ruleClass: string) => string | null,
    private checkStrikethrough: boolean
  ) {
    super();
    this.cachedSnapshot = parsedUrls.map((pu) => {
      const d = ogpCache.get(pu.url);
      return !!(d && (d.title || d.description));
    });
  }

  eq(other: QuoteBlockWidget): boolean {
    if (this.fileName !== other.fileName) return false;
    if (this.blockId !== other.blockId) return false;
    if (this.ruleClass !== other.ruleClass) return false;
    if (this.timestampFormat !== other.timestampFormat) return false;
    if (this.checkStrikethrough !== other.checkStrikethrough) return false;
    if (this.parsedUrls.length !== other.parsedUrls.length) return false;
    for (let i = 0; i < this.parsedUrls.length; i++) {
      if (this.parsedUrls[i].url !== other.parsedUrls[i].url) return false;
      if (this.cachedSnapshot[i] !== other.cachedSnapshot[i]) return false;
    }
    return true;
  }

  toDOM(): HTMLElement {
    const container = createDiv();
    container.className = "wrot-quote-block";
    if (this.ruleClass) container.classList.add(this.ruleClass);

    if (this.parsedUrls.length > 0) {
      const mediaArea = createDiv();
      mediaArea.className = "wrot-media-area wrot-lp-media";
      if (this.ruleClass) mediaArea.classList.add(this.ruleClass);
      let hasContent = false;
      for (const pu of this.parsedUrls) {
        if (pu.type === "image") {
          renderImagePreview(mediaArea, pu.url, this.resolveImagePath);
          hasContent = true;
        } else {
          const cached = this.ogpCache.get(pu.url);
          if (cached && (cached.title || cached.description)) {
            if (pu.type === "twitter") {
              renderTwitterCard(mediaArea, cached);
            } else {
              renderOGPCard(mediaArea, cached);
            }
            hasContent = true;
          }
        }
      }
      if (hasContent) container.appendChild(mediaArea);
    }

    const slot = createSpan();
    slot.className = "wrot-quote-card-slot wrot-lp-quote-card";
    if (this.ruleClass) slot.classList.add(this.ruleClass);
    renderQuoteCard(slot, this.fileName, this.blockId, this.app, this.currentFilePath, {
      timestampFormat: this.timestampFormat,
      resolveRuleClass: this.resolveQuoteRuleClass,
      resolveRuleAccent: this.resolveQuoteRuleAccent,
      checkStrikethrough: this.checkStrikethrough,
    });
    container.appendChild(slot);

    return container;
  }

  // true so CodeMirror doesn't swallow clicks on <a>/quote-card inside the widget;
  // without it URL-card and image-URL clicks are lost.
  ignoreEvent(): boolean { return true; }
}
