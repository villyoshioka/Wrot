/**
 * Text manipulations for the composer textarea.
 *
 * These only ever read and write the textarea, so they live outside the view: the toolbar
 * buttons and keyboard shortcuts call them, and the view keeps the wiring.
 * Every mutation ends with `commit`, which restores focus and fires the input event the
 * auto-resize and toolbar-state handlers listen for.
 */

import { ListDepthTracker, nestThreshold, parseListLine } from "./listParser";

function commit(ta: HTMLTextAreaElement): void {
  ta.focus();
  ta.dispatchEvent(new Event("input"));
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
export function insertAtLineStart(ta: HTMLTextAreaElement, prefix: string): void {
  const pos = ta.selectionStart;
  const val = ta.value;
  const { start: lineStart, end: lineEnd } = currentLineBounds(val, pos);
  const lineText = val.slice(lineStart, lineEnd);

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
    ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart);
    ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
  }
  commit(ta);
}

/**
 * Indent of the item the given one is nested under.
 *
 * Indents are written by hand and come in no fixed step, so the level to step out to is
 * whichever one the parent actually used — the nearest item above whose text begins at or
 * before this indent. Scanning stops where the run of list items does, since anything before
 * that belongs to another list.
 */
function enclosingIndent(val: string, lineStart: number, indentWidth: number): string {
  if (lineStart === 0) return "";
  const lines = val.slice(0, lineStart - 1).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const item = parseListLine(lines[i], true);
    if (!item) break;
    if (nestThreshold(item) <= indentWidth) {
      return lines[i].slice(0, item.indentLength);
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
export function syncListFormatting(ta: HTMLTextAreaElement): void {
  normalizeRunAroundCaret(ta);
}

// Only the run under the caret is touched; lists elsewhere in the post are left alone.
function normalizeRunAroundCaret(ta: HTMLTextAreaElement): void {
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
  if (!parseListLine(lines[caretLine], true)) return;

  let first = caretLine;
  let last = caretLine;
  while (first > 0 && parseListLine(lines[first - 1], true)) first--;
  while (last + 1 < lines.length && parseListLine(lines[last + 1], true)) last++;

  const tracker = new ListDepthTracker();
  let startShift = 0;
  let endShift = 0;
  let changed = false;
  for (let i = first; i <= last; i++) {
    const item = parseListLine(lines[i], true);
    if (!item) continue;
    const { depth, ordinal } = tracker.place(item);
    const written = lines[i].slice(0, item.indentLength);
    // A part-typed indent on the caret's line is left alone: normalising it away would eat
    // each space as it arrives, and the next level could never be reached by typing. Only
    // spaces get that grace — a tab or an ideographic space is a whole step as it stands.
    const midStep =
      i === caretLine && isPlainSpaces(written) && written.length > depth * INDENT_UNIT.length;
    const indent = midStep ? written : INDENT_UNIT.repeat(depth);

    let rest = lines[i].slice(item.indentLength);
    if (item.kind === "ol") rest = `${ordinal}.` + rest.slice(item.olMarker.length);
    const next = indent + rest;
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
function childIndent(val: string, lineStart: number, indentWidth: number): string | null {
  if (lineStart === 0) return null;
  const lines = val.slice(0, lineStart - 1).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const item = parseListLine(lines[i], true);
    if (!item) return null;
    if (item.indentWidth > indentWidth) continue;
    if (item.indentWidth < indentWidth) return null;
    return lines[i].slice(0, item.indentLength) + INDENT_UNIT;
  }
  return null;
}

/**
 * Moves the list items covered by the selection one level in or out, for Tab and Shift+Tab.
 *
 * Returns false when nothing in reach is a list item that can move, which leaves Tab to do
 * what it always did and keeps a way out of the textarea by keyboard.
 */
export function shiftListIndent(ta: HTMLTextAreaElement, outdent: boolean): boolean {
  const val = ta.value;
  const selStart = ta.selectionStart;
  const selEnd = ta.selectionEnd;
  const blockStart = selStart > 0 ? val.lastIndexOf("\n", selStart - 1) + 1 : 0;
  const trailing = val.indexOf("\n", selEnd);
  const blockEnd = trailing === -1 ? val.length : trailing;

  const rebuilt: string[] = [];
  let lineStart = blockStart;
  let startShift = 0;
  let endShift = 0;
  let changed = false;

  for (const line of val.slice(blockStart, blockEnd).split("\n")) {
    const item = parseListLine(line, true);
    let next = line;
    if (item) {
      // Every line is measured against the text as it was, so one item moving does not
      // drag the next one along with it.
      const target = outdent
        ? enclosingIndent(val, lineStart, item.indentWidth)
        : childIndent(val, lineStart, item.indentWidth);
      if (target !== null && target.length !== item.indentLength) {
        next = target + line.slice(item.indentLength);
        changed = true;
      }
    }
    const delta = next.length - line.length;
    if (lineStart <= selStart) startShift += delta;
    if (lineStart <= selEnd) endShift += delta;
    rebuilt.push(next);
    lineStart += line.length + 1;
  }

  if (!changed) return false;

  ta.value = val.slice(0, blockStart) + rebuilt.join("\n") + val.slice(blockEnd);
  ta.selectionStart = Math.max(blockStart, selStart + startShift);
  ta.selectionEnd = Math.max(blockStart, selEnd + endShift);
  normalizeRunAroundCaret(ta);
  ta.dispatchEvent(new Event("input"));
  return true;
}

/**
 * Carries a list item onto the next line when Enter is pressed.
 *
 * A item with text repeats its marker at the same indent, numbering on from the current one.
 * An empty one steps out a level instead, and at the outermost level loses its marker, so
 * repeated Enter walks back out of the list. Returns false when the caret is not on a list
 * item at all, leaving the plain newline to the textarea.
 */
export function continueListOnEnter(ta: HTMLTextAreaElement): boolean {
  const pos = ta.selectionStart;
  const val = ta.value;
  const lineStart = pos > 0 ? val.lastIndexOf("\n", pos - 1) + 1 : 0;
  const line = val.slice(lineStart, pos);

  const info = parseListLine(line, true);
  if (!info) return false;
  const indent = line.slice(0, info.indentLength);

  if (info.content !== "") {
    const marker =
      info.kind === "check" ? "- [ ] "
        : info.kind === "bullet" ? "- "
          : `${parseInt(info.olMarker, 10) + 1}. `;
    const insert = `\n${indent}${marker}`;
    ta.value = val.slice(0, pos) + insert + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = pos + insert.length;
  } else if (indent === "") {
    ta.value = val.slice(0, lineStart) + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = lineStart;
  } else {
    const outer = enclosingIndent(val, lineStart, info.indentWidth);
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

/** Inserts a fenced block (code or math) on its own lines, caret placed inside it. */
export function insertFenceBlock(ta: HTMLTextAreaElement, insert: string): void {
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
export function lineMarkerState(ta: HTMLTextAreaElement): {
  isList: boolean;
  isCheck: boolean;
  isOl: boolean;
} {
  const val = ta.value;
  const { start, end } = currentLineBounds(val, ta.selectionStart);
  const line = val.slice(start, end);
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
export function isInsideMarker(ta: HTMLTextAreaElement, marker: "**" | "*"): boolean {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (start === end) return false;
  const selected = ta.value.slice(start, end);
  if (marker === "**") {
    return /^\*\*[\s\S]+\*\*$/.test(selected);
  }
  if (!/^\*[\s\S]+\*$/.test(selected)) return false;
  // Don't misread **bold** as italic.
  if (selected.startsWith("**") || selected.endsWith("**")) return false;
  return true;
}

/** True if the caret sits inside, or the selection is exactly, an embed link. */
export function isInsideEmbed(ta: HTMLTextAreaElement): boolean {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const val = ta.value;

  if (start !== end) {
    return /^!?\[\[[^\]]*\]\]$/.test(val.slice(start, end));
  }
  const before = val.slice(Math.max(0, start - 100), start);
  const after = val.slice(start, start + 100);
  return /!\[\[([^\]]*?)$/.test(before) && /^([^\]]*?)\]\]/.test(after);
}

/**
 * Toggles an inline wrapper around the caret. If the caret already sits inside one of the
 * known wrappers, that one is removed or swapped; otherwise an empty pair is inserted.
 */
export function toggleInlineWrap(ta: HTMLTextAreaElement, open: string, close: string): void {
  const pos = ta.selectionStart;
  const val = ta.value;
  const before = val.slice(Math.max(0, pos - 100), pos);
  const after = val.slice(pos, pos + 100);

  const wrapTypes: [string, string, RegExp, RegExp][] = [
    ["![[", "]]", /!\[\[([^\]]*?)$/, /^([^\]]*?)\]\]/],
    ["`", "`", /`([^`]*?)$/, /^([^`]*?)`/],
    ["$", "$", /\$([^$]*?)$/, /^([^$]*?)\$/],
  ];

  let currentType: [string, string] | null = null;
  let currentBefore: RegExpMatchArray | null = null;
  let currentAfter: RegExpMatchArray | null = null;

  for (const [wo, wc, beforeRe, afterRe] of wrapTypes) {
    const bm = before.match(beforeRe);
    const am = after.match(afterRe);
    if (bm && am) {
      currentType = [wo, wc];
      currentBefore = bm;
      currentAfter = am;
      break;
    }
  }

  if (!currentType || !currentBefore || !currentAfter) {
    const insert = open + close;
    ta.value = val.slice(0, pos) + insert + val.slice(pos);
    ta.selectionStart = ta.selectionEnd = pos + open.length;
    commit(ta);
    return;
  }

  const start = pos - currentBefore[0].length;
  const end = pos + currentAfter[0].length;
  const content = currentBefore[1] + currentAfter[1];

  if (currentType[0] === open) {
    ta.value = val.slice(0, start) + content + val.slice(end);
    ta.selectionStart = ta.selectionEnd = start + currentBefore[1].length;
  } else {
    ta.value = val.slice(0, start) + open + content + close + val.slice(end);
    ta.selectionStart = ta.selectionEnd = start + open.length + currentBefore[1].length;
  }
  commit(ta);
}

/** Wraps the selection in a marker pair, or unwraps it when it is already wrapped. */
export function wrapSelection(ta: HTMLTextAreaElement, open: string, close: string): void {
  let start = ta.selectionStart;
  let end = ta.selectionEnd;
  if (start === end) return;
  const val = ta.value;

  const markers = ["**", "*", "~~", "==", "$"];

  // Check the marker matching `open` first to avoid bold/italic confusion.
  const orderedForInner =
    open === "*"
      ? ["*", "**", "~~", "==", "$"]
      : open === "**"
        ? ["**", "*", "~~", "==", "$"]
        : markers;
  for (const m of orderedForInner) {
    const selected = val.slice(start, end);
    // Skip the "*" match when the edges are "**" (that's bold).
    if (m === "*" && (selected.startsWith("**") || selected.endsWith("**"))) continue;
    if (selected.length >= m.length * 2 && selected.startsWith(m) && selected.endsWith(m)) {
      const inner = selected.slice(m.length, selected.length - m.length);
      ta.value = val.slice(0, start) + inner + val.slice(end);
      ta.selectionStart = start;
      ta.selectionEnd = start + inner.length;
      commit(ta);
      return;
    }
  }

  // The selection may sit just inside an existing pair; strip that first so the new marker
  // replaces it rather than nesting.
  for (const m of markers) {
    const before = val.slice(start - m.length, start);
    const after = val.slice(end, end + m.length);
    if (before === m && after === m) {
      ta.value =
        val.slice(0, start - m.length) + val.slice(start, end) + val.slice(end + m.length);
      start -= m.length;
      end -= m.length;
      if (m === open) {
        ta.selectionStart = start;
        ta.selectionEnd = end;
        commit(ta);
        return;
      }
      break;
    }
  }

  const currentVal = ta.value;
  ta.value =
    currentVal.slice(0, start) + open + currentVal.slice(start, end) + close + currentVal.slice(end);
  ta.selectionStart = start;
  ta.selectionEnd = end + open.length + close.length;
  commit(ta);
}

/** Wrap the selection in ![[...]], unwrap if already wrapped; no-op if it would nest. */
export function wrapSelectionWithEmbedBrackets(ta: HTMLTextAreaElement): void {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (start === end) return;
  const val = ta.value;
  const selected = val.slice(start, end);

  const unwrapMatch = selected.match(/^(!?)\[\[([^\]]*)\]\]$/);
  if (unwrapMatch) {
    const inner = unwrapMatch[2];
    ta.value = val.slice(0, start) + inner + val.slice(end);
    ta.selectionStart = ta.selectionEnd = start + inner.length;
    commit(ta);
    return;
  }

  if (/!?\[\[[^\]]*\]\]/.test(selected)) return;

  const wrapped = "![[" + selected + "]]";
  ta.value = val.slice(0, start) + wrapped + val.slice(end);
  ta.selectionStart = ta.selectionEnd = start + wrapped.length;
  commit(ta);
}

/** Adds or removes a prefix (quote marker) on every line the selection touches. */
export function toggleBlockPrefix(ta: HTMLTextAreaElement, prefix: string): void {
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

/** Turns the selection into a markdown link, caret placed inside the empty URL. */
export function insertMarkdownLink(ta: HTMLTextAreaElement): void {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (start === end) return;
  const val = ta.value;
  const selected = val.slice(start, end);
  ta.value = val.slice(0, start) + "[" + selected + "](" + ")" + val.slice(end);
  ta.selectionStart = ta.selectionEnd = start + 1 + selected.length + 2;
  commit(ta);
}
