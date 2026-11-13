/**
 * Patterns shared across the renderers.
 *
 * Each of these used to be re-typed in several files, so a change to one spelling silently
 * left the others behind. Sticky (`g`) patterns are exposed as factories: a shared global
 * RegExp carries `lastIndex` between call sites and would skip matches.
 */

/** Attachment extensions Wrot renders inline, without the leading dot. */
const IMAGE_EXTENSIONS = "png|jpe?g|gif|webp|svg|bmp";

/** Matches a file name or URL ending in a supported image extension. */
export const IMAGE_EXT_RE = new RegExp(`\\.(?:${IMAGE_EXTENSIONS})$`, "i");

/** Matches a bare extension, as reported by TFile.extension. */
export const ATTACHMENT_EXT_RE = new RegExp(`^(?:${IMAGE_EXTENSIONS})$`, "i");

/**
 * Splits a note link's inner text (`note|shown text`) at its first `|` into the note it
 * points to and the text shown for it. Without a `|` both are the whole text.
 */
export function splitLinkAlias(inner: string): { target: string; display: string } {
  const bar = inner.indexOf("|");
  if (bar < 0) return { target: inner, display: inner };
  const target = inner.slice(0, bar);
  return { target, display: inner.slice(bar + 1) || target };
}

// Obsidian 1.14's coloured highlights: a colour emoji (circle or square) right after the
// opening == picks the colour and is not shown.
const HIGHLIGHT_COLORS: Record<string, string> = {
  "🔴": "red", "🟥": "red",
  "🟠": "orange", "🟧": "orange",
  "🟡": "yellow", "🟨": "yellow",
  "🟢": "green", "🟩": "green",
  "🔵": "blue", "🟦": "blue",
  "🟣": "purple", "🟪": "purple",
};

/** The colours in the order Obsidian offers them, with the emoji it writes for each. */
export const HIGHLIGHT_EMOJI: ReadonlyArray<[color: string, emoji: string]> = [
  ["red", "🔴"],
  ["orange", "🟠"],
  ["yellow", "🟡"],
  ["green", "🟢"],
  ["blue", "🔵"],
  ["purple", "🟣"],
];

/**
 * The colour a highlight's inner text asks for, and how many characters of it the emoji
 * takes. Null without one, or when the emoji is all there is (nothing left to colour).
 */
export function highlightColor(inner: string): { color: string; length: number } | null {
  const cp = inner.codePointAt(0);
  if (cp === undefined) return null;
  const emoji = String.fromCodePoint(cp);
  const color = HIGHLIGHT_COLORS[emoji];
  if (!color || inner.length <= emoji.length) return null;
  return { color, length: emoji.length };
}

/** A six-digit hex color, the only form the settings accept. */
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// No String.raw: any tagged template stops V8 caching the plugin's eval, slowing startup.

