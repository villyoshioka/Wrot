import { IMAGE_EXT_RE, QUOTE_MARKER_RE, inlineTokens, splitLinkAlias } from "../utils/patterns";

/**
 * A link written in the composer, as the link button reads and writes it.
 *
 * Two spellings carry one meaning: `[text](url)` for a link out of the vault and
 * `![[note|text]]` (or `![[note]]` when the text is the note's name) for a note. Bare URLs,
 * image embeds and quote-card markers are not links in this sense: they stay as typed.
 */
interface ComposerLink {
  from: number;
  to: number;
  open: { from: number; to: number };
  close: { from: number; to: number };
  text: string;
  target: string;
  external: boolean;
}

const SCHEME_RE = /^(?:https?|obsidian):\/\//i;

/** Reads one inline token (as inlineTokenPattern matches it) starting at `from`. */
export function parseLinkToken(token: string, from: number): ComposerLink | null {
  const to = from + token.length;
  if (token.startsWith("[") && !token.startsWith("[[")) {
    const split = token.indexOf("](");
    if (split < 0) return null;
    return {
      from,
      to,
      open: { from, to: from + 1 },
      close: { from: from + split, to },
      text: token.slice(1, split),
      target: token.slice(split + 2, -1),
      external: true,
    };
  }
  const lead = token.startsWith("![[") ? 3 : token.startsWith("[[") ? 2 : 0;
  if (lead === 0 || !token.endsWith("]]") || QUOTE_MARKER_RE.test(token)) return null;
  const inner = token.slice(lead, -2);
  const { target, display } = splitLinkAlias(inner);
  if (IMAGE_EXT_RE.test(target)) return null;
  const bar = inner.indexOf("|");
  const aliased = bar >= 0 && bar < inner.length - 1;
  return {
    from,
    to,
    open: { from, to: from + lead + (aliased ? bar + 1 : 0) },
    // An empty alias shows the note name, so its bar goes with the closing brackets.
    close: { from: bar >= 0 && !aliased ? from + lead + bar : to - 2, to },
    text: display,
    target,
    external: false,
  };
}

/** The link on `doc`'s line that holds [from, to], touching its ends included, decorated or not. */
export function findLinkAt(doc: string, from: number, to: number): ComposerLink | null {
  const lineStart = doc.lastIndexOf("\n", from - 1) + 1;
  const nl = doc.indexOf("\n", lineStart);
  const line = doc.slice(lineStart, nl === -1 ? doc.length : nl);
  for (const { token, index } of inlineTokens(line)) {
    const start = lineStart + index;
    if (start > from) continue;
    const link = parseLinkToken(token, start);
    if (link && link.to >= to) return link;
  }
  return null;
}

/** Whether `text` can be shown as a link: one line, and no brackets to end the syntax early. */
export function isLinkableText(text: string): boolean {
  return text.length > 0 && !/[[\]\n]/.test(text);
}

/**
 * The Markdown for `text` linked to `target`: out of the vault when the target starts with
 * a scheme, otherwise to a note (brackets a user pasted around the name are dropped).
 */
export function linkMarkdown(text: string, target: string): string {
  const dest = target.trim();
  if (SCHEME_RE.test(dest)) {
    // The link syntax ends at the first space or ")".
    return `[${text}](${dest.replace(/ /g, "%20").replace(/\)/g, "%29")})`;
  }
  const note = dest.replace(/^!?\[\[/, "").replace(/\]\]$/, "").replace(/[[\]]/g, "");
  return note === text ? `![[${note}]]` : `![[${note}|${text}]]`;
}
