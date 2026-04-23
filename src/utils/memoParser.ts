import { extractNonBlockText } from "./blockSegmenter";

export interface Memo {
  time: string;
  tags: string[];
  content: string;
  rawBlock: string;
  lineStart: number;
  lineEnd: number;
}

// Matches opening line: ```wr 2026-04-02T15:48:51.758+09:00
const OPENING_REGEX = /^```wr\s+(.+)$/;

/**
 * Parse all qm code blocks from file content.
 * Timestamp is in the opening fence line (```wr TIMESTAMP), not inside the block.
 */
export function parseMemos(fileContent: string): Memo[] {
  const memos: Memo[] = [];
  const lines = fileContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const openMatch = lines[i].trim().match(OPENING_REGEX);
    if (openMatch) {
      const lineStart = i;
      const rawLines = [lines[i]];

      const time = openMatch[1];

      i++;

      const bodyLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "```") {
        bodyLines.push(lines[i]);
        rawLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        rawLines.push(lines[i]); // closing ```
        i++;
      }

      const content = bodyLines.join("\n").trim();
      const tagSource = extractNonBlockText(content);
      const tags = tagSource.match(/#[^\s#]+/g) || [];

      memos.push({
        time,
        tags,
        content,
        rawBlock: rawLines.join("\n"),
        lineStart,
        lineEnd: lineStart + rawLines.length - 1,
      });
    } else {
      i++;
    }
  }

  return memos.reverse();
}
