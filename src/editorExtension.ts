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

const ogpFetched = StateEffect.define<null>();
export const tagRulesChanged = StateEffect.define<null>();
export const vaultFilesChanged = StateEffect.define<null>();

// ViewPlugin からは block decoration を出せないため、隠したい行範囲を
// StateField 側に渡して block:true の replace で実際に高さを 0 にする。
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
import { renderQuoteCard, invalidateMemoCache } from "./utils/quoteCard";
import type { OGPCache } from "./utils/ogpCache";
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
    const span = document.createElement("span");
    span.className = "wr-lp-marker wr-lp-bullet";
    span.textContent = "\u2022";
    return span;
  }
  eq(): boolean { return true; }
}

class CheckboxWidget extends WidgetType {
  constructor(private checked: boolean, private pos: number) { super(); }
  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement("span");
    wrap.className = "wr-lp-marker wr-lp-check";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = this.checked;
    cb.addEventListener("click", (e) => {
      e.preventDefault();
      // クリック時にDOM側のcheckedを先に切り替えて、テキスト書き換え→Widget再構築のラグでチラつくのを抑える
      const next = !this.checked;
      cb.checked = next;
      const newChar = next ? "x" : " ";
      // pos は "- [" の先頭。[ ] 内の文字は pos+3
      view.dispatch({ changes: { from: this.pos + 3, to: this.pos + 4, insert: newChar } });
    });
    wrap.appendChild(cb);
    return wrap;
  }
  // 同じ位置のcheckboxはWidget差し替えではなくDOM再利用で更新する。checked状態だけ差分反映する
  updateDOM(dom: HTMLElement): boolean {
    const cb = dom.querySelector("input[type=\"checkbox\"]") as HTMLInputElement | null;
    if (!cb) return false;
    if (cb.checked !== this.checked) cb.checked = this.checked;
    return true;
  }
  eq(other: CheckboxWidget): boolean { return this.checked === other.checked; }
  ignoreEvent(): boolean { return false; }
}

class OlMarkerWidget extends WidgetType {
  constructor(private label: string) { super(); }
  toDOM(): HTMLElement {
    const span = document.createElement("span");
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
    const link = document.createElement("a");
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
    const link = document.createElement("a");
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
    const link = document.createElement("a");
    link.className = this.resolved
      ? "wr-internal-link"
      : "wr-internal-link wr-internal-link-unresolved";
    link.textContent = this.fileName;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
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
    const span = document.createElement("span");
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
  constructor(private tex: string) { super(); }
  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "wr-math";
    try {
      const { renderMath, finishRenderMath } = require("obsidian");
      const rendered = renderMath(this.tex, false);
      span.appendChild(rendered);
      finishRenderMath();
    } catch {
      span.textContent = `$${this.tex}$`;
    }
    return span;
  }
  eq(other: MathWidget): boolean { return this.tex === other.tex; }
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
    const container = document.createElement("div");
    container.className = "wr-codeblock-display wr-lp-codeblock wr-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);

    const pre = container.createEl("pre");
    if (this.lang) pre.className = `language-${this.lang}`;
    const codeEl = pre.createEl("code");
    if (this.lang) codeEl.className = `language-${this.lang}`;
    codeEl.textContent = this.code;

