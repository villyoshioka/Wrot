import { App, Events, TFile } from "obsidian";
import { dailyNoteTitle, expandCoreTemplateVars } from "./dailyNote";

declare const moment: typeof import("moment");
type Moment = ReturnType<typeof moment>;

const HEADING_RE = /^(#{1,6})[ \t]+(.*?)[ \t]*$/;
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})/;
const TEMPLATER_TAG_RE = /<%[-_]?([\s\S]*?)[-_]?%>/g;

/**
 * Line indexes of ATX headings, skipping front matter and fenced code. Posts are
 * fenced too, so a heading written inside a post is never taken for the target.
 */
function headingLines(lines: string[]): number[] {
  const out: number[] = [];
  let i = 0;
  if (lines[0]?.trim() === "---") {
    i = 1;
    while (i < lines.length && lines[i].trim() !== "---") i++;
    i++;
  }
  let fence: string | null = null;
  for (; i < lines.length; i++) {
    const open = lines[i].match(FENCE_RE)?.[1];
    if (fence !== null) {
      if (open && open[0] === fence[0] && open.length >= fence.length && lines[i].trim() === open) {
        fence = null;
      }
      continue;
    }
    if (open) fence = open;
    else if (HEADING_RE.test(lines[i])) out.push(i);
  }
  return out;
}

function headingLevel(line: string): number {
  return line.match(HEADING_RE)?.[1].length ?? 0;
}

/** The template's headings as written, variables included, for the settings picker. */
export function listTemplateHeadings(template: string): string[] {
  const lines = template.split("\n");
  return [...new Set(headingLines(lines).map((i) => lines[i].trim()))].filter(isFindableHeading);
}

