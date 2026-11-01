/**
 * Visual mode for the composer: Markdown syntax is shown as what it produces.
 *
 * The text in the editor stays the raw Markdown at all times; everything here is
 * decoration. Hidden syntax falls into two groups:
 * - Inline decorations (bold, italic, strikethrough, highlight, inline code, links) hide their
 *   delimiters for good. Deleting edits the visible text only: a delimiter is never removed
 *   on its own, and a decoration whose text is emptied goes with it.
 * - Line markers (lists, checkboxes, quotes) and inline math are replaced by what they draw.
 *   Deleting into one shows its source again instead of removing it. Inline code, though
 *   drawn as a decoration, does the same.
 *
 * Syntax typed by hand stays as typed until Enter is pressed on that line, so nothing
 * changes shape under the caret mid-line. Shown source (typed, or revealed by a delete)
 * goes back to hidden on the same Enter.
 */

import {
  EditorSelection,
  EditorState,
  Extension,
  Facet,
  Range,
  StateEffect,
  StateField,
  Transaction,
  TransactionSpec,
  findClusterBreak,
} from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { finishRenderMath, renderMath } from "obsidian";
import { findBlockRanges } from "../utils/blockSegmenter";
import { parseListLine } from "../utils/listParser";
import { isMathJaxReady, requestMathJax } from "../utils/mathjax";
import { TAG_TOKEN_RE, highlightColor, inlineTokens } from "../utils/patterns";
import { parseLinkToken } from "./composerLink";

interface Span {
  from: number;
  to: number;
}

/** An inline decoration whose delimiters are hidden. */
interface Construct {
  open: Span;
  close: Span;
}

interface Analysis {
  decorations: DecorationSet;
  atomic: DecorationSet;
  constructs: Construct[];
  // Line markers and rendered math: deleting into one reveals it.
  revealable: Span[];
  // The bold/italic opener armed from the toolbar, hidden while its text is being typed.
  armed: Span | null;
}

const revealEffect = StateEffect.define<Span>();
// Hands typed text in a range back to visual mode.
const commitEffect = StateEffect.define<Span>();
const armEffect = StateEffect.define<{ pos: number; marker: string } | null>();
/** Whether a ticked item's text is struck through, as the "check strikethrough" setting says. */
export const checkStrikethrough = Facet.define<boolean, boolean>({
  combine: (values) => values.some(Boolean),
});

/** Recomputes the decorations without any change, e.g. once MathJax has loaded. */
export const redrawEffect = StateEffect.define<null>();

function overlaps(spans: readonly Span[], from: number, to: number): boolean {
  return spans.some((s) => s.from < to && s.to > from);
}

function addSpan(spans: Span[], span: Span): Span[] {
  let { from, to } = span;
  const rest: Span[] = [];
  for (const s of spans) {
    if (s.to < from || s.from > to) rest.push(s);
    else {
      from = Math.min(from, s.from);
      to = Math.max(to, s.to);
    }
  }
  rest.push({ from, to });
  return rest;
}

/** Text typed by hand, or source revealed by a delete: shown as written until Enter. */
const rawField = StateField.define<Span[]>({
  create: () => [],
  update(spans, tr) {
    let next = spans;
    if (tr.docChanged) {
      next = next
        .map((s) => ({ from: tr.changes.mapPos(s.from, 1), to: tr.changes.mapPos(s.to, -1) }))
        .filter((s) => s.to > s.from);
      if (tr.isUserEvent("input.type")) {
        tr.changes.iterChanges((_fa, _ta, fromB, toB) => {
          if (toB > fromB) next = addSpan(next, { from: fromB, to: toB });
        });
      } else {
        // Text written by anything but typing is never raw, even where it replaced typed
        // text (the toolbar rewrites a whole selection when it wraps it).
        tr.changes.iterChanges((_fa, _ta, fromB, toB) => {
          if (toB > fromB) next = next.flatMap((s) => subtract(s.from, s.to, [{ from: fromB, to: toB }]));
        });
      }
    }
    for (const e of tr.effects) {
      if (e.is(revealEffect)) next = addSpan(next, e.value);
      if (e.is(commitEffect)) next = next.filter((s) => s.to <= e.value.from || s.from >= e.value.to);
    }
    if (tr.docChanged) {
      // Enter commits the line it was pressed on, including the part carried onto the new line.
      tr.changes.iterChanges((_fa, _ta, fromB, toB, inserted) => {
        if (!inserted.toString().includes("\n")) return;
        const from = tr.state.doc.lineAt(fromB).from;
        const to = tr.state.doc.lineAt(toB).to;
        next = next.filter((s) => s.to <= from || s.from >= to);
      });
    }
    return next;
  },
});

