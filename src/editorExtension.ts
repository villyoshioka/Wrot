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
import type WrotPlugin from "./main";

// StateEffect to trigger re-decoration after OGP fetch completes
const ogpFetched = StateEffect.define<null>();

// StateEffect to trigger re-decoration after tag color rules change
export const tagRulesChanged = StateEffect.define<null>();
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

/**
 * Editor extension that:
 * 1. Highlights #tags and URLs in ```wr code blocks (Decoration.mark)
 * 2. Renders rich URL previews below qm code blocks (Decoration.widget)
 *
 * OGP cards are async — after fetch completes, we trigger a re-decoration
 * so the widget rebuilds with cached data.
 */

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

// Cached line decorations keyed by class string so CodeMirror sees stable Decoration instances
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

// --- Widgets for list markers ---

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
      // Replace the character inside [ ] — pos points to "- [", so the char is at pos+3
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
  constructor(private url: string, private displayName: string) { super(); }
  toDOM(): HTMLElement {
    const link = document.createElement("a");
    link.className = "wr-internal-link";
    link.textContent = this.displayName;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSafeUrl(this.url)) window.open(this.url);
    });
    return link;
  }
  eq(other: ObsidianLinkWidget): boolean { return this.url === other.url; }
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

// --- Preview Widget (fully synchronous — uses cached OGP data) ---

class UrlPreviewWidget extends WidgetType {
  // Snapshot which URLs had cached OGP data at creation time
  private cachedSnapshot: boolean[];

  constructor(
    private parsedUrls: ParsedUrl[],
    private ogpCache: OGPCache,
    private ruleClass: string | null
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
      // Compare snapshot: did cache state change between old and new widget?
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
        renderImagePreview(container, pu.url);
      } else {
        const cached = this.ogpCache.get(pu.url);
        if (cached && (cached.title || cached.description)) {
          if (pu.type === "twitter") {
            renderTwitterCard(container, cached);
          } else {
            renderOGPCard(container, cached);
          }
        }
        // If not cached yet, show nothing — will re-render after fetch
      }
    }

    return container;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

// --- Build Decorations ---

interface WrBlock {
  startLn: number;
  endLn: number;
  urlTexts: string[];
  ruleClass: string | null;
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

