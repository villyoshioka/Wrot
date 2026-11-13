import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, keymap } from "@codemirror/view";
import { history, historyKeymap, insertNewline, standardKeymap } from "@codemirror/commands";
import { autoPairs } from "./composerPairs";
import { expandNow, nowOnSpace } from "./composerTime";
import { armEffectOf, armedOpener, checkStrikethrough, commitTypedLine, drawnListMarkerAt, redrawEffect, visualMode } from "./composerVisual";

type Listener = (e: Event) => void;

const placeholderAttr = (text: string) => EditorView.contentAttributes.of({ "aria-placeholder": text });

// The range a popover is working on (the link window), painted as selected while the
// popover's own field holds the focus and the editor's real selection is not drawn.
const heldRangeEffect = StateEffect.define<{ from: number; to: number } | null>();
const heldMark = Decoration.mark({ class: "wrot-held-range" });
const heldRangeField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    let next = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(heldRangeEffect)) continue;
      next = e.value && e.value.to > e.value.from
        ? Decoration.set([heldMark.range(e.value.from, e.value.to)])
        : Decoration.none;
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

/**
 * The composer's editor, behind the surface the textarea used to offer.
 *
 * Everything that drives the composer (toolbar actions, list handling, tag completion, the
 * IME workarounds) was written against a textarea: read the value and selection, write
 * them back, announce the change with an input event. This keeps those terms so the editor
 * underneath could change without rewriting each of them.
 *
 * Contract kept from the textarea:
 * - Writing `value` or the selection does not fire "input"; user edits do, after the fact.
 *   Callers that change the text announce it themselves with dispatchEvent("input").
 * - DOM listeners run in the capture phase, ahead of CodeMirror's own handlers, so a
 *   preventDefault (Enter on a list, an image paste or drop) keeps CodeMirror out of it.
 */
export class ComposerField {
  readonly view: EditorView;
  private inputListeners = new Set<Listener>();
  private selectionListeners = new Set<() => void>();
  private readOnlyConf = new Compartment();
  private placeholderConf = new Compartment();
  private strikeConf = new Compartment();
  private holder: object | null = null;

  constructor(parent: HTMLElement, placeholderText: string, strikeDone: boolean, autoPair: () => boolean) {
    this.view = new EditorView({
      parent,
      state: EditorState.create({
        extensions: [
          history(),
          autoPairs(autoPair),
          nowOnSpace,
          // Plain newline first: the standard binding copies the line's indentation,
          // which a textarea never did. Lists get their marker from the view's handler.
          keymap.of([
            { key: "Enter", run: insertNewline, shift: insertNewline },
            ...standardKeymap,
            ...historyKeymap,
          ]),
          EditorView.lineWrapping,
          // Through the facet: the editor rewrites its class attribute whenever its own
          // classes change (focus adds one), dropping anything added to the element by hand.
          EditorView.editorAttributes.of({ class: "wrot-textarea" }),
          EditorView.contentAttributes.of({ spellcheck: "true", autocorrect: "on", autocapitalize: "on" }),
          // Not CodeMirror's placeholder widget: on mobile it breaks the long-press menu.
          this.placeholderConf.of(placeholderAttr(placeholderText)),
          EditorView.editorAttributes.compute(["doc"], (s) => ({ class: s.doc.length ? "" : "wrot-composer-empty" })),
          this.readOnlyConf.of(EditorState.readOnly.of(false)),
          visualMode(),
          heldRangeField,
          this.strikeConf.of(checkStrikethrough.of(strikeDone)),
          EditorView.updateListener.of((update) => {
            const typed = update.docChanged && update.transactions.some((tr) =>
              tr.isUserEvent("input") || tr.isUserEvent("delete") ||
              tr.isUserEvent("undo") || tr.isUserEvent("redo") || tr.isUserEvent("move"));
            const composing = update.view.composing;
            // Listeners write back into the editor, which is refused mid-update.
            if (typed) queueMicrotask(() => this.emitInput(new InputEvent("input", { isComposing: composing })));
            if (update.selectionSet || update.docChanged) {
              queueMicrotask(() => this.selectionListeners.forEach((cb) => cb()));
            }
          }),
        ],
      }),
    });
  }

  get value(): string {
    return this.view.state.doc.toString();
  }

  // Replaces only the span that differs, so the caret, undo history and IME state around
  // an unchanged region are left where they were.
  set value(next: string) {
    const current = this.value;
    if (current === next) return;
    let from = 0;
    while (from < current.length && from < next.length && current[from] === next[from]) from++;
    let endCur = current.length;
    let endNext = next.length;
    while (endCur > from && endNext > from && current[endCur - 1] === next[endNext - 1]) {
      endCur--;
      endNext--;
    }
    this.view.dispatch({ changes: { from, to: endCur, insert: next.slice(from, endNext) } });
  }

