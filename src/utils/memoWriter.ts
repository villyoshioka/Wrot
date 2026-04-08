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
    const match = line.match(/^(- \[)([ x])(\] .*)$/);
    if (!match) return data;
    lines[lineNumber] = match[1] + (match[2] === " " ? "x" : " ") + match[3];
    return lines.join("\n");
  });
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