/** Body of a quote-card marker: a link to a memo's block id. */
const QUOTE_MARKER_SOURCE = /\[\[[^[\]]+#\^wr-\d{17}\]\]/.source;

/** Tests whether a string contains a quote-card marker. Safe to share: not sticky. */
export const QUOTE_MARKER_RE = new RegExp(QUOTE_MARKER_SOURCE);

/** Tests whether a line consists of nothing but a quote-card marker. */
export const QUOTE_MARKER_ONLY_LINE_RE = new RegExp(`^\\s*${QUOTE_MARKER_SOURCE}\\s*$`);

/** Fresh global matcher for inline tags. */
/**
 * A tag: # and what follows up to whitespace, another #, or a decoration delimiter, so a tag at
 * the end of bold or a highlight leaves its closing delimiter alone (as Obsidian reads it).
 */
export const TAG_SOURCE = /#[^\s#*=~]+/.source;
/** A whole string that is one tag. */
export const TAG_TOKEN_RE = new RegExp(`^${TAG_SOURCE}$`);

export function tagPattern(): RegExp {
  return new RegExp(TAG_SOURCE, "g");
}

/** All inline tags in a string, in order of appearance. */
export function matchTags(text: string): string[] {
  return text.match(tagPattern()) ?? [];
}

/**
 * Sources for the inline decorations, shared by the live-preview extension and the token
 * pattern below so all three renderers agree on what counts as a decoration.
 *
 * Two rules keep a half-typed run from being decorated, matching how Markdown itself pairs
 * delimiters:
 *
 * - A delimiter only counts when its own character does not continue past it, so `**foo*`
 *   is a bold in progress rather than an italic wrapping `*foo` with a stray delimiter left
 *   on screen.
 * - An opening delimiter may not be followed by whitespace and a closing one may not be
 *   preceded by it, so two separate openers such as `*大事 *注意` no longer pair up with each
 *   other and swallow the text in between.
 *
 * Bold and italic may hold each other's delimiters (`**a *b* c**`, `*a **b** c*`), so the two
 * can be stacked with other decorations between them.
 *
 * @param mark The delimiter, already escaped for use in a regular expression.
 * @param char The delimiter's single character class, e.g. `\*`, used for the run guards.
 * @param nested Another delimiter allowed inside the text, as a regular expression source.
 */
function decorationSource(mark: string, char: string, nested = ""): string {
  // One non-space character, or a run that both starts and ends with one.
  const middle = nested ? `(?:[^${char}]|${nested})*` : `[^${char}]*`;
  const body = `(?:[^${char}\\s]|[^${char}\\s]${middle}[^${char}\\s])`;
  return `(?<!${char})${mark}${body}${mark}(?!${char})`;
}

// Bold and italic at once: read as bold around an italic.
const BOLD_ITALIC_SOURCE = decorationSource(/\*\*\*/.source, /\*/.source);
// A lone asterisk inside bold is italic's delimiter; a pair inside italic is bold's. The nested
// star never follows another star (the body only lets one through when the next char is not a
// star), so it needs no lookbehind — which iOS before 16.4 cannot parse in a regex literal.
const BOLD_SOURCE = decorationSource(/\*\*/.source, /\*/.source, /\*(?!\*)/.source);
const ITALIC_SOURCE = decorationSource(/\*/.source, /\*/.source, /\*\*/.source);
const STRIKE_SOURCE = decorationSource("~~", "~");
const HIGHLIGHT_SOURCE = decorationSource("==", "=");

/** Fresh global matchers for each decoration. Returned fresh because they are sticky. */
export function boldItalicPattern(): RegExp {
  return new RegExp(BOLD_ITALIC_SOURCE, "g");
}

export function boldPattern(): RegExp {
  return new RegExp(BOLD_SOURCE, "g");
}

export function italicPattern(): RegExp {
  return new RegExp(ITALIC_SOURCE, "g");
}

export function strikePattern(): RegExp {
  return new RegExp(STRIKE_SOURCE, "g");
}

export function highlightPattern(): RegExp {
  return new RegExp(HIGHLIGHT_SOURCE, "g");
}

/**
 * Inline token precedence, shared by every renderer and by tag extraction.
 *
 * Order matters: a `#` inside code, math, an embed/link, or a URL is not a tag on screen, so it
 * must not be treated as one anywhere. A decoration's own text is read again with the same
 * rules (see inlineTokens). Returned fresh because it is sticky.
 */
export function inlineTokenPattern(): RegExp {
  return new RegExp(
    "(" +
      [
        /\$[^$]+\$/.source,
        "`[^`]+`",
        BOLD_ITALIC_SOURCE,
        BOLD_SOURCE,
        ITALIC_SOURCE,
        STRIKE_SOURCE,
        HIGHLIGHT_SOURCE,
        /!\[\[[^\]]+\]\]/.source,
        /\[\[[^\]]+\]\]/.source,
        /\[[^[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)/.source,
        TAG_SOURCE,
        /(?:https?|obsidian):\/\/[^\s<>"'\]]+/.source,
      ].join("|") +
      ")",
    "g"
  );
}

const DECORATION_DELIMS = ["**", "~~", "==", "*"];

/**
 * The text a bold, italic, strikethrough or highlight token shows, and where it starts in the
 * token (past a highlight's colour emoji); null for any other token.
 */
export function decorationInner(token: string): { offset: number; text: string } | null {
  const delim = DECORATION_DELIMS.find((d) => token.length > d.length * 2 && token.startsWith(d) && token.endsWith(d));
  if (!delim) return null;
  const inner = token.slice(delim.length, -delim.length);
  const tint = delim === "==" ? highlightColor(inner) : null;
  const offset = delim.length + (tint?.length ?? 0);
  return { offset, text: token.slice(offset, -delim.length) };
}

/** Every inline token in text, those inside a decoration's text included, each before its contents. */
export function* inlineTokens(text: string): Generator<{ token: string; index: number }> {
  for (const m of text.matchAll(inlineTokenPattern())) {
    const index = m.index ?? 0;
    yield { token: m[0], index };
    const inner = decorationInner(m[0]);
    if (!inner) continue;
    for (const t of inlineTokens(inner.text)) yield { token: t.token, index: index + inner.offset + t.index };
  }
}
