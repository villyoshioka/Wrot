/**
 * Patterns shared across the renderers.
 *
 * Each of these used to be re-typed in several files, so a change to one spelling silently
 * left the others behind. Sticky (`g`) patterns are exposed as factories: a shared global
 * RegExp carries `lastIndex` between call sites and would skip matches.
 */

/** Attachment extensions Wrot renders inline, without the leading dot. */
export const IMAGE_EXTENSIONS = "png|jpe?g|gif|webp|svg|bmp";

/** Matches a file name or URL ending in a supported image extension. */
export const IMAGE_EXT_RE = new RegExp(`\\.(?:${IMAGE_EXTENSIONS})$`, "i");

/** Matches a bare extension, as reported by TFile.extension. */
export const ATTACHMENT_EXT_RE = new RegExp(`^(?:${IMAGE_EXTENSIONS})$`, "i");

/** A six-digit hex color, the only form the settings accept. */
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Body of a quote-card marker: a link to a memo's block id. */
const QUOTE_MARKER_SOURCE = String.raw`\[\[[^[\]]+#\^wr-\d{17}\]\]`;

/** Tests whether a string contains a quote-card marker. Safe to share: not sticky. */
export const QUOTE_MARKER_RE = new RegExp(QUOTE_MARKER_SOURCE);

/** Tests whether a line consists of nothing but a quote-card marker. */
export const QUOTE_MARKER_ONLY_LINE_RE = new RegExp(`^\\s*${QUOTE_MARKER_SOURCE}\\s*$`);

/** Fresh global matcher for quote-card markers, for replace/scan over a whole text. */
export function quoteMarkerPattern(): RegExp {
  return new RegExp(QUOTE_MARKER_SOURCE, "g");
}

/** Fresh global matcher for inline tags. */
export function tagPattern(): RegExp {
  return /#[^\s#]+/g;
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
 * @param mark The delimiter, already escaped for use in a regular expression.
 * @param char The delimiter's single character class, e.g. `\*`, used for the run guards.
 */
function decorationSource(mark: string, char: string): string {
  // One non-space character, or a run that both starts and ends with one.
  const body = `(?:[^${char}\\s]|[^${char}\\s][^${char}]*[^${char}\\s])`;
  return `(?<!${char})${mark}${body}${mark}(?!${char})`;
}

const BOLD_SOURCE = decorationSource(String.raw`\*\*`, String.raw`\*`);
const ITALIC_SOURCE = decorationSource(String.raw`\*`, String.raw`\*`);
const STRIKE_SOURCE = decorationSource("~~", "~");
const HIGHLIGHT_SOURCE = decorationSource("==", "=");

/** Fresh global matchers for each decoration. Returned fresh because they are sticky. */
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
 * Order matters: a `#` inside code, math, a decoration, an embed/link, or a URL is not a tag
 * on screen, so it must not be treated as one anywhere. Returned fresh because it is sticky.
 */
export function inlineTokenPattern(): RegExp {
  return new RegExp(
    "(" +
      [
        String.raw`\$[^$]+\$`,
        "`[^`]+`",
        BOLD_SOURCE,
        ITALIC_SOURCE,
        STRIKE_SOURCE,
        HIGHLIGHT_SOURCE,
        String.raw`!\[\[[^\]]+\]\]`,
        String.raw`\[\[[^\]]+\]\]`,
        String.raw`\[[^[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)`,
        String.raw`#[^\s#]+`,
        String.raw`(?:https?|obsidian):\/\/[^\s<>"'\]]+`,
      ].join("|") +
      ")",
    "g"
  );
}
