/**
 * Text manipulations for the composer.
 *
 * These only ever read and write the composer field, so they live outside the view: the toolbar
 * buttons and keyboard shortcuts call them, and the view keeps the wiring.
 * Every mutation ends with `commit`, which restores focus and fires the input event the
 * auto-resize and toolbar-state handlers listen for.
 */

import { ListDepthTracker, type ListLine, nestThreshold, parseListLine } from "./listParser";
import type { ComposerField } from "../editor/composerField";
import { findBlockRanges } from "./blockSegmenter";
import { findLinkAt } from "../editor/composerLink";
import { HIGHLIGHT_EMOJI, decorationInner, highlightColor, inlineTokens } from "./patterns";

function commit(ta: ComposerField): void {
  ta.focus();
  ta.dispatchEvent(new Event("input"));
}

/**
 * Types an indent at the caret when it sits inside a code block (an unclosed one runs to the
 * end). Returns false elsewhere, leaving Tab to its usual job.
 */
export function insertCodeIndent(ta: ComposerField, indent: string): boolean {
  const val = ta.value;
  const start = ta.selectionStart;
  if (!insideCodeBlock(val, start)) return false;
  ta.value = val.slice(0, start) + indent + val.slice(ta.selectionEnd);
  ta.setSelectionRange(start + indent.length, start + indent.length);
  ta.dispatchEvent(new Event("input"));
  return true;
}

/** Enter inside a code block starts the new line at the current line's indent. */
export function continueCodeIndentOnEnter(ta: ComposerField): boolean {
  const val = ta.value;
  const start = ta.selectionStart;
  if (!insideCodeBlock(val, start)) return false;
  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
  const indent = /^[ \t]*/.exec(val.slice(lineStart, start))?.[0] ?? "";
  const insert = "\n" + indent;
  ta.value = val.slice(0, start) + insert + val.slice(ta.selectionEnd);
  ta.setSelectionRange(start + insert.length, start + insert.length);
  ta.dispatchEvent(new Event("input"));
  return true;
}

const CODE_FENCE_CLOSE_RE = /^\s*~{3,}\s*$/;

// Between a code block's fences; an unclosed block runs to the end.
export function insideCodeBlock(val: string, pos: number): boolean {
  const lines = val.split("\n");
  const line = val.slice(0, pos).split("\n").length - 1;
  return findBlockRanges(lines).some(
    (b) =>
      b.kind === "codeblock" &&
      line > b.startLine &&
      line <= b.endLine &&
      !(line === b.endLine && CODE_FENCE_CLOSE_RE.test(lines[line]))
  );
}

function currentLineBounds(val: string, pos: number): { start: number; end: number } {
  const start = pos > 0 ? val.lastIndexOf("\n", pos - 1) + 1 : 0;
  const newline = val.indexOf("\n", start);
  return { start, end: newline === -1 ? val.length : newline };
}

/**
 * Toggles a line-level marker ("- ", "- [ ] ", "1. ") at the caret's line.
 * Re-applying the same marker removes it; a different one replaces it.
 */
// A quote's "> " stays in front of a list marker: the list goes inside the quote.
const QUOTE_PREFIX_RE = /^(?:>[ \t]?)+/;

export function insertAtLineStart(ta: ComposerField, prefix: string): void {
  const pos = ta.selectionStart;
  const val = ta.value;
  const bounds = currentLineBounds(val, pos);
  const lineStart = bounds.start + (QUOTE_PREFIX_RE.exec(val.slice(bounds.start, bounds.end))?.[0].length ?? 0);
  const lineText = val.slice(lineStart, bounds.end);

  const prefixes = ["- [ ] ", "- [x] ", "- "];
  let existingPrefix = "";
  for (const p of prefixes) {
    if (lineText.startsWith(p)) {
      existingPrefix = p;
      break;
    }
  }
  if (!existingPrefix) {
    const olMatch = lineText.match(/^\d+\.\s?/);
    if (olMatch) existingPrefix = olMatch[0];
  }

  const isSameType =
    existingPrefix === prefix || (prefix === "1. " && /^\d+\. $/.test(existingPrefix));
  if (isSameType) {
    ta.value = val.slice(0, lineStart) + val.slice(lineStart + existingPrefix.length);
    ta.selectionStart = ta.selectionEnd = lineStart;
  } else if (existingPrefix) {
    ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart + existingPrefix.length);
    ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
  } else {
    // ">text" gets its space back, so the marker reads as a list inside the quote.
    const insert = lineStart > bounds.start && !/\s/.test(val[lineStart - 1]) ? " " + prefix : prefix;
    ta.value = val.slice(0, lineStart) + insert + val.slice(lineStart);
    ta.selectionStart = ta.selectionEnd = lineStart + insert.length;
  }
  commit(ta);
}