const armedField = StateField.define<{ pos: number; marker: string } | null>({
  create: () => null,
  update(armed, tr) {
    for (const e of tr.effects) if (e.is(armEffect)) armed = e.value;
    if (!armed) return null;
    const pos = tr.docChanged ? tr.changes.mapPos(armed.pos, 1) : armed.pos;
    if (tr.state.sliceDoc(pos, pos + armed.marker.length) !== armed.marker) return null;
    return { pos, marker: armed.marker };
  },
});

const hide = Decoration.replace({});
// Hidden by CSS, not replaced: CodeMirror rebuilds a replaced range's empty element on each nearby delete, which ends a held Backspace on iOS.
const conceal = Decoration.mark({ class: "wrot-cv-hidden" });
const checkDone = Decoration.mark({ class: "wrot-check-done" });
const linkMark = Decoration.mark({ class: "wrot-cv-link" });
const URL_TOKEN_RE = /^(?:https?|obsidian):\/\//i;
const tintedHighlights = new Map<string, Decoration>();
// 1.14's coloured highlight (==🔴…==): the emoji is part of the hidden opener.
function tintedHighlight(color: string): Decoration {
  let mark = tintedHighlights.get(color);
  if (!mark) {
    mark = Decoration.mark({ tagName: "mark", class: "wrot-highlight", attributes: { "data-highlight": color } });
    tintedHighlights.set(color, mark);
  }
  return mark;
}

const INLINE_MARKS: ReadonlyArray<{ delim: string; mark: Decoration }> = [
  // Longest delimiters first, so ** is not read as two *.
  { delim: "**", mark: Decoration.mark({ tagName: "strong" }) },
  { delim: "~~", mark: Decoration.mark({ tagName: "del" }) },
  { delim: "==", mark: Decoration.mark({ tagName: "mark", class: "wrot-highlight" }) },
  { delim: "*", mark: Decoration.mark({ tagName: "em" }) },
  { delim: "`", mark: Decoration.mark({ tagName: "code", class: "wrot-inline-code" }) },
];

// The armed styles open inclusively: a plain mark starting where a replacement starts is
// ordered inside it, and would not wrap the opener's stand-in.
const ARMED_MARKS: Record<string, Decoration> = {
  "**": Decoration.mark({ tagName: "strong", inclusive: true }),
  "*": Decoration.mark({ tagName: "em", inclusive: true }),
};

const QUOTE_PREFIX_RE = /^(?:>[ \t]?)+/;

class ListMarkerWidget extends WidgetType {
  constructor(
    readonly kind: "bullet" | "check" | "ol",
    readonly checked: boolean,
    readonly label: string
  ) {
    super();
  }

  eq(other: ListMarkerWidget): boolean {
    return other.kind === this.kind && other.checked === this.checked && other.label === this.label;
  }

  toDOM(view: EditorView): HTMLElement {
    const slot = createSpan({ cls: "wrot-cv-mark" });
    if (this.kind === "check") {
      const box = slot.createEl("input", {
        cls: "task-list-item-checkbox wrot-cv-check",
        attr: { type: "checkbox" },
      });
      box.checked = this.checked;
      // Keep the caret where it is; the click alone toggles the box.
      box.addEventListener("mousedown", (e) => e.preventDefault());
      box.addEventListener("click", (e) => {
        e.preventDefault();
        // "- [ ] ": the state character sits three past the marker's start.
        const pos = view.posAtDOM(slot) + 3;
        if (view.state.sliceDoc(pos - 1, pos + 2).match(/^\[[ x]\]$/) === null) return;
        view.dispatch({
          changes: { from: pos, to: pos + 1, insert: this.checked ? " " : "x" },
          userEvent: "input.toggle",
        });
      });
    } else if (this.kind === "ol") {
      slot.createSpan({ cls: "wrot-cv-ol", text: this.label });
    } else {
      slot.createSpan({ cls: "wrot-cv-bullet" });
    }
    return slot;
  }
}

