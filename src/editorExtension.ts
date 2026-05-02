import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect } from "@codemirror/state";
import type { App } from "obsidian";
import { MarkdownRenderer, loadPrism } from "obsidian";
import type WrotPlugin from "./main";
import { findBlockRanges, type BlockRange } from "./utils/blockSegmenter";

// 各種イベントで再装飾をトリガするStateEffect
const ogpFetched = StateEffect.define<null>();
export const tagRulesChanged = StateEffect.define<null>();
export const vaultFilesChanged = StateEffect.define<null>();
import {
  extractUrls,
  renderImagePreview,
  renderOGPCard,
  renderTwitterCard,
  isSafeUrl,
  type ParsedUrl,
} from "./utils/urlRenderer";
import type { OGPCache } from "./utils/ogpCache";
import type { OGPData } from "./utils/ogpCache";

// ライブビュー用の装飾。タグ/URL等のマーク装飾とOGPプレビューウィジェットを管理する

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
const hiddenLine = Decoration.line({ class: "wr-hidden-line" });

// CodeMirrorに安定したインスタンスを渡すため、line装飾はクラス文字列でキャッシュする
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
      const newChar = this.checked ? " " : "x";
      // pos は "- [" の先頭。[ ] 内の文字は pos+3
      view.dispatch({ changes: { from: this.pos + 3, to: this.pos + 4, insert: newChar } });
    });
    wrap.appendChild(cb);
    return wrap;
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

// プレビューウィジェットはキャッシュ済みOGPデータのみで同期描画する
class UrlPreviewWidget extends WidgetType {
  // 生成時点で各URLにキャッシュデータがあったかのスナップショット
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
        // 未キャッシュ時は何も描画しない（フェッチ後に再描画）
      }
    }

    return container;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

interface WrBlock {
  startLn: number;
  endLn: number;
  urlTexts: string[];
  ruleClass: string | null;
  innerBlocks: BlockRange[];
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

    // 内側のコード/数式ブロックに含まれる doc 行インデックスを記録
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

    blocks.push({ startLn, endLn, urlTexts, ruleClass, innerBlocks });
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
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
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
      builder.add(openLine.from, openLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));

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
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));
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

          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));

          // ViewPluginからは inline replace のみ可能（block replace は不可）
          const startLine = doc.line(docStart);
          const widget = range.kind === "codeblock"
            ? Decoration.replace({ widget: new CodeBlockWidget(widgetContent, range.lang || "", app, plugin, block.ruleClass) })
            : Decoration.replace({ widget: new MathBlockWidget(widgetContent, block.ruleClass) });
          builder.add(startLine.from, startLine.to, widget);

          // 残りの行は内容を空に置換し、hiddenLine で行自体を非表示にする
          for (let k = docStart + 1; k <= docEnd; k++) {
            const kl = doc.line(k);
            builder.add(kl.from, kl.from, hiddenLine);
            if (kl.to > kl.from) {
              builder.add(kl.from, kl.to, Decoration.replace({}));
            }
          }

          j = docEnd;
          continue;
        }

        if (innerBlockInsideDocLines.has(j)) {
          continue;
        }

        const quotePrefix = l.text.startsWith("> ") ? 2 : l.text.startsWith(">") ? 1 : 0;
        const isQuoteLine = quotePrefix > 0;
        const hasObsidianUrl = !showRaw && /obsidian:\/\//.test(l.text);
        const isEmbedOnlyLine = (() => {
          if (showRaw) return false;
          const trimmed = l.text.trim();
          if (!/^!\[\[[^\]]+\]\]$/.test(trimmed)) return false;
          const innerName = trimmed.slice(3, -2);
          if (!IMAGE_EXT_RE.test(innerName)) return false;
          return app.metadataCache.getFirstLinkpathDest(innerName, "") !== null;
        })();
        if (isEmbedOnlyLine) {
          builder.add(l.from, l.from, hiddenLine);
        } else if (isQuoteLine && !showRaw) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-blockquote-line", block.ruleClass]));
        } else if (hasObsidianUrl) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-obsidian-url-line", block.ruleClass]));
        } else {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));
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
                entries.push({ from, to, deco: replaceHidden });
                embedImages.push({ src, alt: innerName });
                continue;
              }
              entries.push({
                from,
                to,
                deco: Decoration.replace({ widget: new EmbedMissingWidget(innerName) }),
              });
              continue;
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

        entries.sort((a, b) => a.from - b.from || a.to - b.to);
        for (const e of entries) {
          builder.add(e.from, e.to, e.deco);
        }
      }

      // 閉じフェンス行に背景色を適用
      const closeLine = doc.line(block.endLn);
      builder.add(closeLine.from, closeLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));

      // 閉じフェンスの後にプレビューウィジェットを配置
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

      if (block.urlTexts.length > 0) {
        // 画像以外のobsidian:// URLは空のメディアブロックを生まないよう除外
        const parsedUrls = extractUrls(block.urlTexts.join(" ")).filter(
          (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
        );
        if (parsedUrls.length > 0) {
          const resolveImagePath = (fileName: string): string | null => {
            const file = app.metadataCache.getFirstLinkpathDest(fileName, "");
            return file ? app.vault.getResourcePath(file) : null;
          };
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
    }
  } catch (e) {
    console.debug("Wrot: decoration skipped", e);
  }

  return builder.finish();
}


export function createWrEditorExtension(ogpCache: OGPCache, app: App, plugin: WrotPlugin, getCheckStrikethrough: () => boolean) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private blocks: WrBlock[];
      private currentView: EditorView;

      constructor(view: EditorView) {
        this.currentView = view;
        this.blocks = findWrBlocks(view, plugin);
        this.decorations = buildDecorations(view, ogpCache, this.blocks, app, plugin, getCheckStrikethrough());
        // CodeMirror初期化後にフェッチを開始
        requestAnimationFrame(() => this.fetchMissing());
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
          this.blocks = findWrBlocks(update.view, plugin);
          this.decorations = buildDecorations(update.view, ogpCache, this.blocks, app, plugin, getCheckStrikethrough());
          if (!hasOgpEffect) {
            this.fetchMissing();
          }
        }
      }

      private fetchMissing() {
        // 全URLのOGPフェッチを開始し、完了時にeffectをディスパッチして再装飾
        for (const block of this.blocks) {
          const parsedUrls = extractUrls(block.urlTexts.join(" "));
          for (const pu of parsedUrls) {
            if (pu.type === "image") continue;
            if (ogpCache.get(pu.url)) continue; // Already cached
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
    }
  );
}
