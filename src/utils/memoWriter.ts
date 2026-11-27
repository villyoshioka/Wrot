import { App, TFile } from "obsidian";
import { parseMemos } from "./memoParser";
import { findBlockRanges } from "./blockSegmenter";

const CHECKBOX_RE = /^((?:>\s?)*[ \t\u3000]*- \[)([ x])(\](?:[ \t].*)?)$/;

// Code and math blocks are skipped: a "- [x]" written inside one is text, not a checkbox.
function checkboxLines(lines: string[]): number[] {
  const blocks = findBlockRanges(lines);
  return lines.flatMap((line, i) =>
    CHECKBOX_RE.test(line) && !blocks.some((b) => i >= b.startLine && i <= b.endLine) ? [i] : []
  );
}

export function hasCheckbox(text: string): boolean {
  return checkboxLines(text.split("\n")).length > 0;
}

/** The text with exactly the given lines (indices into its lines) checked. */
export function withChecks(text: string, checked: number[]): string {
  const lines = text.split("\n");
  for (const i of checkboxLines(lines)) {
    const m = CHECKBOX_RE.exec(lines[i])!;
    lines[i] = `${m[1]}${checked.includes(i) ? "x" : " "}${m[3]}`;
  }
  return lines.join("\n");
}

// lineIndex counts lines of the trimmed memo content. Returns false when nothing matched.
export async function setMemoCheckbox(
  app: App,
  file: TFile,
  memoTimestamp: string,
  lineIndex: number,
  checked: boolean
): Promise<boolean> {
  let found = false;
  await app.vault.process(file, (data) => {
    const memo = parseMemos(data).find((m) => m.time === memoTimestamp);
    if (!memo) return data;
    const body = memo.rawBlock.split("\n").slice(1);
    let leading = 0;
    while (leading < body.length && body[leading].trim() === "") leading++;
    const lines = data.split("\n");
    const lineNumber = memo.lineStart + 1 + leading + lineIndex;
    const match = lines[lineNumber]?.match(/^((?:>\s?)*[ \t\u3000]*- \[)[ x](\] .*)$/);
    if (!match) return data;
    found = true;
    lines[lineNumber] = match[1] + (checked ? "x" : " ") + match[2];
    return lines.join("\n");
  });
  return found;
}

export async function toggleCheckbox(
  app: App,
  file: TFile,
  lineNumber: number
): Promise<void> {
  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    if (lineNumber < 0 || lineNumber >= lines.length) return data;
    const line = lines[lineNumber];
    const match = line.match(/^((?:>\s?)*[ \t\u3000]*- \[)([ x])(\] .*)$/);
    if (!match) return data;
    lines[lineNumber] = match[1] + (match[2] === " " ? "x" : " ") + match[3];
    return lines.join("\n");
  });
}

export async function ensureBlockIdOnFence(
  app: App,
  file: TFile,
  memoTimestamp: string,
  blockId: string
): Promise<boolean> {
  let added = false;
  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(```wr\s+)(\S+)(.*)$/);
      if (!m) continue;
      if (m[2].trim() !== memoTimestamp) continue;
      if (m[3].includes(`^${blockId}`)) {
        added = false;
        return data;
      }
      lines[i] = `${m[1]}${m[2]}${m[3]} ^${blockId}`;
      added = true;
      return lines.join("\n");
    }
    return data;
  });
  return added;
}

// The fence line is left untouched so the timestamp and any block ID (^wr-T) survive the edit.
export async function updateMemo(
  app: App,
  file: TFile,
  memoTimestamp: string,
  newContent: string
): Promise<boolean> {
  let updated = false;
  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(```wr\s+)(\S+)(.*)$/);
      if (!m) continue;
      if (m[2].trim() !== memoTimestamp) continue;
      // Same closing-fence detection as parseMemos, so the replaced range is
      // exactly what the parser reads as this memo's body.
      let end = i + 1;
      while (end < lines.length && lines[end].trim() !== "```") end++;
      if (end >= lines.length) return data;
      updated = true;
      return [
        ...lines.slice(0, i + 1),
        ...newContent.split("\n"),
        ...lines.slice(end),
      ].join("\n");
    }
    return data;
  });
  return updated;
}

// Also removes one adjacent blank line (the preceding one first) to undo the separator appendMemo wrote.
export async function deleteMemo(
  app: App,
  file: TFile,
  memoTimestamp: string,
  expectedLineStart?: number
): Promise<boolean> {
  let deleted = false;
  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    const matchesAt = (idx: number): boolean => {
      const line = lines[idx];
      if (line === undefined) return false;
      const m = line.match(/^(```wr\s+)(\S+)(.*)$/);
      return m !== null && m[2].trim() === memoTimestamp;
    };

    // Same-millisecond posts share a timestamp; the caller's line hint picks the fence while it still matches.
    let start = -1;
    if (expectedLineStart !== undefined && matchesAt(expectedLineStart)) {
      start = expectedLineStart;
    } else {
      for (let i = 0; i < lines.length; i++) {
        if (matchesAt(i)) {
          start = i;
          break;
        }
      }
    }
    if (start < 0) return data;

    // Same closing-fence detection as parseMemos, so the removed range is
    // exactly what the parser reads as this memo.
    let end = start + 1;
    while (end < lines.length && lines[end].trim() !== "```") end++;
    // Unterminated block: refuse rather than swallow everything after the fence.
    if (end >= lines.length) return data;

    let from = start;
    let to = end;
    if (from > 0 && lines[from - 1].trim() === "") from--;
    else if (to + 1 < lines.length && lines[to + 1].trim() === "") to++;

    deleted = true;
    return [...lines.slice(0, from), ...lines.slice(to + 1)].join("\n");
  });
  return deleted;
}

declare const moment: typeof import("moment");

/**
 * Appends a memo and returns the timestamp it was filed under, which is its identity.
 * `locate` names the line to write after; when it has none the memo goes at the end.
 */
export async function appendMemo(
  app: App,
  file: TFile,
  content: string,
  locate?: (lines: string[]) => number | null
): Promise<string> {
  const time = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");

  const memoBlock = "```wr " + time + "\n" + content + "\n```";

  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    const at = locate?.(lines) ?? null;
    if (at !== null) {
      const after = lines.slice(at + 1);
      // One blank line on each side, so deleteMemo taking the one before leaves the rest intact.
      const gap = after.length === 0 || after[0].trim() === "" ? [] : [""];
      return [...lines.slice(0, at + 1), "", memoBlock, ...gap, ...after].join("\n");
    }
    if (data.length === 0) return memoBlock;
    const separator = data.endsWith("\n\n")
      ? ""
      : data.endsWith("\n")
        ? "\n"
        : "\n\n";
    return data + separator + memoBlock;
  });

  return time;
}
