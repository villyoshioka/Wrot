import { App, TFile, normalizePath } from "obsidian";
import {
  getDailyNoteSettings,
  getTemplateInfo,
} from "obsidian-daily-notes-interface";

declare const moment: typeof import("moment");

/**
 * Resolve the file path for the given moment using the user's "Daily Notes"
 * core settings (folder + date format + template).
 *
 * We avoid `obsidian-daily-notes-interface`'s `getDailyNote` / `getAllDailyNotes`
 * because those parse filenames assuming `granularity="day"`. That fails for
 * non-daily formats (e.g. `GGGG年WW週`, `YYYY年MM月`, `GGGG-[W]WW`, `YYYY-MM00`),
 * silently misses existing files, and tries to recreate them — causing
 * "Unable to create new file." when the file already exists.
 *
 * Wrot itself stays a daily-view tool. Users get weekly/monthly behavior by
 * setting the core date format so that any day inside the same week/month
 * resolves to the same filename.
 */
function buildNotePath(date: ReturnType<typeof moment>): string {
  const settings = getDailyNoteSettings();
  const format = settings?.format || "YYYY-MM-DD";
  const folder = settings?.folder?.trim() || "";
  const filename = date.format(format);
  const withExt = filename.endsWith(".md") ? filename : `${filename}.md`;
  const joined = folder ? `${folder}/${withExt}` : withExt;
  return normalizePath(joined);
}

async function ensureFolderForPath(app: App, path: string): Promise<void> {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return;
  const dir = path.substring(0, lastSlash);
  const existing = app.vault.getAbstractFileByPath(dir);
  if (existing) return;
  await app.vault.createFolder(dir);
}

export function getDailyNoteFile(
  app: App,
  date: ReturnType<typeof moment>
): TFile | null {
  const path = buildNotePath(date);
  const file = app.vault.getAbstractFileByPath(path);
  return file instanceof TFile ? file : null;
}

export async function getOrCreateDailyNote(
  app: App,
  date: ReturnType<typeof moment>
): Promise<TFile> {
  const path = buildNotePath(date);
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) return existing;

  await ensureFolderForPath(app, path);

  const settings = getDailyNoteSettings();
  const template = settings?.template?.trim() || "";
  const format = settings?.format || "YYYY-MM-DD";
  const filename = date.format(format);

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
            if (calc) cur.add(parseInt(delta, 10), unit);
            return customFmt
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
