import { App, TFile, normalizePath } from "obsidian";
import {
  getDailyNoteSettings,
  getTemplateInfo,
} from "obsidian-daily-notes-interface";

declare const moment: typeof import("moment");

interface NotePathInfo {
  path: string;
  filename: string;
  format: string;
}

// getDailyNote from obsidian-daily-notes-interface misses existing files for
// non-daily formats (weekly/monthly), so build the path ourselves.
// format/filename are returned for reuse in template expansion.
function buildNotePath(date: ReturnType<typeof moment>): NotePathInfo {
  const settings = getDailyNoteSettings();
  const format = settings?.format || "YYYY-MM-DD";
  const folder = settings?.folder?.trim() || "";
  const filename = date.format(format);
  const withExt = filename.endsWith(".md") ? filename : `${filename}.md`;
  const joined = folder ? `${folder}/${withExt}` : withExt;
  return { path: normalizePath(joined), filename, format };
}

async function ensureFolderForPath(app: App, path: string): Promise<void> {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return;
  const dir = path.substring(0, lastSlash);
  const existing = app.vault.getAbstractFileByPath(dir);
  if (existing) return;
  await app.vault.createFolder(dir);
}

/**
 * Where the note for this date lives, whether or not it exists.
 *
 * Deletion is the case that needs this: once the file is gone there is nothing to look up,
 * so a watcher asking "was that the note I am showing?" has only the path to go on.
 */
export function dailyNotePathFor(date: ReturnType<typeof moment>): string {
  return buildNotePath(date).path;
}

export function getDailyNoteFile(
  app: App,
  date: ReturnType<typeof moment>
): TFile | null {
  const file = app.vault.getAbstractFileByPath(dailyNotePathFor(date));
  return file instanceof TFile ? file : null;
}

export async function getOrCreateDailyNote(
  app: App,
  date: ReturnType<typeof moment>
): Promise<TFile> {
  const { path, filename, format } = buildNotePath(date);
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) return existing;

  await ensureFolderForPath(app, path);

  const template = getDailyNoteSettings()?.template?.trim() || "";

  let body = "";
  if (template) {
    try {
      const [contents] = await getTemplateInfo(template);
      body = contents
        .replace(/{{\s*date\s*}}/gi, filename)
        .replace(/{{\s*time\s*}}/gi, moment().format("HH:mm"))
        .replace(/{{\s*title\s*}}/gi, filename)
        .replace(
          /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
          (_match, _type, calc, delta, unit, customFmt) => {
            const now = moment();
            const cur = date.clone().set({
              hour: now.get("hour"),
              minute: now.get("minute"),
              second: now.get("second"),
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- argument from untyped Obsidian/CodeMirror internal API
            if (calc) cur.add(parseInt(delta, 10), unit);
            return customFmt
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- internal Obsidian/CodeMirror API or intentional pattern
              ? cur.format(customFmt.substring(1).trim())
              : cur.format(format);
          }
        )
        .replace(
          /{{\s*yesterday\s*}}/gi,
          date.clone().subtract(1, "day").format(format)
        )
        .replace(
          /{{\s*tomorrow\s*}}/gi,
          date.clone().add(1, "day").format(format)
        );
    } catch {
      body = "";
    }
  }

  return await app.vault.create(path, body);
}
