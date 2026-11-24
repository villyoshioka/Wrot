import { EditorView } from "@codemirror/view";
import { isolateHistory } from "@codemirror/commands";
import { insideCodeBlock, splitQuoted } from "../utils/textareaEditor";
import { findBlockRanges, toTildeFences } from "../utils/blockSegmenter";
import type { ActiveToken, SuggestItem, SuggestSource } from "../utils/tagSuggest";

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * The text typed after the last @ before the caret, when that @ opens the line, follows the
 * line's quote and list markers, or follows a space (so an address like a@b is left alone).
 * Compared in NFKC, so a fullwidth ＠, digits and letters from an IME read the same as ASCII.
 */
function lineShortcut(value: string, pos: number): { start: number; text: string } | null {
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const line = value.slice(lineStart, pos);
  const at = Math.max(line.lastIndexOf("@"), line.lastIndexOf("＠"));
  if (at < 0) return null;
  const { quote, rest, item } = splitQuoted(line);
  const lead = quote.length + (item ? item.indentLength + item.markerLength : rest.length - rest.trimStart().length);
  if (at !== lead && line[at - 1] !== " " && line[at - 1] !== "　") return null;
  // An odd number of backticks before the @ puts it in inline code, closed yet or still being typed.
  if (line.slice(0, at).split("`").length % 2 === 0) return null;
  // Backtick fences stay as typed until posting; same length as tildes, so pos still holds.
  if (insideCodeBlock(toTildeFences(value), pos)) return null;
  return { start: lineStart + at, text: line.slice(at + 1).normalize("NFKC") };
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

// Offered once @n is typed. The label stays the word, and the time is read when the item is
// picked, so a list left open never shows or inserts a stale minute.
const nowItem: SuggestItem = {
  label: "@now",
  get insert(): string {
    const now = new Date();
    return clock(now.getHours(), now.getMinutes())!.insert;
  },
};

export interface DateShortcuts {
  pick: (from: number, to: number) => void;
  today: () => string;
}

// Not through expandShortcut: iOS can still report a composition right after the list's insert.
export function timeSource(dates: DateShortcuts): SuggestSource {
  const dateItem: SuggestItem = { label: "@date", insert: "@date ", after: dates.pick };
  const todayItem: SuggestItem = {
    label: "@today",
    get insert(): string {
      return `${dates.today()} `;
    },
  };
  return {
    detect(value: string, pos: number): ActiveToken | null {
      const shortcut = lineShortcut(value, pos);
      const typed = shortcut && /^(?:\d{0,4}|n|no|now|d|da|dat|date|t|to|tod|toda|today)$/i.exec(shortcut.text);
      return typed ? { start: shortcut.start, end: pos, query: typed[0] } : null;
    },
    items: (query) =>
      /^n/i.test(query) ? [nowItem]
      : /^d/i.test(query) ? [dateItem]
      : /^t/i.test(query) ? [todayItem]
      : timeItems(query),
  };
}

export function completeShortcut(view: EditorView, from: number, to: number, insert: string): void {
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length },
    userEvent: "input.complete",
    annotations: isolateHistory.of("full"),
  });
}

/**
 * Replaces an @now or @today opening the caret's line with the time or date at this moment,
 * or hands an @date to `dates.pick`. `typed` is the space that triggered it, written first in
 * a step of its own, so one undo brings back "@now " as typed rather than the time.
 */
export function expandShortcut(view: EditorView, dates: DateShortcuts, typed = ""): boolean {
  const sel = view.state.selection.main;
  if (!sel.empty || view.composing) return false;
  const shortcut = lineShortcut(view.state.doc.toString(), sel.head);
  const word = shortcut?.text.toLowerCase();
  if (!shortcut || (word !== "now" && word !== "date" && word !== "today")) return false;
  if (typed) {
    view.dispatch({ changes: { from: sel.head, insert: typed }, selection: { anchor: sel.head + typed.length }, userEvent: "input.type" });
  }
  const to = sel.head + typed.length;
  if (word === "date") {
    dates.pick(shortcut.start, to);
    return true;
  }
  const now = new Date();
  const insert = word === "today" ? `${dates.today()} ` : clock(now.getHours(), now.getMinutes())!.insert;
  completeShortcut(view, shortcut.start, to, insert);
  return true;
}

export const shortcutOnSpace = (dates: DateShortcuts) => EditorView.inputHandler.of((view, from, to, text) => {
  if ((text !== " " && text !== "　") || from !== to || from !== view.state.selection.main.head) return false;
  return expandShortcut(view, dates, text);
});

/**
 * Pads a one-digit hour (9:30 → 09:30) at the start of a line or after its quote and list
 * markers. Times later in the line, and code and math blocks, are left as written.
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
