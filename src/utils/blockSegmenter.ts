/**
 * Segments memo body text into fenced code blocks, display math blocks, and plain text.
 *
 * Conventions:
 * - Fenced code: `~~~` (3+ tildes). Backticks (```) are reserved for the outer Wrot fence
 *   and therefore NOT recognized here. Fences must match in tilde count (>= opening count).
 * - Display math: `$$ ... $$` (paired, single-line or multi-line).
 * - Inside a code block, `$$` and other markers are treated as plain code.
 * - Unclosed blocks extend to end of input.
 */

export type Segment =
  | { kind: "text"; text: string; startLine: number }
  | { kind: "codeblock"; lang: string; code: string; startLine: number; endLine: number; fenceTildes: number }
  | { kind: "mathblock"; tex: string; startLine: number; endLine: number };

export interface BlockRange {
  kind: "codeblock" | "mathblock";
  startLine: number;
  endLine: number;
  lang?: string;
}

const CODE_FENCE_RE = /^(\s*)(~{3,})(.*)$/;
const LANG_SANITIZE_RE = /^[a-zA-Z0-9_+-]{0,32}$/;

function sanitizeLang(raw: string): string {
  const trimmed = raw.trim();
  return LANG_SANITIZE_RE.test(trimmed) ? trimmed : "";
}

interface ParsedBlock {
  kind: "codeblock" | "mathblock";
  fenceOpenLine: number;
  fenceCloseLine: number; // inclusive; may equal last index when unclosed
  contentStartLine: number; // first inner line (may exceed end when empty)
  contentEndLine: number; // last inner line inclusive (may be < start when empty)
  lang?: string;
  fenceTildes?: number;
  singleLineMath?: boolean;
  singleLineMathTex?: string;
}

function parseBlocks(lines: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const fenceMatch = line.match(CODE_FENCE_RE);
    if (fenceMatch) {
      const tildes = fenceMatch[2].length;
      const lang = sanitizeLang(fenceMatch[3]);
      const openLine = i;
      let closeLine = lines.length - 1;
      let foundClose = false;

      for (let j = i + 1; j < lines.length; j++) {
        const candidate = lines[j].match(CODE_FENCE_RE);
        if (candidate && candidate[2].length >= tildes && candidate[3].trim() === "") {
          closeLine = j;
          foundClose = true;
          break;
        }
      }

      blocks.push({
        kind: "codeblock",
        fenceOpenLine: openLine,
        fenceCloseLine: closeLine,
        contentStartLine: openLine + 1,
        contentEndLine: foundClose ? closeLine - 1 : closeLine,
        lang,
        fenceTildes: tildes,
      });

      i = closeLine + 1;
      continue;
    }

    // Display math: $$ ... $$
    // Prefer single-line form when both $$ appear on the same line with content between
    const trimmed = line.trim();
    if (trimmed.startsWith("$$")) {
      // Single-line: $$...$$
      const afterOpen = trimmed.slice(2);
      const closeIdx = afterOpen.lastIndexOf("$$");
      if (closeIdx > 0 && afterOpen.slice(closeIdx + 2).trim() === "") {
        const tex = afterOpen.slice(0, closeIdx);
        if (tex.length > 0) {
          blocks.push({
            kind: "mathblock",
            fenceOpenLine: i,
            fenceCloseLine: i,
            contentStartLine: i,
            contentEndLine: i,
            singleLineMath: true,
            singleLineMathTex: tex,
          });
          i++;
          continue;
        }
      }

      // Multi-line: $$ on its own line (possibly with content after), close with $$ on later line
      if (trimmed === "$$" || (trimmed.startsWith("$$") && !trimmed.slice(2).includes("$$"))) {
        const openLine = i;
        let closeLine = lines.length - 1;
        let foundClose = false;

        for (let j = i + 1; j < lines.length; j++) {
          const jTrim = lines[j].trim();
          if (jTrim.endsWith("$$")) {
            closeLine = j;
            foundClose = true;
            break;
          }
        }

        blocks.push({
          kind: "mathblock",
          fenceOpenLine: openLine,
          fenceCloseLine: closeLine,
          contentStartLine: openLine + 1,
          contentEndLine: foundClose ? closeLine - 1 : closeLine,
        });

        i = closeLine + 1;
        continue;
      }
    }

    i++;
  }

  return blocks;
}

export function segmentBlocks(text: string): Segment[] {
  const lines = text.split("\n");
  const blocks = parseBlocks(lines);
  const segments: Segment[] = [];

  let cursor = 0;
  for (const block of blocks) {
    if (block.fenceOpenLine > cursor) {
      const textLines = lines.slice(cursor, block.fenceOpenLine);
      segments.push({
        kind: "text",
        text: textLines.join("\n"),
        startLine: cursor,
      });
    }

    if (block.kind === "codeblock") {
      const codeLines = block.contentEndLine >= block.contentStartLine
        ? lines.slice(block.contentStartLine, block.contentEndLine + 1)
        : [];
      segments.push({
        kind: "codeblock",
        lang: block.lang || "",
        code: codeLines.join("\n"),
        startLine: block.fenceOpenLine,
        endLine: block.fenceCloseLine,
        fenceTildes: block.fenceTildes || 3,
      });
    } else {
      let tex: string;
      if (block.singleLineMath) {
        tex = block.singleLineMathTex || "";
      } else {
        // Handle edge case: opening line may have content after $$, closing line may have content before $$
        const openLine = lines[block.fenceOpenLine].trim();
        const texParts: string[] = [];
        if (openLine !== "$$" && openLine.startsWith("$$")) {
          texParts.push(openLine.slice(2));
        }
        if (block.contentEndLine >= block.contentStartLine) {
          texParts.push(...lines.slice(block.contentStartLine, block.contentEndLine + 1));
        }
        if (block.fenceCloseLine !== block.fenceOpenLine) {
          const closeLine = lines[block.fenceCloseLine];
          const closeTrim = closeLine.trim();
          if (closeTrim !== "$$" && closeTrim.endsWith("$$")) {
            texParts.push(closeTrim.slice(0, -2));
          }
        }
        tex = texParts.join("\n");
      }
      segments.push({
        kind: "mathblock",
        tex,
        startLine: block.fenceOpenLine,
        endLine: block.fenceCloseLine,
      });
    }

    cursor = block.fenceCloseLine + 1;
  }

  if (cursor < lines.length) {
    const tailLines = lines.slice(cursor);
    segments.push({
      kind: "text",
      text: tailLines.join("\n"),
      startLine: cursor,
    });
  }

  return segments;
}

/**
 * Line-range view over the same parser, for Live Preview which works in
 * CodeMirror line coordinates.
 *
 * @param lines Array of line strings (0-indexed). Caller is responsible for
 *              slicing the doc into a wr-block's interior before calling.
 */
export function findBlockRanges(lines: string[]): BlockRange[] {
  const blocks = parseBlocks(lines);
  return blocks.map((b) => {
    const range: BlockRange = {
      kind: b.kind,
      startLine: b.fenceOpenLine,
      endLine: b.fenceCloseLine,
    };
    if (b.kind === "codeblock") range.lang = b.lang;
    return range;
  });
}

/**
 * Extract non-block text from a memo body, joined with newlines.
 * Used by tag extraction so that `#tag` tokens inside code/math are ignored.
 */
export function extractNonBlockText(text: string): string {
  const segments = segmentBlocks(text);
  return segments
    .filter((s): s is Extract<Segment, { kind: "text" }> => s.kind === "text")
    .map((s) => s.text)
    .join("\n");
}
