import { Platform } from "obsidian";
import { extractNonBlockText, findBlockRanges } from "./blockSegmenter";
import { TAG_TOKEN_RE, inlineTokens } from "./patterns";
import type { ComposerField } from "../editor/composerField";

// Cap on stored recent tags; least-recently-used entries are dropped past
// the cap to keep the candidate list fresh.
const MAX_RECENT_TAGS = 200;

// Max candidates shown at once (the list itself scrolls).
const MAX_VISIBLE_ITEMS = 5;

// How long a tap's delayed compatibility mouse events (ghost clicks) can trail it.
const GHOST_CLICK_MS = 400;

// Tags follow the shared inline token rules, decoration text included: # inside code, math, links or URLs is not a tag.

// Extract tags (without leading #) in appearance order, deduped; code/math blocks excluded.
export function extractTagsForHistory(text: string): string[] {
  const source = extractNonBlockText(text);
  const tags: string[] = [];
  for (const { token } of inlineTokens(source)) {
    if (TAG_TOKEN_RE.test(token)) {
      const tag = token.slice(1);
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags;
}

// Move tags used this time to the front (newest-first order) and trim to the cap.
export function mergeRecentTags(existing: string[], used: string[]): string[] {
  if (used.length === 0) return existing;
  const merged = [...used, ...existing.filter((tag) => !used.includes(tag))];
  return merged.slice(0, MAX_RECENT_TAGS);
}

interface InlineSuggestOptions {
  field: ComposerField;
  // Parent element hosting the popover (view body = wrot-container); positioned and
  // clamped in container coordinates, same as the calendar popover.
  container: HTMLElement;
  // Tried in order; the first one with a token at the caret and any items owns the list.
  sources: SuggestSource[];
}

export interface ActiveToken {
  // Replacement range: start = the trigger character (# or @, fullwidth too), end = caret.
  start: number;
  end: number;
  query: string;
}

export interface SuggestItem {
  label: string;
  insert: string;
}

export interface SuggestSource {
  // Read on every refresh, so a settings toggle takes effect immediately.
  isEnabled?: () => boolean;
  detect(value: string, pos: number): ActiveToken | null;
  items(query: string): SuggestItem[];
}

// After a forced commit, refocusing the textarea directly makes iOS reuse the stale
// input session and skip drawing the caret (typing still works). Bounce focus through
// an invisible dummy input to rebuild the session; both are editable, so the keyboard stays open.
export function rebuildFocus(ta: ComposerField, container: HTMLElement): void {
  const dummy = container.createEl("input", {
    cls: "wrot-focus-bounce",
    attr: { type: "text" },
  });
  dummy.focus({ preventScroll: true });
  ta.focus();
  dummy.remove();
}

/**
 * The form tags are compared in. Accents come off Latin and Greek letters only, as in Obsidian's
 * own search: elsewhere the mark makes another letter (й, が). Letters with no accent to strip
 * (ø, ß, ...) are spelled out the same way Obsidian's search does.
 */
const FOLDED: Record<string, string> = {
  ø: "o", ł: "l", đ: "d", ð: "d", ħ: "h", ı: "i", ß: "ss", æ: "ae", œ: "oe", þ: "th",
};

export function matchKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/([\p{Script=Latin}\p{Script=Greek}])[\u0300-\u036f]+/gu, "$1")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[øłđðħıßæœþ]/g, (c) => FOLDED[c]);
}

// Complete only when the whitespace-delimited word before the caret starts with #
// (or ＃) — not on mid-word # like URL fragments. In `#a#b`, the last # starts the tag.
function detectTagToken(value: string, pos: number): ActiveToken | null {
  let wordStart = pos;
  while (wordStart > 0 && !/\s/.test(value[wordStart - 1])) {
    wordStart--;
  }
  const word = value.slice(wordStart, pos);
  if (!word.startsWith("#") && !word.startsWith("＃")) return null;
  // Inside a code block (an unclosed one runs to the end), # is code, not a tag.
  const line = value.slice(0, pos).split("\n").length - 1;
  const inCode = findBlockRanges(value.split("\n")).some(
    (b) => b.kind === "codeblock" && line >= b.startLine && line <= b.endLine
  );
  if (inCode) return null;
  const hashIdx = Math.max(word.lastIndexOf("#"), word.lastIndexOf("＃"));
  return {
    start: wordStart + hashIdx,
    end: pos,
    query: word.slice(hashIdx + 1),
  };
}