/**
 * A line's quote prefix, how deep that quote is, and the list item after it, if any. A list
 * inside a quote is the same list as long as the quote keeps its depth.
 */
export function splitQuoted(line: string): { quote: string; depth: number; rest: string; item: ListLine | null } {
  const quote = QUOTE_PREFIX_RE.exec(line)?.[0] ?? "";
  const rest = line.slice(quote.length);
  return { quote, depth: (quote.match(/>/g) ?? []).length, rest, item: parseListLine(rest, true) };
}

/**
 * Indent of the item the given one (on the line starting at rowStart) is nested under.
 *
 * Indents are written by hand and come in no fixed step, so the level to step out to is
 * whichever one the parent actually used — the nearest item above whose text begins at or
 * before this indent. Scanning stops where the run of list items does, since anything before
 * that belongs to another list.
 */
function enclosingIndent(val: string, rowStart: number, depth: number, indentWidth: number): string {
  if (rowStart === 0) return "";
  const lines = val.slice(0, rowStart - 1).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const { depth: d, rest, item } = splitQuoted(lines[i]);
    if (!item || d !== depth) break;
    if (nestThreshold(item) <= indentWidth) {
      return rest.slice(0, item.indentLength);
    }
  }
  return "";
}

/** One level of indent, as the composer writes it. */
const INDENT_UNIT = "  ";

/** Whether an indent is built only from the spaces one types a level with. */
function isPlainSpaces(indent: string): boolean {
  return /^ *$/.test(indent);
}

/**
 * Brings the list being edited into the shape the views will give it.
 *
 * Both the numbers and the indent are decoration in the text: the views number by position and
 * step by level, whatever was typed. The composer shows raw characters, so an ideographic space
 * and a tab sit at different places on screen while meaning the same level — writing them all
 * as the same step is what makes the form agree with itself and with the post.
 */
export function syncListFormatting(ta: ComposerField): void {
  normalizeRunAroundCaret(ta);
}

// Only the run under the caret is touched; lists elsewhere in the post are left alone.
function normalizeRunAroundCaret(ta: ComposerField): void {
  const lines = ta.value.split("\n");
  const lineOf = (pos: number) => {
    let index = 0;
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
      if (offset > pos) break;
      index = i;
      offset += lines[i].length + 1;
    }
    return index;
  };

  const caretLine = lineOf(ta.selectionStart);
  const endLine = lineOf(ta.selectionEnd);
  const { depth: quoteDepth, item: caretItem } = splitQuoted(lines[caretLine]);
  if (!caretItem) return;
  // A "- " line in code is code: its indent stays as typed.
  if (insideCodeBlock(ta.value, ta.selectionStart)) return;
  const inRun = (i: number): boolean => {
    const l = splitQuoted(lines[i]);
    return l.item !== null && l.depth === quoteDepth;
  };

  let first = caretLine;
  let last = caretLine;
  while (first > 0 && inRun(first - 1)) first--;
  while (last + 1 < lines.length && inRun(last + 1)) last++;

  const tracker = new ListDepthTracker();
  let startShift = 0;
  let endShift = 0;
  let changed = false;
  for (let i = first; i <= last; i++) {
    const { quote, rest: body, item } = splitQuoted(lines[i]);
    if (!item) continue;
    const { depth, ordinal } = tracker.place(item);
    const written = body.slice(0, item.indentLength);
    // A part-typed indent on the caret's line is left alone: normalising it away would eat
    // each space as it arrives, and the next level could never be reached by typing. Only
    // spaces get that grace — a tab or an ideographic space is a whole step as it stands.
    const midStep =
      i === caretLine && isPlainSpaces(written) && written.length > depth * INDENT_UNIT.length;
    const indent = midStep ? written : INDENT_UNIT.repeat(depth);

    let rest = body.slice(item.indentLength);
    if (item.kind === "ol") rest = `${ordinal}.` + rest.slice(item.olMarker.length);
    const next = quote + indent + rest;
    if (next === lines[i]) continue;

    const delta = next.length - lines[i].length;
    if (i <= caretLine) startShift += delta;
    if (i <= endLine) endShift += delta;
    lines[i] = next;
    changed = true;
  }
  if (!changed) return;

  const start = Math.max(0, ta.selectionStart + startShift);
  const end = Math.max(start, ta.selectionEnd + endShift);
  ta.value = lines.join("\n");
  ta.selectionStart = start;
  ta.selectionEnd = end;
}

