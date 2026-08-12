/**
 * Shared list-line parsing for every renderer.
 *
 * Reading view, the timeline, live preview and the quote card each used to re-type the same
 * `^- `, `^- [ ] ` and `^1. ` patterns anchored hard to the start of the line, so an indented
 * item matched nowhere and fell through as plain text. The patterns live here once, indent
 * included, and the depth of an item is derived by ListDepthTracker.
 */

/** Deepest nesting level rendered, matching the blockquote depth classes. */
export const MAX_LIST_DEPTH = 5;

/** Columns a tab advances to, matching the editor's own tab size. */
const TAB_WIDTH = 4;

/** Columns an ideographic space occupies: it renders as wide as two half-width ones. */
const IDEOGRAPHIC_SPACE_WIDTH = 2;

/**
 * Columns past a parent's indent at which an item counts as nested under it.
 *
 * Held to one step for every marker kind, rather than to where each parent's text happens to
 * begin. Indenting by hand is done in whole spaces, and a numbered parent would otherwise ask
 * for three of them while a bullet asked for two — the same keypress landing differently
 * depending on the marker above. One space is still too little to mean anything.
 */
const NEST_STEP = 2;

/** Columns a child of this item has to reach. */
export function nestThreshold(item: ListLine): number {
  return item.indentWidth + NEST_STEP;
}

export type ListKind = "check" | "bullet" | "ol";

export interface ListLine {
  kind: ListKind;
  /** Leading whitespace as written, in characters. */
  indentLength: number;
  /** Leading whitespace measured in columns, with tabs expanded. */
  indentWidth: number;
  /** The marker itself, excluding the indent: `- ` is 2, `- [x] ` is 6. */
  markerLength: number;
  /** Ordered-list marker as written, e.g. `1.`. Empty for the other kinds. */
  olMarker: string;
  checked: boolean;
  content: string;
}

// Indent written with an ideographic space counts too: a Japanese IME puts one there on the
// space bar, and ignoring it would leave the indent visible but doing nothing.
const INDENT_RE = /^[ \t\u3000]*/;
const CHECK_RE = /^- \[([ x])\] (.*)$/;
const BULLET_RE = /^- (.+)$/;
const OL_RE = /^(\d+)\.\s?(.+)$/;
const BULLET_EMPTY_RE = /^- (.*)$/;
const OL_EMPTY_RE = /^(\d+)\.\s?(.*)$/;

/**
 * Columns the given leading whitespace occupies.
 *
 * Measuring by how wide the indent looks rather than by how many keys were pressed is what
 * makes spaces, ideographic spaces and tabs agree: what lines up on screen nests the same.
 */
function widthOf(indent: string): number {
  let width = 0;
  for (const ch of indent) {
    if (ch === "\t") width += TAB_WIDTH - (width % TAB_WIDTH);
    else if (ch === "\u3000") width += IDEOGRAPHIC_SPACE_WIDTH;
    else width += 1;
  }
  return width;
}

/**
 * Splits a line into its list marker and content, or returns null when it is not a list item.
 *
 * A bullet or ordered marker with nothing after it stays plain by default, since it is usually
 * a line still being typed. Live preview passes allowEmpty because it shows the marker as soon
 * as it is typed, and it kept doing so before the indent support landed.
 */
export function parseListLine(text: string, allowEmpty = false): ListLine | null {
  const indent = INDENT_RE.exec(text)?.[0] ?? "";
  const rest = text.slice(indent.length);
  const base = {
    indentLength: indent.length,
    indentWidth: widthOf(indent),
    olMarker: "",
    checked: false,
  };

  const check = CHECK_RE.exec(rest);
  if (check) {
    return {
      ...base,
      kind: "check",
      markerLength: check[0].length - check[2].length,
      checked: check[1] === "x",
      content: check[2],
    };
  }

  const bullet = (allowEmpty ? BULLET_EMPTY_RE : BULLET_RE).exec(rest);
  if (bullet) {
    return { ...base, kind: "bullet", markerLength: 2, content: bullet[1] };
  }

  const ol = (allowEmpty ? OL_EMPTY_RE : OL_RE).exec(rest);
  if (ol) {
    const markerLength = ol[0].length - ol[2].length;
    return {
      ...base,
      kind: "ol",
      markerLength,
      olMarker: `${ol[1]}.`,
      content: ol[2],
    };
  }

  return null;
}