/**
 * Stands in for the armed opener. Unlike a bare hidden range it leaves an element inside the
 * style's mark, so the mark is on screen before anything is typed: text composed in an IME
 * lands inside it and shows styled while still uncommitted.
 */
class ArmedOpenerWidget extends WidgetType {
  eq(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    return createSpan({ cls: "wrot-cv-armed" });
  }
}

class MathWidget extends WidgetType {
  constructor(readonly tex: string) {
    super();
  }

  eq(other: MathWidget): boolean {
    return other.tex === this.tex;
  }

  toDOM(): HTMLElement {
    const wrap = createSpan({ cls: "wrot-cv-math" });
    try {
      wrap.appendChild(renderMath(this.tex, false));
      void finishRenderMath();
    } catch {
      wrap.setText(`$${this.tex}$`);
    }
    return wrap;
  }
}

function analyze(state: EditorState, rawOverride?: Span[]): Analysis {
  const strikeDone = state.facet(checkStrikethrough);
  const raw = rawOverride ?? state.field(rawField);
  const armedState = state.field(armedField);
  const caret = state.selection.main.head;
  const doc = state.doc;
  const decos: Range<Decoration>[] = [];
  const atomic: Range<Decoration>[] = [];
  const constructs: Construct[] = [];
  const revealable: Span[] = [];

  const hideSpan = (from: number, to: number): void => {
    decos.push(hide.range(from, to));
    atomic.push(hide.range(from, to));
  };
  const hideDelims = (open: Span, close: Span): void => {
    decos.push(conceal.range(open.from, open.to), conceal.range(close.from, close.to));
    atomic.push(hide.range(open.from, open.to), hide.range(close.from, close.to));
  };

  const lines = doc.toString().split("\n");
  const blocked = new Set<number>();
  for (const b of findBlockRanges(lines)) {
    for (let i = b.startLine; i <= b.endLine; i++) blocked.add(i);
  }

  let armed: Span | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (blocked.has(i)) continue;
    const line = doc.line(i + 1);
    const text = line.text;
    let offset = 0;

    const quote = QUOTE_PREFIX_RE.exec(text);
    if (quote) {
      const depth = (quote[0].match(/>/g) ?? []).length;
      const span = { from: line.from, to: line.from + quote[0].length };
      if (!overlaps(raw, span.from, span.to)) {
        hideSpan(span.from, span.to);
        revealable.push(span);
        decos.push(Decoration.line({ class: `wrot-cv-quote wrot-cv-quote-${Math.min(depth, 5)}` }).range(line.from));
      }
      offset = quote[0].length;
    }

    const item = parseListLine(text.slice(offset), true);
    if (item) {
      const from = line.from + offset + item.indentLength;
      const span = { from, to: from + item.markerLength };
      if (!overlaps(raw, span.from, span.to)) {
        // The marker's trailing space stays real text, so the caret at the start of the item
        // keeps a text-wide gap from the drawn mark. Both stay one atomic unit.
        const marker = text.slice(span.from - line.from, span.to - line.from);
        const drawnTo = span.from + marker.trimEnd().length;
        const widget = new ListMarkerWidget(item.kind, item.checked, item.olMarker);
        decos.push(Decoration.replace({ widget }).range(span.from, drawnTo));
        atomic.push(hide.range(span.from, span.to));
        revealable.push(span);
      }
      if (item.kind === "check" && item.checked && strikeDone && line.to > span.to) {
        decos.push(checkDone.range(span.to, line.to));
      }
      offset += item.indentLength + item.markerLength;
    }

    const content = text.slice(offset);
    const base = line.from + offset;
    const consumed: Span[] = [];
    for (const { token, index } of inlineTokens(content)) {
      const from = base + index;
      const to = from + token.length;
      consumed.push({ from, to });
      if (token.startsWith("$")) {
        // Typed text inside is fine (selected and wrapped by the toolbar); only typed
        // delimiters mean the formula is still being written by hand.
        if (overlaps(raw, from, from + 1) || overlaps(raw, to - 1, to)) continue;
        if (!isMathJaxReady()) {
          requestMathJax();
          continue;
        }
        decos.push(Decoration.replace({ widget: new MathWidget(token.slice(1, -1)) }).range(from, to));
        atomic.push(hide.range(from, to));
        revealable.push({ from, to });
        continue;
      }
      const link = parseLinkToken(token, from);
      if (link) {
        const { open, close } = link;
        if (overlaps(raw, open.from, open.to) || overlaps(raw, close.from, close.to)) continue;
        hideDelims(open, close);
        decos.push(linkMark.range(open.to, close.from));
        constructs.push({ open, close });
        continue;
      }
      if (token.startsWith("#")) {
        // A tag still being typed (caret inside or at its end) stays plain until finished.
        if (!(caret > from && caret <= to)) decos.push(linkMark.range(from, to));
        continue;
      }
      if (URL_TOKEN_RE.test(token)) {
        decos.push(linkMark.range(from, to));
        continue;
      }
      const kind = INLINE_MARKS.find((k) => token.startsWith(k.delim) && token.endsWith(k.delim));
      if (!kind) continue;
      const tint = kind.delim === "==" ? highlightColor(token.slice(2, -2)) : null;
      const open = { from, to: from + kind.delim.length + (tint?.length ?? 0) };
      const close = { from: to - kind.delim.length, to };
      if (overlaps(raw, open.from, open.to) || overlaps(raw, close.from, close.to)) continue;
      hideDelims(open, close);
      decos.push((tint ? tintedHighlight(tint.color) : kind.mark).range(open.to, close.from));
      constructs.push({ open, close });
      if (kind.delim === "`") revealable.push({ from, to });
    }

    // The toolbar's bold/italic writes only the opener and closes it when switched off;
    // until then the text after it shows in that style without the opener on screen.
    if (armedState && armedState.pos >= line.from && armedState.pos <= line.to) {
      const open = { from: armedState.pos, to: armedState.pos + armedState.marker.length };
      if (!overlaps(consumed, open.from, open.to)) {
        decos.push(Decoration.replace({ widget: new ArmedOpenerWidget() }).range(open.from, open.to));
        atomic.push(hide.range(open.from, open.to));
        const mark = ARMED_MARKS[armedState.marker];
        if (mark) decos.push(mark.range(open.from, line.to));
        armed = open;
      }
    }
  }

  return {
    decorations: Decoration.set(decos, true),
    atomic: Decoration.set(atomic, true),
    constructs,
    revealable,
    armed,
  };
}