/**
 * Indent that would nest the given item one level deeper, or null when it cannot go deeper.
 *
 * An item nests under the item above it at its own level, so the step is added to that item's
 * own indent. The first item of a level has no such neighbour and stays put — the same limit
 * markdown itself puts on indenting.
 */
function childIndent(val: string, rowStart: number, depth: number, indentWidth: number): string | null {
  if (rowStart === 0) return null;
  const lines = val.slice(0, rowStart - 1).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const { depth: d, rest, item } = splitQuoted(lines[i]);
    if (!item || d !== depth) return null;
    if (item.indentWidth > indentWidth) continue;
    if (item.indentWidth < indentWidth) return null;
    return rest.slice(0, item.indentLength) + INDENT_UNIT;
  }
  return null;
}

/**
 * Moves the list items covered by the selection one level in or out, for Tab and Shift+Tab.
 * Items nested under one that moves go with it, selected or not.
 *
 * Returns false when nothing in reach is a list item that can move, which leaves Tab to do
 * what it always did and keeps a way out of the textarea by keyboard.
 */
export function shiftListIndent(ta: ComposerField, outdent: boolean): boolean {
  const val = ta.value;
  const selStart = ta.selectionStart;
  if (insideCodeBlock(val, selStart)) return false;
  const selEnd = ta.selectionEnd;
  const blockStart = selStart > 0 ? val.lastIndexOf("\n", selStart - 1) + 1 : 0;

  const lines = val.slice(blockStart).split("\n");
  let lineStart = blockStart;
  let startShift = 0;
  let endShift = 0;
  let changed = false;
  // The item that moved last, while the lines after it are still nested under it.
  let moved: { depth: number; threshold: number; from: string; to: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const { quote, depth, rest, item } = splitQuoted(line);
    const nested = !!moved && !!item && depth === moved.depth && item.indentWidth >= moved.threshold;
    if (!nested) moved = null;
    if (lineStart > selEnd && !nested) break;
    let next = line;
    if (item && moved) {
      const indent = rest.slice(0, item.indentLength);
      const below = indent.startsWith(moved.from) ? indent.slice(moved.from.length) : INDENT_UNIT;
      next = quote + moved.to + below + rest.slice(item.indentLength);
    } else if (item) {
      // Measured against the text as it was: the lines above are not rewritten until the end.
      const target: string | null = outdent
        ? enclosingIndent(val, lineStart, depth, item.indentWidth)
        : childIndent(val, lineStart, depth, item.indentWidth);
      if (target !== null && target.length !== item.indentLength) {
        next = quote + target + rest.slice(item.indentLength);
        changed = true;
        moved = { depth, threshold: nestThreshold(item), from: rest.slice(0, item.indentLength), to: target };
      }
    }
    const delta = next.length - line.length;
    if (lineStart <= selStart) startShift += delta;
    if (lineStart <= selEnd) endShift += delta;
    lines[i] = next;
    lineStart += line.length + 1;
  }

  if (!changed) return false;

  ta.value = val.slice(0, blockStart) + lines.join("\n");
  ta.selectionStart = Math.max(blockStart, selStart + startShift);
  ta.selectionEnd = Math.max(blockStart, selEnd + endShift);
  normalizeRunAroundCaret(ta);
  ta.dispatchEvent(new Event("input"));
  return true;
}

