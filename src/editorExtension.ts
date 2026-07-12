import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import type { App } from "obsidian";
import { loadPrism } from "obsidian";
import type WrotPlugin from "./main";
import { findBlockRanges, type BlockRange } from "./utils/blockSegmenter";
import { isMathJaxReady, requestMathJax } from "./utils/mathjax";

const ogpFetched = StateEffect.define<null>();
export const tagRulesChanged = StateEffect.define<null>();
export const vaultFilesChanged = StateEffect.define<null>();

// ViewPlugin cannot emit block decorations, so line ranges to hide are passed to
// this StateField, which collapses them with a block:true replace.
const setHiddenRanges = StateEffect.define<{ from: number; to: number }[]>();

const hiddenBlockReplace = Decoration.replace({ block: true });

const hiddenLineStateField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setHiddenRanges)) {
        const builder = new RangeSetBuilder<Decoration>();
        for (const r of e.value) {
          if (r.to > r.from) builder.add(r.from, r.to, hiddenBlockReplace);
        }
        deco = builder.finish();
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});
import {
  extractUrls,
  renderImagePreview,
  renderOGPCard,
  renderTwitterCard,
  isSafeUrl,
  QUOTE_LINK_RE,
  type ParsedUrl,
} from "./utils/urlRenderer";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API signature / future use
import { renderQuoteCard, invalidateMemoCache } from "./utils/quoteCard";
import type { OGPCache } from "./utils/ogpCache";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API signature / future use
import type { OGPData } from "./utils/ogpCache";

const tagMark = Decoration.mark({ class: "wr-tag-highlight" });
const urlMark = Decoration.mark({ class: "wr-url-highlight" });
const olMark = Decoration.mark({ class: "wr-ol-highlight" });
const internalLinkMark = Decoration.mark({ class: "wr-internal-link-highlight" });
const internalLinkUnresolvedMark = Decoration.mark({
  class: "wr-internal-link-highlight wr-internal-link-unresolved",
});
const inlineCodeMark = Decoration.mark({ class: "wr-inline-code-highlight" });
const mathMark = Decoration.mark({ class: "wr-math-highlight" });
const boldMark = Decoration.mark({ class: "wr-bold-highlight" });
const italicMark = Decoration.mark({ class: "wr-italic-highlight" });
const strikeMark = Decoration.mark({ class: "wr-strike-highlight" });
const highlightMark = Decoration.mark({ class: "wr-highlight-highlight" });
const replaceHidden = Decoration.replace({});

const lineDecoCache = new Map<string, Decoration>();
function makeLineDeco(classes: (string | null | undefined)[]): Decoration {
  const key = classes.filter(Boolean).join(" ");
  let deco = lineDecoCache.get(key);
  if (!deco) {
    deco = Decoration.line({ class: key });
    lineDecoCache.set(key, deco);
  }
  return deco;
}

class BulletWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = "wr-lp-marker wr-lp-bullet";
    span.textContent = "\u2022";
    return span;
  }
  eq(): boolean { return true; }
}

class CheckboxWidget extends WidgetType {
  constructor(private checked: boolean) { super(); }
  toDOM(view: EditorView): HTMLElement {
    const wrap = createSpan();
    wrap.className = "wr-lp-marker wr-lp-check";
    const cb = createEl("input");
    cb.type = "checkbox";
    cb.checked = this.checked;
    cb.addEventListener("click", (e) => {
      // updateDOM reuses DOM, so derive state from the doc at click time (listener may be stale).
      // No preventDefault: the browser would roll checked back afterward, leaving the box stale.
      const pos = view.posAtDOM(wrap);
      if (!/^- \[[ x]\] /.test(view.state.doc.sliceString(pos, pos + 6))) {
        // Position not identifiable: skip the doc write and revert the box.
        e.preventDefault();
        return;
      }
      // The char inside "[ ]" is at pos+3.
      const next = view.state.doc.sliceString(pos + 3, pos + 4) === " ";
      cb.checked = next;
      view.dispatch({ changes: { from: pos + 3, to: pos + 4, insert: next ? "x" : " " } });
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
  eq(other: CheckboxWidget): boolean { return this.checked === other.checked; }
  // Keep events from the editor: a mousedown would move the cursor into the block,
  // opening it as raw text and diverging from RV.
  ignoreEvent(): boolean { return true; }
}

// Read-mode tag; click opens global search. A clickable mark would open the block raw
// on mousedown, so use an ignoreEvent widget. While editing it stays plain text + tagMark.
class TagWidget extends WidgetType {
  constructor(private tag: string, private plugin: WrotPlugin) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan({ cls: "wr-tag-highlight wr-tag-clickable", text: this.tag });
    span.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Press feedback: remove class and force reflow so rapid clicks re-trigger the flash.
      span.classList.remove("wr-tag-flash");
      void span.offsetWidth;
      span.classList.add("wr-tag-flash");
      this.plugin.openTagSearch(this.tag);
    });
    return span;
  }
  eq(other: TagWidget): boolean { return this.tag === other.tag; }
  ignoreEvent(): boolean { return true; }
}