const visualField = StateField.define<Analysis>({
  create: (state) => analyze(state),
  update(value, tr) {
    const touched =
      tr.docChanged ||
      tr.startState.selection.main.head !== tr.state.selection.main.head ||
      tr.startState.field(rawField) !== tr.state.field(rawField) ||
      tr.startState.field(armedField) !== tr.state.field(armedField) ||
      tr.effects.some((e) => e.is(redrawEffect)) ||
      tr.startState.facet(checkStrikethrough) !== tr.state.facet(checkStrikethrough);
    return touched ? analyze(tr.state) : value;
  },
  provide: (field) => [
    EditorView.decorations.from(field, (a) => a.decorations),
    EditorView.atomicRanges.of((view) => view.state.field(field).atomic),
  ],
});

/** Pieces of [from, to] left after cutting out the given spans. */
function subtract(from: number, to: number, cuts: Span[]): Span[] {
  const pieces: Span[] = [];
  let pos = from;
  for (const c of [...cuts].sort((a, b) => a.from - b.from)) {
    if (c.from > pos) pieces.push({ from: pos, to: Math.min(c.from, to) });
    pos = Math.max(pos, c.to);
  }
  if (pos < to) pieces.push({ from: pos, to });
  return pieces.filter((p) => p.to > p.from);
}