// Prefix matches first, then substring matches; ignores case and accents.
function filterTags(candidates: string[], query: string): string[] {
  if (query === "") return candidates.slice(0, MAX_VISIBLE_ITEMS);
  const q = matchKey(query);
  const prefix: string[] = [];
  const partial: string[] = [];
  for (const tag of candidates) {
    const key = matchKey(tag);
    if (key.startsWith(q)) prefix.push(tag);
    else if (key.includes(q)) partial.push(tag);
  }
  return [...prefix, ...partial].slice(0, MAX_VISIBLE_ITEMS);
}

// Candidates are tags without the leading #, newest first.
export function tagSource(getCandidates: () => string[], isEnabled: () => boolean): SuggestSource {
  return {
    isEnabled,
    detect: detectTagToken,
    items: (query) => filterTags(getCandidates(), query).map((tag) => ({ label: `#${tag}`, insert: `#${tag} ` })),
  };
}

// Completion list for the input area. Passive: WrotView calls refresh()
// on input/selectionchange/compositionend and handleKeydown() first in keydown.
export class InlineSuggest {
  private opts: InlineSuggestOptions;
  private popover: HTMLDivElement | null = null;
  private itemEls: HTMLElement[] = [];
  private items: SuggestItem[] = [];
  // -1 = nothing selected: the list opens unselected, so Enter/Tab type as usual until an arrow key picks one.
  private selectedIndex = -1;
  private token: ActiveToken | null = null;
  // Finger position at pointerdown; counts as a tap if it barely moves by pointerup.
  private tapStart: { id: number; x: number; y: number } | null = null;
  // True from pointerdown to pointerup on an item. A textarea blur during this
  // window must not close the popover (the pending confirm would lose its target).
  private interacting = false;
  // Suppression deadline after a pointer-close: delayed ghost clicks landing on the
  // same spot would otherwise hit UI that was beneath the list.
  private suppressUiUntil = 0;
  // True during IME composition. Rewriting value mid-composition breaks iOS input
  // state, so confirm() force-commits the composition first.
  private composing = false;
  private onCompositionStart = (): void => {
    this.composing = true;
  };
  private onCompositionEnd = (): void => {
    this.composing = false;
  };

  constructor(opts: InlineSuggestOptions) {
    this.opts = opts;
    opts.field.addEventListener("compositionstart", this.onCompositionStart);
    opts.field.addEventListener("compositionend", this.onCompositionEnd);
  }

  isOpen(): boolean {
    return this.popover !== null;
  }

  // True while the list is open or just after a pointer-close; the toolbar
  // ignores clicks during this window (appearance unchanged).
  isSuppressingUi(): boolean {
    return this.popover !== null || Date.now() < this.suppressUiUntil;
  }

  // Open/update/close the dropdown for the token at the caret. Safe during IME
  // composition: uncommitted text is in value, so filtering works before commit.
  refresh(): void {
    const ta = this.opts.field;
    if (ta.hasFocus && ta.selectionStart === ta.selectionEnd) {
      for (const source of this.opts.sources) {
        if (source.isEnabled && !source.isEnabled()) continue;
        const token = source.detect(ta.value, ta.selectionStart);
        if (!token) continue;
        const items = source.items(token.query);
        if (items.length === 0) continue;
        this.token = token;
        this.renderItems(items);
        this.position();
        return;
      }
    }
    this.close();
  }