class OlMarkerWidget extends WidgetType {
  constructor(private label: string) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = "wr-lp-marker wr-lp-ol";
    span.textContent = this.label;
    return span;
  }
  eq(other: OlMarkerWidget): boolean { return this.label === other.label; }
}

class ObsidianLinkWidget extends WidgetType {
  constructor(
    private url: string,
    private displayName: string,
    private unresolved: boolean = false
  ) { super(); }
  toDOM(): HTMLElement {
    const link = createEl("a");
    link.className = this.unresolved
      ? "wr-internal-link wr-internal-link-unresolved"
      : "wr-internal-link";
    link.textContent = this.displayName;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSafeUrl(this.url)) window.open(this.url);
    });
    return link;
  }
  eq(other: ObsidianLinkWidget): boolean {
    return this.url === other.url && this.unresolved === other.unresolved;
  }
  ignoreEvent(): boolean { return false; }
}

class MdLinkWidget extends WidgetType {
  constructor(private label: string, private url: string) { super(); }
  toDOM(): HTMLElement {
    const link = createEl("a");
    link.className = "wr-url-highlight";
    link.textContent = this.label;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSafeUrl(this.url)) window.open(this.url, "_blank");
    });
    return link;
  }
  eq(other: MdLinkWidget): boolean {
    return this.url === other.url && this.label === other.label;
  }
  ignoreEvent(): boolean { return false; }
}

class InternalLinkWidget extends WidgetType {
  constructor(private fileName: string, private app: App, private resolved: boolean) { super(); }
  toDOM(): HTMLElement {
    const link = createEl("a");
    link.className = this.resolved
      ? "wr-internal-link"
      : "wr-internal-link wr-internal-link-unresolved";
    link.textContent = this.fileName;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.app.workspace.openLinkText(this.fileName, "", false);
    });
    return link;
  }
  eq(other: InternalLinkWidget): boolean {
    return this.fileName === other.fileName && this.resolved === other.resolved;
  }
  ignoreEvent(): boolean { return false; }
}

class EmbedMissingWidget extends WidgetType {
  constructor(private fileName: string) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = "wr-embed-missing";
    span.textContent = `![[${this.fileName}]]`;
    return span;
  }
  eq(other: EmbedMissingWidget): boolean {
    return this.fileName === other.fileName;
  }
  ignoreEvent(): boolean { return false; }
}

class MathWidget extends WidgetType {
  // MathJax loads lazily; including readiness in eq() makes post-load rebuilds
  // replace fallback-rendered widgets.
  private hadMathJax = isMathJaxReady();
  constructor(private tex: string) { super(); }
  toDOM(): HTMLElement {
    const span = createSpan();
    span.className = "wr-math";
    try {
      // Branch explicitly instead of relying on renderMath's behavior when MathJax is missing.
      if (!this.hadMathJax) throw new Error("MathJax not loaded yet");
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, no-undef -- internal Obsidian/CodeMirror API or intentional pattern
      const { renderMath, finishRenderMath } = require("obsidian");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- internal Obsidian/CodeMirror API or intentional pattern
      const rendered = renderMath(this.tex, false);
      span.appendChild(rendered);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- call into untyped Obsidian/CodeMirror internal API
      finishRenderMath();
    } catch {
      span.classList.add("wr-math-fallback");
      span.textContent = `$${this.tex}$`;
      requestMathJax();
    }
    return span;
  }
  eq(other: MathWidget): boolean { return this.tex === other.tex && this.hadMathJax === other.hadMathJax; }
}