    // Obsidian の loadPrism() で構文ハイライトを適用（Prismのトークン色は app.css で定義済み）
    if (this.lang) {
      loadPrism().then((Prism: any) => {
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
  constructor(private tex: string, private ruleClass: string | null) { super(); }
  toDOM(): HTMLElement {
    const container = document.createElement("div");
    container.className = "wr-math-display wr-lp-mathblock wr-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    try {
      const { renderMath, finishRenderMath } = require("obsidian");
      const rendered = renderMath(this.tex, true);
      container.appendChild(rendered);
      finishRenderMath();
    } catch {
      container.textContent = this.tex;
    }
    return container;
  }
  eq(other: MathBlockWidget): boolean {
    return this.tex === other.tex && this.ruleClass === other.ruleClass;
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
    const container = document.createElement("div");
    container.className = "wr-media-area wr-lp-media";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    for (const { src, alt } of this.images) {
      const img = document.createElement("img");
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

// 引用マーカーありの投稿で画像をインライン位置にその場で表示する単発 widget
class InlineEmbedImageWidget extends WidgetType {
  constructor(private src: string, private alt: string) { super(); }
  toDOM(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "wr-lp-inline-img-wrapper";
    const img = document.createElement("img");
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
    const container = document.createElement("div");
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

// 引用マーカーありの投稿で endLine.to に block widget としてまとめて出す。
// 「引用は底」原則を維持するため、 内側で URL プレビュー → 引用カードの順で構築する。
// 本文中の引用マーカーは別途 replaceHidden 化することで二重描画を防ぐ
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
    private resolveQuoteRuleAccent: (ruleClass: string) => string | null
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
    if (this.parsedUrls.length !== other.parsedUrls.length) return false;
    for (let i = 0; i < this.parsedUrls.length; i++) {
      if (this.parsedUrls[i].url !== other.parsedUrls[i].url) return false;
      if (this.cachedSnapshot[i] !== other.cachedSnapshot[i]) return false;
    }
    return true;
  }

  toDOM(): HTMLElement {
    const container = document.createElement("div");
    container.className = "wr-quote-block";
    if (this.ruleClass) container.classList.add(this.ruleClass);

    if (this.parsedUrls.length > 0) {
      const mediaArea = document.createElement("div");
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

    // 引用は底
    const slot = document.createElement("span");
    slot.className = "wr-quote-card-slot wr-lp-quote-card";
    if (this.ruleClass) slot.classList.add(this.ruleClass);
    renderQuoteCard(slot, this.fileName, this.blockId, this.app, this.currentFilePath, {
      timestampFormat: this.timestampFormat,
      resolveRuleClass: this.resolveQuoteRuleClass,
      resolveRuleAccent: this.resolveQuoteRuleAccent,
    });
    container.appendChild(slot);

    return container;
  }

  // widget 内部の <a>/quote-card のクリックを CodeMirror に奪われないよう true。
  // これがないと URL カード/画像URL クリックが空振る (引用カードは元から addEventListener なので両方助かる)
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
  // 引用マーカー [[X#^wr-T]] が初めて現れる行のドキュメント全体での行番号 (1-based)。-1 ならなし
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

    // 開始フェンス行から ^wr-T ブロックID を抽出（点滅対象特定用）
    const fenceLine = doc.line(startLn).text;
    const blockIdMatch = fenceLine.match(/\^(wr-\d{17})/);
    const blockId = blockIdMatch ? blockIdMatch[1] : null;

    // 本文に引用カードマーカー [[X#^wr-T]] が含まれているか、 含むなら最初の出現行を記録
    let hasQuoteMarker = false;
    let quoteLineIdx = -1;
    for (let j = startLn + 1; j < endLn; j++) {
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

  // ソースモードでは置換装飾を行わず、生のmarkdownをすべて表示する
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

      // ライブプレビュー: カーソルがブロック内のどこかにあれば生表示する
      const blockHasCursor = cursorInBlock(block);

      const embedImages: { src: string; alt: string }[] = [];

      // 内側ブロック: 開始行のみにウィジェットを描画、それ以外の行は背景クラスのみ
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

        // 編集中（生表示）はネストブロックも含めて生のテキストを保つ
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
          // 1行$$x$$や未閉じブロック（docStart === docEnd）に対応
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

          // ViewPluginからは inline replace のみ可能（block replace は不可）
          const startLine = doc.line(docStart);
          const widget = range.kind === "codeblock"
            ? Decoration.replace({ widget: new CodeBlockWidget(widgetContent, range.lang || "", app, plugin, block.ruleClass) })
            : Decoration.replace({ widget: new MathBlockWidget(widgetContent, block.ruleClass) });
          builder.add(startLine.from, startLine.to, widget);

          // 残りの行は block:true replace で CodeMirror の行高モデルごと潰す
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
          // 引用マーカーがある投稿では画像はインライン描画するため、行を隠さない
          if (block.hasQuoteMarker) return false;
          const trimmed = l.text.trim();
          if (!/^!\[\[[^\]]+\]\]$/.test(trimmed)) return false;
          const innerName = trimmed.slice(3, -2);
          if (!IMAGE_EXT_RE.test(innerName)) return false;
          return app.metadataCache.getFirstLinkpathDest(innerName, "") !== null;
        })();
        // 引用マーカー単独の行は QuoteBlockWidget で末尾に再描画するため、行ごと隠す
        const isQuoteMarkerOnlyLine = (() => {
          if (showRaw) return false;
          if (!block.hasQuoteMarker) return false;
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
        // インラインコード内をformat判定から除外するためのレンジ
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
                  deco: Decoration.replace({ widget: new CheckboxWidget(isChecked, l.from + quotePrefix) }),
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
              deco: Decoration.replace({ widget: new CheckboxWidget(isChecked, l.from) }),
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
          entries.push({ from: l.from + match.index, to: l.from + match.index + match[0].length, deco: tagMark });
        }

        // 通常URLとの重複を避けるためmarkdownリンクを先に処理
        const mdLinkRanges: { from: number; to: number }[] = [];
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
                  // 引用マーカーがある投稿: インライン img widget で画像をその場（書かれた位置）に表示
                  entries.push({
                    from,
                    to,
                    deco: Decoration.replace({ widget: new InlineEmbedImageWidget(src, innerName) }),
                  });
                } else {
                  // 引用マーカーがない投稿: 末尾メディアエリアに集約
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
            // 通常 [[...]] リンク。引用カードマーカー [[fileName#^wr-T]] なら本文位置では非表示にし、
            // 引用カードは endLine.to の QuoteBlockWidget に「引用は底」で再構築する
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
          // showRaw時は記号を残しつつ色付けのみ行う
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

        // Italic: bold箇所をマスクしてから *...* を検出
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

        // 同じ位置に Decoration.replace と Decoration.mark が並ぶと
        // RangeSetBuilder が startSide 順序エラーで全装飾を弾くため、
        // replace を先にソートしておく
        const isReplace = (d: Decoration): boolean => (d as any).point === true;
        entries.sort((a, b) => {
          if (a.from !== b.from) return a.from - b.from;
          const ar = isReplace(a.deco) ? 0 : 1;
          const br = isReplace(b.deco) ? 0 : 1;
          if (ar !== br) return ar - br;
          return a.to - b.to;
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

      // 引用マーカーありの投稿: 非編集時に endLine.to に block widget でまとめて出す。
      // 内部で URL プレビュー → 引用カードの順で構築し、「引用は底」原則を維持する。
      // 編集時 (blockHasCursor) は本文中の引用マーカーを生で表示するためここはスキップ
      if (block.hasQuoteMarker && !blockHasCursor) {
        // 投稿本文中の最初の引用マーカーから fileName と blockId を取り出す
        let quoteFileName: string | null = null;
        let quoteBlockId: string | null = null;
        for (let j = block.startLn + 1; j < block.endLn; j++) {
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
                (ruleClass) => plugin.getRuleAccentColor(ruleClass)
              ),
              side: 2,
            })
          );
        }
      } else if (!block.hasQuoteMarker && block.urlTexts.length > 0) {
        // 引用マーカーなし投稿の URL プレビュー (従来通り末尾)
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
      // 引用マーカーあり + カーソル中 (blockHasCursor) は URL プレビューも出さない:
      // 編集中は本文の引用マーカー生表示のみで、 プレビュー類は非表示にして編集に集中させる
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
        // 初回の hidden range 反映は次フレームで dispatch (constructor 内 dispatch は不可)
        const initialRanges = built.hiddenRanges;
        requestAnimationFrame(() => {
          try {
            this.currentView.dispatch({ effects: setHiddenRanges.of(initialRanges) });
          } catch {}
          this.fetchMissing();
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
          // カーソル移動だけの update では doc 内のブロック構造は変わらないため、
          // キャッシュ済み blocks を再利用して全行スキャンを回避する。
          // decoration 自体は cursorInBlock 判定が変わるので再構築する。
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
          // hidden range の更新は同じトランザクションサイクル内では dispatch できないため、
          // 次フレームに送る
          const pendingRanges = built.hiddenRanges;
          requestAnimationFrame(() => {
            try {
              this.currentView.dispatch({ effects: setHiddenRanges.of(pendingRanges) });
            } catch {}
          });
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
            ogpCache.fetchOGP(pu.url).then(() => {
              // フェッチ完了時点で最新のview参照を使う
              try {
                this.currentView.dispatch({ effects: ogpFetched.of(null) });
              } catch {}
            });
          }
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        // wr ブロック内の URL ハイライト要素をクリックしたらブラウザで開く
        // (LV では Cmd+クリックの Obsidian 標準動作も効かないため、 シングルクリックで対応)
        click(this: { decorations: DecorationSet }, e: MouseEvent) {
          const target = e.target;
          if (!(target instanceof HTMLElement)) return false;
          const urlEl = target.closest(".wr-url-highlight");
          if (!urlEl) return false;
          // wr フェンスブロック内に居る URL のみ対象 (誤発火防止)
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