  // Handle keys while the dropdown is open; returns true if consumed.
  handleKeydown(e: KeyboardEvent): boolean {
    if (!this.popover) return false;
    // The submit shortcut wins over completion: close without consuming so Scope sends.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      this.close();
      return false;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      return true;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      this.moveSelection(e.key === "ArrowDown" ? 1 : -1);
      return true;
    }
    if (((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") && this.selectedIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      this.confirm(this.selectedIndex);
      return true;
    }
    return false;
  }

  // linger: after a tap, iOS sends its delayed compatibility mouse events (seen on device about
  // 40ms after touchend) to whatever sits under the finger. With the list gone they would reach
  // what lies beneath it: the form's text, a toolbar button or a post. So the list stays a
  // moment, invisible, to absorb them with its own mousedown/click guards.
  close(linger = false): void {
    if (!this.popover) return;
    activeDocument.removeEventListener("pointerdown", this.onOutside, true);
    if (linger) {
      const leaving = this.popover;
      leaving.addClass("wrot-tag-suggest-leaving");
      window.setTimeout(() => leaving.remove(), GHOST_CLICK_MS);
    } else {
      this.popover.remove();
    }
    this.popover = null;
    this.itemEls = [];
    this.items = [];
    this.selectedIndex = -1;
    this.token = null;
    this.tapStart = null;
    this.interacting = false;
  }

  // Called when the textarea blurs. Focus can drop briefly mid-tap (after
  // pointerdown), so don't close then; confirm() refocuses the textarea.
  notifyBlur(): void {
    if (!this.interacting) this.close();
  }

  destroy(): void {
    this.opts.field.removeEventListener("compositionstart", this.onCompositionStart);
    this.opts.field.removeEventListener("compositionend", this.onCompositionEnd);
    this.close();
  }

  private renderItems(items: SuggestItem[]): void {
    if (!this.popover) {
      this.popover = this.opts.container.createDiv({ cls: "wrot-tag-suggest" });
      // Keep clicks inside the popover from bubbling out (same as the calendar popover).
      this.popover.addEventListener("click", (e) => e.stopPropagation());
      // iOS synthesizes delayed compatibility mouse events after a tap; their default
      // action steals focus back from the textarea after confirm()'s focus(), killing all
      // later key input. pointerdown preventDefault can't stop them, so block mousedown
      // too (same fix as the toolbar buttons).
      this.popover.addEventListener("mousedown", (e) => e.preventDefault());
      activeDocument.addEventListener("pointerdown", this.onOutside, true);
    }
    this.popover.empty();
    this.itemEls = [];
    this.items = items;
    this.selectedIndex = -1;

    items.forEach(({ label }, index) => {
      const item = this.popover!.createDiv({
        cls: "wrot-tag-suggest-item",
        text: label,
      });
      // Confirm on pointerup, not click (iOS WebKit may not fire click, which would
      // break tap-confirm on mobile). Don't preventDefault pointerdown: on iOS that can
      // detach the keyboard input session — focus stays on the textarea but keys stop
      // arriving (confirmed on device). Desktop focus theft is covered by the
      // popover-level mousedown preventDefault.
      item.addEventListener("pointerdown", (e) => {
        this.tapStart = { id: e.pointerId, x: e.clientX, y: e.clientY };
        this.interacting = true;
      });
      item.addEventListener("pointerup", (e) => {
        const start = this.tapStart;
        this.tapStart = null;
        this.interacting = false;
        if (!start || start.id !== e.pointerId) return;
        // Count as a tap only if the finger barely moved (distinguishes list scrolling).
        if (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8) return;
        this.confirm(index, true);
      });
      // Cleanup when the gesture ends without confirming (e.g. it became a scroll).
      item.addEventListener("pointercancel", () => {
        this.tapStart = null;
        this.interacting = false;
      });
      this.itemEls.push(item);
    });
    this.fitHeight();
    this.applySelection();
  }

  // Long lists (the time source has up to 96) stop at the height of MAX_VISIBLE_ITEMS rows
  // and scroll inside; measured so it matches whatever row height the platform and font give.
  private fitHeight(): void {
    const popover = this.popover!;
    const last = this.itemEls[MAX_VISIBLE_ITEMS - 1];
    if (this.itemEls.length <= MAX_VISIBLE_ITEMS || !last) {
      popover.style.removeProperty("max-height");
      return;
    }
    popover.scrollTop = 0;
    const cs = getComputedStyle(popover);
    const bottom = last.getBoundingClientRect().bottom - popover.getBoundingClientRect().top;
    popover.style.maxHeight = `${bottom + parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth)}px`;
  }

  private moveSelection(delta: number): void {
    const count = this.itemEls.length;
    if (count === 0) return;
    this.selectedIndex = this.selectedIndex < 0
      ? (delta > 0 ? 0 : count - 1)
      : (this.selectedIndex + delta + count) % count;
    this.applySelection();
  }

  private applySelection(): void {
    this.itemEls.forEach((el, index) => {
      el.toggleClass("wrot-tag-suggest-item-selected", index === this.selectedIndex);
    });
    this.itemEls[this.selectedIndex]?.scrollIntoView({ block: "nearest" });
  }

  // Replace the active token with the chosen item; its trailing space keeps typing flowing.
  private confirm(index: number, byPointer = false): void {
    const insert = this.items[index]?.insert;
    const token = this.token;
    if (insert === undefined || !token) return;
    const ta = this.opts.field;
    this.suppressUiUntil = Date.now() + GHOST_CLICK_MS;
    this.close(byPointer);
    // iOS kana input keeps a composition alive the whole time you type; rewriting the
    // value mid-composition leaves the IME with a ghost composition detached from the
    // real text, and later single Backspaces do nothing (confirmed on device). So while
    // composing: blur to force-commit, wait for compositionend, then replace and refocus.
    // The forced commit doesn't change the text, so the token range stays valid.
    if (this.composing) {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        ta.removeEventListener("compositionend", finish);
        this.applyInsert(ta, token, insert);
      };
      ta.addEventListener("compositionend", finish);
      ta.blur();
      // Fallback for environments where compositionend never fires.
      window.setTimeout(finish, 150);
      return;
    }
    // A tap on the list, even with the focus kept, leaves iOS no longer drawing the caret or
    // delivering keys to the form (seen on device with the English keyboard), so a tap always
    // rebuilds the input session.
    this.applyInsert(ta, token, insert, byPointer && Platform.isIosApp);
  }