/**
 * Places items in a list run: how deep each one sits, and what number it carries.
 *
 * An item nests once it is indented a step past its parent, so a stray single space keeps the
 * item on the level it was already on rather than opening a level nobody asked for. The step
 * is measured against the parent's own indent, so two spaces, four spaces and tabs all nest
 * the same way whatever the list is indented by overall.
 *
 * Feed lines in document order and call reset() whenever the run of list items breaks.
 */
export class ListDepthTracker {
  private levels: {
    indentWidth: number;
    contentColumn: number;
    tag: ListTag;
    ordinal: number;
  }[] = [];

  /**
   * Where this item sits: its depth, and its position within its own level.
   *
   * The ordinal is what the numbered views show, so a list numbered 1/1/1 or 3/9/4 still reads
   * 1/2/3 and every level starts over at one. It follows the same rules as the CSS counters
   * reading view uses, so the two stay in step.
   */
  place(item: ListLine): { depth: number; ordinal: number } {
    const width = item.indentWidth;
    const tag = tagFor(item.kind);
    // Anything indented less than a level's own indent has stepped back out of it.
    while (this.levels.length > 0 && width < this.levels[this.levels.length - 1].indentWidth) {
      this.levels.pop();
    }
    const enclosing = this.levels[this.levels.length - 1];
    if (!enclosing || width >= enclosing.contentColumn) {
      this.levels.push({ indentWidth: width, contentColumn: nestThreshold(item), tag, ordinal: 1 });
    } else if (enclosing.tag !== tag) {
      // Switching marker kind at the same depth ends that list and starts a fresh one.
      enclosing.tag = tag;
      enclosing.ordinal = 1;
    } else {
      enclosing.ordinal += 1;
    }
    return {
      depth: Math.min(this.levels.length - 1, MAX_LIST_DEPTH - 1),
      ordinal: this.levels[this.levels.length - 1].ordinal,
    };
  }

  reset(): void {
    this.levels = [];
  }
}

export type ListTag = "ul" | "ol";

/** The tag a parsed item belongs in. */
export function tagFor(kind: ListKind): ListTag {
  return kind === "ol" ? "ol" : "ul";
}

/**
 * Holds the open `<ul>`/`<ol>` of each depth so an item can be dropped into the right one.
 *
 * A deeper item goes inside the previous item of the level above, which is what gives the
 * markup real nesting instead of a flat run of siblings. The root list is created detached;
 * the caller decides where it goes, and watches `root` to notice when a new one starts.
 */
export class NestedListStack {
  private levels: { el: HTMLElement; tag: ListTag }[] = [];

  constructor(
    private makeList: (tag: ListTag) => HTMLElement,
    private makeItem: () => HTMLElement
  ) {}

  get isEmpty(): boolean {
    return this.levels.length === 0;
  }

  get root(): HTMLElement | null {
    return this.levels.length > 0 ? this.levels[0].el : null;
  }

  /** The list an item at this depth belongs in, opening or closing levels to reach it. */
  listFor(depth: number, tag: ListTag): HTMLElement {
    while (this.levels.length > depth + 1) this.levels.pop();
    // Switching marker kind at the same depth ends that list and starts a fresh one.
    if (this.levels.length === depth + 1 && this.levels[depth].tag !== tag) {
      this.levels.pop();
    }
    while (this.levels.length < depth + 1) {
      const el = this.makeList(tag);
      const parent = this.levels[this.levels.length - 1];
      if (parent) {
        // A list can only nest inside an item; a level that jumped straight to a deeper
        // indent has none yet, so an empty item stands in as the host.
        let host = parent.el.lastElementChild as HTMLElement | null;
        if (!host) {
          host = this.makeItem();
          parent.el.appendChild(host);
        }
        // Marked so the styles can tell an item that holds a list from a plain one, without
        // asking the selector to look at what is inside it.
        host.classList.add("wr-has-sublist");
        host.appendChild(el);
      }
      this.levels.push({ el, tag });
    }
    return this.levels[this.levels.length - 1].el;
  }

  clear(): void {
    this.levels = [];
  }
}