// Splits a Templater call's arguments. Only literals and tp.file.title are understood;
// anything else makes the whole expression unreadable.
function parseArgs(src: string, title: string): (string | number)[] | null {
  const args: (string | number)[] = [];
  const re = /\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`([^`]*)`|(-?\d+(?:\.\d+)?)|(tp\.file\.title))\s*(,|$)/y;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) return null;
    if (m[4] !== undefined) args.push(Number(m[4]));
    else if (m[5] !== undefined) args.push(title);
    else args.push(m[1] ?? m[2] ?? m[3] ?? "");
    pos = re.lastIndex;
    if (m[6] === "") break;
  }
  return args;
}

// Reads the handful of Templater expressions that put a date or the note's name into a
// heading, as Templater would have written them at `ref`. Returns null for anything else.
function evalTemplater(expr: string, ref: Moment, title: string): string | null {
  const m = expr.trim().match(/^tp\.(date\.(?:now|today|tomorrow|yesterday)|file\.title|file\.creation_date)(?:\(([\s\S]*)\))?$/);
  if (!m) return null;
  if (m[1] === "file.title") return m[2] === undefined ? title : null;
  const args = parseArgs(m[2] ?? "", title);
  if (!args) return null;

  const fmtArg = args[0];
  if (fmtArg !== undefined && typeof fmtArg !== "string") return null;
  if (m[1] === "file.creation_date") return ref.format(fmtArg || "YYYY-MM-DD HH:mm");

  const fmt = fmtArg || "YYYY-MM-DD";
  if (m[1] === "date.today") return ref.format(fmt);
  if (m[1] === "date.tomorrow") return ref.clone().add(1, "day").format(fmt);
  if (m[1] === "date.yesterday") return ref.clone().subtract(1, "day").format(fmt);

  const [, offset, reference, refFormat] = args;
  let base = ref.clone();
  if (reference !== undefined) {
    base = moment(String(reference), refFormat === undefined ? undefined : String(refFormat));
    if (!base.isValid()) return null;
  }
  if (typeof offset === "number") base.add(offset, "day");
  else if (typeof offset === "string" && offset) base.add(moment.duration(offset));
  return base.format(fmt);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fillTemplater(text: string, ref: Moment, title: string): string | null {
  let readable = true;
  const value = text.replace(TEMPLATER_TAG_RE, (_m, expr: string) => {
    const out = evalTemplater(expr, ref, title);
    if (out === null) readable = false;
    return out ?? "";
  });
  return readable ? value : null;
}

function fixedWordsPattern(text: string): RegExp | null {
  const parts = text.split(/<%[\s\S]*?%>/);
  return parts.length > 1 && parts.join("").trim()
    ? new RegExp(`^${parts.map(escapeRegExp).join(".*")}$`)
    : null;
}

/**
 * Whether a posted note could ever be matched against this template heading: true unless
 * it is made only of Templater variables Wrot cannot read, leaving nothing to go by.
 */
export function isFindableHeading(heading: string): boolean {
  const raw = heading.match(HEADING_RE)?.[2] ?? "";
  const today = moment();
  const core = expandCoreTemplateVars(raw, today);
  return fillTemplater(core, today, dailyNoteTitle(today)) !== null || fixedWordsPattern(core) !== null;
}

/**
 * Finds the section under the chosen template heading in a note of this date and
 * returns the index of its last non-blank line — the line a post goes after — or
 * null when the heading is not there. Null from this function itself means no
 * heading is set.
 */
export function headingLocator(
  heading: string,
  date: Moment
): ((lines: string[]) => number | null) | null {
  const hm = heading.trim().match(HEADING_RE);
  if (!hm) return null;
  const level = hm[1].length;
  const raw = hm[2];
  const title = dailyNoteTitle(date);

  const core = expandCoreTemplateVars(raw, date).trim();
  const exact = new Set([raw.trim(), core]);

  // Templater writes the moment the note was made, which is today for a note Wrot just
  // created but the note's own date for one made on that day, so both are tried.
  const now = moment();
  const noteNow = date.clone().set({ hour: now.hour(), minute: now.minute(), second: now.second() });
  for (const ref of [noteNow, now]) {
    const value = fillTemplater(core, ref, title);
    if (value !== null) exact.add(value.trim());
  }

  const pattern = fixedWordsPattern(core);

  return (lines) => {
    const heads = headingLines(lines);
    for (let k = 0; k < heads.length; k++) {
      const line = lines[heads[k]];
      if (headingLevel(line) !== level) continue;
      const text = line.match(HEADING_RE)?.[2] ?? "";
      if (!exact.has(text) && !pattern?.test(text)) continue;

      let end = lines.length;
      for (let j = k + 1; j < heads.length; j++) {
        if (headingLevel(lines[heads[j]]) <= level) {
          end = heads[j];
          break;
        }
      }
      let last = end - 1;
      while (last > heads[k] && lines[last].trim() === "") last--;
      return last;
    }
    return null;
  };
}

interface TemplaterPlugin {
  settings?: { trigger_on_file_creation?: boolean };
  templater?: { files_with_pending_templates?: Set<string> };
}

/**
 * Templater's "trigger on new file creation" reads a new note 300ms after it appears and
 * rewrites the whole file, applying a folder template only while the note is empty.
 * Writing a post before that would keep the template off, run any <% %> in the post,
 * and race the rewrite. So a note Wrot has just created is left to Templater first.
 * Relies on Templater internals; anything missing means not waiting.
 */
export async function waitForTemplater(app: App, file: TFile): Promise<void> {
  const plugins = (app as unknown as { plugins?: { plugins?: Record<string, unknown> } }).plugins?.plugins;
  const templater = plugins?.["templater-obsidian"] as TemplaterPlugin | undefined;
  if (!templater) return;
  // Moved to per-device local storage in newer Templater; older ones keep it in settings.
  const local = app.loadLocalStorage("templater-local-settings") as { trigger_on_file_creation?: boolean } | null;
  if (!(local?.trigger_on_file_creation ?? templater.settings?.trigger_on_file_creation)) return;

  const pending = templater.templater?.files_with_pending_templates;
  const workspace: Events = app.workspace;

  await new Promise<void>((resolve) => {
    let timer = 0;
    const refs = [
      workspace.on("templater:overwrite-file", (data: unknown) => {
        if ((data as { file?: TFile } | undefined)?.file?.path === file.path) done();
      }),
      workspace.on("templater:all-templates-executed", () => done()),
    ];
    // Past Templater's own delay, keep waiting only while it still holds the file.
    const check = (): void => {
      if (pending?.has(file.path)) timer = window.setTimeout(check, 300);
      else done();
    };
    timer = window.setTimeout(check, 1000);
    // A template waiting on a prompt nobody answers must not hold the post forever.
    const cap = window.setTimeout(() => done(), 30000);
    function done(): void {
      window.clearTimeout(timer);
      window.clearTimeout(cap);
      refs.forEach((ref) => workspace.offref(ref));
      resolve();
    }
  });
}