  get selectionStart(): number {
    return this.view.state.selection.main.from;
  }

  set selectionStart(pos: number) {
    this.setSelectionRange(pos, Math.max(pos, this.selectionEnd));
  }

  get selectionEnd(): number {
    return this.view.state.selection.main.to;
  }

  set selectionEnd(pos: number) {
    this.setSelectionRange(Math.min(this.selectionStart, pos), pos);
  }

  setSelectionRange(start: number, end: number): void {
    const len = this.view.state.doc.length;
    const anchor = Math.max(0, Math.min(start, len));
    const head = Math.max(anchor, Math.min(end, len));
    this.view.dispatch({ selection: { anchor, head } });
  }

  get hasFocus(): boolean {
    return this.view.hasFocus;
  }

  // The editor's own focus also writes its selection into the DOM; a bare DOM focus would let
  // the browser's caret (often the start) be read back as the selection. It never scrolls.
  focus(): void {
    this.view.focus();
  }

  blur(): void {
    this.view.contentDOM.blur();
  }

  set readOnly(on: boolean) {
    this.view.dispatch({ effects: this.readOnlyConf.reconfigure(EditorState.readOnly.of(on)) });
  }

  setPlaceholder(text: string): void {
    this.view.dispatch({ effects: this.placeholderConf.reconfigure(placeholderAttr(text)) });
  }

  /**
   * Tells visual mode where the toolbar's pending bold/italic opener sits, so it can be
   * hidden while its text is typed. Null once the mode ends.
   */
  setArmedFormat(pos: number | null, marker = ""): void {
    this.view.dispatch({ effects: armEffectOf(pos, marker) });
  }

  /** The pending opener visual mode is tracking, or null. */
  armedOpener(): { pos: number; marker: string } | null {
    return armedOpener(this.view.state);
  }

  /**
   * Keeps [from, to] painted as selected while focus is elsewhere. null clears it, but only
   * for the holder that set it, so a late clear from one owner leaves another's hold.
   */
  holdRange(range: { from: number; to: number } | null, holder: object): void {
    if (!range && this.holder !== holder) return;
    this.holder = range ? holder : null;
    this.view.dispatch({ effects: heldRangeEffect.of(range) });
  }

  setCheckStrikethrough(on: boolean): void {
    this.view.dispatch({ effects: this.strikeConf.reconfigure(checkStrikethrough.of(on)) });
  }

  /** End of the drawn list marker the caret sits before or just after (see composerVisual). */
  listMarkerAtCaret(): number | null {
    const sel = this.view.state.selection.main;
    return sel.empty ? drawnListMarkerAt(this.view.state, sel.head) : null;
  }

  /** Converts typed syntax on the caret's line; true if there was any (see composerVisual). */
  commitTypedLine(): boolean {
    return commitTypedLine(this.view);
  }

  /** Turns an @now opening the caret's line into the current time; true if there was one. */
  expandNow(): boolean {
    return expandNow(this.view);
  }

  /** Rebuilds what visual mode draws, for when something outside the text changed. */
  redraw(): void {
    this.view.dispatch({ effects: redrawEffect.of(null) });
  }

  /** Viewport coordinates of the character edge at pos. */
  coordsAt(pos: number, side: -1 | 1 = 1): { left: number; bottom: number } | null {
    return this.view.coordsAtPos(pos, side);
  }

  contains(node: Node | null): boolean {
    return this.view.dom.contains(node);
  }

  getBoundingClientRect(): DOMRect {
    return this.view.dom.getBoundingClientRect();
  }

  /** Fires after the selection or the text changed, once the editor has settled. */
  onSelectionChange(cb: () => void): void {
    this.selectionListeners.add(cb);
  }

  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (e: HTMLElementEventMap[K]) => void): void;
  addEventListener(type: string, listener: Listener): void {
    if (type === "input") this.inputListeners.add(listener);
    else this.view.contentDOM.addEventListener(type, listener, true);
  }

  removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (e: HTMLElementEventMap[K]) => void): void;
  removeEventListener(type: string, listener: Listener): void {
    if (type === "input") this.inputListeners.delete(listener);
    else this.view.contentDOM.removeEventListener(type, listener, true);
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === "input") this.emitInput(event);
    else this.view.contentDOM.dispatchEvent(event);
    return true;
  }

  destroy(): void {
    this.inputListeners.clear();
    this.selectionListeners.clear();
    this.view.destroy();
  }

  private emitInput(event: Event): void {
    for (const listener of this.inputListeners) listener(event);
  }
}