class CodeBlockWidget extends WidgetType {
  constructor(
    private code: string,
    private lang: string,
    private app: App,
    private plugin: WrotPlugin,
    private ruleClass: string | null
  ) { super(); }
  toDOM(): HTMLElement {
    const container = createDiv();
    container.className = "wr-codeblock-display wr-lp-codeblock wr-codeblock-line";
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

class MathBlockWidget extends WidgetType {
  // As in MathWidget: eq() includes MathJax readiness so lazy-load rebuilds the DOM.
  private hadMathJax = isMathJaxReady();
  constructor(private tex: string, private ruleClass: string | null) { super(); }
  toDOM(): HTMLElement {
    const container = createDiv();
    container.className = "wr-math-display wr-lp-mathblock wr-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    try {
      // Branch explicitly instead of relying on renderMath's behavior when MathJax is missing.
      if (!this.hadMathJax) throw new Error("MathJax not loaded yet");
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, no-undef -- internal Obsidian/CodeMirror API or intentional pattern
      const { renderMath, finishRenderMath } = require("obsidian");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- internal Obsidian/CodeMirror API or intentional pattern
      const rendered = renderMath(this.tex, true);
      container.appendChild(rendered);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- call into untyped Obsidian/CodeMirror internal API
      finishRenderMath();
    } catch {
      container.classList.add("wr-math-fallback");
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

const IMAGE_EXT_RE = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;

class EmbedImageWidget extends WidgetType {
  constructor(
    private images: { src: string; alt: string }[],
    private ruleClass: string | null
  ) { super(); }
  toDOM(): HTMLElement {
    const container = createDiv();
    // Avoids CSS :has(): children always contain wr-embed-img, so set the state class directly.
    container.className = "wr-media-area wr-lp-media wr-has-img";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    for (const { src, alt } of this.images) {
      const img = createEl("img");
      img.className = "wr-embed-img";
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
class InlineEmbedImageWidget extends WidgetType {
  constructor(private src: string, private alt: string) { super(); }
  toDOM(): HTMLElement {
    const wrapper = createDiv();
    wrapper.className = "wr-lp-inline-img-wrapper";
    const img = createEl("img");
    img.className = "wr-embed-img wr-lp-inline-img";
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



class UrlPreviewWidget extends WidgetType {
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
    container.className = "wr-media-area wr-lp-media";
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
    return false;
  }
}

// Block widget at endLine.to for quote-marker posts: URL previews first, quote card last
// ("quote at the bottom"). The in-body marker is hidden separately to avoid double rendering.
class QuoteBlockWidget extends WidgetType {
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
    container.className = "wr-quote-block";
    if (this.ruleClass) container.classList.add(this.ruleClass);

    if (this.parsedUrls.length > 0) {
      const mediaArea = createDiv();
      mediaArea.className = "wr-media-area wr-lp-media";
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

    // Quote card always goes at the bottom.
    const slot = createSpan();
    slot.className = "wr-quote-card-slot wr-lp-quote-card";
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

interface WrBlock {
  startLn: number;
  endLn: number;
  urlTexts: string[];
  ruleClass: string | null;
  innerBlocks: BlockRange[];
  blockId: string | null;
  hasQuoteMarker: boolean;
  // 1-based doc line of the first quote marker [[X#^wr-T]]; -1 if none.
  quoteLineIdx: number;
}

function findWrBlocks(view: EditorView, plugin: WrotPlugin | null): WrBlock[] {
  const blocks: WrBlock[] = [];
  const doc = view.state.doc;

  for (let ln = 1; ln <= doc.lines; ln++) {
    const line = doc.line(ln);
    if (!line.text.trim().startsWith("```wr")) continue;

    const startLn = ln;
    let endLn = 0;

    for (let j = startLn + 1; j <= doc.lines; j++) {
      if (doc.line(j).text.trim() === "```") {
        endLn = j;
        break;
      }
    }
    if (endLn === 0) continue;

    const bodyLines: string[] = [];
    for (let j = startLn + 1; j < endLn; j++) {
      bodyLines.push(doc.line(j).text);
    }
    const innerBlocks = findBlockRanges(bodyLines);

    const blockedDocLines = new Set<number>();
    for (const br of innerBlocks) {
      for (let k = br.startLine; k <= br.endLine; k++) {
        blockedDocLines.add(startLn + 1 + k);
      }
    }

    const urlTexts: string[] = [];
    const tags: string[] = [];
    for (let j = startLn + 1; j < endLn; j++) {
      if (blockedDocLines.has(j)) continue;
      const l = doc.line(j);
      const urlRegex = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
      let match;
      while ((match = urlRegex.exec(l.text)) !== null) {
        urlTexts.push(match[0]);
      }
      const tagMatches = l.text.match(/#[^\s#]+/g);
      if (tagMatches) tags.push(...tagMatches);
    }

    let ruleClass: string | null = null;
    if (plugin) {
      const rule = plugin.findTagColorRule(tags);
      if (rule) {
        const idx = plugin.settings.tagColorRules.indexOf(rule);
        if (idx >= 0) ruleClass = `wr-tag-rule-${idx}`;
      }
    }

    // Block ID (^wr-T) from the opening fence, used to target the flash highlight.
    const fenceLine = doc.line(startLn).text;
    const blockIdMatch = fenceLine.match(/\^(wr-\d{17})/);
    const blockId = blockIdMatch ? blockIdMatch[1] : null;

    let hasQuoteMarker = false;
    let quoteLineIdx = -1;
    for (let j = startLn + 1; j < endLn; j++) {
      // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
      if (/\[\[[^\[\]]+#\^wr-\d{17}\]\]/.test(doc.line(j).text)) {
        hasQuoteMarker = true;
        quoteLineIdx = j;
        break;
      }
    }

    blocks.push({ startLn, endLn, urlTexts, ruleClass, innerBlocks, blockId, hasQuoteMarker, quoteLineIdx });
    ln = endLn;
  }

  return blocks;
}

function buildDecorations(
  view: EditorView,
  ogpCache: OGPCache,
  blocks: WrBlock[],
  app: App,
  plugin: WrotPlugin,
  checkStrikethrough: boolean
): { decorations: DecorationSet; hiddenRanges: { from: number; to: number }[] } {
  const builder = new RangeSetBuilder<Decoration>();
  const hiddenRanges: { from: number; to: number }[] = [];
  const doc = view.state.doc;

  // Source mode shows raw markdown with no replace decorations.
  const isSourceMode = !view.contentDOM.closest(".is-live-preview");

  const cursorLineNums = new Set<number>();
  for (const range of view.state.selection.ranges) {
    const startLine = doc.lineAt(range.from).number;
    const endLine = doc.lineAt(range.to).number;
    for (let n = startLine; n <= endLine; n++) cursorLineNums.add(n);
  }

  const cursorInBlock = (b: WrBlock) => {
    for (let n = b.startLn; n <= b.endLn; n++) {
      if (cursorLineNums.has(n)) return true;
    }
    return false;
  };

  try {
    for (const block of blocks) {
      const openLine = doc.line(block.startLn);
      builder.add(openLine.from, openLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));

      // Live preview: cursor anywhere in the block shows it raw.
      const blockHasCursor = cursorInBlock(block);

      const embedImages: { src: string; alt: string }[] = [];

      // Inner blocks: widget on the start line only; other lines get background classes.
      const innerBlockStartByDocLine = new Map<number, { range: BlockRange; docStart: number; docEnd: number }>();
      const innerBlockInsideDocLines = new Set<number>();
      for (const br of block.innerBlocks) {
        const docStart = block.startLn + 1 + br.startLine;
        const docEnd = block.startLn + 1 + br.endLine;
        innerBlockStartByDocLine.set(docStart, { range: br, docStart, docEnd });
        for (let k = docStart; k <= docEnd; k++) {
          innerBlockInsideDocLines.add(k);
        }
      }

      for (let j = block.startLn + 1; j < block.endLn; j++) {
        const l = doc.line(j);
        const showRaw = isSourceMode || blockHasCursor;

        const innerStart = innerBlockStartByDocLine.get(j);

        // Raw view keeps nested blocks as plain text too.
        if (showRaw && innerBlockInsideDocLines.has(j)) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
          continue;
        }

        if (innerStart && !showRaw) {
          const { range, docStart, docEnd } = innerStart;

          const innerBodyLines: string[] = [];
          const bodyStart = docStart + 1;
          const bodyEnd = docEnd - 1;
          for (let k = bodyStart; k <= bodyEnd; k++) {
            innerBodyLines.push(doc.line(k).text);
          }
          // Handles single-line $$x$$ and unclosed blocks (docStart === docEnd).
          let widgetContent: string;
          if (range.kind === "mathblock" && docStart === docEnd) {
            const lineText = doc.line(docStart).text.trim();
            const inner = lineText.startsWith("$$") && lineText.endsWith("$$") && lineText.length >= 4
              ? lineText.slice(2, -2)
              : lineText;
            widgetContent = inner;
          } else {
            widgetContent = innerBodyLines.join("\n");
          }

          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));

          // ViewPlugin can only emit inline replace, not block replace.
          const startLine = doc.line(docStart);
          const widget = range.kind === "codeblock"
            ? Decoration.replace({ widget: new CodeBlockWidget(widgetContent, range.lang || "", app, plugin, block.ruleClass) })
            : Decoration.replace({ widget: new MathBlockWidget(widgetContent, block.ruleClass) });
          builder.add(startLine.from, startLine.to, widget);

          // Collapse remaining lines via block:true replace so CM drops their line height.
          if (docEnd > docStart) {
            const tailStart = doc.line(docStart + 1).from;
            const tailEnd = doc.line(docEnd).to;
            hiddenRanges.push({ from: tailStart, to: tailEnd });
          }

          j = docEnd;
          continue;
        }

        if (innerBlockInsideDocLines.has(j)) {
          continue;
        }

        const quotePrefixMatch = l.text.match(/^(?:>\s?)+/);
        const quotePrefix = quotePrefixMatch ? quotePrefixMatch[0].length : 0;
        const quoteDepth = quotePrefixMatch ? (quotePrefixMatch[0].match(/>/g) || []).length : 0;
        const innerTextAfterQuote = quoteDepth > 0 ? l.text.slice(quotePrefix) : "";
        const quoteInnerIsList = quoteDepth > 0 && /^(?:- \[[ x]\] |- |\d+\.\s?)/.test(innerTextAfterQuote);
        const isQuoteLine = quoteDepth > 0;
        const hasObsidianUrl = !showRaw && /obsidian:\/\//.test(l.text);
        const isEmbedOnlyLine = (() => {
          if (showRaw) return false;
          // Quote-marker posts render images inline, so keep the line visible.
          if (block.hasQuoteMarker) return false;
          const trimmed = l.text.trim();
          if (!/^!\[\[[^\]]+\]\]$/.test(trimmed)) return false;
          const innerName = trimmed.slice(3, -2);
          if (!IMAGE_EXT_RE.test(innerName)) return false;
          return app.metadataCache.getFirstLinkpathDest(innerName, "") !== null;
        })();
        // Marker-only lines are re-rendered at the end by QuoteBlockWidget, so hide them entirely.
        const isQuoteMarkerOnlyLine = (() => {
          if (showRaw) return false;
          if (!block.hasQuoteMarker) return false;
          // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
          return /^\s*\[\[[^\[\]]+#\^wr-\d{17}\]\]\s*$/.test(l.text);
        })();
        if (isEmbedOnlyLine || isQuoteMarkerOnlyLine) {
          if (l.to > l.from) {
            hiddenRanges.push({ from: l.from, to: l.to });
          }
        } else if ((isQuoteLine || quoteInnerIsList) && !showRaw) {
          const depthClass = `wr-blockquote-depth-${Math.min(quoteDepth, 5)}`;
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-blockquote-line", depthClass, block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
        } else if (hasObsidianUrl) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-obsidian-url-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
        } else {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
        }

        const entries: { from: number; to: number; deco: Decoration }[] = [];
        // Ranges excluded from format detection (inline code).
        const codeRanges: { from: number; to: number }[] = [];

        const checkMatch = l.text.match(/^- \[([ x])\] /);
        const listMatch = !checkMatch && l.text.match(/^- /);

        if (isQuoteLine) {
          if (showRaw) {
            entries.push({ from: l.from, to: l.from + quotePrefix, deco: Decoration.mark({ class: "wr-quote-highlight" }) });
          } else {
            entries.push({ from: l.from, to: l.from + quotePrefix, deco: replaceHidden });
            if (l.to > l.from + quotePrefix) {
              entries.push({ from: l.from + quotePrefix, to: l.to, deco: Decoration.mark({ class: "wr-blockquote-wrap" }) });
            }
          }
          if (quoteInnerIsList) {
            const innerCheck = innerTextAfterQuote.match(/^- \[([ x])\] /);
            const innerList = !innerCheck && innerTextAfterQuote.match(/^- /);
            const innerOl = !innerCheck && !innerList && innerTextAfterQuote.match(/^(\d+\.)\s?/);
            if (innerCheck) {
              const isChecked = innerCheck[1] === "x";
              if (showRaw) {
                const mark = isChecked ? Decoration.mark({ class: "wr-check-checked" }) : Decoration.mark({ class: "wr-check-unchecked" });
                entries.push({ from: l.from + quotePrefix, to: l.from + quotePrefix + innerCheck[0].length, deco: mark });
              } else {
                entries.push({
                  from: l.from + quotePrefix,
                  to: l.from + quotePrefix + innerCheck[0].length,
                  deco: Decoration.replace({ widget: new CheckboxWidget(isChecked) }),
                });
              }
              if (isChecked && checkStrikethrough && l.to > l.from + quotePrefix + innerCheck[0].length) {
                entries.push({ from: l.from + quotePrefix + innerCheck[0].length, to: l.to, deco: Decoration.mark({ class: "wr-check-done" }) });
              }
            } else if (innerList) {
              if (showRaw) {
                entries.push({ from: l.from + quotePrefix, to: l.from + quotePrefix + 2, deco: Decoration.mark({ class: "wr-list-highlight" }) });
              } else {
                entries.push({
                  from: l.from + quotePrefix,
                  to: l.from + quotePrefix + 2,
                  deco: Decoration.replace({ widget: new BulletWidget() }),
                });
              }
            } else if (innerOl) {
              if (showRaw) {
                entries.push({ from: l.from + quotePrefix, to: l.from + quotePrefix + innerOl[0].length, deco: olMark });
              } else {
                entries.push({
                  from: l.from + quotePrefix,
                  to: l.from + quotePrefix + innerOl[0].length,
                  deco: Decoration.replace({ widget: new OlMarkerWidget(innerOl[1]) }),
                });
              }
            }
          }
        } else if (checkMatch) {
          const isChecked = checkMatch[1] === "x";
          if (showRaw) {
            const mark = isChecked ? Decoration.mark({ class: "wr-check-checked" }) : Decoration.mark({ class: "wr-check-unchecked" });
            entries.push({ from: l.from, to: l.from + checkMatch[0].length, deco: mark });
          } else {
            entries.push({
              from: l.from,
              to: l.from + checkMatch[0].length,
              deco: Decoration.replace({ widget: new CheckboxWidget(isChecked) }),
            });
          }
          if (isChecked && checkStrikethrough && l.to > l.from + checkMatch[0].length) {
            entries.push({ from: l.from + checkMatch[0].length, to: l.to, deco: Decoration.mark({ class: "wr-check-done" }) });
          }
        } else if (listMatch) {
          if (showRaw) {
            entries.push({ from: l.from, to: l.from + 2, deco: Decoration.mark({ class: "wr-list-highlight" }) });
          } else {
            entries.push({
              from: l.from,
              to: l.from + 2,
              deco: Decoration.replace({ widget: new BulletWidget() }),
            });
          }
        } else {
          const olMatchResult = l.text.match(/^(\d+\.)\s?/);
          if (olMatchResult) {
            if (showRaw) {
              entries.push({ from: l.from, to: l.from + olMatchResult[0].length, deco: olMark });
            } else {
              entries.push({
                from: l.from,
                to: l.from + olMatchResult[0].length,
                deco: Decoration.replace({ widget: new OlMarkerWidget(olMatchResult[1]) }),
              });
            }
          }
        }

        let match;

        const tagRegex = /#[^\s#]+/g;
        while ((match = tagRegex.exec(l.text)) !== null) {
          entries.push({
            from: l.from + match.index,
            to: l.from + match.index + match[0].length,
            deco: showRaw ? tagMark : Decoration.replace({ widget: new TagWidget(match[0], plugin) }),
          });
        }

        // Process markdown links first to avoid overlapping the bare-URL pass.
        const mdLinkRanges: { from: number; to: number }[] = [];
        // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
        const mdLinkRegex = /\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)/g;
        while ((match = mdLinkRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          const label = match[1];
          const url = match[2];
          if (!isSafeUrl(url)) continue;
          mdLinkRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: urlMark });
          } else {
            entries.push({
              from,
              to,
              deco: Decoration.replace({ widget: new MdLinkWidget(label, url) }),
            });
          }
        }

        const insideMdLink = (f: number, t: number) =>
          mdLinkRanges.some((r) => f >= r.from && t <= r.to);

        const urlRegex = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
        while ((match = urlRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideMdLink(from, to)) continue;
          if (match[0].startsWith("obsidian://") && !showRaw) {
            let fileName: string | null = null;
            try {
              const params = new URL(match[0]).searchParams;
              const filePath = params.get("file");
              if (filePath) {
                const decoded = decodeURIComponent(filePath);
                fileName = decoded.split("/").pop() || decoded;
              }
            // eslint-disable-next-line no-empty -- intentional no-op
            } catch {}
            const looksLikeImage = !!fileName && IMAGE_EXT_RE.test(fileName);
            const resolved = fileName ? app.metadataCache.getFirstLinkpathDest(fileName, "") : null;
            const isImageEmbed = looksLikeImage && resolved !== null;
            const isUnresolvedImage = looksLikeImage && resolved === null;
            if (isImageEmbed) {
              entries.push({ from, to, deco: replaceHidden });
            } else {
              entries.push({
                from,
                to,
                deco: Decoration.replace({ widget: new ObsidianLinkWidget(match[0], fileName || match[0], isUnresolvedImage) }),
              });
            }
          } else {
            entries.push({ from, to, deco: urlMark });
          }
        }

        const linkRegex = /!?\[\[[^\]]+\]\]/g;
        while ((match = linkRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          const isEmbed = match[0].startsWith("!");
          const innerName = isEmbed ? match[0].slice(3, -2) : match[0].slice(2, -2);
          const resolved = app.metadataCache.getFirstLinkpathDest(innerName, "") !== null;
          if (!showRaw) {
            if (isEmbed && IMAGE_EXT_RE.test(innerName)) {
              const file = app.metadataCache.getFirstLinkpathDest(innerName, "");
              if (file) {
                const src = app.vault.getResourcePath(file);
                if (block.hasQuoteMarker) {
                  // Quote-marker post: render the image inline where it is written.
                  entries.push({
                    from,
                    to,
                    deco: Decoration.replace({ widget: new InlineEmbedImageWidget(src, innerName) }),
                  });
                } else {
                  // No quote marker: collect into the trailing media area.
                  entries.push({ from, to, deco: replaceHidden });
                  embedImages.push({ src, alt: innerName });
                }
                continue;
              }
              entries.push({
                from,
                to,
                deco: Decoration.replace({ widget: new EmbedMissingWidget(innerName) }),
              });
              continue;
            }
            // Quote-card markers [[file#^wr-T]] are hidden in place; the card is rebuilt
            // by QuoteBlockWidget at endLine.to ("quote at the bottom").
            if (!isEmbed) {
              const quoteMatch = innerName.match(QUOTE_LINK_RE);
              if (quoteMatch) {
                entries.push({ from, to, deco: replaceHidden });
                continue;
              }
            }
            entries.push({
              from,
              to,
              deco: Decoration.replace({ widget: new InternalLinkWidget(innerName, app, resolved) }),
            });
            continue;
          }
          // Raw view keeps the brackets and only colors them.
          entries.push({ from, to, deco: resolved ? internalLinkMark : internalLinkUnresolvedMark });
        }

        const codeRegex = /`[^`]+`/g;
        while ((match = codeRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          codeRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: inlineCodeMark });
          } else {
            entries.push({ from, to: from + 1, deco: replaceHidden });
            entries.push({ from: from + 1, to: to - 1, deco: inlineCodeMark });
            entries.push({ from: to - 1, to, deco: replaceHidden });
          }
        }

        const mathRegex = /\$([^$]+)\$/g;
        while ((match = mathRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (codeRanges.some((r) => from >= r.from && to <= r.to)) continue;
          codeRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: mathMark });
          } else {
            entries.push({
              from,
              to,
              deco: Decoration.replace({ widget: new MathWidget(match[1]) }),
            });
          }
        }

        const insideCode = (f: number, t: number) =>
          codeRanges.some((r) => f >= r.from && t <= r.to);

        const boldRanges: { from: number; to: number }[] = [];

        const boldRegex = /\*\*[^*]+\*\*/g;
        while ((match = boldRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideCode(from, to)) continue;
          boldRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: boldMark });
          } else {
            entries.push({ from, to: from + 2, deco: replaceHidden });
            entries.push({ from: from + 2, to: to - 2, deco: boldMark });
            entries.push({ from: to - 2, to, deco: replaceHidden });
          }
        }

        // Italic: mask bold ranges first so ** delimiters aren't matched as *.
        {
          const chars = [...l.text];
          for (const br of boldRanges) {
            const start = br.from - l.from;
            const end = br.to - l.from;
            for (let i = start; i < end && i < chars.length; i++) chars[i] = " ";
          }
          const masked = chars.join("");
          const italicRegex = /\*([^*]+)\*/g;
          while ((match = italicRegex.exec(masked)) !== null) {
            const from = l.from + match.index;
            const to = from + match[0].length;
            if (insideCode(from, to)) continue;
            if (showRaw) {
              entries.push({ from, to, deco: italicMark });
            } else {
              entries.push({ from, to: from + 1, deco: replaceHidden });
              entries.push({ from: from + 1, to: to - 1, deco: italicMark });
              entries.push({ from: to - 1, to, deco: replaceHidden });
            }
          }
        }

        const strikeRegex = /~~[^~]+~~/g;
        while ((match = strikeRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideCode(from, to)) continue;
          if (showRaw) {
            entries.push({ from, to, deco: strikeMark });
          } else {
            entries.push({ from, to: from + 2, deco: replaceHidden });
            entries.push({ from: from + 2, to: to - 2, deco: strikeMark });
            entries.push({ from: to - 2, to, deco: replaceHidden });
          }
        }

        const highlightRegex = /==([^=]+)==/g;
        while ((match = highlightRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideCode(from, to)) continue;
          if (showRaw) {
            entries.push({ from, to, deco: highlightMark });
          } else {
            entries.push({ from, to: from + 2, deco: replaceHidden });
            entries.push({ from: from + 2, to: to - 2, deco: highlightMark });
            entries.push({ from: to - 2, to, deco: replaceHidden });
          }
        }

        // A replace and a mark at the same position trip RangeSetBuilder's startSide
        // ordering and drop every decoration, so sort replaces first.
        const isReplace = (d: Decoration): boolean => (d as { point?: boolean }).point === true;
        // wr-blockquote-wrap must sort last among same-range marks so it nests outside;
        // as the inner span its muted color would cancel e.g. the URL accent color.
        const isBlockquoteWrap = (d: Decoration): boolean => {
          const spec = (d as { spec?: { class?: string } }).spec;
          return !!spec && typeof spec.class === "string" && spec.class.includes("wr-blockquote-wrap");
        };
        entries.sort((a, b) => {
          if (a.from !== b.from) return a.from - b.from;
          const ar = isReplace(a.deco) ? 0 : 1;
          const br = isReplace(b.deco) ? 0 : 1;
          if (ar !== br) return ar - br;
          if (a.to !== b.to) return a.to - b.to;
          const aw = isBlockquoteWrap(a.deco) ? 1 : 0;
          const bw = isBlockquoteWrap(b.deco) ? 1 : 0;
          return aw - bw;
        });
        for (const e of entries) {
          builder.add(e.from, e.to, e.deco);
        }

      }

      const closeLine = doc.line(block.endLn);
      builder.add(closeLine.from, closeLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));

      const endLine = doc.line(block.endLn);

      if (embedImages.length > 0 && !blockHasCursor) {
        builder.add(
          endLine.to,
          endLine.to,
          Decoration.widget({
            widget: new EmbedImageWidget(embedImages, block.ruleClass),
            side: 1,
          })
        );
      }

      const resolveImagePath = (fileName: string): string | null => {
        const file = app.metadataCache.getFirstLinkpathDest(fileName, "");
        return file ? app.vault.getResourcePath(file) : null;
      };

      // Quote-marker posts: one block widget at endLine.to (URL previews, then quote card —
      // "quote at the bottom"). Skipped while editing and in source mode, which show raw markers.
      if (block.hasQuoteMarker && !blockHasCursor && !isSourceMode) {
        let quoteFileName: string | null = null;
        let quoteBlockId: string | null = null;
        for (let j = block.startLn + 1; j < block.endLn; j++) {
          // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
          const m = doc.line(j).text.match(/\[\[([^\[\]]+)#\^(wr-\d{17})\]\]/);
          if (m) {
            quoteFileName = m[1];
            quoteBlockId = m[2];
            break;
          }
        }
        if (quoteFileName && quoteBlockId) {
          const parsedUrls = block.urlTexts.length > 0
            ? extractUrls(block.urlTexts.join(" ")).filter(
                (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
              )
            : [];
          const currentPath = app.workspace.getActiveFile()?.path || "";
          builder.add(
            endLine.to,
            endLine.to,
            Decoration.widget({
              widget: new QuoteBlockWidget(
                quoteFileName,
                quoteBlockId,
                parsedUrls,
                app,
                currentPath,
                block.ruleClass,
                plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm",
                ogpCache,
                resolveImagePath,
                (content) => plugin.getTagRuleClassForContent(content),
                (ruleClass) => plugin.getRuleAccentColor(ruleClass),
                plugin.settings.checkStrikethrough
              ),
              side: 2,
            })
          );
        }
      } else if (!block.hasQuoteMarker && block.urlTexts.length > 0 && !isSourceMode) {
        // URL previews for posts without a quote marker (trailing); not in source mode.
        const parsedUrls = extractUrls(block.urlTexts.join(" ")).filter(
          (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
        );
        if (parsedUrls.length > 0) {
          builder.add(
            endLine.to,
            endLine.to,
            Decoration.widget({
              widget: new UrlPreviewWidget(parsedUrls, ogpCache, block.ruleClass, resolveImagePath),
              side: 2,
            })
          );
        }
      }
      // Quote marker + cursor in block: no previews at all; editing shows only raw markers.
    }
  } catch (e) {
    console.debug("Wrot: decoration skipped", e);
  }

  return { decorations: builder.finish(), hiddenRanges };
}


export function createWrEditorExtension(ogpCache: OGPCache, app: App, plugin: WrotPlugin, getCheckStrikethrough: () => boolean) {
  const viewPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private blocks: WrBlock[];
      private currentView: EditorView;

      constructor(view: EditorView) {
        this.currentView = view;
        this.blocks = findWrBlocks(view, plugin);
        const built = buildDecorations(view, ogpCache, this.blocks, app, plugin, getCheckStrikethrough());
        this.decorations = built.decorations;
        // Hidden ranges cannot be dispatched in the same update cycle. rAF would flash the
        // uncollapsed structure for a frame (worse on slow devices); a microtask lands pre-paint.
        this.dispatchHiddenRanges(built.hiddenRanges);
        queueMicrotask(() => this.fetchMissing());
      }

      // Re-dispatching identical ranges chains collapse -> height change -> rebuild across
      // frames (stepwise jank on mobile), so dispatch only when the ranges change.
      private lastHiddenKey: string | null = null;

      private dispatchHiddenRanges(ranges: { from: number; to: number }[]): void {
        const key = ranges.map((r) => `${r.from}-${r.to}`).join(",");
        if (key === this.lastHiddenKey) return;
        this.lastHiddenKey = key;
        queueMicrotask(() => {
          try {
            this.currentView.dispatch({ effects: setHiddenRanges.of(ranges) });
          // eslint-disable-next-line no-empty -- intentional no-op
          } catch {}
        });
      }

      update(update: ViewUpdate) {
        this.currentView = update.view;
        const hasOgpEffect = update.transactions.some((tr) =>
          tr.effects.some((e) => e.is(ogpFetched))
        );
        const hasTagRulesEffect = update.transactions.some((tr) =>
          tr.effects.some((e) => e.is(tagRulesChanged))
        );
        const hasVaultFilesEffect = update.transactions.some((tr) =>
          tr.effects.some((e) => e.is(vaultFilesChanged))
        );

        if (update.docChanged || update.viewportChanged || update.selectionSet || hasOgpEffect || hasTagRulesEffect || hasVaultFilesEffect) {
          // Cursor-only updates cannot change block structure: reuse cached blocks to skip
          // the full doc scan. Decorations still rebuild since cursorInBlock may change.
          const structureMayChange =
            update.docChanged ||
            update.viewportChanged ||
            hasOgpEffect ||
            hasTagRulesEffect ||
            hasVaultFilesEffect;
          if (structureMayChange) {
            this.blocks = findWrBlocks(update.view, plugin);
          }
          const built = buildDecorations(update.view, ogpCache, this.blocks, app, plugin, getCheckStrikethrough());
          this.decorations = built.decorations;
          this.dispatchHiddenRanges(built.hiddenRanges);
          if (!hasOgpEffect) {
            this.fetchMissing();
          }
        }
      }

      private fetchMissing() {
        for (const block of this.blocks) {
          const parsedUrls = extractUrls(block.urlTexts.join(" "));
          for (const pu of parsedUrls) {
            if (pu.type === "image") continue;
            if (ogpCache.get(pu.url)) continue;
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
            ogpCache.fetchOGP(pu.url).then(() => {
              // Use the view reference that is current when the fetch completes.
              try {
                this.currentView.dispatch({ effects: ogpFetched.of(null) });
              // eslint-disable-next-line no-empty -- intentional no-op
              } catch {}
            });
          }
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        // Single click opens URL highlights in the browser; in LV even Obsidian's
        // standard Cmd+click doesn't work here.
        click(this: { decorations: DecorationSet }, e: MouseEvent) {
          const target = e.target;
          if (!(target instanceof HTMLElement)) return false;
          const urlEl = target.closest(".wr-url-highlight");
          if (!urlEl) return false;
          // Only URLs inside a wr fence block, to avoid false triggers.
          if (!urlEl.closest(".wr-codeblock-line, .HyperMD-codeblock")) return false;
          const url = urlEl.textContent?.trim();
          if (!url) return false;
          if (!isSafeUrl(url)) return false;
          e.preventDefault();
          e.stopPropagation();
          window.open(url, "_blank");
          return true;
        },
      },
    }
  );
  return [hiddenLineStateField, viewPlugin];
}
