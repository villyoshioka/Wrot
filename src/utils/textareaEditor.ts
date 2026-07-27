/**
 * Text manipulations for the composer textarea.
 *
 * These only ever read and write the textarea, so they live outside the view: the toolbar
 * buttons and keyboard shortcuts call them, and the view keeps the wiring.
 * Every mutation ends with `commit`, which restores focus and fires the input event the
 * auto-resize and toolbar-state handlers listen for.
 */

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