/** One visible character next to pos, stepping over hidden delimiters touching it. */
function neighbourChar(state: EditorState, pos: number, hidden: Span[], forward: boolean): Span | null {
  let p = pos;
  for (let moved = true; moved; ) {
    moved = false;
    for (const h of hidden) {
      if (!forward && h.to === p && h.from < p) { p = h.from; moved = true; }
      if (forward && h.from === p && h.to > p) { p = h.to; moved = true; }
    }
  }
  const line = state.doc.lineAt(p);
  if (forward) {
    if (p === state.doc.length) return null;
    if (p === line.to) return { from: p, to: p + 1 };
    return { from: p, to: line.from + findClusterBreak(line.text, p - line.from, true) };
  }
  if (p === 0) return null;
  if (p === line.from) return { from: p - 1, to: p };
  return { from: line.from + findClusterBreak(line.text, p - line.from, false), to: p };
}

/**
 * Keeps deletes and overtyping from tearing hidden syntax apart (see the file comment).
 * Only user edits pass through here; the toolbar's own rewrites are left alone.
 */
const deleteGuard = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || tr.isUserEvent("input.type.compose")) return tr;
  if (!tr.isUserEvent("delete") && !tr.isUserEvent("input")) return tr;
  const start = tr.startState;
  const a = start.field(visualField);
  if (a.constructs.length === 0 && a.revealable.length === 0 && !a.armed) return tr;

  const markers: Span[] = a.constructs.flatMap((c) => [c.open, c.close]);
  if (a.armed) markers.push(a.armed);
  const hidden = [...markers, ...a.revealable];
  const out: { from: number; to: number; insert: string }[] = [];
  const reveals: Span[] = [];
  let adjusted = false;
  // Where the character taken in place of hidden delimiters stood.
  let takenAt: number | null = null;

  tr.changes.iterChanges((fromA, toA, _fb, _tb, inserted) => {
    const insert = inserted.toString();
    if (toA === fromA) {
      out.push({ from: fromA, to: toA, insert });
      return;
    }
    const revealed = a.revealable.find((r) => fromA >= r.from && toA <= r.to);
    if (revealed && insert === "") {
      reveals.push(revealed);
      adjusted = true;
      return;
    }
    // Delimiters of decorations not swallowed whole by this edit stay put.
    const kept = a.constructs
      .filter((c) => !(fromA <= c.open.from && toA >= c.close.to))
      .flatMap((c) => [c.open, c.close]);
    if (a.armed && !(fromA < a.armed.from && toA > a.armed.to)) kept.push(a.armed);
    const cuts = kept.filter((s) => s.from < toA && s.to > fromA);
    if (cuts.length === 0) {
      out.push({ from: fromA, to: toA, insert });
      return;
    }
    adjusted = true;
    const pieces = subtract(fromA, toA, cuts);
    if (pieces.length > 0) {
      pieces.forEach((p, i) => out.push({ ...p, insert: i === 0 ? insert : "" }));
    } else if (insert) {
      out.push({ from: fromA, to: fromA, insert });
    } else if (
      tr.isUserEvent("delete.backward") && a.armed &&
      fromA === a.armed.from && toA === a.armed.to && start.selection.main.head === a.armed.to
    ) {
      // Backspace with nothing typed after a pending bold/italic switches it off.
      out.push({ ...a.armed, insert: "" });
    } else if (tr.isUserEvent("delete.backward") || tr.isUserEvent("delete.forward")) {
      // The delete landed on delimiters only: take the visible character beside them.
      const target = neighbourChar(start, tr.isUserEvent("delete.forward") ? toA : fromA, hidden, tr.isUserEvent("delete.forward"));
      if (target) {
        out.push({ ...target, insert: "" });
        takenAt = target.from;
      }
    }
  });
  // A decoration whose visible text this edit empties goes with it; one emptied that way can
  // in turn empty the decoration stacked around it.
  const emptied: Span[] = [];
  for (let grew = true; grew; ) {
    grew = false;
    for (const c of a.constructs) {
      const inner = { from: c.open.to, to: c.close.from };
      if (inner.to <= inner.from || emptied.includes(c.open)) continue;
      if (out.some((o) => o.from <= c.open.from && o.to >= c.close.to)) continue;
      if (out.some((o) => o.insert && o.from >= inner.from && o.from <= inner.to)) continue;
      let removed = 0;
      for (const o of [...out, ...emptied]) removed += Math.max(0, Math.min(o.to, inner.to) - Math.max(o.from, inner.from));
      if (removed < inner.to - inner.from) continue;
      emptied.push(c.open, c.close);
      adjusted = true;
      grew = true;
    }
  }
  out.push(...emptied.map((s) => ({ ...s, insert: "" })));
  if (!adjusted) return tr;

  const changes = start.changes(out);
  const sel = start.selection.main;
  const firstInsert = out.find((o) => o.insert);
  // The caret stays where iOS already put it (inside the delimiters): any other spot, even one drawn the same, ends a held Backspace.
  const head = firstInsert
    ? changes.mapPos(firstInsert.from, 1)
    : changes.mapPos(takenAt ?? sel.from, -1);
  const revealedEnd = out.length === 0 && reveals.length > 0 && tr.isUserEvent("delete.backward")
    ? EditorSelection.cursor(reveals[0].to)
    : null;
  const spec: TransactionSpec = {
    changes,
    selection: revealedEnd ?? (out.length > 0 ? EditorSelection.cursor(head) : start.selection),
    effects: [...tr.effects, ...reveals.map((r) => revealEffect.of(r))],
    userEvent: tr.annotation(Transaction.userEvent),
    scrollIntoView: tr.scrollIntoView,
  };
  return spec;
});

