import { App, TFile } from "obsidian";
import {
  getDailyNote,
  createDailyNote,
  getAllDailyNotes,
} from "obsidian-daily-notes-interface";

declare const moment: typeof import("moment");

export async function getOrCreateDailyNote(
  app: App,
  date: ReturnType<typeof moment>
): Promise<TFile> {
  const allDailyNotes = getAllDailyNotes();
  const existing = getDailyNote(date, allDailyNotes);
  if (existing) return existing;
  return await createDailyNote(date);
}

export function getDailyNoteFile(
  app: App,
  date: ReturnType<typeof moment>
): TFile | null {
  const allDailyNotes = getAllDailyNotes();
  return getDailyNote(date, allDailyNotes);
}
