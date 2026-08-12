import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import type { App } from "obsidian";
import type WrotPlugin from "./main";
import { findBlockRanges, type BlockRange } from "./utils/blockSegmenter";
import { IMAGE_EXT_RE, QUOTE_MARKER_ONLY_LINE_RE, QUOTE_MARKER_RE, tagPattern } from "./utils/patterns";
import { ListDepthTracker, parseListLine } from "./utils/listParser";

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
import { extractUrls, isSafeUrl, QUOTE_LINK_RE } from "./utils/urlRenderer";
import type { OGPCache } from "./utils/ogpCache";

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

import {
  BulletWidget,
  CheckboxWidget,
  CodeBlockWidget,
  EmbedImageWidget,
  EmbedMissingWidget,
  InlineEmbedImageWidget,
  InternalLinkWidget,
  MathBlockWidget,
  MathWidget,
  MdLinkWidget,
  ObsidianLinkWidget,
  OlMarkerWidget,
  QuoteBlockWidget,
  TagWidget,
  UrlPreviewWidget,
} from "./editor/widgets";
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
      const tagMatches = l.text.match(tagPattern());
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
       
      if (QUOTE_MARKER_RE.test(doc.line(j).text)) {
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

      // Nesting depth builds up across the block's lines, so the tracker spans the whole loop.
      const listDepth = new ListDepthTracker();
      let lastQuoteDepth = 0;

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
        const listInfo = parseListLine(quoteDepth > 0 ? innerTextAfterQuote : l.text, true);
        const quoteInnerIsList = quoteDepth > 0 && listInfo !== null;
        const isQuoteLine = quoteDepth > 0;
        // One line is one .cm-line here, so nesting rides on the marker's offset, not markup.
        // A quote holds its own list, the way the rendered views treat it.
        if (quoteDepth !== lastQuoteDepth) {
          listDepth.reset();
          lastQuoteDepth = quoteDepth;
        }
        let listItemDepth = 0;
        let listItemOrdinal = 1;
        if (listInfo) {
          const placed = listDepth.place(listInfo);
          listItemDepth = placed.depth;
          listItemOrdinal = placed.ordinal;
        } else {
          listDepth.reset();
        }
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
           
          return QUOTE_MARKER_ONLY_LINE_RE.test(l.text);
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

        if (isQuoteLine) {
          if (showRaw) {
            entries.push({ from: l.from, to: l.from + quotePrefix, deco: Decoration.mark({ class: "wr-quote-highlight" }) });
          } else {
            entries.push({ from: l.from, to: l.from + quotePrefix, deco: replaceHidden });
            if (l.to > l.from + quotePrefix) {
              entries.push({ from: l.from + quotePrefix, to: l.to, deco: Decoration.mark({ class: "wr-blockquote-wrap" }) });
            }
          }
        }

        if (listInfo) {
          const indentFrom = l.from + (isQuoteLine ? quotePrefix : 0);
          const markerFrom = indentFrom + listInfo.indentLength;
          const markerTo = markerFrom + listInfo.markerLength;
          // The indent characters give way to the depth class, so the marker stays aligned
          // with the level's pad instead of drifting right by however it was typed.
          if (!showRaw && listInfo.indentLength > 0) {
            entries.push({ from: indentFrom, to: markerFrom, deco: replaceHidden });
          }
          if (listInfo.kind === "check") {
            if (showRaw) {
              const mark = listInfo.checked ? Decoration.mark({ class: "wr-check-checked" }) : Decoration.mark({ class: "wr-check-unchecked" });
              entries.push({ from: markerFrom, to: markerTo, deco: mark });
            } else {
              entries.push({
                from: markerFrom,
                to: markerTo,
                deco: Decoration.replace({ widget: new CheckboxWidget(listInfo.checked, listItemDepth) }),
              });
            }
            if (listInfo.checked && checkStrikethrough && l.to > markerTo) {
              entries.push({ from: markerTo, to: l.to, deco: Decoration.mark({ class: "wr-check-done" }) });
            }
          } else if (listInfo.kind === "bullet") {
            if (showRaw) {
              entries.push({ from: markerFrom, to: markerTo, deco: Decoration.mark({ class: "wr-list-highlight" }) });
            } else {
              entries.push({
                from: markerFrom,
                to: markerTo,
                deco: Decoration.replace({ widget: new BulletWidget(listItemDepth) }),
              });
            }
          } else {
            if (showRaw) {
              entries.push({ from: markerFrom, to: markerTo, deco: olMark });
            } else {
              entries.push({
                from: markerFrom,
                to: markerTo,
                // Numbered the way the rendered views number: by position, not by what was typed.
                deco: Decoration.replace({ widget: new OlMarkerWidget(`${listItemOrdinal}.`, listItemDepth) }),
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


/**
 * Identifies which blocks the selection currently touches.
 *
 * buildDecorations consults the selection only to decide whether a block is shown raw, so two
 * updates with the same value here produce identical decorations.
 */
function cursorBlockKey(view: EditorView, blocks: WrBlock[]): string {
  const doc = view.state.doc;
  const cursorLineNums = new Set<number>();
  for (const range of view.state.selection.ranges) {
    const startLine = doc.lineAt(range.from).number;
    const endLine = doc.lineAt(range.to).number;
    for (let n = startLine; n <= endLine; n++) cursorLineNums.add(n);
  }
  const touched: number[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    for (let n = block.startLn; n <= block.endLn; n++) {
      if (cursorLineNums.has(n)) {
        touched.push(i);
        break;
      }
    }
  }
  return touched.join(",");
}

export function createWrEditorExtension(ogpCache: OGPCache, app: App, plugin: WrotPlugin, getCheckStrikethrough: () => boolean) {
  const viewPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private blocks: WrBlock[];
      private currentView: EditorView;
      private cursorBlockKey: string;

      constructor(view: EditorView) {
        this.currentView = view;
        this.blocks = findWrBlocks(view, plugin);
        this.cursorBlockKey = cursorBlockKey(view, this.blocks);
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
            this.cursorBlockKey = cursorBlockKey(update.view, this.blocks);
          } else {
            // Selection-only update: decorations depend on the selection solely through which
            // blocks it touches. If that is unchanged the rebuild would produce the same set,
            // so moving the cursor inside one memo no longer walks every block in the note.
            const key = cursorBlockKey(update.view, this.blocks);
            if (key === this.cursorBlockKey) return;
            this.cursorBlockKey = key;
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
            // Skip URLs whose outcome is already known and URLs that will never be fetched
            // (previews off, obsidian:// links, private hosts). Both used to fall through and
            // dispatch a redraw per URL on every cursor move.
            if (ogpCache.isResolved(pu.url)) continue;
            if (!ogpCache.canFetch(pu.url)) continue;
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
            ogpCache.fetchOGP(pu.url).then((data) => {
              // Only a successful fetch changes what is rendered; a failure has nothing to show.
              if (!data) return;
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