  // Replace the token and put the caret after the insert. Refocus only if focus was
  // lost (blurred by the forced commit) or a tap asked for it: stacking a plain focus() on an
  // already-focused textarea can make iOS lose the keyboard session, so it goes through
  // rebuildFocus.
  private applyInsert(ta: ComposerField, token: ActiveToken, insert: string, rebuild = false): void {
    ta.value = ta.value.slice(0, token.start) + insert + ta.value.slice(token.end);
    const caret = token.start + insert.length;
    if (rebuild || !ta.hasFocus) {
      rebuildFocus(ta, this.opts.container);
    }
    ta.setSelectionRange(caret, caret);
    ta.dispatchEvent(new Event("input"));
  }

  private onOutside = (e: PointerEvent): void => {
    const target = e.target as Node | null;
    if (target && (this.popover?.contains(target) || this.opts.field.contains(target))) {
      return;
    }
    this.suppressUiUntil = Date.now() + GHOST_CLICK_MS;
    this.close();
  };

  // Place the dropdown right under the token's #: left from the # itself, top from the
  // bottom of the token's end, which may sit on a later line if the token wrapped.
  private position(): void {
    const { field: ta, container } = this.opts;
    const popover = this.popover;
    const token = this.token;
    if (!popover || !token) return;

    const startCoords = ta.coordsAt(token.start, 1);
    const endCoords = ta.coordsAt(token.end, -1) ?? startCoords;
    if (!startCoords || !endCoords) return;
    const caretLeft = startCoords.left;
    const caretBottom = endCoords.bottom;

    // Clamp within the container (same margin rules as the calendar popover).
    const GAP = 2;
    const EDGE = 8;
    const cRect = container.getBoundingClientRect();
    popover.style.maxWidth = `${cRect.width - EDGE * 2}px`;
    const w = popover.offsetWidth;
    const maxLeft = cRect.width - w - EDGE;
    let left = caretLeft - cRect.left;
    if (left > maxLeft) left = maxLeft;
    if (left < EDGE) left = EDGE;
    popover.style.top = `${caretBottom - cRect.top + GAP}px`;
    popover.style.left = `${left}px`;
  }
}