// Read-back selections (iOS after a delete) also carry "select"; only an arrow key may step over hidden delimiters, or a held Backspace ends.
let lastArrowAt = 0;
// An observer, since the keymap's handler takes the arrow keys before any later handler sees them.
const arrowWatch = EditorView.domEventObservers({
  keydown(e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") lastArrowAt = Date.now();
  },
});

/**
 * An arrow key that only stepped across hidden delimiters (into or out of a link, a bold run)
 * leaves the caret where it was drawn, so it takes a second press to move. Carry such a step
 * on to the next visible character. Drawn markers (list marks, math) are not hidden text and
 * are left to the plain step.
 */
const stepOverHidden = EditorState.transactionFilter.of((tr) => {
  if (tr.docChanged || !tr.selection || !tr.isUserEvent("select") || tr.isUserEvent("select.pointer")) return tr;
  if (Date.now() - lastArrowAt > 200) return tr;
  const before = tr.startState.selection.main;
  const after = tr.selection.main;
  if (tr.selection.ranges.length !== 1 || !before.empty || !after.empty || after.head === before.head) return tr;
  const hidden = tr.startState.field(visualField).constructs
    .flatMap((c) => [c.open, c.close])
    .sort((x, y) => x.from - y.from);
  const from = Math.min(before.head, after.head);
  const to = Math.max(before.head, after.head);
  let reach = from;
  for (const h of hidden) if (h.from <= reach && h.to > reach) reach = h.to;
  if (reach < to) return tr;
  const forward = after.head > before.head;
  const target = neighbourChar(tr.startState, after.head, hidden, forward);
  if (!target) return tr;
  return {
    selection: EditorSelection.cursor(forward ? target.to : target.from),
    scrollIntoView: tr.scrollIntoView,
    userEvent: tr.annotation(Transaction.userEvent),
  };
});

