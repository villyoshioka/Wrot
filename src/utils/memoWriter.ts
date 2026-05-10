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
