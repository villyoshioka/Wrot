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
 * Inline token precedence, shared by every renderer and by tag extraction.
 *
 * Order matters: a `#` inside code, math, a decoration, an embed/link, or a URL is not a tag
 * on screen, so it must not be treated as one anywhere. Returned fresh because it is sticky.
 */
export function inlineTokenPattern(): RegExp {
  return /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+=+|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)|#[^\s#]+|(?:https?|obsidian):\/\/[^\s<>"'\]]+)/g;
}