    const urlTexts: string[] = [];
    const tags: string[] = [];
    for (let j = startLn + 1; j < endLn; j++) {
      const l = doc.line(j);
      const urlRegex = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
      let match;
      while ((match = urlRegex.exec(l.text)) !== null) {
        if (!match[0].startsWith("obsidian://")) {
          urlTexts.push(match[0]);
        }
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

    blocks.push({ startLn, endLn, urlTexts, ruleClass });
    ln = endLn;
  }

  return blocks;
}

function buildDecorations(
  view: EditorView,
  ogpCache: OGPCache,
  blocks: WrBlock[],
  app: App,
  checkStrikethrough: boolean
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Source mode: show raw markdown on all lines (no replace decorations)
  const isSourceMode = !view.contentDOM.closest(".is-live-preview");

  // Determine which lines have the cursor
  const cursorLineNums = new Set<number>();
  for (const range of view.state.selection.ranges) {
    const startLine = doc.lineAt(range.from).number;
    const endLine = doc.lineAt(range.to).number;
    for (let n = startLine; n <= endLine; n++) cursorLineNums.add(n);
  }

  // Check if cursor is inside a qm block (startLn..endLn inclusive)
  const cursorInBlock = (b: WrBlock) => {
    for (let n = b.startLn; n <= b.endLn; n++) {
      if (cursorLineNums.has(n)) return true;
    }
    return false;
  };

  try {
    for (const block of blocks) {
      // Apply background color to opening fence line
      const openLine = doc.line(block.startLn);
      builder.add(openLine.from, openLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));

      // In live preview: if cursor is anywhere in this block, show raw markdown
      const blockHasCursor = cursorInBlock(block);

      // Collect embed images for preview after closing fence
      const embedImages: { src: string; alt: string }[] = [];

      // Tags, URLs, and format marks with marker hiding
      for (let j = block.startLn + 1; j < block.endLn; j++) {
        const l = doc.line(j);
        const showRaw = isSourceMode || blockHasCursor;

        // Apply background color class (or combined blockquote+bg class) to this line
        const quotePrefix = l.text.startsWith("> ") ? 2 : l.text.startsWith(">") ? 1 : 0;
        const isQuoteLine = quotePrefix > 0;
        const hasObsidianUrl = !showRaw && /obsidian:\/\//.test(l.text);
        const isEmbedOnlyLine = !showRaw && /^!\[\[[^\]]+\]\]$/.test(l.text.trim()) && IMAGE_EXT_RE.test(l.text.trim().slice(3, -2));
        if (isEmbedOnlyLine) {
          builder.add(l.from, l.from, hiddenLine);
        } else if (isQuoteLine && !showRaw) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-blockquote-line", block.ruleClass]));
        } else if (hasObsidianUrl) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-obsidian-url-line", block.ruleClass]));
        } else {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));
        }

        // Collect all decorations for this line, then sort and add
        const entries: { from: number; to: number; deco: Decoration }[] = [];
        // Track code ranges to avoid format matching inside code
        const codeRanges: { from: number; to: number }[] = [];

        // --- Block-level elements (line start) ---
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

        // --- Inline elements ---
        let match;

        // Tags
        const tagRegex = /#[^\s#]+/g;
        while ((match = tagRegex.exec(l.text)) !== null) {
          entries.push({ from: l.from + match.index, to: l.from + match.index + match[0].length, deco: tagMark });
        }

        // Markdown links [label](url) — processed before plain URLs to prevent overlap
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

        // URLs
        const urlRegex = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
        while ((match = urlRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideMdLink(from, to)) continue;
          if (match[0].startsWith("obsidian://") && !showRaw) {
            let displayName = match[0];
            try {
              const params = new URL(match[0]).searchParams;
              const filePath = params.get("file");
              if (filePath) {
                const decoded = decodeURIComponent(filePath);
                displayName = decoded.split("/").pop() || decoded;
              }
            } catch { /* use full URL */ }
            entries.push({
              from,
              to,
              deco: Decoration.replace({ widget: new ObsidianLinkWidget(match[0], displayName) }),
            });
          } else {
            entries.push({ from, to, deco: urlMark });
          }
        }

        // Internal links and embeds
        const linkRegex = /!?\[\[[^\]]+\]\]/g;
        while ((match = linkRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          const isEmbed = match[0].startsWith("!");
          // Extract the inner link name: strip leading `![[` or `[[` and trailing `]]`
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
            }
            // Non-image embed and plain internal link: replace with a clickable link widget
            entries.push({
              from,
              to,
              deco: Decoration.replace({ widget: new InternalLinkWidget(innerName, app, resolved) }),
            });
            continue;
          }
          // showRaw (cursor on this line): keep raw `![[...]]` / `[[...]]` but still color it
          entries.push({ from, to, deco: resolved ? internalLinkMark : internalLinkUnresolvedMark });
        }

        // Inline code
        const codeRegex = /`[^`]+`/g;
        while ((match = codeRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          codeRanges.push({ from, to });
          if (showRaw) {
            // Cursor line: show backticks, style whole span
            entries.push({ from, to, deco: inlineCodeMark });
          } else {
            entries.push({ from, to: from + 1, deco: replaceHidden });
            entries.push({ from: from + 1, to: to - 1, deco: inlineCodeMark });
            entries.push({ from: to - 1, to, deco: replaceHidden });
          }
        }

        // Inline math $...$
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

        // Helper: check if range is inside a code span
        const insideCode = (f: number, t: number) =>
          codeRanges.some((r) => f >= r.from && t <= r.to);

        // Format patterns: hide markers on non-cursor lines, show raw on cursor lines
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

        // Italic: mask out bold ranges then find *...* pairs
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

        // Sort all entries by position and add to builder
        entries.sort((a, b) => a.from - b.from || a.to - b.to);
        for (const e of entries) {
          builder.add(e.from, e.to, e.deco);
        }
      }

      // Apply background color to closing fence line
      const closeLine = doc.line(block.endLn);
      builder.add(closeLine.from, closeLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass]));

      // Preview widgets after closing ```
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
        const parsedUrls = extractUrls(block.urlTexts.join(" "));
        if (parsedUrls.length > 0) {
          builder.add(
            endLine.to,
            endLine.to,
            Decoration.widget({
              widget: new UrlPreviewWidget(parsedUrls, ogpCache, block.ruleClass),
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

// --- Export ---

export function createWrEditorExtension(ogpCache: OGPCache, app: App, plugin: WrotPlugin, getCheckStrikethrough: () => boolean) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private blocks: WrBlock[];
      private currentView: EditorView;

      constructor(view: EditorView) {
        this.currentView = view;
        this.blocks = findWrBlocks(view, plugin);
        this.decorations = buildDecorations(view, ogpCache, this.blocks, app, getCheckStrikethrough());
        // Trigger fetch after CM initialization is complete
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

        if (update.docChanged || update.viewportChanged || update.selectionSet || hasOgpEffect || hasTagRulesEffect) {
          this.blocks = findWrBlocks(update.view, plugin);
          this.decorations = buildDecorations(update.view, ogpCache, this.blocks, app, getCheckStrikethrough());
          if (!hasOgpEffect) {
            this.fetchMissing();
          }
        }
      }

      private fetchMissing() {
        // Kick off OGP fetches for all URLs; when any completes, dispatch effect
        for (const block of this.blocks) {
          const parsedUrls = extractUrls(block.urlTexts.join(" "));
          for (const pu of parsedUrls) {
            if (pu.type === "image") continue;
            if (ogpCache.get(pu.url)) continue; // Already cached
            ogpCache.fetchOGP(pu.url).then(() => {
              // OGP data now cached — use latest view reference
              try {
                this.currentView.dispatch({ effects: ogpFetched.of(null) });
              } catch { /* ignore if view is destroyed */ }
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
