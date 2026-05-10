// バッククォート```はWrotの外側フェンスに予約されているため、内部コードはチルダ~~~を使う。

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

    const trimmed = line.trim();
    if (trimmed.startsWith("$$")) {
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

// CodeMirror座標で動くライブプレビュー用の行レンジ取得（呼び出し側でwrブロック内部に切り出して渡す）
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

// メモ本文から非ブロック部分のテキストのみ抽出する（コード/数式内の#tagを除外するため）
export function extractNonBlockText(text: string): string {
  const segments = segmentBlocks(text);
  return segments
    .filter((s): s is Extract<Segment, { kind: "text" }> => s.kind === "text")
    .map((s) => s.text)
    .join("\n");
}