const TIMED_ITEM_RE = /^\d{1,2}:\d{2}(?:[ \t\u3000]|$)/;

/**
 * Carries a list item onto the next line when Enter is pressed.
 *
 * A item with text repeats its marker at the same indent, numbering on from the current one.
 * An empty one steps out a level instead, and at the outermost level loses its marker, so
 * repeated Enter walks back out of the list. Returns false when the caret is not on a list
 * item at all, leaving the plain newline to the textarea.
 */
export function continueListOnEnter(ta: ComposerField): boolean {
  const pos = ta.selectionStart;
  const val = ta.value;
  const rowStart = pos > 0 ? val.lastIndexOf("\n", pos - 1) + 1 : 0;
  // Inside a quote the list carries on inside it, "> " repeated before the marker.
  const quote = QUOTE_PREFIX_RE.exec(val.slice(rowStart, pos))?.[0] ?? "";
  const lineStart = rowStart + quote.length;
  const line = val.slice(lineStart, pos);

  const info = parseListLine(line, true);
  if (!info) return false;
  const indent = line.slice(0, info.indentLength);

  if (info.content !== "") {
    const marker =
      info.kind === "check" ? "- [ ] "
        : info.kind === "bullet" ? "- "
          : `${parseInt(info.olMarker, 10) + 1}. `;
    // An item opening with a time hands the next one an @, so the time list opens right away.
    const timed = TIMED_ITEM_RE.test(info.content) ? "@" : "";
    const insert = `\n${quote}${indent}${marker}${timed}`;
    ta.value = val.slice(0, pos) + insert + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = pos + insert.length;
  } else if (indent === "") {
    ta.value = val.slice(0, lineStart) + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = lineStart;
  } else {
    const outer = enclosingIndent(val, rowStart, (quote.match(/>/g) ?? []).length, info.indentWidth);
    const marker = line.slice(info.indentLength);
    ta.value = val.slice(0, lineStart) + outer + marker + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = lineStart + outer.length + marker.length;
  }
  normalizeRunAroundCaret(ta);
  // Not commit(): the caret is already in the textarea, and re-focusing mid-keystroke
  // disturbs the IME on iOS.
  ta.dispatchEvent(new Event("input"));
  return true;
}

/**
 * Carries a block quote onto the next line when Enter is pressed, at the same depth. An empty
 * quote line steps out a level instead, and at the outermost level loses its marker, so repeated
 * Enter walks back out of the quote, as with lists. Returns false off a quote line.
 */
