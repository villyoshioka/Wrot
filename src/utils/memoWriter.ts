import { App, TFile } from "obsidian";

export async function toggleCheckbox(
  app: App,
  file: TFile,
  lineNumber: number
): Promise<void> {
  await app.vault.process(file, (data) => {
    const lines = data.split("\n");
    if (lineNumber < 0 || lineNumber >= lines.length) return data;
    const line = lines[lineNumber];
    const match = line.match(/^((?:>\s?)*- \[)([ x])(\] .*)$/);
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

// Replaces only the body of the memo whose opening fence carries this timestamp.
// The fence line itself is left untouched, so the timestamp and any block ID
// (^wr-T) survive the edit. Returns false when no matching memo exists anymore.
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

// Removes the whole memo block — both fences and the body — for the memo whose
// opening fence carries this timestamp, plus one adjacent blank line so the note
// keeps the single-blank-line separation appendMemo writes. The preceding blank
// is taken first (it is the separator appendMemo added along with this block);
// only when the block starts the file does the following blank go instead.
// Returns false when no matching memo exists anymore.
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

    // Two posts written in the same millisecond share a timestamp. The caller's
    // line hint tells them apart while it still points at a matching fence;
    // otherwise fall back to the first match, as updateMemo does.
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

export async function appendMemo(
  app: App,
  file: TFile,
  content: string
): Promise<void> {
  const time = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");

  const memoBlock = "```wr " + time + "\n" + content + "\n```";

  await app.vault.process(file, (data) => {
    if (data.length === 0) return memoBlock;
    const separator = data.endsWith("\n\n")
      ? ""
      : data.endsWith("\n")
        ? "\n"
        : "\n\n";
    return data + separator + memoBlock;
  });
}
