import { EditorView } from "@codemirror/view";
import { isolateHistory } from "@codemirror/commands";
import { insideCodeBlock, splitQuoted } from "../utils/textareaEditor";
import { findBlockRanges, toTildeFences } from "../utils/blockSegmenter";
import type { ActiveToken, SuggestItem, SuggestSource } from "../utils/tagSuggest";

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * The text typed after an @ that opens a line, or after the line's quote and list markers.
 * Compared in NFKC, so a fullwidth ＠, digits and letters from an IME read the same as ASCII.
 */
function lineShortcut(value: string, pos: number): { start: number; text: string } | null {
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const { quote, rest, item } = splitQuoted(value.slice(lineStart, pos));
  const lead = item ? item.indentLength + item.markerLength : rest.length - rest.trimStart().length;
  const text = rest.slice(lead).normalize("NFKC");
  // Backtick fences stay as typed until posting; same length as tildes, so pos still holds.
  if (!text.startsWith("@") || insideCodeBlock(toTildeFences(value), pos)) return null;
  return { start: lineStart + quote.length + lead, text: text.slice(1) };
}

function clock(h: number, m: number): SuggestItem | null {
  if (h > 23 || m > 59) return null;
  const label = `${pad(h)}:${pad(m)}`;
  return { label, insert: `${label} ` };
}

/**
 * Quarter hours whose digits begin with the query, with or without the hour's leading zero
 * (2 offers 02:xx and 20:xx–23:xx, 830 offers 08:30). Three or four digits also offer the
 * exact time they spell. Kept in time order.
 */
function timeItems(query: string): SuggestItem[] {
  const found = new Map<number, SuggestItem>();
  const add = (h: number, m: number): void => {
    const item = clock(h, m);
    if (item) found.set(h * 60 + m, item);
  };
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (`${pad(h)}${pad(m)}`.startsWith(query) || `${h}${pad(m)}`.startsWith(query)) add(h, m);
    }
  }
  if (query.length >= 3) {
    const hourDigits = query.length - 2;
    add(Number(query.slice(0, hourDigits)), Number(query.slice(hourDigits)));
  }
  return [...found.entries()].sort(([a], [b]) => a - b).map(([, item]) => item);
}

export const timeSource: SuggestSource = {
  detect(value: string, pos: number): ActiveToken | null {
    const shortcut = lineShortcut(value, pos);
    const digits = shortcut && /^\d{0,4}$/.exec(shortcut.text);
    return digits ? { start: shortcut.start, end: pos, query: digits[0] } : null;
  },
  items: timeItems,
};

/**
 * Replaces an @now opening the caret's line with the time at this moment. `typed` is the
 * space that triggered it, written first in a step of its own, so one undo brings back
 * "@now " as typed rather than the time.
 */
export function expandNow(view: EditorView, typed = ""): boolean {
  const sel = view.state.selection.main;
  if (!sel.empty || view.composing) return false;
  const shortcut = lineShortcut(view.state.doc.toString(), sel.head);
  if (!shortcut || shortcut.text.toLowerCase() !== "now") return false;
  if (typed) {
    view.dispatch({ changes: { from: sel.head, insert: typed }, selection: { anchor: sel.head + typed.length }, userEvent: "input.type" });
  }
  const now = new Date();
  const { insert } = clock(now.getHours(), now.getMinutes())!;
  view.dispatch({
    changes: { from: shortcut.start, to: sel.head + typed.length, insert },
    selection: { anchor: shortcut.start + insert.length },
    userEvent: "input.complete",
    annotations: isolateHistory.of("full"),
  });
  return true;
}

export const nowOnSpace = EditorView.inputHandler.of((view, from, to, text) => {
  if ((text !== " " && text !== "　") || from !== to || from !== view.state.selection.main.head) return false;
  return expandNow(view, text);
});

/**
 * Pads a one-digit hour (9:30 → 09:30) where the @ shortcut would have put a time: at the
 * start of a line or after its quote and list markers. Code and math blocks are left as written.
 */
export function padLineTimes(text: string): string {
  const lines = text.split("\n");
  const blocks = findBlockRanges(lines);
  return lines.map((line, i) => {
    if (blocks.some((b) => i >= b.startLine && i <= b.endLine)) return line;
    const { quote, rest, item } = splitQuoted(line);
    const lead = quote.length + (item ? item.indentLength + item.markerLength : rest.length - rest.trimStart().length);
    return line.slice(0, lead) + line.slice(lead).replace(/^(\d:\d{2})(?=[ \t\u3000]|$)/, "0$1");
  }).join("\n");
}