/** Just outside the decoration whose text starts at from or ends at to, if there is one. */
function outsideDecoration(state: EditorState, from: number, to: number): number | null {
  const constructs = state.field(visualField).constructs;
  // Out through every decoration stacked at that end.
  const out = (pos: number, end: boolean): number | null => {
    const c = constructs.find((k) => (end ? k.close.from : k.open.to) === pos);
    if (!c) return null;
    const next = end ? c.close.to : c.open.from;
    return out(next, end) ?? next;
  };
  return out(to, true) ?? out(from, false);
}

/**
 * Typing at either end of a decoration's text (a link, bold, a highlight) goes outside it. The
 * page has no caret spot past CSS-hidden delimiters, so the browser types into its text there.
 */
const typeOutsideDecoration = EditorState.transactionFilter.of((tr) => {
  if (!tr.isUserEvent("input.type") || tr.isUserEvent("input.type.compose")) return tr;
  const edits: { at: number; insert: string }[] = [];
  let count = 0;
  tr.changes.iterChanges((fromA, toA, _fb, _tb, inserted) => {
    count++;
    if (fromA === toA) edits.push({ at: fromA, insert: inserted.toString() });
  });
  if (count !== 1 || edits.length !== 1) return tr;
  const { at, insert } = edits[0];
  const dest = outsideDecoration(tr.startState, at, at);
  if (dest === null) return tr;
  return {
    changes: { from: dest, insert },
    // Same offset into the moved text: an auto-closed pair keeps the caret between its halves.
    selection: EditorSelection.cursor(dest + (tr.newSelection.main.head - at)),
    userEvent: tr.annotation(Transaction.userEvent),
    scrollIntoView: tr.scrollIntoView,
  };
});

/** A tag written with a full-width ＃ becomes a real one once whitespace ends it, as picking a candidate does. */
const halfWidthTagHash = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || tr.isUserEvent("input.type.compose")) return tr;
  const fixes: number[] = [];
  tr.changes.iterChanges((fromA, _toA, _fromB, _toB, inserted) => {
    if (!/^\s/.test(inserted.sliceString(0, 1))) return;
    const line = tr.startState.doc.lineAt(fromA);
    const word = /(?:^|\s)＃([^\s#＃]+)$/.exec(line.text.slice(0, fromA - line.from));
    if (word && TAG_TOKEN_RE.test(`#${word[1]}`)) fixes.push(fromA - word[1].length - 1);
  });
  if (fixes.length === 0) return tr;
  const at = fixes.map((pos) => tr.changes.mapPos(pos));
  return [tr, { changes: at.map((pos) => ({ from: pos, to: pos + 1, insert: "#" })), sequential: true }];
});

// Composed text can't be moved while uncommitted, so text composed at a decoration's end is
// tracked and moved outside once committed.
const composedDoneEffect = StateEffect.define<null>();
const composedField = StateField.define<Span | null>({
  create: () => null,
  update(span, tr) {
    if (tr.effects.some((e) => e.is(composedDoneEffect))) return null;
    if (span) {
      return tr.docChanged ? { from: tr.changes.mapPos(span.from, -1), to: tr.changes.mapPos(span.to, 1) } : span;
    }
    if (!tr.isUserEvent("input.type.compose")) return null;
    const found: Span[] = [];
    tr.changes.iterChanges((fromA, toA, fromB, toB) => {
      if (fromA === toA && outsideDecoration(tr.startState, fromA, fromA) !== null) found.push({ from: fromB, to: toB });
    });
    return found[0] ?? null;
  },
});

function moveComposed(view: EditorView): void {
  const span = view.state.field(composedField);
  if (!span || view.composing) return;
  const dest = span.to > span.from ? outsideDecoration(view.state, span.from, span.to) : null;
  if (dest === null) {
    view.dispatch({ effects: composedDoneEffect.of(null) });
    return;
  }
  const changes = view.state.changes([
    { from: span.from, to: span.to },
    { from: dest, insert: view.state.sliceDoc(span.from, span.to) },
  ]);
  view.dispatch({
    changes,
    selection: EditorSelection.cursor(changes.mapPos(dest, 1)),
    effects: composedDoneEffect.of(null),
    userEvent: "input.move",
  });
}