export function continueQuoteOnEnter(ta: ComposerField): boolean {
  const pos = ta.selectionStart;
  const val = ta.value;
  const { start } = currentLineBounds(val, pos);
  const prefix = QUOTE_PREFIX_RE.exec(val.slice(start, pos))?.[0];
  if (!prefix) return false;
  if (val.slice(start + prefix.length, pos).trim() !== "") {
    const insert = "\n" + (prefix.endsWith(" ") ? prefix : prefix + " ");
    ta.value = val.slice(0, pos) + insert + val.slice(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = pos + insert.length;
  } else {
    const depth = (prefix.match(/>/g) ?? []).length;
    const outer = "> ".repeat(depth - 1);
    ta.value = val.slice(0, start) + outer + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = start + outer.length;
  }
  ta.dispatchEvent(new Event("input"));
  return true;
}

/** Inserts a fenced block (code or math) on its own lines, caret placed inside it. */
export function insertFenceBlock(ta: ComposerField, insert: string): void {
  const pos = ta.selectionStart;
  const val = ta.value;

  const lineStart = pos > 0 ? val.lastIndexOf("\n", pos - 1) + 1 : 0;
  const currentLineIsEmpty =
    val.slice(lineStart, pos).trim() === "" &&
    (val.indexOf("\n", pos) === -1 || val.slice(pos, val.indexOf("\n", pos)).trim() === "");

  let before = val.slice(0, lineStart);
  let after = val.slice(lineStart);

  if (!currentLineIsEmpty) {
    const needsLeadingNewline = before.length > 0 && !before.endsWith("\n\n");
    if (needsLeadingNewline) before += before.endsWith("\n") ? "\n" : "\n\n";
    after = "\n" + after;
  }

  // No separator if the remainder is empty/whitespace; one newline before any
  // following text or quote marker.
  const afterStripped = after.replace(/^\n+/, "");
  let separator = "";
  if (afterStripped.length > 0) {
    separator = "\n";
    after = afterStripped;
  }

  const cursorOffset = before.length + 3; // inside the fence, at the empty line

  ta.value = before + insert + separator + after;
  ta.selectionStart = ta.selectionEnd = cursorOffset;
  commit(ta);
}

/** Which list marker, if any, the caret's line currently carries. */
export function lineMarkerState(ta: ComposerField): {
  isList: boolean;
  isCheck: boolean;
  isOl: boolean;
} {
  const val = ta.value;
  const { start, end } = currentLineBounds(val, ta.selectionStart);
  const line = val.slice(start, end).replace(QUOTE_PREFIX_RE, "");
  return {
    isList: line.startsWith("- ") && !/^- \[[ x]\] /.test(line),
    isCheck: /^- \[[ x]\] /.test(line),
    isOl: /^\d+\.\s?/.test(line),
  };
}

/**
 * True if the selection is fully wrapped by the marker. Always false with no selection, so
 * button state doesn't flicker while the caret moves.
 */
export function isInsideMarker(ta: ComposerField, marker: "**" | "*"): boolean {
  const val = ta.value;
  if (ta.selectionStart === ta.selectionEnd) return false;
  let { start, end } = outsideLink(val, ta.selectionStart, ta.selectionEnd);
  // Delimiters may be inside the selection or just outside it (hidden in visual mode); step
  // in past the selected ones so every one is counted from outside.
  while (end - start > 2 && val[start] === "*" && val[end - 1] === "*") {
    start++;
    end--;
  }
  return pairsAround(val, start, end).some((p) => p.marker === marker);
}

// Toolbar decorations get a half-width space each side: touching delimiters merge into one run. Existing whitespace (or a line start, before) is enough.
export const spaceBefore = (prev: string): string => (prev !== "" && !/\s/.test(prev) ? " " : "");
export const spaceAfter = (next: string): string => (/\s/.test(next) ? "" : " ");

/**
 * Inserts a closing marker at the caret and leaves the caret past a single half-width space,
 * also setting the opener at openerPos off from the text before it.
 */
export function closeInlineMarker(ta: ComposerField, marker: string, openerPos?: number): void {
  const pos = ta.selectionStart;
  const val = ta.value;
  const insert = marker + spaceAfter(val.slice(pos, pos + 1));
  const lead = openerPos === undefined || openerPos >= pos ? "" : spaceBefore(val.slice(openerPos - 1, openerPos));
  const at = openerPos ?? pos;
  ta.value = val.slice(0, at) + lead + val.slice(at, pos) + insert + val.slice(pos);
  ta.selectionStart = ta.selectionEnd = pos + lead.length + insert.length;
}

/**
 * Whether an action would put inline code or math together with another effect, which is not
 * offered: decorations and links stay off code and math, and code and math off decorated or
 * linked text. Code and math with nothing selected insert a block, so they are never held off.
 */
export function effectBlocked(ta: ComposerField, kind: "code" | "math" | "decoration"): boolean {
  const val = ta.value;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (kind !== "decoration" && start === end) return false;
  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
  const nl = val.indexOf("\n", end);
  const own = kind === "code" ? "`" : "$";
  for (const { token, index } of inlineTokens(val.slice(lineStart, nl === -1 ? val.length : nl))) {
    const from = lineStart + index;
    const to = from + token.length;
    const touches = start === end ? from < start && to > start : from < end && to > start;
    if (!touches) continue;
    const literal = token.startsWith("`") || token.startsWith("$");
    if (kind === "decoration" ? literal : literal ? !token.startsWith(own) : decorationInner(token) !== null || /^!?\[/.test(token)) {
      return true;
    }
  }
  return false;
}

/** Whether [start, end] sits inside decoration delimiters, where nothing is spaced off. */
export function insideDecoration(val: string, start: number, end: number): boolean {
  return pairsAround(val, start, end).length > 0;
}

/**
 * A selection within a link's text stands for the whole link: decorations go around the link,
 * since its text is not read for them.
 */
function outsideLink(val: string, start: number, end: number): { start: number; end: number } {
  const link = findLinkAt(val, start, end);
  return link && start >= link.open.to && end <= link.close.from ? { start: link.from, end: link.to } : { start, end };
}

/**
 * Delimiter pairs wrapped right around [start, end], innermost first: the opener sits just
 * before s and the closer just after e. A run of three asterisks is italic inside bold.
 */
function pairsAround(val: string, start: number, end: number): { marker: string; close: string; s: number; e: number }[] {
  const pairs: { marker: string; close: string; s: number; e: number }[] = [];
  let s = start;
  let e = end;
  for (;;) {
    const before = val.slice(0, s);
    const after = val.slice(e);
    const stars = Math.min(/\*+$/.exec(before)?.[0].length ?? 0, /^\*+/.exec(after)?.[0].length ?? 0, 3);
    if (stars === 3) {
      pairs.push({ marker: "*", close: "*", s, e }, { marker: "**", close: "**", s: s - 1, e: e + 1 });
    } else if (stars > 0) {
      const m = "*".repeat(stars);
      pairs.push({ marker: m, close: m, s, e });
    }
    if (stars > 0) {
      s -= stars;
      e += stars;
      continue;
    }
    const same = ["~~", "$", "`"].find((m) => before.endsWith(m) && after.startsWith(m));
    // A highlight's opener may carry its colour emoji.
    const highlight = after.startsWith("==")
      ? ["", ...HIGHLIGHT_EMOJI.map(([, emoji]) => emoji)].map((emoji) => "==" + emoji).find((m) => before.endsWith(m))
      : undefined;
    const pair = same ? { marker: same, close: same } : highlight ? { marker: highlight, close: "==" } : null;
    if (!pair) return pairs;
    pairs.push({ ...pair, s, e });
    s -= pair.marker.length;
    e += pair.close.length;
  }
}

/**
 * Wraps the selection in a marker pair, or takes that marker off when it already wraps it.
 * Decorations stack: another marker goes on inside the ones already around the selection.
 */
export function wrapSelection(
  ta: ComposerField,
  open: string,
  close: string,
  // Inline decorations are spaced off as closeInlineMarker does it.
  spaced = false
): void {
  if (ta.selectionStart === ta.selectionEnd) return;
  const val = ta.value;
  const linkSpan = outsideLink(val, ta.selectionStart, ta.selectionEnd);
  const inLinkText = linkSpan.start !== ta.selectionStart || linkSpan.end !== ta.selectionEnd;
  // Code and math go inside the link's text, where nothing is spaced off either.
  const literal = open === "`" || open === "$";
  const { start, end } = literal ? { start: ta.selectionStart, end: ta.selectionEnd } : linkSpan;
  const selected = val.slice(start, end);

  // The selection takes in the marker's own delimiters. Asterisks count by run, so bold is not
  // read as italic and a run of three holds both.
  const starRun = Math.min(/^\*+/.exec(selected)?.[0].length ?? 0, /\*+$/.exec(selected)?.[0].length ?? 0);
  const own = open === "*" ? starRun === 1 || starRun >= 3
    : open === "**" ? starRun >= 2
      : selected.startsWith(open) && selected.endsWith(close);
  if (own && selected.length > open.length + close.length) {
    const inner = selected.slice(open.length, selected.length - close.length);
    ta.value = val.slice(0, start) + inner + val.slice(end);
    ta.selectionStart = start;
    ta.selectionEnd = start + inner.length;
    commit(ta);
    return;
  }

  // Or the marker sits just outside the selection, possibly beyond other markers.
  const pairs = pairsAround(val, start, end);
  const around = pairs.find((p) => (open === "==" ? p.marker.startsWith("==") : p.marker === open));
  if (around) {
    ta.value =
      val.slice(0, around.s - around.marker.length) + val.slice(around.s, around.e) + val.slice(around.e + around.close.length);
    ta.selectionStart = start - around.marker.length;
    ta.selectionEnd = end - around.marker.length;
    commit(ta);
    return;
  }

  // Bold and italic only hold together as one run of asterisks (***x***): with another
  // decoration between them, neither reads as a pair. The new one joins the one already there.
  const star = open === "*" || open === "**" ? pairs.find((p) => p.marker === "*" || p.marker === "**") : undefined;
  if (star && star.s !== start) {
    ta.value = val.slice(0, star.s) + open + val.slice(star.s, star.e) + close + val.slice(star.e);
    ta.selectionStart = start + open.length;
    ta.selectionEnd = end + open.length;
    commit(ta);
    return;
  }

  const alone = spaced && pairs.length === 0 && !(literal && inLinkText);
  const lead = alone ? spaceBefore(val.slice(start - 1, start)) : "";
  const tail = alone ? spaceAfter(val.slice(end, end + 1)) : "";
  ta.value = val.slice(0, start) + lead + open + selected + close + tail + val.slice(end);
  ta.selectionStart = start + lead.length;
  ta.selectionEnd = end + lead.length + open.length + close.length;
  commit(ta);
}

/** Adds or removes a prefix (quote marker) on every line the selection touches. */
export function toggleBlockPrefix(ta: ComposerField, prefix: string): void {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const val = ta.value;

  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = val.indexOf("\n", end - 1);
  const blockEnd = lineEnd === -1 ? val.length : lineEnd;
  const block = val.slice(lineStart, blockEnd);
  const lines = block.split("\n");

  const allHavePrefix = lines.every((l) => l.startsWith(prefix));
  const newLines = allHavePrefix
    ? lines.map((l) => l.slice(prefix.length))
    : lines.map((l) => prefix + l);

  const newBlock = newLines.join("\n");
  ta.value = val.slice(0, lineStart) + newBlock + val.slice(blockEnd);

  const diff = newBlock.length - block.length;
  ta.selectionStart = ta.selectionEnd = blockEnd + diff;
  commit(ta);
}

/**
 * The highlight (coloured or not) holding the whole selection, with the text it shows. Read
 * with the display token rules, so a highlight inside code is not one here.
 */
export function highlightAtSelection(ta: ComposerField): { from: number; to: number; text: string } | null {
  const val = ta.value;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
  const newline = val.indexOf("\n", lineStart);
  const line = val.slice(lineStart, newline === -1 ? val.length : newline);
  for (const { token, index } of inlineTokens(line)) {
    if (token.length < 5 || !token.startsWith("==") || !token.endsWith("==")) continue;
    const from = lineStart + index;
    const to = from + token.length;
    if (from > start || end > to) continue;
    const inner = token.slice(2, -2);
    const tint = highlightColor(inner);
    return { from, to, text: tint ? inner.slice(tint.length) : inner };
  }
  return null;
}

/** Replaces a highlight with its text, colour emoji and all, leaving that text selected. */
export function removeHighlight(ta: ComposerField, at: { from: number; to: number; text: string }): void {
  const val = ta.value;
  ta.value = val.slice(0, at.from) + at.text + val.slice(at.to);
  ta.selectionStart = at.from;
  ta.selectionEnd = at.from + at.text.length;
  commit(ta);
}

/**
 * Highlights the selection in a colour, written as Obsidian writes it (its emoji first);
 * "" is the default, the theme's own highlight.
 */
export function wrapHighlight(ta: ComposerField, emoji: string): void {
  if (!emoji) {
    wrapSelection(ta, "==", "==", true);
    return;
  }
  if (ta.selectionStart === ta.selectionEnd) return;
  const val = ta.value;
  const { start, end } = outsideLink(val, ta.selectionStart, ta.selectionEnd);
  const text = val.slice(start, end);
  const alone = !insideDecoration(val, start, end);
  const lead = alone ? spaceBefore(val.slice(start - 1, start)) : "";
  const tail = alone ? spaceAfter(val.slice(end, end + 1)) : "";
  ta.value = `${val.slice(0, start)}${lead}==${emoji}${text}==${tail}${val.slice(end)}`;
  ta.selectionStart = start + lead.length + 2 + emoji.length;
  ta.selectionEnd = ta.selectionStart + text.length;
  commit(ta);
}