/**
 * Until committed, composed text sits in the decoration's own text node, and CodeMirror leaves
 * the DOM of a composition alone, so it would show in a link's colour. A CSS highlight recolours
 * just that text with the line's own colour, without touching the DOM. (Weight and style can't
 * be set by a highlight; bold text composed at its end shows bold until committed.)
 */
const COMPOSING_HIGHLIGHT = "wrot-composing";
function paintComposing(view: EditorView): void {
  const registry = typeof CSS !== "undefined" ? CSS.highlights : undefined;
  if (!registry) return;
  const span = view.state.field(composedField);
  if (!span) {
    registry.delete(COMPOSING_HIGHLIGHT);
    return;
  }
  const start = view.domAtPos(span.from, 1);
  const end = view.domAtPos(span.to, -1);
  const line = (start.node.instanceOf(Element) ? start.node : start.node.parentElement)?.closest(".cm-line");
  if (line) view.dom.style.setProperty("--wrot-composing-color", getComputedStyle(line).color);
  const range = view.dom.ownerDocument.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  // At a decoration's end the composed text runs to the end of its text node. Ending the range after
  // the node rather than at an offset in it keeps it covering the text while the IME rewrites it.
  const parent = end.node.parentNode;
  if (end.node.nodeType === Node.TEXT_NODE && end.offset === end.node.textContent?.length && parent) {
    range.setEndAfter(end.node);
  }
  registry.set(COMPOSING_HIGHLIGHT, new Highlight(range));
}

// After the DOM is updated, in the same task, so no frame shows the text unpainted.
const composingColor = EditorView.updateListener.of((u) => {
  if (u.state.field(composedField) || u.startState.field(composedField)) paintComposing(u.view);
});

// After CodeMirror has read the committed text in (a microtask at most).
const composeWatch = EditorView.domEventObservers({
  compositionend(_e, view) {
    window.setTimeout(() => moveComposed(view), 0);
  },
});

/**
 * Enter on a line still showing typed syntax: converts it instead of breaking the line, so
 * the first Enter shows the result and the next one starts a new line. Returns false (and
 * changes nothing) when the line has nothing waiting to convert.
 */
export function commitTypedLine(view: EditorView): boolean {
  const state = view.state;
  const line = state.doc.lineAt(state.selection.main.head);
  const onLine = (s: Span): boolean => s.to > line.from && s.from < line.to;
  const raw = state.field(rawField);
  const typed = raw.filter(onLine);
  if (typed.length === 0) return false;
  const after = analyze(state, raw.filter((s) => !onLine(s)));
  let pending = false;
  after.atomic.between(line.from, line.to, (from, to) => {
    if (overlaps(typed, from, to)) pending = true;
  });
  if (!pending) return false;
  view.dispatch({ effects: commitEffect.of({ from: line.from, to: line.to }) });
  return true;
}

export function visualMode(): Extension {
  return [
    rawField, armedField, visualField, composedField,
    deleteGuard, typeOutsideDecoration, halfWidthTagHash, stepOverHidden, arrowWatch, composeWatch, composingColor,
  ];
}

/**
 * The end of the list marker pos sits before or just after, when the marker is drawn in place
 * of its source (not shown as typed); null otherwise.
 */
export function drawnListMarkerAt(state: EditorState, pos: number): number | null {
  const line = state.doc.lineAt(pos);
  const offset = QUOTE_PREFIX_RE.exec(line.text)?.[0].length ?? 0;
  const item = parseListLine(line.text.slice(offset), true);
  if (!item) return null;
  const from = line.from + offset + item.indentLength;
  const to = from + item.markerLength;
  if (pos < line.from + offset || pos > to) return null;
  return state.field(visualField).revealable.some((r) => r.from === from && r.to === to) ? to : null;
}

/** Where the toolbar's pending opener sits, if one is armed. */
export function armedOpener(state: EditorState): { pos: number; marker: string } | null {
  return state.field(armedField);
}

export function armEffectOf(pos: number | null, marker = ""): StateEffect<{ pos: number; marker: string } | null> {
  return armEffect.of(pos === null ? null : { pos, marker });
}
