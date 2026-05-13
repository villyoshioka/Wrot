var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/blockSegmenter.ts
function sanitizeLang(raw) {
  const trimmed = raw.trim();
  return LANG_SANITIZE_RE.test(trimmed) ? trimmed : "";
}
function parseBlocks(lines) {
  const blocks = [];
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
        fenceTildes: tildes
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
            singleLineMathTex: tex
          });
          i++;
          continue;
        }
      }
      if (trimmed === "$$" || trimmed.startsWith("$$") && !trimmed.slice(2).includes("$$")) {
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
          contentEndLine: foundClose ? closeLine - 1 : closeLine
        });
        i = closeLine + 1;
        continue;
      }
    }
    i++;
  }
  return blocks;
}
function segmentBlocks(text) {
  const lines = text.split("\n");
  const blocks = parseBlocks(lines);
  const segments = [];
  let cursor = 0;
  for (const block of blocks) {
    if (block.fenceOpenLine > cursor) {
      const textLines = lines.slice(cursor, block.fenceOpenLine);
      segments.push({
        kind: "text",
        text: textLines.join("\n"),
        startLine: cursor
      });
    }
    if (block.kind === "codeblock") {
      const codeLines = block.contentEndLine >= block.contentStartLine ? lines.slice(block.contentStartLine, block.contentEndLine + 1) : [];
      segments.push({
        kind: "codeblock",
        lang: block.lang || "",
        code: codeLines.join("\n"),
        startLine: block.fenceOpenLine,
        endLine: block.fenceCloseLine,
        fenceTildes: block.fenceTildes || 3
      });
    } else {
      let tex;
      if (block.singleLineMath) {
        tex = block.singleLineMathTex || "";
      } else {
        const openLine = lines[block.fenceOpenLine].trim();
        const texParts = [];
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
        endLine: block.fenceCloseLine
      });
    }
    cursor = block.fenceCloseLine + 1;
  }
  if (cursor < lines.length) {
    const tailLines = lines.slice(cursor);
    segments.push({
      kind: "text",
      text: tailLines.join("\n"),
      startLine: cursor
    });
  }
  return segments;
}
function findBlockRanges(lines) {
  const blocks = parseBlocks(lines);
  return blocks.map((b) => {
    const range = {
      kind: b.kind,
      startLine: b.fenceOpenLine,
      endLine: b.fenceCloseLine
    };
    if (b.kind === "codeblock") range.lang = b.lang;
    return range;
  });
}
function extractNonBlockText(text) {
  const segments = segmentBlocks(text);
  return segments.filter((s) => s.kind === "text").map((s) => s.text).join("\n");
}
var CODE_FENCE_RE, LANG_SANITIZE_RE;
var init_blockSegmenter = __esm({
  "src/utils/blockSegmenter.ts"() {
    CODE_FENCE_RE = /^(\s*)(~{3,})(.*)$/;
    LANG_SANITIZE_RE = /^[a-zA-Z0-9_+-]{0,32}$/;
  }
});

// src/utils/memoParser.ts
var memoParser_exports = {};
__export(memoParser_exports, {
  parseMemos: () => parseMemos
});
function parseMemos(fileContent) {
  const memos = [];
  const lines = fileContent.split("\n");
  let i = 0;
  while (i < lines.length) {
    const openMatch = lines[i].trim().match(OPENING_REGEX);
    if (openMatch) {
      const lineStart = i;
      const rawLines = [lines[i]];
      const time = openMatch[1].split(/\s/)[0];
      i++;
      const bodyLines = [];
      while (i < lines.length && lines[i].trim() !== "```") {
        bodyLines.push(lines[i]);
        rawLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        rawLines.push(lines[i]);
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
        lineEnd: lineStart + rawLines.length - 1
      });
    } else {
      i++;
    }
  }
  return memos.reverse();
}
var OPENING_REGEX;
var init_memoParser = __esm({
  "src/utils/memoParser.ts"() {
    init_blockSegmenter();
    OPENING_REGEX = /^```wr\s+(.+)$/;
  }
});

// node_modules/obsidian-daily-notes-interface/dist/main.js
var require_main = __commonJS({
  "node_modules/obsidian-daily-notes-interface/dist/main.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var obsidian = require("obsidian");
    var DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
    var DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";
    var DEFAULT_MONTHLY_NOTE_FORMAT = "YYYY-MM";
    var DEFAULT_QUARTERLY_NOTE_FORMAT = "YYYY-[Q]Q";
    var DEFAULT_YEARLY_NOTE_FORMAT = "YYYY";
    function shouldUsePeriodicNotesSettings(periodicity) {
      var _a, _b;
      const periodicNotes = window.app.plugins.getPlugin("periodic-notes");
      return periodicNotes && ((_b = (_a = periodicNotes.settings) == null ? void 0 : _a[periodicity]) == null ? void 0 : _b.enabled);
    }
    function getDailyNoteSettings2() {
      var _a, _b, _c, _d;
      try {
        const { internalPlugins, plugins } = window.app;
        if (shouldUsePeriodicNotesSettings("daily")) {
          const { format: format2, folder: folder2, template: template2 } = ((_b = (_a = plugins.getPlugin("periodic-notes")) == null ? void 0 : _a.settings) == null ? void 0 : _b.daily) || {};
          return {
            format: format2 || DEFAULT_DAILY_NOTE_FORMAT,
            folder: (folder2 == null ? void 0 : folder2.trim()) || "",
            template: (template2 == null ? void 0 : template2.trim()) || ""
          };
        }
        const { folder, format, template } = ((_d = (_c = internalPlugins.getPluginById("daily-notes")) == null ? void 0 : _c.instance) == null ? void 0 : _d.options) || {};
        return {
          format: format || DEFAULT_DAILY_NOTE_FORMAT,
          folder: (folder == null ? void 0 : folder.trim()) || "",
          template: (template == null ? void 0 : template.trim()) || ""
        };
      } catch (err) {
        console.info("No custom daily note settings found!", err);
      }
    }
    function getWeeklyNoteSettings() {
      var _a, _b, _c, _d, _e, _f, _g;
      try {
        const pluginManager = window.app.plugins;
        const calendarSettings = (_a = pluginManager.getPlugin("calendar")) == null ? void 0 : _a.options;
        const periodicNotesSettings = (_c = (_b = pluginManager.getPlugin("periodic-notes")) == null ? void 0 : _b.settings) == null ? void 0 : _c.weekly;
        if (shouldUsePeriodicNotesSettings("weekly")) {
          return {
            format: periodicNotesSettings.format || DEFAULT_WEEKLY_NOTE_FORMAT,
            folder: ((_d = periodicNotesSettings.folder) == null ? void 0 : _d.trim()) || "",
            template: ((_e = periodicNotesSettings.template) == null ? void 0 : _e.trim()) || ""
          };
        }
        const settings = calendarSettings || {};
        return {
          format: settings.weeklyNoteFormat || DEFAULT_WEEKLY_NOTE_FORMAT,
          folder: ((_f = settings.weeklyNoteFolder) == null ? void 0 : _f.trim()) || "",
          template: ((_g = settings.weeklyNoteTemplate) == null ? void 0 : _g.trim()) || ""
        };
      } catch (err) {
        console.info("No custom weekly note settings found!", err);
      }
    }
    function getMonthlyNoteSettings() {
      var _a, _b, _c, _d;
      const pluginManager = window.app.plugins;
      try {
        const settings = shouldUsePeriodicNotesSettings("monthly") && ((_b = (_a = pluginManager.getPlugin("periodic-notes")) == null ? void 0 : _a.settings) == null ? void 0 : _b.monthly) || {};
        return {
          format: settings.format || DEFAULT_MONTHLY_NOTE_FORMAT,
          folder: ((_c = settings.folder) == null ? void 0 : _c.trim()) || "",
          template: ((_d = settings.template) == null ? void 0 : _d.trim()) || ""
        };
      } catch (err) {
        console.info("No custom monthly note settings found!", err);
      }
    }
    function getQuarterlyNoteSettings() {
      var _a, _b, _c, _d;
      const pluginManager = window.app.plugins;
      try {
        const settings = shouldUsePeriodicNotesSettings("quarterly") && ((_b = (_a = pluginManager.getPlugin("periodic-notes")) == null ? void 0 : _a.settings) == null ? void 0 : _b.quarterly) || {};
        return {
          format: settings.format || DEFAULT_QUARTERLY_NOTE_FORMAT,
          folder: ((_c = settings.folder) == null ? void 0 : _c.trim()) || "",
          template: ((_d = settings.template) == null ? void 0 : _d.trim()) || ""
        };
      } catch (err) {
        console.info("No custom quarterly note settings found!", err);
      }
    }
    function getYearlyNoteSettings() {
      var _a, _b, _c, _d;
      const pluginManager = window.app.plugins;
      try {
        const settings = shouldUsePeriodicNotesSettings("yearly") && ((_b = (_a = pluginManager.getPlugin("periodic-notes")) == null ? void 0 : _a.settings) == null ? void 0 : _b.yearly) || {};
        return {
          format: settings.format || DEFAULT_YEARLY_NOTE_FORMAT,
          folder: ((_c = settings.folder) == null ? void 0 : _c.trim()) || "",
          template: ((_d = settings.template) == null ? void 0 : _d.trim()) || ""
        };
      } catch (err) {
        console.info("No custom yearly note settings found!", err);
      }
    }
    function join(...partSegments) {
      let parts = [];
      for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split("/"));
      }
      const newParts = [];
      for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i];
        if (!part || part === ".")
          continue;
        else
          newParts.push(part);
      }
      if (parts[0] === "")
        newParts.unshift("");
      return newParts.join("/");
    }
    function basename(fullPath) {
      let base = fullPath.substring(fullPath.lastIndexOf("/") + 1);
      if (base.lastIndexOf(".") != -1)
        base = base.substring(0, base.lastIndexOf("."));
      return base;
    }
    async function ensureFolderExists(path) {
      const dirs = path.replace(/\\/g, "/").split("/");
      dirs.pop();
      if (dirs.length) {
        const dir = join(...dirs);
        if (!window.app.vault.getAbstractFileByPath(dir)) {
          await window.app.vault.createFolder(dir);
        }
      }
    }
    async function getNotePath(directory, filename) {
      if (!filename.endsWith(".md")) {
        filename += ".md";
      }
      const path = obsidian.normalizePath(join(directory, filename));
      await ensureFolderExists(path);
      return path;
    }
    async function getTemplateInfo2(template) {
      const { metadataCache, vault } = window.app;
      const templatePath = obsidian.normalizePath(template);
      if (templatePath === "/") {
        return Promise.resolve(["", null]);
      }
      try {
        const templateFile = metadataCache.getFirstLinkpathDest(templatePath, "");
        const contents = await vault.cachedRead(templateFile);
        const IFoldInfo = window.app.foldManager.load(templateFile);
        return [contents, IFoldInfo];
      } catch (err) {
        console.error(`Failed to read the daily note template '${templatePath}'`, err);
        new obsidian.Notice("Failed to read the daily note template");
        return ["", null];
      }
    }
    function getDateUID(date, granularity = "day") {
      const ts = date.clone().startOf(granularity).format();
      return `${granularity}-${ts}`;
    }
    function removeEscapedCharacters(format) {
      return format.replace(/\[[^\]]*\]/g, "");
    }
    function isFormatAmbiguous(format, granularity) {
      if (granularity === "week") {
        const cleanFormat = removeEscapedCharacters(format);
        return /w{1,2}/i.test(cleanFormat) && (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat));
      }
      return false;
    }
    function getDateFromFile(file, granularity) {
      return getDateFromFilename(file.basename, granularity);
    }
    function getDateFromPath(path, granularity) {
      return getDateFromFilename(basename(path), granularity);
    }
    function getDateFromFilename(filename, granularity) {
      const getSettings = {
        day: getDailyNoteSettings2,
        week: getWeeklyNoteSettings,
        month: getMonthlyNoteSettings,
        quarter: getQuarterlyNoteSettings,
        year: getYearlyNoteSettings
      };
      const format = getSettings[granularity]().format.split("/").pop();
      const noteDate = window.moment(filename, format, true);
      if (!noteDate.isValid()) {
        return null;
      }
      if (isFormatAmbiguous(format, granularity)) {
        if (granularity === "week") {
          const cleanFormat = removeEscapedCharacters(format);
          if (/w{1,2}/i.test(cleanFormat)) {
            return window.moment(
              filename,
              // If format contains week, remove day & month formatting
              format.replace(/M{1,4}/g, "").replace(/D{1,4}/g, ""),
              false
            );
          }
        }
      }
      return noteDate;
    }
    var DailyNotesFolderMissingError = class extends Error {
    };
    async function createDailyNote(date) {
      const app = window.app;
      const { vault } = app;
      const moment2 = window.moment;
      const { template, format, folder } = getDailyNoteSettings2();
      const [templateContents, IFoldInfo] = await getTemplateInfo2(template);
      const filename = date.format(format);
      const normalizedPath = await getNotePath(folder, filename);
      try {
        const createdFile = await vault.create(normalizedPath, templateContents.replace(/{{\s*date\s*}}/gi, filename).replace(/{{\s*time\s*}}/gi, moment2().format("HH:mm")).replace(/{{\s*title\s*}}/gi, filename).replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
          const now = moment2();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second")
          });
          if (calc) {
            currentDate.add(parseInt(timeDelta, 10), unit);
          }
          if (momentFormat) {
            return currentDate.format(momentFormat.substring(1).trim());
          }
          return currentDate.format(format);
        }).replace(/{{\s*yesterday\s*}}/gi, date.clone().subtract(1, "day").format(format)).replace(/{{\s*tomorrow\s*}}/gi, date.clone().add(1, "d").format(format)));
        app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
      } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
      }
    }
    function getDailyNote(date, dailyNotes) {
      var _a;
      return (_a = dailyNotes[getDateUID(date, "day")]) != null ? _a : null;
    }
    function getAllDailyNotes() {
      const { vault } = window.app;
      const { folder } = getDailyNoteSettings2();
      const dailyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
      if (!dailyNotesFolder) {
        throw new DailyNotesFolderMissingError("Failed to find daily notes folder");
      }
      const dailyNotes = {};
      obsidian.Vault.recurseChildren(dailyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
          const date = getDateFromFile(note, "day");
          if (date) {
            const dateString = getDateUID(date, "day");
            dailyNotes[dateString] = note;
          }
        }
      });
      return dailyNotes;
    }
    var WeeklyNotesFolderMissingError = class extends Error {
    };
    function getDaysOfWeek() {
      const { moment: moment2 } = window;
      let weekStart = moment2.localeData()._week.dow;
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ];
      while (weekStart) {
        daysOfWeek.push(daysOfWeek.shift());
        weekStart--;
      }
      return daysOfWeek;
    }
    function getDayOfWeekNumericalValue(dayOfWeekName) {
      return getDaysOfWeek().indexOf(dayOfWeekName.toLowerCase());
    }
    async function createWeeklyNote(date) {
      const { vault } = window.app;
      const { template, format, folder } = getWeeklyNoteSettings();
      const [templateContents, IFoldInfo] = await getTemplateInfo2(template);
      const filename = date.format(format);
      const normalizedPath = await getNotePath(folder, filename);
      try {
        const createdFile = await vault.create(normalizedPath, templateContents.replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
          const now = window.moment();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second")
          });
          if (calc) {
            currentDate.add(parseInt(timeDelta, 10), unit);
          }
          if (momentFormat) {
            return currentDate.format(momentFormat.substring(1).trim());
          }
          return currentDate.format(format);
        }).replace(/{{\s*title\s*}}/gi, filename).replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm")).replace(/{{\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*:(.*?)}}/gi, (_, dayOfWeek, momentFormat) => {
          const day = getDayOfWeekNumericalValue(dayOfWeek);
          return date.weekday(day).format(momentFormat.trim());
        }));
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
      } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
      }
    }
    function getWeeklyNote(date, weeklyNotes) {
      var _a;
      return (_a = weeklyNotes[getDateUID(date, "week")]) != null ? _a : null;
    }
    function getAllWeeklyNotes() {
      const weeklyNotes = {};
      if (!appHasWeeklyNotesPluginLoaded()) {
        return weeklyNotes;
      }
      const { vault } = window.app;
      const { folder } = getWeeklyNoteSettings();
      const weeklyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
      if (!weeklyNotesFolder) {
        throw new WeeklyNotesFolderMissingError("Failed to find weekly notes folder");
      }
      obsidian.Vault.recurseChildren(weeklyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
          const date = getDateFromFile(note, "week");
          if (date) {
            const dateString = getDateUID(date, "week");
            weeklyNotes[dateString] = note;
          }
        }
      });
      return weeklyNotes;
    }
    var MonthlyNotesFolderMissingError = class extends Error {
    };
    async function createMonthlyNote(date) {
      const { vault } = window.app;
      const { template, format, folder } = getMonthlyNoteSettings();
      const [templateContents, IFoldInfo] = await getTemplateInfo2(template);
      const filename = date.format(format);
      const normalizedPath = await getNotePath(folder, filename);
      try {
        const createdFile = await vault.create(normalizedPath, templateContents.replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
          const now = window.moment();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second")
          });
          if (calc) {
            currentDate.add(parseInt(timeDelta, 10), unit);
          }
          if (momentFormat) {
            return currentDate.format(momentFormat.substring(1).trim());
          }
          return currentDate.format(format);
        }).replace(/{{\s*date\s*}}/gi, filename).replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm")).replace(/{{\s*title\s*}}/gi, filename));
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
      } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
      }
    }
    function getMonthlyNote(date, monthlyNotes) {
      var _a;
      return (_a = monthlyNotes[getDateUID(date, "month")]) != null ? _a : null;
    }
    function getAllMonthlyNotes() {
      const monthlyNotes = {};
      if (!appHasMonthlyNotesPluginLoaded()) {
        return monthlyNotes;
      }
      const { vault } = window.app;
      const { folder } = getMonthlyNoteSettings();
      const monthlyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
      if (!monthlyNotesFolder) {
        throw new MonthlyNotesFolderMissingError("Failed to find monthly notes folder");
      }
      obsidian.Vault.recurseChildren(monthlyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
          const date = getDateFromFile(note, "month");
          if (date) {
            const dateString = getDateUID(date, "month");
            monthlyNotes[dateString] = note;
          }
        }
      });
      return monthlyNotes;
    }
    var QuarterlyNotesFolderMissingError = class extends Error {
    };
    async function createQuarterlyNote(date) {
      const { vault } = window.app;
      const { template, format, folder } = getQuarterlyNoteSettings();
      const [templateContents, IFoldInfo] = await getTemplateInfo2(template);
      const filename = date.format(format);
      const normalizedPath = await getNotePath(folder, filename);
      try {
        const createdFile = await vault.create(normalizedPath, templateContents.replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
          const now = window.moment();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second")
          });
          if (calc) {
            currentDate.add(parseInt(timeDelta, 10), unit);
          }
          if (momentFormat) {
            return currentDate.format(momentFormat.substring(1).trim());
          }
          return currentDate.format(format);
        }).replace(/{{\s*date\s*}}/gi, filename).replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm")).replace(/{{\s*title\s*}}/gi, filename));
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
      } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
      }
    }
    function getQuarterlyNote(date, quarterly) {
      var _a;
      return (_a = quarterly[getDateUID(date, "quarter")]) != null ? _a : null;
    }
    function getAllQuarterlyNotes() {
      const quarterly = {};
      if (!appHasQuarterlyNotesPluginLoaded()) {
        return quarterly;
      }
      const { vault } = window.app;
      const { folder } = getQuarterlyNoteSettings();
      const quarterlyFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
      if (!quarterlyFolder) {
        throw new QuarterlyNotesFolderMissingError("Failed to find quarterly notes folder");
      }
      obsidian.Vault.recurseChildren(quarterlyFolder, (note) => {
        if (note instanceof obsidian.TFile) {
          const date = getDateFromFile(note, "quarter");
          if (date) {
            const dateString = getDateUID(date, "quarter");
            quarterly[dateString] = note;
          }
        }
      });
      return quarterly;
    }
    var YearlyNotesFolderMissingError = class extends Error {
    };
    async function createYearlyNote(date) {
      const { vault } = window.app;
      const { template, format, folder } = getYearlyNoteSettings();
      const [templateContents, IFoldInfo] = await getTemplateInfo2(template);
      const filename = date.format(format);
      const normalizedPath = await getNotePath(folder, filename);
      try {
        const createdFile = await vault.create(normalizedPath, templateContents.replace(/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi, (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
          const now = window.moment();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second")
          });
          if (calc) {
            currentDate.add(parseInt(timeDelta, 10), unit);
          }
          if (momentFormat) {
            return currentDate.format(momentFormat.substring(1).trim());
          }
          return currentDate.format(format);
        }).replace(/{{\s*date\s*}}/gi, filename).replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm")).replace(/{{\s*title\s*}}/gi, filename));
        window.app.foldManager.save(createdFile, IFoldInfo);
        return createdFile;
      } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
      }
    }
    function getYearlyNote(date, yearlyNotes) {
      var _a;
      return (_a = yearlyNotes[getDateUID(date, "year")]) != null ? _a : null;
    }
    function getAllYearlyNotes() {
      const yearlyNotes = {};
      if (!appHasYearlyNotesPluginLoaded()) {
        return yearlyNotes;
      }
      const { vault } = window.app;
      const { folder } = getYearlyNoteSettings();
      const yearlyNotesFolder = vault.getAbstractFileByPath(obsidian.normalizePath(folder));
      if (!yearlyNotesFolder) {
        throw new YearlyNotesFolderMissingError("Failed to find yearly notes folder");
      }
      obsidian.Vault.recurseChildren(yearlyNotesFolder, (note) => {
        if (note instanceof obsidian.TFile) {
          const date = getDateFromFile(note, "year");
          if (date) {
            const dateString = getDateUID(date, "year");
            yearlyNotes[dateString] = note;
          }
        }
      });
      return yearlyNotes;
    }
    function appHasDailyNotesPluginLoaded() {
      var _a, _b;
      const { app } = window;
      const dailyNotesPlugin = app.internalPlugins.plugins["daily-notes"];
      if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
        return true;
      }
      const periodicNotes = app.plugins.getPlugin("periodic-notes");
      return periodicNotes && ((_b = (_a = periodicNotes.settings) == null ? void 0 : _a.daily) == null ? void 0 : _b.enabled);
    }
    function appHasWeeklyNotesPluginLoaded() {
      var _a, _b;
      const { app } = window;
      if (app.plugins.getPlugin("calendar")) {
        return true;
      }
      const periodicNotes = app.plugins.getPlugin("periodic-notes");
      return periodicNotes && ((_b = (_a = periodicNotes.settings) == null ? void 0 : _a.weekly) == null ? void 0 : _b.enabled);
    }
    function appHasMonthlyNotesPluginLoaded() {
      var _a, _b;
      const { app } = window;
      const periodicNotes = app.plugins.getPlugin("periodic-notes");
      return periodicNotes && ((_b = (_a = periodicNotes.settings) == null ? void 0 : _a.monthly) == null ? void 0 : _b.enabled);
    }
    function appHasQuarterlyNotesPluginLoaded() {
      var _a, _b;
      const { app } = window;
      const periodicNotes = app.plugins.getPlugin("periodic-notes");
      return periodicNotes && ((_b = (_a = periodicNotes.settings) == null ? void 0 : _a.quarterly) == null ? void 0 : _b.enabled);
    }
    function appHasYearlyNotesPluginLoaded() {
      var _a, _b;
      const { app } = window;
      const periodicNotes = app.plugins.getPlugin("periodic-notes");
      return periodicNotes && ((_b = (_a = periodicNotes.settings) == null ? void 0 : _a.yearly) == null ? void 0 : _b.enabled);
    }
    function getPeriodicNoteSettings(granularity) {
      const getSettings = {
        day: getDailyNoteSettings2,
        week: getWeeklyNoteSettings,
        month: getMonthlyNoteSettings,
        quarter: getQuarterlyNoteSettings,
        year: getYearlyNoteSettings
      }[granularity];
      return getSettings();
    }
    function createPeriodicNote(granularity, date) {
      const createFn = {
        day: createDailyNote,
        month: createMonthlyNote,
        week: createWeeklyNote
      };
      return createFn[granularity](date);
    }
    exports.DEFAULT_DAILY_NOTE_FORMAT = DEFAULT_DAILY_NOTE_FORMAT;
    exports.DEFAULT_MONTHLY_NOTE_FORMAT = DEFAULT_MONTHLY_NOTE_FORMAT;
    exports.DEFAULT_QUARTERLY_NOTE_FORMAT = DEFAULT_QUARTERLY_NOTE_FORMAT;
    exports.DEFAULT_WEEKLY_NOTE_FORMAT = DEFAULT_WEEKLY_NOTE_FORMAT;
    exports.DEFAULT_YEARLY_NOTE_FORMAT = DEFAULT_YEARLY_NOTE_FORMAT;
    exports.appHasDailyNotesPluginLoaded = appHasDailyNotesPluginLoaded;
    exports.appHasMonthlyNotesPluginLoaded = appHasMonthlyNotesPluginLoaded;
    exports.appHasQuarterlyNotesPluginLoaded = appHasQuarterlyNotesPluginLoaded;
    exports.appHasWeeklyNotesPluginLoaded = appHasWeeklyNotesPluginLoaded;
    exports.appHasYearlyNotesPluginLoaded = appHasYearlyNotesPluginLoaded;
    exports.createDailyNote = createDailyNote;
    exports.createMonthlyNote = createMonthlyNote;
    exports.createPeriodicNote = createPeriodicNote;
    exports.createQuarterlyNote = createQuarterlyNote;
    exports.createWeeklyNote = createWeeklyNote;
    exports.createYearlyNote = createYearlyNote;
    exports.getAllDailyNotes = getAllDailyNotes;
    exports.getAllMonthlyNotes = getAllMonthlyNotes;
    exports.getAllQuarterlyNotes = getAllQuarterlyNotes;
    exports.getAllWeeklyNotes = getAllWeeklyNotes;
    exports.getAllYearlyNotes = getAllYearlyNotes;
    exports.getDailyNote = getDailyNote;
    exports.getDailyNoteSettings = getDailyNoteSettings2;
    exports.getDateFromFile = getDateFromFile;
    exports.getDateFromPath = getDateFromPath;
    exports.getDateUID = getDateUID;
    exports.getMonthlyNote = getMonthlyNote;
    exports.getMonthlyNoteSettings = getMonthlyNoteSettings;
    exports.getPeriodicNoteSettings = getPeriodicNoteSettings;
    exports.getQuarterlyNote = getQuarterlyNote;
    exports.getQuarterlyNoteSettings = getQuarterlyNoteSettings;
    exports.getTemplateInfo = getTemplateInfo2;
    exports.getWeeklyNote = getWeeklyNote;
    exports.getWeeklyNoteSettings = getWeeklyNoteSettings;
    exports.getYearlyNote = getYearlyNote;
    exports.getYearlyNoteSettings = getYearlyNoteSettings;
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WrotPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/constants.ts
var VIEW_TYPE_WROT = "wrot-view";

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  viewPlacement: "right",
  headerDateFormat: "YYYY\u5E74MM\u6708DD\u65E5",
  timestampFormat: "YYYY/MM/DD HH:mm:ss",
  bgColorLight: "#f8f8f8",
  bgColorDark: "#303030",
  textColorLight: "#454545",
  textColorDark: "#dcddde",
  submitLabel: "\u6295\u7A3F",
  submitIcon: "send",
  inputPlaceholder: "\u3042\u306A\u305F\u304C\u66F8\u304F\u306E\u3092\u5F85\u3063\u3066\u3044\u307E\u3059...",
  enableOgpFetch: true,
  checkStrikethrough: false,
  tagColorRulesEnabled: false,
  tagColorRules: [],
  followObsidianFontSize: false,
  pins: [],
  pinLimit: 3
};
var SETTINGS_NARROW_THRESHOLD_PX = 600;
var WrotSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.narrowObserver = null;
    // メモリ上のみ。設定タブを開き直すたびに全ルールがロック状態に戻る
    this.unlockedRules = /* @__PURE__ */ new Set();
    // display()内部からの再構築でロック状態を保持したい場合にtrueにする
    this.skipLockReset = false;
    this.plugin = plugin;
  }
  hide() {
    if (this.narrowObserver) {
      this.narrowObserver.disconnect();
      this.narrowObserver = null;
    }
    super.hide();
  }
  // Obsidianのバージョン/プラットフォーム差を吸収するためスクロール対象候補を網羅的に収集する
  collectScrollCandidates() {
    const list = [];
    if (this.containerEl.scrollHeight > this.containerEl.clientHeight) {
      list.push(this.containerEl);
    }
    let el2 = this.containerEl.parentElement;
    while (el2) {
      const style = getComputedStyle(el2);
      const overflowY = style.overflowY;
      const scrolls = (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && el2.scrollHeight > el2.clientHeight;
      if (scrolls || el2.scrollTop > 0) {
        list.push(el2);
      }
      el2 = el2.parentElement;
      if (!el2 || el2 === document.body || el2 === document.documentElement) break;
    }
    return list;
  }
  // 設定タブのスクロール位置を保ったまま `work` を実行する
  withScrollPreserved(work) {
    const before = this.collectScrollCandidates().map((el2) => ({ el: el2, top: el2.scrollTop }));
    work();
    const restore = () => {
      for (const { el: el2, top } of before) {
        if (el2.scrollTop !== top) el2.scrollTop = top;
      }
    };
    restore();
    requestAnimationFrame(restore);
    setTimeout(restore, 0);
    setTimeout(restore, 50);
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("wr-settings");
    if (this.skipLockReset) {
      this.skipLockReset = false;
    } else {
      this.unlockedRules.clear();
    }
    if (this.narrowObserver) {
      this.narrowObserver.disconnect();
      this.narrowObserver = null;
    }
    const updateNarrow = () => {
      const narrow = containerEl.clientWidth > 0 && containerEl.clientWidth < SETTINGS_NARROW_THRESHOLD_PX;
      containerEl.toggleClass("wr-settings-narrow", narrow);
    };
    requestAnimationFrame(updateNarrow);
    if (typeof ResizeObserver !== "undefined") {
      this.narrowObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateNarrow);
      });
      this.narrowObserver.observe(containerEl);
    }
    new import_obsidian.Setting(containerEl).setName("\u57FA\u672C\u8A2D\u5B9A").setHeading();
    new import_obsidian.Setting(containerEl).setName("\u8868\u793A\u4F4D\u7F6E").setDesc("Wrot\u30D1\u30CD\u30EB\u306E\u8868\u793A\u4F4D\u7F6E\u3092\u9078\u3073\u307E\u3059\u3002").addDropdown(
      (dropdown) => dropdown.addOption("left", "\u5DE6\u30B5\u30A4\u30C9\u30D0\u30FC").addOption("right", "\u53F3\u30B5\u30A4\u30C9\u30D0\u30FC").addOption("main", "\u30E1\u30A4\u30F3\u30A8\u30EA\u30A2").setValue(this.plugin.settings.viewPlacement).onChange(async (value) => {
        this.plugin.settings.viewPlacement = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Obsidian\u306E\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA\u306B\u8FFD\u5F93").setDesc("Obsidian\u306E\u5916\u89B3\u8A2D\u5B9A\u306BWrot\u306E\u6587\u5B57\u30B5\u30A4\u30BA\u3092\u5408\u308F\u305B\u307E\u3059\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.followObsidianFontSize).onChange(async (value) => {
        this.plugin.settings.followObsidianFontSize = value;
        await this.plugin.saveSettings();
        this.plugin.applyFontFollow();
      })
    );
    let headerDateText;
    new import_obsidian.Setting(containerEl).setName("\u30D8\u30C3\u30C0\u30FC\u65E5\u4ED8\u8868\u793A\u5F62\u5F0F").setDesc("\u65E5\u4ED8\u30CA\u30D3\u306B\u8868\u793A\u3059\u308B\u65E5\u4ED8\u306E\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3092\u6307\u5B9A\u3057\u307E\u3059\u3002\uFF08YYYY, MM, DD \u306A\u3069\u304C\u4F7F\u3048\u307E\u3059\uFF09\u7A7A\u6B04\u3067\u521D\u671F\u5024\u306B\u623B\u308A\u307E\u3059\u3002").addText((text) => {
      headerDateText = text;
      text.setPlaceholder(DEFAULT_SETTINGS.headerDateFormat).setValue(this.plugin.settings.headerDateFormat).onChange(async (value) => {
        this.plugin.settings.headerDateFormat = value || DEFAULT_SETTINGS.headerDateFormat;
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.headerDateFormat = DEFAULT_SETTINGS.headerDateFormat;
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
        headerDateText.setValue(DEFAULT_SETTINGS.headerDateFormat);
      })
    );
    let tsText;
    new import_obsidian.Setting(containerEl).setName("\u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7\u8868\u793A\u5F62\u5F0F").setDesc("\u6295\u7A3F\u306E\u65E5\u6642\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3092\u6307\u5B9A\u3057\u307E\u3059\u3002\uFF08YYYY, MM, DD, HH, mm, ss \u304C\u4F7F\u3048\u307E\u3059\uFF09").addText((text) => {
      tsText = text;
      text.setPlaceholder("YYYY/MM/DD HH:mm:ss").setValue(this.plugin.settings.timestampFormat).onChange(async (value) => {
        this.plugin.settings.timestampFormat = value || DEFAULT_SETTINGS.timestampFormat;
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.timestampFormat = DEFAULT_SETTINGS.timestampFormat;
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
        tsText.setValue(DEFAULT_SETTINGS.timestampFormat);
      })
    );
    let lightPicker;
    new import_obsidian.Setting(containerEl).setName("\u80CC\u666F\u8272\uFF08\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9\uFF09").setDesc("\u30E9\u30A4\u30C8\u30C6\u30FC\u30DE\u3067\u306E\u6295\u7A3F\u30FB\u6295\u7A3F\u30D5\u30A9\u30FC\u30E0\u306E\u80CC\u666F\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
      lightPicker = picker;
      picker.setValue(this.plugin.settings.bgColorLight).onChange(async (value) => {
        this.plugin.settings.bgColorLight = value;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.bgColorLight = DEFAULT_SETTINGS.bgColorLight;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
        lightPicker.setValue(DEFAULT_SETTINGS.bgColorLight);
      })
    );
    let textLightPicker;
    new import_obsidian.Setting(containerEl).setName("\u6587\u5B57\u8272\uFF08\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9\uFF09").setDesc("\u30E9\u30A4\u30C8\u30C6\u30FC\u30DE\u3067\u306E\u30C6\u30AD\u30B9\u30C8\u30FB\u30A2\u30A4\u30B3\u30F3\u306E\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
      textLightPicker = picker;
      picker.setValue(this.plugin.settings.textColorLight).onChange(async (value) => {
        this.plugin.settings.textColorLight = value;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.textColorLight = DEFAULT_SETTINGS.textColorLight;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
        textLightPicker.setValue(DEFAULT_SETTINGS.textColorLight);
      })
    );
    let darkPicker;
    new import_obsidian.Setting(containerEl).setName("\u80CC\u666F\u8272\uFF08\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9\uFF09").setDesc("\u30C0\u30FC\u30AF\u30C6\u30FC\u30DE\u3067\u306E\u6295\u7A3F\u30FB\u6295\u7A3F\u30D5\u30A9\u30FC\u30E0\u306E\u80CC\u666F\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
      darkPicker = picker;
      picker.setValue(this.plugin.settings.bgColorDark).onChange(async (value) => {
        this.plugin.settings.bgColorDark = value;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.bgColorDark = DEFAULT_SETTINGS.bgColorDark;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
        darkPicker.setValue(DEFAULT_SETTINGS.bgColorDark);
      })
    );
    let textDarkPicker;
    new import_obsidian.Setting(containerEl).setName("\u6587\u5B57\u8272\uFF08\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9\uFF09").setDesc("\u30C0\u30FC\u30AF\u30C6\u30FC\u30DE\u3067\u306E\u30C6\u30AD\u30B9\u30C8\u30FB\u30A2\u30A4\u30B3\u30F3\u306E\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
      textDarkPicker = picker;
      picker.setValue(this.plugin.settings.textColorDark).onChange(async (value) => {
        this.plugin.settings.textColorDark = value;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.textColorDark = DEFAULT_SETTINGS.textColorDark;
        await this.plugin.saveSettings();
        this.plugin.applyBgColor();
        textDarkPicker.setValue(DEFAULT_SETTINGS.textColorDark);
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u8868\u793A\u8A2D\u5B9A").setHeading();
    let submitText;
    new import_obsidian.Setting(containerEl).setName("\u6295\u7A3F\u30DC\u30BF\u30F3\u306E\u30C6\u30AD\u30B9\u30C8").setDesc("\u6295\u7A3F\u30DC\u30BF\u30F3\u306B\u8868\u793A\u3059\u308B\u30C6\u30AD\u30B9\u30C8\u3092\u5909\u66F4\u3067\u304D\u307E\u3059\u3002").addText((text) => {
      submitText = text;
      text.setPlaceholder("\u6295\u7A3F").setValue(this.plugin.settings.submitLabel).onChange(async (value) => {
        this.plugin.settings.submitLabel = value || DEFAULT_SETTINGS.submitLabel;
        await this.plugin.saveSettings();
        this.plugin.updateSubmitLabel();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.submitLabel = DEFAULT_SETTINGS.submitLabel;
        await this.plugin.saveSettings();
        submitText.setValue(DEFAULT_SETTINGS.submitLabel);
        this.plugin.updateSubmitLabel();
      })
    );
    let iconText;
    const iconSetting = new import_obsidian.Setting(containerEl).setName("\u6295\u7A3F\u30DC\u30BF\u30F3\u306E\u30A2\u30A4\u30B3\u30F3");
    const descEl = iconSetting.descEl;
    descEl.appendText("\u6295\u7A3F\u30DC\u30BF\u30F3\u306E\u30A2\u30A4\u30B3\u30F3\u3092\u5909\u66F4\u3067\u304D\u307E\u3059\u3002\u30A2\u30A4\u30B3\u30F3\u540D\u306F ");
    const link = descEl.createEl("a", { text: "\u3053\u3061\u3089", href: "https://lucide.dev/icons/" });
    link.setAttr("target", "_blank");
    descEl.appendText(" \u304B\u3089\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u7A7A\u6B04\u306B\u3059\u308B\u3068\u30A2\u30A4\u30B3\u30F3\u3092\u975E\u8868\u793A\u306B\u3067\u304D\u307E\u3059\u3002");
    iconSetting.addText((text) => {
      iconText = text;
      text.setPlaceholder("send").setValue(this.plugin.settings.submitIcon).onChange(async (value) => {
        this.plugin.settings.submitIcon = value.trim();
        await this.plugin.saveSettings();
        this.plugin.updateSubmitIcon();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.submitIcon = DEFAULT_SETTINGS.submitIcon;
        await this.plugin.saveSettings();
        iconText.setValue(DEFAULT_SETTINGS.submitIcon);
        this.plugin.updateSubmitIcon();
      })
    );
    let placeholderText;
    new import_obsidian.Setting(containerEl).setName("\u6295\u7A3F\u30D5\u30A9\u30FC\u30E0\u306E\u7A7A\u6B04\u30E1\u30C3\u30BB\u30FC\u30B8").setDesc("\u6295\u7A3F\u30D5\u30A9\u30FC\u30E0\u304C\u7A7A\u306E\u6642\u306B\u8868\u793A\u3055\u308C\u308B\u30C6\u30AD\u30B9\u30C8\u3092\u5909\u66F4\u3067\u304D\u307E\u3059\u3002\u7A7A\u6B04\u306B\u3059\u308B\u3068\u975E\u8868\u793A\u306B\u306A\u308A\u307E\u3059\u3002").addText((text) => {
      placeholderText = text;
      text.setPlaceholder(DEFAULT_SETTINGS.inputPlaceholder).setValue(this.plugin.settings.inputPlaceholder).onChange(async (value) => {
        this.plugin.settings.inputPlaceholder = value;
        await this.plugin.saveSettings();
        this.plugin.updateInputPlaceholder();
      });
    }).addExtraButton(
      (btn) => btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
        this.plugin.settings.inputPlaceholder = DEFAULT_SETTINGS.inputPlaceholder;
        await this.plugin.saveSettings();
        placeholderText.setValue(DEFAULT_SETTINGS.inputPlaceholder);
        this.plugin.updateInputPlaceholder();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u30D4\u30F3\u7559\u3081\u306E\u4E0A\u9650").setDesc("\u30BF\u30A4\u30E0\u30E9\u30A4\u30F3\u306B\u56FA\u5B9A\u3067\u304D\u308B\u30E1\u30E2\u306E\u6700\u5927\u4EF6\u6570\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002").addDropdown(
      (dropdown) => dropdown.addOption("1", "1 \u4EF6").addOption("3", "3 \u4EF6").addOption("5", "5 \u4EF6").setValue(String(this.plugin.settings.pinLimit)).onChange(async (value) => {
        const limit = Number(value);
        this.plugin.settings.pinLimit = limit;
        if (this.plugin.settings.pins.length > limit) {
          this.plugin.settings.pins = this.plugin.settings.pins.slice(0, limit);
        }
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
      })
    );
    new import_obsidian.Setting(containerEl).setName("URL\u30D7\u30EC\u30D3\u30E5\u30FC").setDesc("\u30E1\u30E2\u5185\u306EURL\u304B\u3089OGP\u60C5\u5831\u3092\u81EA\u52D5\u53D6\u5F97\u3057\u3066\u8868\u793A\u3057\u307E\u3059\u3002\u30AA\u30D5\u306B\u3059\u308B\u3068\u5916\u90E8\u901A\u4FE1\u3092\u884C\u3044\u307E\u305B\u3093\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableOgpFetch).onChange(async (value) => {
        this.plugin.settings.enableOgpFetch = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u30C1\u30A7\u30C3\u30AF\u6E08\u307F\u306E\u53D6\u308A\u6D88\u3057\u7DDA").setDesc("\u30C1\u30A7\u30C3\u30AF\u30DC\u30C3\u30AF\u30B9\u304CON\u306E\u9805\u76EE\u306B\u53D6\u308A\u6D88\u3057\u7DDA\u3092\u8868\u793A\u3057\u307E\u3059\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.checkStrikethrough).onChange(async (value) => {
        this.plugin.settings.checkStrikethrough = value;
        await this.plugin.saveSettings();
        this.plugin.refreshViews();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u30BF\u30B0\u5225\u306B\u8272\u3092\u5909\u3048\u308B").setDesc(
      "\u6307\u5B9A\u30BF\u30B0\u3092\u542B\u3080\u6295\u7A3F\u306E\u80CC\u666F\u8272\u3068\u6587\u5B57\u8272\u3092\u5909\u66F4\u3057\u307E\u3059\u3002\u8907\u6570\u30EB\u30FC\u30EB\u306B\u8A72\u5F53\u3059\u308B\u5834\u5408\u306F\u672C\u6587\u3067\u5148\u306B\u51FA\u305F\u30BF\u30B0\u304C\u512A\u5148\u3055\u308C\u307E\u3059\u3002"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.tagColorRulesEnabled).onChange(async (v) => {
        this.plugin.settings.tagColorRulesEnabled = v;
        await this.plugin.saveSettings();
        this.plugin.applyTagColorRules();
        this.plugin.refreshAllWrDecorations();
        const rules = this.plugin.settings.tagColorRules;
        const noMeaningfulRule = rules.length === 0 || rules.length === 1 && rules[0].tag.trim() === "";
        if (v && noMeaningfulRule) {
          this.unlockedRules.add(0);
        }
        this.skipLockReset = true;
        this.withScrollPreserved(() => this.display());
      })
    );
    const rulesContainer = containerEl.createDiv({ cls: "wr-tag-rules-container" });
    const addBtnContainer = containerEl.createDiv();
    const renderRulesInner = () => {
      rulesContainer.empty();
      addBtnContainer.empty();
      if (!this.plugin.settings.tagColorRulesEnabled) return;
      const isDarkTheme = () => document.body.classList.contains("theme-dark");
      const getDefaultBg = () => isDarkTheme() ? this.plugin.settings.bgColorDark : this.plugin.settings.bgColorLight;
      const getDefaultText = () => isDarkTheme() ? this.plugin.settings.textColorDark : this.plugin.settings.textColorLight;
      const isLightDefaultBg = (v) => v === DEFAULT_SETTINGS.bgColorLight;
      const isLightDefaultText = (v) => v === DEFAULT_SETTINGS.textColorLight;
      const resolveRuleBg = (v) => /^#[0-9a-fA-F]{6}$/.test(v) && !(isDarkTheme() && isLightDefaultBg(v)) ? v : getDefaultBg();
      const resolveRuleText = (v) => /^#[0-9a-fA-F]{6}$/.test(v) && !(isDarkTheme() && isLightDefaultText(v)) ? v : getDefaultText();
      const getDefaultAccent = () => {
        const raw = getComputedStyle(document.body).getPropertyValue("--text-accent").trim();
        if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
        const probe = document.createElement("div");
        probe.style.color = raw || "var(--text-accent)";
        probe.style.display = "none";
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        document.body.removeChild(probe);
        const m = resolved.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const toHex = (n) => parseInt(n, 10).toString(16).padStart(2, "0");
          return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
        }
        return getDefaultText();
      };
      const getDefaultSub = (rule) => {
        const fg = resolveRuleText(rule.textColor);
        const bg = resolveRuleBg(rule.bgColor);
        return this.plugin.blendColor(fg, bg, 0.45);
      };
      const buildRuleGroup = (isFirst, ruleNumber, ruleKey, initial, onTagChange, onBgChange, onFgChange, onAccentChange, onSubChange, onScopeChange, trailing) => {
        if (!isFirst) {
          rulesContainer.createEl("hr", { cls: "wr-tag-rule-separator" });
        }
        const groupEl = rulesContainer.createDiv({ cls: "wr-tag-rule-group" });
        const isUnlocked = () => this.unlockedRules.has(ruleKey);
        const labelSetting = new import_obsidian.Setting(groupEl).setName(`\u30EB\u30FC\u30EB ${ruleNumber}`).setClass("wr-tag-rule-label-setting");
        let lockBtnEl = null;
        labelSetting.addExtraButton((btn) => {
          lockBtnEl = btn.extraSettingsEl;
          btn.setIcon(isUnlocked() ? "lock-keyhole-open" : "lock-keyhole").setTooltip(isUnlocked() ? "\u30ED\u30C3\u30AF\u3059\u308B" : "\u7DE8\u96C6\u3059\u308B\u306B\u306F\u30ED\u30C3\u30AF\u3092\u89E3\u9664").onClick(() => {
            if (isUnlocked()) {
              this.unlockedRules.delete(ruleKey);
            } else {
              this.unlockedRules.add(ruleKey);
            }
            applyLockState();
          });
        });
        let trailingBtnEl = null;
        if (trailing) {
          labelSetting.addExtraButton((btn) => {
            trailingBtnEl = btn.extraSettingsEl;
            btn.setIcon(trailing.kind === "delete" ? "trash-2" : "reset").setTooltip(trailing.kind === "delete" ? "\u3053\u306E\u30EB\u30FC\u30EB\u3092\u524A\u9664" : "\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
              if (!isUnlocked()) return;
              await trailing.handler();
            });
          });
        }
        let tagInputEl = null;
        new import_obsidian.Setting(groupEl).setName("\u30BF\u30B0").setDesc("\u8272\u3092\u5909\u3048\u305F\u3044\u30BF\u30B0\u540D\u3092\u5165\u529B\u3057\u307E\u3059\u3002\uFF08# \u306F\u7701\u7565\u3067\u304D\u307E\u3059\uFF09").addText((text) => {
          tagInputEl = text.inputEl;
          text.setPlaceholder("\u30BF\u30B0\u540D").setValue(initial.tag).onChange(async (v) => {
            await onTagChange(v.replace(/^#/, "").trim());
          });
        });
        let bgPickerEl = null;
        new import_obsidian.Setting(groupEl).setName("\u80CC\u666F\u8272").setDesc("\u3053\u306E\u30BF\u30B0\u3092\u542B\u3080\u6295\u7A3F\u306E\u80CC\u666F\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
          bgPickerEl = picker.colorPickerEl;
          picker.setValue(resolveRuleBg(initial.bgColor)).onChange(async (v) => {
            await onBgChange(v);
          });
        });
        let fgPickerEl = null;
        new import_obsidian.Setting(groupEl).setName("\u6587\u5B57\u8272").setDesc("\u3053\u306E\u30BF\u30B0\u3092\u542B\u3080\u6295\u7A3F\u306E\u672C\u6587\u6587\u5B57\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002\uFF08\u30BF\u30B0\u30FB\u30EA\u30F3\u30AF\u30FBURL\u306F\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC\u5074\u3067\u8A2D\u5B9A\u3057\u307E\u3059\uFF09").setClass("wr-reverse-controls").addColorPicker((picker) => {
          fgPickerEl = picker.colorPickerEl;
          picker.setValue(resolveRuleText(initial.textColor)).onChange(async (v) => {
            await onFgChange(v);
          });
        });
        let accentPicker;
        let accentPickerEl = null;
        let accentResetBtnEl = null;
        new import_obsidian.Setting(groupEl).setName("\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC").setDesc("\u30BF\u30B0\u30FB\u30EA\u30F3\u30AF\u30FBURL\u30FB\u30B3\u30D4\u30FC\u5B8C\u4E86\u30A2\u30A4\u30B3\u30F3\u306A\u3069\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC\u304C\u4F7F\u308F\u308C\u308B\u8981\u7D20\u306E\u8272\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002\u672A\u8A2D\u5B9A\u6642\u306F\u30C6\u30FC\u30DE\u306E\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC\u3092\u4F7F\u3044\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
          accentPicker = picker;
          accentPickerEl = picker.colorPickerEl;
          const initialAccent = initial.accentColor && /^#[0-9a-fA-F]{6}$/.test(initial.accentColor) ? initial.accentColor : getDefaultAccent();
          picker.setValue(initialAccent).onChange(async (v) => {
            await onAccentChange(v);
          });
        }).addExtraButton((btn) => {
          accentResetBtnEl = btn.extraSettingsEl;
          btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
            if (!isUnlocked()) return;
            await onAccentChange(void 0);
            accentPicker.setValue(getDefaultAccent());
          });
        });
        let subPicker;
        let subPickerEl = null;
        let subResetBtnEl = null;
        let suppressSubChange = false;
        new import_obsidian.Setting(groupEl).setName("\u30B5\u30D6\u30AB\u30E9\u30FC").setDesc("\u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u30EA\u30B9\u30C8\u30DE\u30FC\u30AB\u30FC\u30FB\u5F15\u7528\u7DDA\u30FB\u30C1\u30A7\u30C3\u30AF\u30DC\u30C3\u30AF\u30B9\u306A\u3069\u30B5\u30D6\u8981\u7D20\u306E\u8272\u3092\u307E\u3068\u3081\u3066\u8A2D\u5B9A\u3057\u307E\u3059\u3002\u672A\u8A2D\u5B9A\u6642\u306F\u80CC\u666F\u8272\u3068\u6587\u5B57\u8272\u304B\u3089\u81EA\u52D5\u7B97\u51FA\u3057\u307E\u3059\u3002").setClass("wr-reverse-controls").addColorPicker((picker) => {
          subPicker = picker;
          subPickerEl = picker.colorPickerEl;
          const initialSub = initial.subColor && /^#[0-9a-fA-F]{6}$/.test(initial.subColor) ? initial.subColor : getDefaultSub(initial);
          picker.setValue(initialSub).onChange(async (v) => {
            if (suppressSubChange) return;
            await onSubChange(v);
            renderScope();
            applyLockState();
          });
        }).addExtraButton((btn) => {
          subResetBtnEl = btn.extraSettingsEl;
          btn.setIcon("reset").setTooltip("\u521D\u671F\u5024\u306B\u623B\u3059").onClick(async () => {
            if (!isUnlocked()) return;
            await onSubChange(void 0);
            suppressSubChange = true;
            subPicker.setValue(getDefaultSub(initial));
            suppressSubChange = false;
            renderScope();
            applyLockState();
          });
        });
        const scopeContainer = groupEl.createDiv({ cls: "wr-sub-color-scope" });
        const scopeToggleEls = [];
        const isSubCustomized = () => !!initial.subColor && /^#[0-9a-fA-F]{6}$/.test(initial.subColor);
        const renderScope = () => {
          scopeContainer.empty();
          scopeToggleEls.length = 0;
          if (!isSubCustomized()) return;
          const isOn = (key) => {
            const s = initial.subColorScope;
            if (!s) return true;
            return s[key] !== false;
          };
          const groups = [
            ["buttons", "\u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7\u30FB\u30E1\u30CB\u30E5\u30FC\u30FB\u30D4\u30F3\u306B\u30B5\u30D6\u30AB\u30E9\u30FC\u3092\u9069\u7528", "\u30AA\u30D5\u306E\u3068\u304D\u306F\u81EA\u52D5\u8A2D\u5B9A\u3055\u308C\u305F\u8272\u306B\u306A\u308A\u307E\u3059\u3002"],
            ["quote", "\u5F15\u7528\u306B\u30B5\u30D6\u30AB\u30E9\u30FC\u3092\u9069\u7528", "\u30AA\u30D5\u306E\u3068\u304D\u306F\u81EA\u52D5\u8A2D\u5B9A\u3055\u308C\u305F\u8272\u306B\u306A\u308A\u307E\u3059\u3002"],
            ["list", "\u30EA\u30B9\u30C8\u30FB\u30C1\u30A7\u30C3\u30AF\u30DC\u30C3\u30AF\u30B9\u306B\u30B5\u30D6\u30AB\u30E9\u30FC\u3092\u9069\u7528", "\u30AA\u30D5\u306E\u3068\u304D\u306F\u81EA\u52D5\u8A2D\u5B9A\u3055\u308C\u305F\u8272\u306B\u306A\u308A\u307E\u3059\u3002"],
            ["ogp", "OGP\u30AB\u30FC\u30C9\u306B\u30B5\u30D6\u30AB\u30E9\u30FC\u3092\u9069\u7528", "\u30AA\u30D5\u306E\u3068\u304D\u306F\u81EA\u52D5\u8A2D\u5B9A\u3055\u308C\u305F\u8272\u306B\u306A\u308A\u307E\u3059\u3002"]
          ];
          for (const [key, name, desc] of groups) {
            new import_obsidian.Setting(scopeContainer).setName(name).setDesc(desc).addToggle((tg) => {
              scopeToggleEls.push(tg.toggleEl);
              tg.setValue(isOn(key)).onChange(async (v) => {
                await onScopeChange(key, v);
              });
            });
          }
        };
        const setDisabled = (el2, disabled) => {
          if (!el2) return;
          if (disabled) {
            el2.setAttr("disabled", "true");
            el2.setAttr("aria-disabled", "true");
            el2.addClass("wr-tag-rule-disabled");
          } else {
            el2.removeAttribute("disabled");
            el2.removeAttribute("aria-disabled");
            el2.removeClass("wr-tag-rule-disabled");
          }
        };
        const applyLockState = () => {
          const unlocked = isUnlocked();
          groupEl.toggleClass("wr-tag-rule-locked", !unlocked);
          setDisabled(tagInputEl, !unlocked);
          setDisabled(bgPickerEl, !unlocked);
          setDisabled(fgPickerEl, !unlocked);
          setDisabled(accentPickerEl, !unlocked);
          setDisabled(accentResetBtnEl, !unlocked);
          setDisabled(subPickerEl, !unlocked);
          setDisabled(subResetBtnEl, !unlocked);
          setDisabled(trailingBtnEl, !unlocked);
          for (const el2 of scopeToggleEls) setDisabled(el2, !unlocked);
          if (lockBtnEl) {
            (0, import_obsidian.setIcon)(lockBtnEl, unlocked ? "lock-keyhole-open" : "lock-keyhole");
            lockBtnEl.setAttr(
              "aria-label",
              unlocked ? "\u30ED\u30C3\u30AF\u3059\u308B" : "\u7DE8\u96C6\u3059\u308B\u306B\u306F\u30ED\u30C3\u30AF\u3092\u89E3\u9664"
            );
          }
        };
        renderScope();
        applyLockState();
      };
      const isEmpty = this.plugin.settings.tagColorRules.length === 0;
      if (isEmpty) {
        const placeholderBg = getDefaultBg();
        const placeholderText2 = getDefaultText();
        const placeholder = {
          tag: "",
          bgColor: placeholderBg,
          textColor: placeholderText2
        };
        const promoteIfNeeded = async () => {
          const hasTag = placeholder.tag.trim() !== "";
          const bgChanged = placeholder.bgColor !== placeholderBg;
          const fgChanged = placeholder.textColor !== placeholderText2;
          const accentChanged = placeholder.accentColor !== void 0;
          const subChanged = placeholder.subColor !== void 0;
          if (hasTag || bgChanged || fgChanged || accentChanged || subChanged) {
            this.plugin.settings.tagColorRules.push({ ...placeholder });
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            this.plugin.refreshAllWrDecorations();
            renderRules();
          }
        };
        buildRuleGroup(
          true,
          1,
          0,
          placeholder,
          async (v) => {
            placeholder.tag = v;
            await promoteIfNeeded();
          },
          async (v) => {
            placeholder.bgColor = v;
            await promoteIfNeeded();
          },
          async (v) => {
            placeholder.textColor = v;
            await promoteIfNeeded();
          },
          async (v) => {
            if (v === void 0) delete placeholder.accentColor;
            else placeholder.accentColor = v;
            await promoteIfNeeded();
          },
          async (v) => {
            if (v === void 0) {
              delete placeholder.subColor;
              delete placeholder.subColorScope;
            } else {
              placeholder.subColor = v;
            }
            await promoteIfNeeded();
          },
          async (key, value) => {
            var _a;
            const current = (_a = placeholder.subColorScope) != null ? _a : {
              buttons: true,
              quote: true,
              list: true,
              ogp: true
            };
            current[key] = value;
            placeholder.subColorScope = current;
            await promoteIfNeeded();
          },
          null
        );
        addBtnContainer.empty();
        return;
      }
      const ruleCount = this.plugin.settings.tagColorRules.length;
      this.plugin.settings.tagColorRules.forEach((rule, idx) => {
        const trailing = ruleCount === 1 ? {
          kind: "reset",
          handler: async () => {
            rule.tag = "";
            rule.bgColor = getDefaultBg();
            rule.textColor = getDefaultText();
            delete rule.accentColor;
            delete rule.subColor;
            delete rule.subColorScope;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            this.plugin.refreshAllWrDecorations();
            renderRules();
          }
        } : {
          kind: "delete",
          handler: async () => {
            this.plugin.settings.tagColorRules.splice(idx, 1);
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            this.plugin.refreshAllWrDecorations();
            renderRules();
          }
        };
        buildRuleGroup(
          idx === 0,
          idx + 1,
          idx,
          rule,
          async (v) => {
            rule.tag = v;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
            this.plugin.refreshAllWrDecorations();
          },
          async (v) => {
            rule.bgColor = v;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (v) => {
            rule.textColor = v;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (v) => {
            if (v === void 0) {
              delete rule.accentColor;
            } else {
              rule.accentColor = v;
            }
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (v) => {
            if (v === void 0) {
              delete rule.subColor;
              delete rule.subColorScope;
            } else {
              rule.subColor = v;
            }
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          async (key, value) => {
            var _a;
            const current = (_a = rule.subColorScope) != null ? _a : {
              buttons: true,
              quote: true,
              list: true,
              ogp: true
            };
            current[key] = value;
            rule.subColorScope = current;
            await this.plugin.saveSettings();
            this.plugin.applyTagColorRules();
          },
          trailing
        );
      });
      addBtnContainer.empty();
      new import_obsidian.Setting(addBtnContainer).addButton(
        (btn) => btn.setButtonText("\u30EB\u30FC\u30EB\u3092\u8FFD\u52A0").setCta().onClick(async () => {
          const newIndex = this.plugin.settings.tagColorRules.length;
          this.plugin.settings.tagColorRules.push({
            tag: "",
            bgColor: DEFAULT_SETTINGS.bgColorLight,
            textColor: DEFAULT_SETTINGS.textColorLight
          });
          this.unlockedRules.clear();
          this.unlockedRules.add(newIndex);
          await this.plugin.saveSettings();
          this.plugin.applyTagColorRules();
          renderRules();
        })
      );
    };
    const renderRules = () => {
      this.withScrollPreserved(() => renderRulesInner());
    };
    renderRulesInner();
  }
};

// src/views/WrotView.ts
var import_obsidian4 = require("obsidian");
init_memoParser();

// src/utils/memoWriter.ts
async function toggleCheckbox(app, file, lineNumber) {
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
async function ensureBlockIdOnFence(app, file, memoTimestamp, blockId) {
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
async function appendMemo(app, file, content) {
  const time = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
  const memoBlock = "```wr " + time + "\n" + content + "\n```";
  await app.vault.process(file, (data) => {
    if (data.length === 0) return memoBlock;
    const separator = data.endsWith("\n\n") ? "" : data.endsWith("\n") ? "\n" : "\n\n";
    return data + separator + memoBlock;
  });
}

// src/utils/dailyNote.ts
var import_obsidian2 = require("obsidian");
var import_obsidian_daily_notes_interface = __toESM(require_main(), 1);
function buildNotePath(date) {
  var _a;
  const settings = (0, import_obsidian_daily_notes_interface.getDailyNoteSettings)();
  const format = (settings == null ? void 0 : settings.format) || "YYYY-MM-DD";
  const folder = ((_a = settings == null ? void 0 : settings.folder) == null ? void 0 : _a.trim()) || "";
  const filename = date.format(format);
  const withExt = filename.endsWith(".md") ? filename : `${filename}.md`;
  const joined = folder ? `${folder}/${withExt}` : withExt;
  return { path: (0, import_obsidian2.normalizePath)(joined), filename, format };
}
async function ensureFolderForPath(app, path) {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return;
  const dir = path.substring(0, lastSlash);
  const existing = app.vault.getAbstractFileByPath(dir);
  if (existing) return;
  await app.vault.createFolder(dir);
}
function getDailyNoteFile(app, date) {
  const { path } = buildNotePath(date);
  const file = app.vault.getAbstractFileByPath(path);
  return file instanceof import_obsidian2.TFile ? file : null;
}
async function getOrCreateDailyNote(app, date) {
  var _a, _b;
  const { path, filename, format } = buildNotePath(date);
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof import_obsidian2.TFile) return existing;
  await ensureFolderForPath(app, path);
  const template = ((_b = (_a = (0, import_obsidian_daily_notes_interface.getDailyNoteSettings)()) == null ? void 0 : _a.template) == null ? void 0 : _b.trim()) || "";
  let body = "";
  if (template) {
    try {
      const [contents] = await (0, import_obsidian_daily_notes_interface.getTemplateInfo)(template);
      body = contents.replace(/{{\s*date\s*}}/gi, filename).replace(/{{\s*time\s*}}/gi, moment().format("HH:mm")).replace(/{{\s*title\s*}}/gi, filename).replace(
        /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
        (_match, _type, calc, delta, unit, customFmt) => {
          const now = moment();
          const cur = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second")
          });
          if (calc) cur.add(parseInt(delta, 10), unit);
          return customFmt ? cur.format(customFmt.substring(1).trim()) : cur.format(format);
        }
      ).replace(
        /{{\s*yesterday\s*}}/gi,
        date.clone().subtract(1, "day").format(format)
      ).replace(
        /{{\s*tomorrow\s*}}/gi,
        date.clone().add(1, "day").format(format)
      );
    } catch (e) {
      body = "";
    }
  }
  return await app.vault.create(path, body);
}

// src/utils/urlRenderer.ts
init_blockSegmenter();
var IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp"
];
var URL_REGEX = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
var TWITTER_REGEX = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
var QUOTE_LINK_RE = /^([^\[\]\n#]+)#\^(wr-\d{17})$/;
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:", "obsidian:"].includes(parsed.protocol);
  } catch (e) {
    return false;
  }
}
function isSafeImageUrl(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch (e) {
    return false;
  }
}
function cleanUrl(raw) {
  return raw.replace(/[.,;:!?)]+$/, "");
}
function classifyUrl(url) {
  if (TWITTER_REGEX.test(url)) return "twitter";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "obsidian:") {
      const filePath = parsed.searchParams.get("file");
      if (filePath) {
        const target = decodeURIComponent(filePath).toLowerCase();
        if (IMAGE_EXTENSIONS.some((ext) => target.endsWith(ext))) {
          return "image";
        }
      }
      return "generic";
    }
    const pathname = parsed.pathname.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return "image";
    }
  } catch (e) {
  }
  return "generic";
}
function extractObsidianFileName(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "obsidian:") return null;
    const filePath = parsed.searchParams.get("file");
    if (!filePath) return null;
    const decoded = decodeURIComponent(filePath);
    return decoded.split("/").pop() || decoded;
  } catch (e) {
    return null;
  }
}
function extractUrls(text) {
  const urls = [];
  const seen = /* @__PURE__ */ new Set();
  for (const m of text.matchAll(URL_REGEX)) {
    const url = cleanUrl(m[0]);
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push({ url, type: classifyUrl(url) });
  }
  return urls;
}
function renderTextWithTagsAndUrls(container, text, callbacks) {
  const urls = [];
  const seen = /* @__PURE__ */ new Set();
  const segments = segmentBlocks(text);
  for (const segment of segments) {
    if (segment.kind === "codeblock") {
      const blockEl = container.createDiv({ cls: "wr-codeblock-display" });
      if (callbacks.renderCodeBlock) {
        callbacks.renderCodeBlock(segment.code, segment.lang, blockEl, segment.fenceTildes);
      } else {
        const pre = blockEl.createEl("pre");
        const codeEl = pre.createEl("code");
        if (segment.lang) codeEl.addClass(`language-${segment.lang}`);
        codeEl.textContent = segment.code;
      }
      continue;
    }
    if (segment.kind === "mathblock") {
      const blockEl = container.createDiv({ cls: "wr-math-display" });
      if (callbacks.renderMathBlock) {
        callbacks.renderMathBlock(segment.tex, blockEl);
      } else {
        try {
          const { renderMath: renderMath3, finishRenderMath: finishRenderMath3 } = require("obsidian");
          const rendered = renderMath3(segment.tex, true);
          blockEl.appendChild(rendered);
          finishRenderMath3();
        } catch (e) {
          blockEl.textContent = segment.tex;
        }
      }
      continue;
    }
    renderTextSegment(container, segment.text, segment.startLine, callbacks, urls, seen);
  }
  return urls;
}
function renderTextSegment(container, text, lineOffset, callbacks, urls, seen) {
  const lines = text.split("\n");
  let currentList = null;
  let currentListType = null;
  let quoteStack = [];
  let quoteList = null;
  let quoteListType = null;
  let quoteListDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quoteMatch = line.match(/^((?:>\s?)+)(.*)$/);
    const checkMatch = !quoteMatch && line.match(/^- \[([ x])\] (.*)$/);
    const listMatch = !quoteMatch && !checkMatch && line.match(/^- (.+)$/);
    const olMatch = !quoteMatch && !checkMatch && !listMatch && line.match(/^\d+\.\s?(.+)$/);
    if (quoteMatch) {
      currentList = null;
      currentListType = null;
      const depth = (quoteMatch[1].match(/>/g) || []).length;
      const body = quoteMatch[2];
      while (quoteStack.length > depth) {
        quoteStack.pop();
      }
      while (quoteStack.length < depth) {
        const parent = quoteStack.length > 0 ? quoteStack[quoteStack.length - 1] : container;
        const bq = parent.createEl("blockquote", { cls: "wr-blockquote" });
        quoteStack.push(bq);
      }
      const target = quoteStack[quoteStack.length - 1];
      const innerCheck = body.match(/^- \[([ x])\] (.*)$/);
      const innerList = !innerCheck && body.match(/^- (.+)$/);
      const innerOl = !innerCheck && !innerList && body.match(/^\d+\.\s?(.+)$/);
      if (innerCheck || innerList) {
        if (quoteList === null || quoteListType !== "ul" || quoteListDepth !== depth || quoteList.parentElement !== target) {
          quoteList = target.createEl("ul", { cls: "wr-bullet-list" });
          quoteListType = "ul";
          quoteListDepth = depth;
        }
        const li = quoteList.createEl("li");
        if (innerCheck) {
          li.addClass("wr-check-item");
          const checkbox = li.createEl("input", { attr: { type: "checkbox" } });
          if (innerCheck[1] === "x") checkbox.checked = true;
          if (callbacks.onCheckToggle) {
            const lineIdx = lineOffset + i;
            const cb = callbacks.onCheckToggle;
            checkbox.addEventListener("click", () => {
              cb(lineIdx, checkbox.checked);
            });
          } else {
            checkbox.disabled = true;
          }
          const textContainer = innerCheck[1] === "x" && callbacks.checkStrikethrough ? li.createEl("span", { cls: "wr-check-done" }) : li;
          renderInlineTokens(textContainer, innerCheck[2], callbacks, urls, seen);
        } else if (innerList) {
          renderInlineTokens(li, innerList[1], callbacks, urls, seen);
        }
      } else if (innerOl) {
        if (quoteList === null || quoteListType !== "ol" || quoteListDepth !== depth || quoteList.parentElement !== target) {
          quoteList = target.createEl("ol", { cls: "wr-ordered-list" });
          quoteListType = "ol";
          quoteListDepth = depth;
        }
        const li = quoteList.createEl("li");
        renderInlineTokens(li, innerOl[1], callbacks, urls, seen);
      } else {
        quoteList = null;
        quoteListType = null;
        if (target.childNodes.length > 0) {
          target.createEl("br");
        }
        renderInlineTokens(target, body, callbacks, urls, seen);
      }
    } else if (checkMatch || listMatch) {
      quoteStack = [];
      quoteList = null;
      quoteListType = null;
      if (currentListType !== "ul") {
        currentList = container.createEl("ul", { cls: "wr-bullet-list" });
        currentListType = "ul";
      }
      const li = currentList.createEl("li");
      if (checkMatch) {
        li.addClass("wr-check-item");
        const checkbox = li.createEl("input", { attr: { type: "checkbox" } });
        if (checkMatch[1] === "x") checkbox.checked = true;
        if (callbacks.onCheckToggle) {
          const lineIdx = lineOffset + i;
          const cb = callbacks.onCheckToggle;
          checkbox.addEventListener("click", () => {
            cb(lineIdx, checkbox.checked);
          });
        } else {
          checkbox.disabled = true;
        }
        const textContainer = checkMatch[1] === "x" && callbacks.checkStrikethrough ? li.createEl("span", { cls: "wr-check-done" }) : li;
        renderInlineTokens(textContainer, checkMatch[2], callbacks, urls, seen);
      } else if (listMatch) {
        renderInlineTokens(li, listMatch[1], callbacks, urls, seen);
      }
    } else if (olMatch) {
      quoteStack = [];
      quoteList = null;
      quoteListType = null;
      if (currentListType !== "ol") {
        currentList = container.createEl("ol", { cls: "wr-ordered-list" });
        currentListType = "ol";
      }
      const li = currentList.createEl("li");
      renderInlineTokens(li, olMatch[1], callbacks, urls, seen);
    } else {
      const prevWasBlock = currentList !== null || quoteStack.length > 0;
      currentList = null;
      currentListType = null;
      quoteStack = [];
      quoteList = null;
      quoteListType = null;
      if (i > 0 && !prevWasBlock) container.appendText("\n");
      renderInlineTokens(container, line, callbacks, urls, seen);
    }
  }
}
var IMAGE_EXT_RE = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;
function renderInlineTokens(container, text, callbacks, urls, seen) {
  const TOKEN_REGEX = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+=+|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)|#[^\s#]+|(?:https?|obsidian):\/\/[^\s<>"'\]]+)/g;
  const parts = text.split(TOKEN_REGEX);
  for (const part of parts) {
    if (!part) continue;
    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) {
      container.createEl("code", { cls: "wr-inline-code", text: codeMatch[1] });
      continue;
    }
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      container.createEl("strong", { text: boldMatch[1] });
      continue;
    }
    const italicMatch = part.match(/^\*(.+)\*$/);
    if (italicMatch) {
      container.createEl("em", { text: italicMatch[1] });
      continue;
    }
    const strikeMatch = part.match(/^~~(.+)~~$/);
    if (strikeMatch) {
      container.createEl("del", { text: strikeMatch[1] });
      continue;
    }
    const highlightMatch = part.match(/^==(.+)==$/);
    if (highlightMatch) {
      container.createEl("mark", { cls: "wr-highlight", text: highlightMatch[1] });
      continue;
    }
    const mdLinkMatch = part.match(/^\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)$/);
    if (mdLinkMatch) {
      const label = mdLinkMatch[1];
      const url = mdLinkMatch[2];
      if (isSafeUrl(url)) {
        const link = container.createEl("a", {
          cls: "wr-url",
          text: label,
          href: url
        });
        link.setAttr("target", "_blank");
        link.setAttr("rel", "noopener");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(url, "_blank");
        });
        if (!seen.has(url)) {
          seen.add(url);
          urls.push({ url, type: classifyUrl(url) });
        }
      } else {
        container.appendText(part);
      }
      continue;
    }
    const embedMatch = part.match(/^!\[\[(.+)\]\]$/);
    const linkMatch = !embedMatch && part.match(/^\[\[(.+)\]\]$/);
    if (embedMatch) {
      const fileName = embedMatch[1];
      if (IMAGE_EXT_RE.test(fileName) && callbacks.resolveImagePath) {
        const src = callbacks.resolveImagePath(fileName);
        if (src) {
          container.createEl("img", {
            cls: "wr-embed-img",
            attr: { src, alt: fileName, loading: "lazy" }
          });
        } else {
          container.createEl("span", { cls: "wr-embed-missing", text: `![[${fileName}]]` });
        }
      } else {
        const resolved = callbacks.resolveLinkTarget ? callbacks.resolveLinkTarget(fileName) : true;
        const cls = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
        const linkEl = container.createEl("a", { cls, text: fileName });
        if (callbacks.onInternalLinkClick) {
          const cb = callbacks.onInternalLinkClick;
          linkEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            cb(fileName);
          });
        }
      }
    } else if (linkMatch) {
      const linkName = linkMatch[1];
      const quoteMatch = linkName.match(QUOTE_LINK_RE);
      if (quoteMatch && callbacks.renderQuoteCard) {
        const slot = container.createEl("span", { cls: "wr-quote-card-slot" });
        callbacks.renderQuoteCard(slot, quoteMatch[1], quoteMatch[2]);
      } else {
        const resolved = callbacks.resolveLinkTarget ? callbacks.resolveLinkTarget(linkName) : true;
        const cls = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
        const linkEl = container.createEl("a", { cls, text: linkName });
        if (callbacks.onInternalLinkClick) {
          const cb = callbacks.onInternalLinkClick;
          linkEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            cb(linkName);
          });
        }
      }
    } else if (part.match(/^#[^\s#]+$/)) {
      const tagEl = container.createEl("span", {
        cls: "wr-tag",
        text: part
      });
      if (callbacks.onTagClick) {
        const cb = callbacks.onTagClick;
        tagEl.addEventListener("click", (e) => {
          e.stopPropagation();
          cb(part);
        });
      }
    } else if (part.match(/^\$([^$]+)\$$/)) {
      const mathContent = part.slice(1, -1);
      const mathEl = container.createEl("span", { cls: "wr-math" });
      try {
        const { renderMath: renderMath3, finishRenderMath: finishRenderMath3 } = require("obsidian");
        const rendered = renderMath3(mathContent, false);
        mathEl.appendChild(rendered);
        finishRenderMath3();
      } catch (e) {
        mathEl.textContent = part;
      }
    } else if (part.match(/^obsidian:\/\//)) {
      const url = cleanUrl(part);
      const trailing = part.slice(url.length);
      const fileName = extractObsidianFileName(url);
      const urlType = classifyUrl(url);
      const looksLikeImage = urlType === "image";
      const resolvedImage = !!(fileName && callbacks.resolveImagePath && callbacks.resolveImagePath(fileName));
      const isImageEmbed = looksLikeImage && resolvedImage;
      const isUnresolvedImage = looksLikeImage && !resolvedImage;
      if (!isImageEmbed) {
        const displayName = fileName || url;
        const cls = isUnresolvedImage ? "wr-internal-link wr-internal-link-unresolved" : "wr-internal-link";
        const link = container.createEl("a", {
          cls,
          text: displayName
        });
        link.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSafeUrl(url)) window.open(url);
        });
        if (trailing) container.appendText(trailing);
      } else if (trailing) {
        container.appendText(trailing);
      }
      if (!seen.has(url)) {
        seen.add(url);
        urls.push({ url, type: urlType });
      }
    } else if (part.match(/^https?:\/\//)) {
      const url = cleanUrl(part);
      const trailing = part.slice(url.length);
      if (isSafeUrl(url)) {
        const link = container.createEl("a", {
          cls: "wr-url",
          text: url,
          href: url
        });
        link.setAttr("target", "_blank");
        link.setAttr("rel", "noopener");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(url, "_blank");
        });
        if (trailing) container.appendText(trailing);
        if (!seen.has(url)) {
          seen.add(url);
          urls.push({ url, type: classifyUrl(url) });
        }
      } else {
        container.appendText(part);
      }
    } else {
      container.appendText(part);
    }
  }
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function makeClickableLink(element, url) {
  element.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSafeUrl(url)) window.open(url, "_blank");
  });
}
function renderImagePreview(container, url, resolveImagePath) {
  const wrapper = el("a", "wr-media-link");
  wrapper.href = url;
  wrapper.target = "_blank";
  wrapper.rel = "noopener";
  makeClickableLink(wrapper, url);
  const img = el("img", "wr-inline-img");
  if (isSafeImageUrl(url)) {
    img.src = url;
  } else if (url.startsWith("obsidian://") && resolveImagePath) {
    const fileName = extractObsidianFileName(url);
    const resolved = fileName ? resolveImagePath(fileName) : null;
    if (resolved) img.src = resolved;
  }
  img.loading = "lazy";
  wrapper.appendChild(img);
  container.appendChild(wrapper);
}
function renderOGPCard(container, data) {
  const card = el("a", "wr-ogp-card");
  card.href = data.url;
  card.target = "_blank";
  card.rel = "noopener";
  makeClickableLink(card, data.url);
  if (data.image && isSafeImageUrl(data.image)) {
    const thumb = el("img", "wr-ogp-thumb");
    thumb.src = data.image;
    thumb.loading = "lazy";
    card.appendChild(thumb);
  }
  const body = el("div", "wr-ogp-body");
  if (data.title) body.appendChild(el("div", "wr-ogp-title", data.title));
  if (data.description) body.appendChild(el("div", "wr-ogp-desc", data.description));
  const siteName = data.siteName || extractDomain(data.url);
  body.appendChild(el("div", "wr-ogp-site", siteName));
  card.appendChild(body);
  container.appendChild(card);
}
function renderTwitterCard(container, data) {
  const card = el("a", "wr-ogp-card wr-twitter-card");
  card.href = data.url;
  card.target = "_blank";
  card.rel = "noopener";
  makeClickableLink(card, data.url);
  if (data.image && isSafeImageUrl(data.image)) {
    const thumb = el("img", "wr-ogp-thumb");
    thumb.src = data.image;
    thumb.loading = "lazy";
    card.appendChild(thumb);
  }
  const body = el("div", "wr-ogp-body");
  if (data.title) body.appendChild(el("div", "wr-ogp-title", data.title));
  if (data.description) body.appendChild(el("div", "wr-ogp-desc", data.description));
  body.appendChild(el("div", "wr-ogp-site", "X (Twitter)"));
  card.appendChild(body);
  container.appendChild(card);
}
function renderUrlPreviews(container, urls, ogpCache, resolveImagePath) {
  for (const pu of urls) {
    if (pu.type === "image") {
      renderImagePreview(container, pu.url, resolveImagePath);
    } else if (pu.url.startsWith("obsidian://")) {
      continue;
    } else {
      const placeholder = el("div", "wr-ogp-loading");
      container.appendChild(placeholder);
      ogpCache.fetchOGP(pu.url).then((data) => {
        placeholder.textContent = "";
        if (!data || !data.title && !data.description) {
          placeholder.remove();
          return;
        }
        if (pu.type === "twitter") {
          renderTwitterCard(placeholder, data);
        } else {
          renderOGPCard(placeholder, data);
        }
      });
    }
  }
}
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
}

// src/utils/quoteCard.ts
var import_obsidian3 = require("obsidian");
init_memoParser();
var MEMO_CACHE = /* @__PURE__ */ new Map();
var MEMO_CACHE_MAX = 8;
function getCachedMemos(filePath) {
  return MEMO_CACHE.get(filePath);
}
function setCachedMemos(filePath, memos) {
  if (MEMO_CACHE.has(filePath)) MEMO_CACHE.delete(filePath);
  MEMO_CACHE.set(filePath, memos);
  while (MEMO_CACHE.size > MEMO_CACHE_MAX) {
    const oldest = MEMO_CACHE.keys().next().value;
    if (oldest === void 0) break;
    MEMO_CACHE.delete(oldest);
  }
}
function invalidateMemoCache(filePath) {
  MEMO_CACHE.delete(filePath);
}
function refreshQuoteCardsForFile(app, file, resolveRuleClass, resolveRuleAccent) {
  const baseName = file.basename;
  const cards = document.querySelectorAll(
    `a.wr-quote-card[data-quote-file="${CSS.escape(baseName)}"]`
  );
  cards.forEach((card) => {
    var _a;
    const slot = card.parentElement;
    if (!slot) return;
    const fileName = card.dataset.quoteFile;
    const blockId = card.dataset.quoteBlock;
    const currentFilePath = (_a = card.dataset.quoteContext) != null ? _a : "";
    const timestampFormat = card.dataset.quoteTsFormat;
    if (!fileName || !blockId) return;
    card.remove();
    renderQuoteCard(slot, fileName, blockId, app, currentFilePath, {
      timestampFormat,
      resolveRuleClass,
      resolveRuleAccent
    });
  });
}
function memoMatchesBlockId(memo, blockId) {
  if (!blockId.startsWith("wr-")) return false;
  const T = blockId.slice(3);
  const memoT = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
  return memoT === T;
}
var DEFAULT_TIMESTAMP_FORMAT = "YYYY/MM/DD HH:mm";
function formatMemoTimestamp(time, format) {
  return moment(time).format(format || DEFAULT_TIMESTAMP_FORMAT);
}
var NESTED_QUOTE_RE_INLINE = /[\s]*\[\[[^\[\]]+#\^wr-\d{17}\]\][\s]*/g;
var NESTED_QUOTE_PLACEHOLDER = "QT:";
var NESTED_QUOTE_DISPLAY = "QT: ...";
function sanitizeNestedQuotes(text) {
  return text.replace(NESTED_QUOTE_RE_INLINE, ` ${NESTED_QUOTE_PLACEHOLDER}`);
}
var IMAGE_EMBED_RE = /!\[\[[^\[\]]+\.(?:png|jpe?g|gif|webp|svg|bmp)\]\]/gi;
var IMAGE_EMBED_PLACEHOLDER = "@@WR_IMAGE_EMBED@@";
function sanitizeImageEmbeds(text) {
  return text.replace(IMAGE_EMBED_RE, IMAGE_EMBED_PLACEHOLDER);
}
var MATH_BLOCK_RE = /\$\$[\s\S]+?\$\$/g;
var MATH_BLOCK_PLACEHOLDER = "@@WR_MATH_BLOCK@@";
function sanitizeMathBlocks(text) {
  return text.replace(MATH_BLOCK_RE, MATH_BLOCK_PLACEHOLDER);
}
var CODE_BLOCK_RE = /(?:```|~~~)[\s\S]+?(?:```|~~~)/g;
var CODE_BLOCK_PLACEHOLDER = "@@WR_CODE_BLOCK@@";
function sanitizeCodeBlocks(text) {
  return text.replace(CODE_BLOCK_RE, CODE_BLOCK_PLACEHOLDER);
}
function decorateImageEmbedMarkers(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while (n = walker.nextNode()) {
    if (n.data.includes(IMAGE_EMBED_PLACEHOLDER)) {
      textNodes.push(n);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(IMAGE_EMBED_PLACEHOLDER);
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-quote-image-marker";
        const iconEl = document.createElement("span");
        iconEl.className = "wr-quote-image-marker-icon";
        (0, import_obsidian3.setIcon)(iconEl, "image");
        span.appendChild(iconEl);
        span.appendChild(document.createTextNode(" image"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}
function decorateMathBlockMarkers(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while (n = walker.nextNode()) {
    if (n.data.includes(MATH_BLOCK_PLACEHOLDER)) {
      textNodes.push(n);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(MATH_BLOCK_PLACEHOLDER);
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-quote-math-marker";
        const iconEl = document.createElement("span");
        iconEl.className = "wr-quote-math-marker-icon";
        (0, import_obsidian3.setIcon)(iconEl, "sigma");
        span.appendChild(iconEl);
        span.appendChild(document.createTextNode(" math"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}
function decorateCodeBlockMarkers(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while (n = walker.nextNode()) {
    if (n.data.includes(CODE_BLOCK_PLACEHOLDER)) {
      textNodes.push(n);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(CODE_BLOCK_PLACEHOLDER);
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-quote-code-marker";
        const iconEl = document.createElement("span");
        iconEl.className = "wr-quote-code-marker-icon";
        (0, import_obsidian3.setIcon)(iconEl, "code");
        span.appendChild(iconEl);
        span.appendChild(document.createTextNode(" code"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}
function decorateNestedQuoteMarkers(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while (n = walker.nextNode()) {
    if (n.data.includes(NESTED_QUOTE_PLACEHOLDER)) {
      textNodes.push(n);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(NESTED_QUOTE_PLACEHOLDER);
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-nested-quote-marker";
        span.textContent = NESTED_QUOTE_DISPLAY;
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}
var PREVIEW_MAX_LINES = 3;
var PREVIEW_MAX_CHARS_PER_LINE = 200;
function renderPreviewLines(bodyEl, content, app) {
  const sanitized = sanitizeCodeBlocks(
    sanitizeMathBlocks(
      sanitizeImageEmbeds(sanitizeNestedQuotes(content))
    )
  );
  const lines = sanitized.split("\n").filter((l) => l.trim().length > 0).slice(0, PREVIEW_MAX_LINES);
  const inlineCallbacks = {
    resolveImagePath: (fileName) => {
      const file = app.metadataCache.getFirstLinkpathDest(fileName, "");
      return file ? app.vault.getResourcePath(file) : null;
    },
    resolveLinkTarget: (linkName) => {
      return app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
    }
  };
  for (const rawLine of lines) {
    const line = rawLine.length > PREVIEW_MAX_CHARS_PER_LINE ? rawLine.slice(0, PREVIEW_MAX_CHARS_PER_LINE) + "\u2026" : rawLine;
    const lineEl = bodyEl.createDiv({ cls: "wr-quote-card-line" });
    const checkMatch = line.match(/^- \[([ x])\] (.*)$/);
    const listMatch = !checkMatch && line.match(/^- (.+)$/);
    const olMatch = !checkMatch && !listMatch && line.match(/^(\d+)\.\s?(.+)$/);
    if (checkMatch) {
      const slot = lineEl.createSpan({ cls: "wr-quote-card-marker-slot wr-quote-card-marker-check" });
      slot.createSpan({
        cls: checkMatch[1] === "x" ? "wr-quote-card-check wr-quote-card-check-done" : "wr-quote-card-check"
      });
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, checkMatch[2], inlineCallbacks);
    } else if (listMatch) {
      const slot = lineEl.createSpan({ cls: "wr-quote-card-marker-slot wr-quote-card-marker-bullet" });
      slot.textContent = "\u30FB";
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, listMatch[1], inlineCallbacks);
    } else if (olMatch) {
      const slot = lineEl.createSpan({ cls: "wr-quote-card-marker-slot wr-quote-card-marker-ol" });
      slot.textContent = `${olMatch[1]}.`;
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, olMatch[2], inlineCallbacks);
    } else {
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, line, inlineCallbacks);
    }
  }
  decorateNestedQuoteMarkers(bodyEl);
  decorateImageEmbedMarkers(bodyEl);
  decorateMathBlockMarkers(bodyEl);
  decorateCodeBlockMarkers(bodyEl);
}
function fillCardBody(card, bodyEl, metaEl, memo, app, timestampFormat) {
  bodyEl.empty();
  renderPreviewLines(bodyEl, memo.content, app);
  metaEl.textContent = formatMemoTimestamp(memo.time, timestampFormat);
}
function markDead(card, bodyEl, metaEl) {
  card.classList.add("wr-quote-card-dead");
  bodyEl.textContent = "(\u5143\u6295\u7A3F\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093)";
  metaEl.textContent = "";
}
function flashJumpTarget(blockId, app, resolveRuleAccent) {
  const tryAt = [80, 250, 500, 900];
  let applied = false;
  for (const ms of tryAt) {
    setTimeout(() => {
      if (applied) return;
      const targets = collectFlashTargets(blockId, app);
      if (targets.length === 0) return;
      applied = true;
      const docTarget = targets.find((el2) => !el2.classList.contains("wr-card"));
      if (docTarget) {
        docTarget.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      for (const el2 of targets) {
        el2.classList.remove("wr-quote-jump-flash");
        void el2.offsetWidth;
        const ruleClass = Array.from(el2.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
        const accent = ruleClass && resolveRuleAccent ? resolveRuleAccent(ruleClass) : null;
        if (accent) {
          const r = parseInt(accent.slice(1, 3), 16);
          const g = parseInt(accent.slice(3, 5), 16);
          const b = parseInt(accent.slice(5, 7), 16);
          el2.style.setProperty("--wr-flash-color", `rgba(${r}, ${g}, ${b}, 0.22)`);
        } else {
          el2.style.removeProperty("--wr-flash-color");
        }
        el2.classList.add("wr-quote-jump-flash");
        setTimeout(() => {
          el2.classList.remove("wr-quote-jump-flash");
          el2.style.removeProperty("--wr-flash-color");
        }, 1600);
      }
    }, ms);
  }
}
function collectFlashTargets(blockId, app) {
  const all = Array.from(
    document.querySelectorAll(`.wr-block-id-${blockId}`)
  );
  if (!import_obsidian3.Platform.isMobile) return all;
  if (import_obsidian3.Platform.isPhone) {
    return all.filter((el2) => !el2.classList.contains("wr-card"));
  }
  const wrCardEls = all.filter((el2) => el2.classList.contains("wr-card"));
  const isUnpinnedDrawer = wrCardEls.some((el2) => {
    const drawer = el2.closest(".workspace-drawer");
    return drawer !== null && !drawer.classList.contains("is-pinned");
  });
  if (isUnpinnedDrawer) {
    return all.filter((el2) => !el2.classList.contains("wr-card"));
  }
  return all;
}
function renderQuoteCard(slot, fileName, blockId, app, currentFilePath, options) {
  const localMemos = options == null ? void 0 : options.localMemos;
  const timestampFormat = options == null ? void 0 : options.timestampFormat;
  const resolveRuleClass = options == null ? void 0 : options.resolveRuleClass;
  const resolveRuleAccent = options == null ? void 0 : options.resolveRuleAccent;
  const card = slot.createEl("a", { cls: "wr-quote-card" });
  card.setAttr("href", `${fileName}#^${blockId}`);
  card.dataset.quoteFile = fileName;
  card.dataset.quoteBlock = blockId;
  card.dataset.quoteContext = currentFilePath;
  if (timestampFormat) card.dataset.quoteTsFormat = timestampFormat;
  const bodyEl = card.createDiv({ cls: "wr-quote-card-body", text: "\u2026" });
  const metaEl = card.createDiv({ cls: "wr-quote-card-meta" });
  const file = app.metadataCache.getFirstLinkpathDest(fileName, currentFilePath);
  if (!(file instanceof import_obsidian3.TFile)) {
    markDead(card, bodyEl, metaEl);
    return;
  }
  const setupClick = (memo) => {
    fillCardBody(card, bodyEl, metaEl, memo, app, timestampFormat);
    if (resolveRuleClass) {
      Array.from(card.classList).filter((c) => /^wr-tag-rule-\d+$/.test(c)).forEach((c) => card.classList.remove(c));
      const cls = resolveRuleClass(memo.content);
      if (cls) card.classList.add(cls);
    }
    card.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const obs = require("obsidian");
      const activeView = app.workspace.getActiveViewOfType(obs.MarkdownView);
      if (activeView) {
        await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, false);
      } else {
        const recent = app.workspace.getMostRecentLeaf();
        if (recent && recent.view instanceof obs.MarkdownView) {
          app.workspace.setActiveLeaf(recent, { focus: true });
          await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, false);
        } else {
          await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, true);
        }
      }
      flashJumpTarget(blockId, app, resolveRuleAccent);
    });
  };
  if (localMemos) {
    const found = localMemos.find((m) => memoMatchesBlockId(m, blockId));
    if (found) {
      setupClick(found);
      return;
    }
    markDead(card, bodyEl, metaEl);
    return;
  }
  const cached = getCachedMemos(file.path);
  if (cached) {
    const found = cached.find((m) => memoMatchesBlockId(m, blockId));
    if (found) {
      setupClick(found);
      return;
    }
    markDead(card, bodyEl, metaEl);
    return;
  }
  app.vault.cachedRead(file).then((content) => {
    const memos = parseMemos(content);
    setCachedMemos(file.path, memos);
    const found = memos.find((m) => memoMatchesBlockId(m, blockId));
    if (found) {
      setupClick(found);
    } else {
      markDead(card, bodyEl, metaEl);
    }
  }).catch(() => {
    markDead(card, bodyEl, metaEl);
  });
}

// src/utils/imageAttachment.ts
var IMAGE_PREFIX = "Pasted Image";
var MIME_TO_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp"
};
function isImageFile(file) {
  return file.type.startsWith("image/");
}
function getExtension(file) {
  if (MIME_TO_EXT[file.type]) return MIME_TO_EXT[file.type];
  const match = /^image\/(.+)$/.exec(file.type);
  if (match) return match[1];
  const nameMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  return nameMatch ? nameMatch[1].toLowerCase() : "png";
}
async function saveImageToVault(app, file, sourceFile) {
  const buffer = await file.arrayBuffer();
  const ext = getExtension(file);
  const baseName = `${IMAGE_PREFIX} ${moment().format("YYYYMMDDHHmmss")}`;
  const vault = app.vault;
  const path = await vault.getAvailablePathForAttachments(
    baseName,
    ext,
    sourceFile
  );
  return await app.vault.createBinary(path, buffer);
}
function buildEmbedLink(savedFile) {
  return `![[${savedFile.name}]]`;
}

// src/views/WrotView.ts
function insertEmbedAboveBottomBlock(bodyText, embed) {
  if (!bodyText) return embed;
  const markerMatch = bodyText.match(/^([\s\S]*?)\n?(\[\[[^\[\]]+#\^wr-\d{17}\]\])\s*$/);
  if (markerMatch) {
    const before = markerMatch[1].replace(/\n+$/, "");
    const marker = markerMatch[2];
    return before ? `${before}
${embed}
${marker}` : `${embed}
${marker}`;
  }
  const lines = bodyText.split("\n");
  let firstQuoteIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^>(\s|$)/.test(lines[i])) {
      firstQuoteIdx = i;
    } else if (lines[i].trim() === "" && firstQuoteIdx === i + 1) {
      firstQuoteIdx = i;
    } else {
      break;
    }
  }
  if (firstQuoteIdx < lines.length) {
    const above = lines.slice(0, firstQuoteIdx);
    const below = lines.slice(firstQuoteIdx);
    const aboveText = above.join("\n").replace(/\n+$/, "");
    const belowText = below.join("\n").replace(/^\n+/, "");
    return aboveText ? `${aboveText}
${embed}

${belowText}` : `${embed}

${belowText}`;
  }
  return `${bodyText}
${embed}`;
}
var WrotView = class extends import_obsidian4.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    // 「今日」追従中フラグ。trueのときだけ日付変更を跨いで自動更新する
    this.anchoredToToday = true;
    this.fileChangeRef = null;
    this.fileDeleteRef = null;
    this.fileCreateRef = null;
    this.ignoreNextModify = false;
    this.ignoreModifyUntil = 0;
    this.activeFormatMode = null;
    this.refreshing = false;
    this.toolbarResizeObserver = null;
    this.currentMenu = null;
    this.pendingImage = null;
    this.pendingImageUrl = null;
    this.thumbnailContainer = null;
    this.imageAddBtn = null;
    this.submitBtnEl = null;
    this.plugin = plugin;
    this.currentDate = moment();
    this.scope = new import_obsidian4.Scope(this.app.scope);
  }
  getViewType() {
    return VIEW_TYPE_WROT;
  }
  getDisplayText() {
    return "Wrot";
  }
  getIcon() {
    return "feather";
  }
  async onOpen() {
    const container = this.contentEl;
    container.empty();
    container.addClass("wr-container");
    this.buildDateNav(container);
    this.buildInputArea(container);
    this.listContainer = container.createDiv({ cls: "wr-list" });
    this.scope.register(["Mod"], "Enter", (evt) => {
      if (document.activeElement === this.textarea) {
        evt.preventDefault();
        evt.stopPropagation();
        this.submitMemo();
        return false;
      }
    });
    await this.refresh();
    this.registerFileWatcher();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf !== this.leaf) return;
        this.maybeRollToToday();
      })
    );
  }
  async onClose() {
    this.unregisterFileWatcher();
    if (this.toolbarResizeObserver) {
      this.toolbarResizeObserver.disconnect();
      this.toolbarResizeObserver = null;
    }
    this.clearPendingImage();
    this.contentEl.empty();
  }
  registerFileWatcher() {
    this.unregisterFileWatcher();
    this.fileChangeRef = this.app.vault.on("modify", (file) => {
      if (this.ignoreNextModify) {
        this.ignoreNextModify = false;
        return;
      }
      if (Date.now() < this.ignoreModifyUntil) {
        return;
      }
      if (!(file instanceof import_obsidian4.TFile)) return;
      const currentFile = getDailyNoteFile(
        this.app,
        this.currentDate
      );
      if (currentFile && file.path === currentFile.path) {
        this.refresh();
      }
    });
    const TRIGGER_EXT = /^(md|png|jpe?g|gif|webp|svg|bmp)$/i;
    this.fileDeleteRef = this.app.metadataCache.on("deleted", (file) => {
      if (!(file instanceof import_obsidian4.TFile)) return;
      if (!TRIGGER_EXT.test(file.extension)) return;
      this.refresh();
    });
    this.fileCreateRef = this.app.vault.on("create", (file) => {
      if (!(file instanceof import_obsidian4.TFile)) return;
      if (!TRIGGER_EXT.test(file.extension)) return;
      this.refresh();
    });
  }
  unregisterFileWatcher() {
    if (this.fileChangeRef) {
      this.app.vault.offref(this.fileChangeRef);
      this.fileChangeRef = null;
    }
    if (this.fileDeleteRef) {
      this.app.vault.offref(this.fileDeleteRef);
      this.fileDeleteRef = null;
    }
    if (this.fileCreateRef) {
      this.app.vault.offref(this.fileCreateRef);
      this.fileCreateRef = null;
    }
  }
  // 「今日」追従中のみ、現在日付を最新の今日へ更新する
  async maybeRollToToday() {
    if (!this.anchoredToToday) return;
    const now = moment();
    if (this.currentDate.isSame(now, "day")) return;
    this.currentDate = now;
    await this.refresh();
  }
  // 既に開かれているタブがあればそこへフォーカスし、なければ新規タブで開く
  async openOrFocusFile(file) {
    let existingLeaf = null;
    this.app.workspace.iterateAllLeaves((leaf2) => {
      var _a;
      if (existingLeaf) return;
      const view = leaf2.view;
      if (((_a = view == null ? void 0 : view.file) == null ? void 0 : _a.path) === file.path) {
        existingLeaf = leaf2;
      }
    });
    if (existingLeaf) {
      this.app.workspace.revealLeaf(existingLeaf);
      this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }
  buildDateNav(container) {
    const nav = container.createDiv({ cls: "wr-date-nav" });
    const prevBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    (0, import_obsidian4.setIcon)(prevBtn, "chevron-left");
    prevBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().subtract(1, "day");
      this.anchoredToToday = false;
      this.refresh();
    });
    this.dateLabel = nav.createEl("span", { cls: "wr-date-label" });
    this.dateLabel.addEventListener("click", async () => {
      var _a;
      this.dateLabel.classList.add("wr-date-label-active");
      setTimeout(() => this.dateLabel.classList.remove("wr-date-label-active"), 300);
      const file = (_a = getDailyNoteFile(this.app, this.currentDate)) != null ? _a : await getOrCreateDailyNote(this.app, this.currentDate);
      await this.openOrFocusFile(file);
    });
    const nextBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    (0, import_obsidian4.setIcon)(nextBtn, "chevron-right");
    nextBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().add(1, "day");
      this.anchoredToToday = false;
      this.refresh();
    });
    const todayBtn = nav.createEl("button", { cls: "wr-today-btn", text: "\u4ECA\u65E5" });
    todayBtn.addEventListener("click", () => {
      this.currentDate = moment();
      this.anchoredToToday = true;
      this.refresh();
    });
  }
  buildInputArea(container) {
    const inputArea = container.createDiv({ cls: "wr-input-area" });
    const header = inputArea.createDiv({ cls: "wr-input-header" });
    const submitBtn = header.createEl("button", {
      cls: "wr-submit-btn"
    });
    this.submitLabelEl = submitBtn.createSpan({ text: `${this.plugin.settings.submitLabel} ` });
    this.submitIconEl = submitBtn.createSpan({ cls: "wr-submit-icon" });
    if (this.plugin.settings.submitIcon) {
      (0, import_obsidian4.setIcon)(this.submitIconEl, this.plugin.settings.submitIcon);
    }
    submitBtn.addEventListener("click", () => this.submitMemo());
    this.submitBtnEl = submitBtn;
    this.textarea = inputArea.createEl("textarea", {
      cls: "wr-textarea",
      attr: { placeholder: this.plugin.settings.inputPlaceholder }
    });
    const autoGrow = () => {
      this.textarea.style.height = "auto";
      this.textarea.style.height = this.textarea.scrollHeight + "px";
    };
    this.textarea.addEventListener("input", autoGrow);
    this.textarea.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const ta = this.textarea;
        const pos = ta.selectionStart;
        const val = ta.value;
        const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
        const line = val.slice(lineStart, pos);
        const checkMatch = line.match(/^- \[[ x]\] (.*)$/);
        const listMatch = !checkMatch && line.match(/^- (.*)$/);
        const olMatch = !checkMatch && !listMatch && line.match(/^(\d+)\.\s?(.*)$/);
        if (checkMatch) {
          e.preventDefault();
          if (checkMatch[1] === "") {
            ta.value = val.slice(0, lineStart) + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = lineStart;
          } else {
            const insert = "\n- [ ] ";
            ta.value = val.slice(0, pos) + insert + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = pos + insert.length;
          }
          ta.dispatchEvent(new Event("input"));
        } else if (listMatch) {
          e.preventDefault();
          if (listMatch[1] === "") {
            ta.value = val.slice(0, lineStart) + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = lineStart;
          } else {
            const insert = "\n- ";
            ta.value = val.slice(0, pos) + insert + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = pos + insert.length;
          }
          ta.dispatchEvent(new Event("input"));
        } else if (olMatch) {
          e.preventDefault();
          if (olMatch[2] === "") {
            ta.value = val.slice(0, lineStart) + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = lineStart;
          } else {
            const nextNum = parseInt(olMatch[1]) + 1;
            const insert = `
${nextNum}. `;
            ta.value = val.slice(0, pos) + insert + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = pos + insert.length;
          }
          ta.dispatchEvent(new Event("input"));
        }
      }
    }, true);
    this.thumbnailContainer = inputArea.createDiv({ cls: "wr-thumbnail-container" });
    this.thumbnailContainer.style.display = "none";
    this.textarea.addEventListener("paste", (e) => {
      var _a;
      const files = (_a = e.clipboardData) == null ? void 0 : _a.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isImageFile(file)) return;
      e.preventDefault();
      this.setPendingImage(file);
    });
    this.textarea.addEventListener("dragover", (e) => {
      var _a;
      if ((_a = e.dataTransfer) == null ? void 0 : _a.types.includes("Files")) {
        e.preventDefault();
      }
    });
    this.textarea.addEventListener("drop", (e) => {
      var _a;
      const files = (_a = e.dataTransfer) == null ? void 0 : _a.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isImageFile(file)) return;
      e.preventDefault();
      this.setPendingImage(file);
    });
    const toolbar = inputArea.createDiv({ cls: "wr-input-toolbar" });
    const imageAddBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(imageAddBtn, "image-plus");
    imageAddBtn.addEventListener("mousedown", (e) => e.preventDefault());
    imageAddBtn.addEventListener("click", () => this.openImagePicker());
    this.imageAddBtn = imageAddBtn;
    const embedBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(embedBtn, "paperclip");
    embedBtn.addEventListener("mousedown", (e) => e.preventDefault());
    const boldBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(boldBtn, "bold");
    boldBtn.addEventListener("mousedown", (e) => e.preventDefault());
    const italicBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(italicBtn, "italic");
    italicBtn.addEventListener("mousedown", (e) => e.preventDefault());
    const listBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(listBtn, "list");
    listBtn.addEventListener("mousedown", (e) => e.preventDefault());
    const checkBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(checkBtn, "list-checks");
    checkBtn.addEventListener("mousedown", (e) => e.preventDefault());
    const olBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    (0, import_obsidian4.setIcon)(olBtn, "list-ordered");
    olBtn.addEventListener("mousedown", (e) => e.preventDefault());
    embedBtn.addEventListener("click", () => {
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelectionWithEmbedBrackets();
      } else {
        this.toggleInlineWrap("![[", "]]");
      }
      this.updateEmbedBtnActive(embedBtn);
    });
    const updateFormatBtns = () => {
      const insideBold = this.isInsideMarker("**");
      const insideItalic = this.isInsideMarker("*");
      boldBtn.toggleClass("wr-toolbar-active", this.activeFormatMode === "bold" || insideBold);
      italicBtn.toggleClass("wr-toolbar-active", this.activeFormatMode === "italic" || insideItalic);
      boldBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "italic" || insideItalic);
      italicBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "bold" || insideBold);
    };
    const validateActiveFormatMode = () => {
      if (this.activeFormatMode === null) return;
      const ta = this.textarea;
      const pos = ta.selectionStart;
      const before = ta.value.slice(0, pos);
      if (this.activeFormatMode === "bold") {
        if (!before.includes("**")) {
          this.activeFormatMode = null;
          updateFormatBtns();
        }
      } else if (this.activeFormatMode === "italic") {
        const stripped = before.replace(/\*\*/g, "");
        if (!stripped.includes("*")) {
          this.activeFormatMode = null;
          updateFormatBtns();
        }
      }
    };
    boldBtn.addEventListener("click", () => {
      if (this.activeFormatMode === "italic" || this.isInsideMarker("*")) return;
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelection("**", "**");
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "bold") {
        const pos = ta.selectionStart;
        if (pos >= 2 && ta.value.slice(pos - 2, pos) === "**") {
          ta.value = ta.value.slice(0, pos - 2) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 2;
        } else {
          ta.value = ta.value.slice(0, pos) + "**" + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos + 2;
        }
        this.activeFormatMode = null;
      } else {
        const pos = ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + "**" + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + 2;
        this.activeFormatMode = "bold";
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    italicBtn.addEventListener("click", () => {
      if (this.activeFormatMode === "bold" || this.isInsideMarker("**")) return;
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelection("*", "*");
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "italic") {
        const pos = ta.selectionStart;
        if (pos >= 1 && ta.value.slice(pos - 1, pos) === "*") {
          ta.value = ta.value.slice(0, pos - 1) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 1;
        } else {
          ta.value = ta.value.slice(0, pos) + "*" + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos + 1;
        }
        this.activeFormatMode = null;
      } else {
        const pos = ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + "*" + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + 1;
        this.activeFormatMode = "italic";
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    listBtn.addEventListener("click", () => {
      this.insertAtLineStart("- ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    checkBtn.addEventListener("click", () => {
      this.insertAtLineStart("- [ ] ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    olBtn.addEventListener("click", () => {
      this.insertAtLineStart("1. ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    const formatBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn wr-format-btn" });
    (0, import_obsidian4.setIcon)(formatBtn, "ellipsis");
    formatBtn.addEventListener("mousedown", (e) => e.preventDefault());
    formatBtn.addEventListener("click", (e) => {
      const ta = this.textarea;
      const hasSelection = ta.selectionStart !== ta.selectionEnd;
      this.openMenu(formatBtn, (menu) => {
        menu.addItem((item) => item.setTitle("\u30B3\u30FC\u30C9").setIcon("code").onClick(() => {
          const t = this.textarea;
          if (t.selectionStart !== t.selectionEnd) {
            this.wrapSelection("`", "`");
          } else {
            this.insertCodeBlock();
          }
        }));
        menu.addItem((item) => item.setTitle("\u6570\u5F0F").setIcon("sigma").onClick(() => {
          const t = this.textarea;
          if (t.selectionStart !== t.selectionEnd) {
            this.wrapSelection("$", "$");
          } else {
            this.insertMathBlock();
          }
        }));
        menu.addItem((item) => item.setTitle("\u5F15\u7528").setIcon("quote").onClick(() => this.toggleBlockPrefix("> ")));
        menu.addSeparator();
        menu.addItem((item) => {
          item.setTitle("\u30EA\u30F3\u30AF").setIcon("link").onClick(() => this.insertMarkdownLink());
          if (!hasSelection) item.setDisabled(true);
        });
        menu.addItem((item) => {
          item.setTitle("\u53D6\u308A\u6D88\u3057\u7DDA").setIcon("strikethrough").onClick(() => this.wrapSelection("~~", "~~"));
          if (!hasSelection) item.setDisabled(true);
        });
        menu.addItem((item) => {
          item.setTitle("\u30CF\u30A4\u30E9\u30A4\u30C8").setIcon("highlighter").onClick(() => this.wrapSelection("==", "=="));
          if (!hasSelection) item.setDisabled(true);
        });
        menu.addSeparator();
        menu.addItem((item) => {
          item.setTitle("\u8A2D\u5B9A").setIcon("settings").onClick(() => {
            const settingApi = this.app.setting;
            if ((settingApi == null ? void 0 : settingApi.open) && (settingApi == null ? void 0 : settingApi.openTabById)) {
              settingApi.open();
              settingApi.openTabById("wrot");
            }
          });
        });
      }, e);
    });
    const updateActive = () => {
      validateActiveFormatMode();
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
      this.updateEmbedBtnActive(embedBtn);
      updateFormatBtns();
      this.updateSubmitBtnState();
    };
    this.registerDomEvent(document, "selectionchange", () => {
      if (document.activeElement === this.textarea) updateActive();
    });
    this.textarea.addEventListener("focus", updateActive);
    this.textarea.addEventListener("input", updateActive);
    const updateToolbarWrapped = () => {
      const buttons = toolbar.querySelectorAll(".wr-toolbar-btn");
      if (buttons.length < 2) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const wrapped = last.offsetTop > first.offsetTop;
      toolbar.toggleClass("wr-toolbar-wrapped", wrapped);
    };
    requestAnimationFrame(updateToolbarWrapped);
    if (typeof ResizeObserver !== "undefined") {
      this.toolbarResizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateToolbarWrapped);
      });
      this.toolbarResizeObserver.observe(toolbar);
    }
  }
  openImagePicker() {
    var _a;
    if (this.pendingImage) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png, image/gif, image/jpeg";
    input.multiple = false;
    input.style.display = "none";
    document.body.appendChild(input);
    (_a = this.imageAddBtn) == null ? void 0 : _a.toggleClass("wr-toolbar-active", true);
    const deactivate = () => {
      var _a2;
      (_a2 = this.imageAddBtn) == null ? void 0 : _a2.toggleClass("wr-toolbar-active", false);
      window.removeEventListener("focus", deactivate);
      window.removeEventListener("pointerdown", onUserTap, true);
    };
    const onUserTap = (e) => {
      var _a2;
      if ((_a2 = this.imageAddBtn) == null ? void 0 : _a2.contains(e.target)) return;
      deactivate();
    };
    window.addEventListener("focus", deactivate);
    window.addEventListener("pointerdown", onUserTap, true);
    input.addEventListener("change", () => {
      var _a2;
      const file = (_a2 = input.files) == null ? void 0 : _a2[0];
      if (file) {
        this.setPendingImage(file);
      }
      document.body.removeChild(input);
      deactivate();
    });
    input.click();
  }
  setPendingImage(file) {
    this.clearPendingImage();
    this.pendingImage = file;
    this.pendingImageUrl = URL.createObjectURL(file);
    this.renderThumbnail();
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }
  clearPendingImage() {
    if (this.pendingImageUrl) {
      URL.revokeObjectURL(this.pendingImageUrl);
      this.pendingImageUrl = null;
    }
    this.pendingImage = null;
    if (this.thumbnailContainer) {
      this.thumbnailContainer.empty();
      this.thumbnailContainer.style.display = "none";
    }
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }
  renderThumbnail() {
    if (!this.thumbnailContainer || !this.pendingImageUrl) return;
    this.thumbnailContainer.empty();
    this.thumbnailContainer.style.display = "";
    const wrap = this.thumbnailContainer.createDiv({ cls: "wr-thumbnail" });
    const img = wrap.createEl("img", { cls: "wr-thumbnail-img" });
    img.src = this.pendingImageUrl;
    const removeBtn = wrap.createEl("button", { cls: "wr-thumbnail-remove" });
    (0, import_obsidian4.setIcon)(removeBtn, "x");
    removeBtn.setAttr("aria-label", "\u753B\u50CF\u3092\u524A\u9664");
    removeBtn.addEventListener("mousedown", (e) => e.preventDefault());
    removeBtn.addEventListener("click", () => this.clearPendingImage());
  }
  updateImageAddBtnState() {
    if (!this.imageAddBtn) return;
    const disabled = this.pendingImage !== null;
    this.imageAddBtn.toggleClass("wr-toolbar-disabled", disabled);
    this.imageAddBtn.disabled = disabled;
  }
  updateSubmitBtnState() {
    if (!this.submitBtnEl) return;
    const hasContent = this.textarea.value.trim().length > 0 || this.pendingImage !== null;
    this.submitBtnEl.toggleClass("wr-submit-active", hasContent);
  }
  async submitMemo() {
    if (this.activeFormatMode) {
      const marker = this.activeFormatMode === "bold" ? "**" : "*";
      this.textarea.value = this.textarea.value + marker;
      this.activeFormatMode = null;
    }
    const rawText = this.textarea.value.trim().replace(/＃/g, "#");
    if (!rawText && !this.pendingImage) return;
    if (this.anchoredToToday && !this.currentDate.isSame(moment(), "day")) {
      this.currentDate = moment();
    }
    try {
      const file = await getOrCreateDailyNote(
        this.app,
        this.currentDate
      );
      let bodyText = rawText;
      if (this.pendingImage) {
        const savedFile = await saveImageToVault(this.app, this.pendingImage, file);
        const embed = buildEmbedLink(savedFile);
        bodyText = insertEmbedAboveBottomBlock(bodyText, embed);
      }
      this.ignoreNextModify = true;
      await appendMemo(this.app, file, bodyText);
      this.textarea.value = "";
      this.textarea.style.height = "";
      this.activeFormatMode = null;
      this.clearPendingImage();
      this.textarea.dispatchEvent(new Event("input"));
      await this.refresh();
    } catch (e) {
      new import_obsidian4.Notice(`\u30E1\u30E2\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${e}`);
    }
  }
  async refresh() {
    if (this.refreshing) return;
    if (Date.now() < this.ignoreModifyUntil) return;
    this.refreshing = true;
    try {
      const isToday = this.currentDate.isSame(moment(), "day");
      const dateText = this.currentDate.format(this.plugin.settings.headerDateFormat);
      this.dateLabel.setText(isToday ? `${dateText}\uFF08\u4ECA\u65E5\uFF09` : dateText);
      this.listContainer.empty();
      const pinnedResolved = await this.resolvePinnedMemos();
      const pinnedTimestamps = new Set(pinnedResolved.map((p) => p.memo.time));
      for (const { memo, filePath } of pinnedResolved) {
        this.renderMemoCard(memo, { pinned: true, filePath });
      }
      const file = getDailyNoteFile(
        this.app,
        this.currentDate
      );
      if (!file) {
        if (pinnedResolved.length === 0) {
          this.listContainer.createDiv({
            cls: "wr-empty",
            text: "\u30E1\u30E2\u306F\u3042\u308A\u307E\u305B\u3093"
          });
        }
        return;
      }
      const content = await this.app.vault.cachedRead(file);
      const memos = parseMemos(content);
      if (memos.length === 0) {
        if (pinnedResolved.length === 0) {
          this.listContainer.createDiv({
            cls: "wr-empty",
            text: "\u30E1\u30E2\u306F\u3042\u308A\u307E\u305B\u3093"
          });
        }
        return;
      }
      for (const memo of memos) {
        if (pinnedTimestamps.has(memo.time)) continue;
        this.renderMemoCard(memo, { pinned: false, filePath: file.path });
      }
    } finally {
      this.refreshing = false;
    }
  }
  // \u30d4\u30f3\u8a2d\u5b9a\u304b\u3089\u5b9f\u4f53\u30e1\u30e2\u3092\u89e3\u6c7a\u3059\u308b\uff08\u8a2d\u5b9a\u306e\u6574\u7406\u306f\u30d4\u30f3\u8ffd\u52a0/\u524a\u9664\u5074\u3067\u884c\u3046\uff09
  async resolvePinnedMemos() {
    const pins = this.plugin.settings.pins;
    if (!pins || pins.length === 0) return [];
    const resolved = [];
    const seenFiles = /* @__PURE__ */ new Map();
    for (const pin of pins) {
      let memos = seenFiles.get(pin.file);
      if (memos === void 0) {
        const file = this.app.vault.getAbstractFileByPath(pin.file);
        if (!(file instanceof import_obsidian4.TFile)) {
          seenFiles.set(pin.file, null);
          continue;
        }
        const content = await this.app.vault.cachedRead(file);
        memos = parseMemos(content);
        seenFiles.set(pin.file, memos);
      }
      if (!memos) continue;
      const memo = memos.find((m) => m.time === pin.timestamp);
      if (memo) {
        resolved.push({ memo, filePath: pin.file });
      }
    }
    return resolved;
  }
  isPinned(memo) {
    return this.plugin.settings.pins.some((p) => p.timestamp === memo.time);
  }
  async cleanupOrphanPins() {
    const pins = this.plugin.settings.pins;
    if (pins.length === 0) return false;
    const cache = /* @__PURE__ */ new Map();
    const surviving = [];
    for (const pin of pins) {
      let memos = cache.get(pin.file);
      if (memos === void 0) {
        const file = this.app.vault.getAbstractFileByPath(pin.file);
        if (!(file instanceof import_obsidian4.TFile)) {
          cache.set(pin.file, null);
          continue;
        }
        const content = await this.app.vault.cachedRead(file);
        memos = parseMemos(content);
        cache.set(pin.file, memos);
      }
      if (!memos) continue;
      if (memos.some((m) => m.time === pin.timestamp)) {
        surviving.push(pin);
      }
    }
    if (surviving.length === pins.length) return false;
    this.plugin.settings.pins = surviving;
    await this.plugin.saveSettings();
    return true;
  }
  async addPin(memo, filePath) {
    await this.cleanupOrphanPins();
    const limit = this.plugin.settings.pinLimit;
    if (this.plugin.settings.pins.length >= limit) return;
    if (this.isPinned(memo)) return;
    this.plugin.settings.pins = [
      { timestamp: memo.time, file: filePath },
      ...this.plugin.settings.pins
    ];
    await this.plugin.saveSettings();
    await this.refresh();
  }
  async removePin(memo) {
    const before = this.plugin.settings.pins.length;
    this.plugin.settings.pins = this.plugin.settings.pins.filter(
      (p) => p.timestamp !== memo.time
    );
    if (this.plugin.settings.pins.length !== before) {
      await this.plugin.saveSettings();
    }
    await this.cleanupOrphanPins();
    await this.refresh();
  }
  async jumpToDailyNoteBlock(memo, filePath) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof import_obsidian4.TFile)) {
      new import_obsidian4.Notice("\u5143\u306E\u30CE\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
      await this.cleanupOrphanPins();
      await this.refresh();
      return;
    }
    await this.openOrFocusFile(file);
    const blockId = `wr-${memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17)}`;
    await this.app.workspace.openLinkText(
      `${file.basename}#^${blockId}`,
      file.path,
      false
    );
    flashJumpTarget(blockId, this.app, (rc) => this.plugin.getRuleAccentColor(rc));
  }
  renderMemoCard(memo, options) {
    const card = this.listContainer.createDiv({ cls: "wr-card" });
    if (options.pinned) card.classList.add("wr-card-pinned");
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    card.classList.add(`wr-block-id-wr-${T}`);
    const rule = this.plugin.findTagColorRule(memo.tags);
    if (rule) {
      const idx = this.plugin.settings.tagColorRules.indexOf(rule);
      if (idx >= 0) card.classList.add(`wr-tag-rule-${idx}`);
    }
    const contentEl = card.createDiv({ cls: "wr-content" });
    const resolveImagePath = (fileName) => {
      const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
      return file ? this.app.vault.getResourcePath(file) : null;
    };
    const currentFile = getDailyNoteFile(this.app, this.currentDate);
    const currentFilePath = (currentFile == null ? void 0 : currentFile.path) || "";
    const urls = renderTextWithTagsAndUrls(contentEl, memo.content, {
      onTagClick: (tag) => this.openSearch(tag),
      onCheckToggle: async (lineIndex) => {
        const file = getDailyNoteFile(this.app, this.currentDate);
        if (!file) return;
        const fileLine = memo.lineStart + 1 + lineIndex;
        this.ignoreModifyUntil = Date.now() + 500;
        this.plugin.quoteRefreshSuppressedUntil = Date.now() + 500;
        await toggleCheckbox(this.app, file, fileLine);
      },
      onInternalLinkClick: (linkName) => {
        this.app.workspace.openLinkText(linkName, "", false);
      },
      checkStrikethrough: this.plugin.settings.checkStrikethrough,
      resolveImagePath,
      resolveLinkTarget: (linkName) => {
        return this.app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
      },
      renderQuoteCard: (slot, fileName, blockId) => {
        renderQuoteCard(slot, fileName, blockId, this.app, currentFilePath, {
          timestampFormat: this.plugin.settings.timestampFormat,
          resolveRuleClass: (content) => this.plugin.getTagRuleClassForContent(content),
          resolveRuleAccent: (ruleClass) => this.plugin.getRuleAccentColor(ruleClass)
        });
      },
      renderCodeBlock: (code, lang, blockEl, fenceTildes) => {
        const fence = "~".repeat(Math.max(3, fenceTildes));
        const source = (lang ? `${fence}${lang}
` : `${fence}
`) + code + `
${fence}`;
        import_obsidian4.MarkdownRenderer.render(this.app, source, blockEl, "", this).catch(() => {
          const pre = blockEl.createEl("pre");
          const codeEl = pre.createEl("code");
          if (lang) codeEl.addClass(`language-${lang}`);
          codeEl.textContent = code;
        });
      },
      renderMathBlock: (tex, blockEl) => {
        try {
          const rendered = (0, import_obsidian4.renderMath)(tex, true);
          blockEl.appendChild(rendered);
          (0, import_obsidian4.finishRenderMath)();
        } catch (e) {
          blockEl.textContent = tex;
        }
      }
    });
    const previewUrls = urls.filter(
      (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
    );
    if (previewUrls.length > 0) {
      const mediaEl = document.createElement("div");
      mediaEl.className = "wr-media-area";
      const quoteSlot = contentEl.querySelector(".wr-quote-card-slot");
      if (quoteSlot && quoteSlot.parentNode) {
        quoteSlot.parentNode.insertBefore(mediaEl, quoteSlot);
      } else {
        card.appendChild(mediaEl);
      }
      renderUrlPreviews(mediaEl, previewUrls, this.plugin.ogpCache, resolveImagePath);
    }
    const footer = card.createDiv({ cls: "wr-card-footer" });
    const fmt = this.plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm:ss";
    const formatted = moment(memo.time).format(fmt);
    footer.createEl("span", { cls: "wr-timestamp", text: formatted });
    const menuBtn = footer.createEl("span", { cls: "wr-menu-btn" });
    (0, import_obsidian4.setIcon)(menuBtn, "ellipsis");
    menuBtn.addEventListener("click", async (e) => {
      await this.cleanupOrphanPins();
      const pinned = this.isPinned(memo);
      const pinLimit = this.plugin.settings.pinLimit;
      const limitReached = !pinned && this.plugin.settings.pins.length >= pinLimit;
      this.openMenu(menuBtn, (menu) => {
        menu.addItem(
          (item) => item.setTitle("\u30B3\u30D4\u30FC").setIcon("copy").onClick(async () => {
            await navigator.clipboard.writeText(memo.content);
          })
        );
        menu.addItem(
          (item) => item.setTitle("\u5F15\u7528").setIcon("quote").onClick(() => {
            this.insertQuoteToForm(memo, options.filePath);
          })
        );
        if (pinned) {
          menu.addItem(
            (item) => item.setTitle("\u5143\u306E\u30CE\u30FC\u30C8\u3078\u30B8\u30E3\u30F3\u30D7").setIcon("reply").onClick(async () => {
              await this.jumpToDailyNoteBlock(memo, options.filePath);
            })
          );
          menu.addItem(
            (item) => item.setTitle("\u30D4\u30F3\u3092\u5916\u3059").setIcon("pin-off").onClick(async () => {
              await this.removePin(memo);
            })
          );
        } else {
          menu.addItem((item) => {
            item.setTitle("\u30D4\u30F3\u7559\u3081").setIcon("pin").onClick(async () => {
              if (limitReached) return;
              await this.addPin(memo, options.filePath);
            });
            if (limitReached) item.setDisabled(true);
          });
          if (limitReached) {
            menu.addItem((item) => {
              item.setTitle(`\u30D4\u30F3\u7559\u3081\u306F${pinLimit}\u4EF6\u307E\u3067\u3067\u3059\u3002`).setDisabled(true);
              const itemDom = item.dom;
              itemDom == null ? void 0 : itemDom.classList.add("wr-menu-hint", "is-label");
            });
          }
        }
      }, e);
    });
    if (options.pinned) {
      const pinIndicator = card.createEl("span", { cls: "wr-pin-indicator" });
      (0, import_obsidian4.setIcon)(pinIndicator, "pin");
    }
  }
  insertAtLineStart(prefix) {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lineStart = pos > 0 ? val.lastIndexOf("\n", pos - 1) + 1 : 0;
    const lineText = val.slice(lineStart, val.indexOf("\n", lineStart) === -1 ? void 0 : val.indexOf("\n", lineStart));
    const prefixes = ["- [ ] ", "- [x] ", "- "];
    let existingPrefix = "";
    for (const p of prefixes) {
      if (lineText.startsWith(p)) {
        existingPrefix = p;
        break;
      }
    }
    if (!existingPrefix) {
      const olMatch = lineText.match(/^\d+\.\s?/);
      if (olMatch) existingPrefix = olMatch[0];
    }
    const isSameType = existingPrefix === prefix || prefix === "1. " && existingPrefix.match(/^\d+\. $/);
    if (isSameType) {
      ta.value = val.slice(0, lineStart) + val.slice(lineStart + existingPrefix.length);
      ta.selectionStart = ta.selectionEnd = lineStart;
    } else if (existingPrefix) {
      ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart + existingPrefix.length);
      ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
    } else {
      ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart);
      ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
    }
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  async insertQuoteToForm(memo, srcFilePath) {
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    const blockId = `wr-${T}`;
    const srcFile = this.app.vault.getAbstractFileByPath(srcFilePath);
    if (!(srcFile instanceof import_obsidian4.TFile)) return;
    this.ignoreNextModify = true;
    this.plugin.quoteRefreshSuppressedUntil = Date.now() + 500;
    await ensureBlockIdOnFence(this.app, srcFile, memo.time, blockId);
    const fileBaseName = srcFile.basename;
    const marker = `[[${fileBaseName}#^${blockId}]]`;
    const ta = this.textarea;
    const QUOTE_RE = /\[\[[^\[\]]+#\^wr-\d{17}\]\]/g;
    const existing = ta.value;
    let next;
    let cursorPos;
    if (QUOTE_RE.test(existing)) {
      next = existing.replace(QUOTE_RE, marker);
      cursorPos = 0;
    } else if (existing.length === 0) {
      next = `
${marker}`;
      cursorPos = 0;
    } else {
      next = `${existing}

${marker}`;
      cursorPos = existing.length + 1;
    }
    ta.value = next;
    ta.selectionStart = ta.selectionEnd = cursorPos;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  insertCodeBlock() {
    this.insertFenceBlock("~~~\n\n~~~");
  }
  insertMathBlock() {
    this.insertFenceBlock("$$\n\n$$");
  }
  insertFenceBlock(insert) {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lineStart = pos > 0 ? val.lastIndexOf("\n", pos - 1) + 1 : 0;
    const currentLineIsEmpty = val.slice(lineStart, pos).trim() === "" && (val.indexOf("\n", pos) === -1 || val.slice(pos, val.indexOf("\n", pos)).trim() === "");
    let before = val.slice(0, lineStart);
    let after = val.slice(lineStart);
    if (!currentLineIsEmpty) {
      const needsLeadingNewline = before.length > 0 && !before.endsWith("\n\n");
      if (needsLeadingNewline) before += before.endsWith("\n") ? "\n" : "\n\n";
      after = "\n" + after;
    }
    const afterStripped = after.replace(/^\n+/, "");
    let separator = "";
    if (afterStripped.length > 0) {
      separator = "\n";
      after = afterStripped;
    }
    const cursorOffset = before.length + 3;
    ta.value = before + insert + separator + after;
    ta.selectionStart = ta.selectionEnd = cursorOffset;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  updateToolbarActive(listBtn, checkBtn, olBtn) {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineEnd = val.indexOf("\n", lineStart);
    const line = val.slice(lineStart, lineEnd === -1 ? void 0 : lineEnd);
    const isList = line.startsWith("- ") && !line.match(/^- \[[ x]\] /);
    const isCheck = !!line.match(/^- \[[ x]\] /);
    const isOl = !!line.match(/^\d+\.\s?/);
    listBtn.toggleClass("wr-toolbar-active", isList);
    checkBtn.toggleClass("wr-toolbar-active", isCheck);
    olBtn.toggleClass("wr-toolbar-active", isOl);
  }
  // 選択範囲が指定マーカー(**または*)で完全に囲まれているか判定する。
  // 選択なし時は常にfalse(カーソル移動でボタン状態が揺れるUXを避けるため)
  isInsideMarker(marker) {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return false;
    const selected = ta.value.slice(start, end);
    if (marker === "**") {
      return /^\*\*[\s\S]+\*\*$/.test(selected);
    }
    if (!/^\*[\s\S]+\*$/.test(selected)) return false;
    if (selected.startsWith("**") || selected.endsWith("**")) return false;
    return true;
  }
  updateEmbedBtnActive(embedBtn) {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    let isEmbed = false;
    if (start !== end) {
      isEmbed = /^!?\[\[[^\]]*\]\]$/.test(val.slice(start, end));
    } else {
      const before = val.slice(Math.max(0, start - 100), start);
      const after = val.slice(start, start + 100);
      isEmbed = !!before.match(/!\[\[([^\]]*?)$/) && !!after.match(/^([^\]]*?)\]\]/);
    }
    embedBtn.toggleClass("wr-toolbar-active", isEmbed);
  }
  toggleInlineWrap(open, close) {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const before = val.slice(Math.max(0, pos - 100), pos);
    const after = val.slice(pos, pos + 100);
    const wrapTypes = [
      ["![[", "]]", /!\[\[([^\]]*?)$/, /^([^\]]*?)\]\]/],
      ["`", "`", /`([^`]*?)$/, /^([^`]*?)`/],
      ["$", "$", /\$([^$]*?)$/, /^([^$]*?)\$/]
    ];
    let currentType = null;
    let currentBefore = null;
    let currentAfter = null;
    for (const [wo, wc, beforeRe, afterRe] of wrapTypes) {
      const bm = before.match(beforeRe);
      const am = after.match(afterRe);
      if (bm && am) {
        currentType = [wo, wc];
        currentBefore = bm;
        currentAfter = am;
        break;
      }
    }
    if (!currentType || !currentBefore || !currentAfter) {
      const insert = open + close;
      ta.value = val.slice(0, pos) + insert + val.slice(pos);
      ta.selectionStart = ta.selectionEnd = pos + open.length;
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      return;
    }
    const start = pos - currentBefore[0].length;
    const end = pos + currentAfter[0].length;
    const content = currentBefore[1] + currentAfter[1];
    if (currentType[0] === open) {
      ta.value = val.slice(0, start) + content + val.slice(end);
      ta.selectionStart = ta.selectionEnd = start + currentBefore[1].length;
    } else {
      ta.value = val.slice(0, start) + open + content + close + val.slice(end);
      ta.selectionStart = ta.selectionEnd = start + open.length + currentBefore[1].length;
    }
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  wrapSelection(open, close) {
    const ta = this.textarea;
    let start = ta.selectionStart;
    let end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;
    const markers = ["**", "*", "~~", "==", "$"];
    const orderedForInner = open === "*" ? ["*", "**", "~~", "==", "$"] : open === "**" ? ["**", "*", "~~", "==", "$"] : markers;
    for (const m of orderedForInner) {
      const selected = val.slice(start, end);
      if (m === "*" && (selected.startsWith("**") || selected.endsWith("**"))) continue;
      if (selected.length >= m.length * 2 && selected.startsWith(m) && selected.endsWith(m)) {
        const inner = selected.slice(m.length, selected.length - m.length);
        ta.value = val.slice(0, start) + inner + val.slice(end);
        ta.selectionStart = start;
        ta.selectionEnd = start + inner.length;
        ta.focus();
        ta.dispatchEvent(new Event("input"));
        return;
      }
    }
    let unwrapped = false;
    for (const m of markers) {
      const before = val.slice(start - m.length, start);
      const after = val.slice(end, end + m.length);
      if (before === m && after === m) {
        const newVal = val.slice(0, start - m.length) + val.slice(start, end) + val.slice(end + m.length);
        start -= m.length;
        end -= m.length;
        ta.value = newVal;
        unwrapped = true;
        if (m === open) {
          ta.selectionStart = start;
          ta.selectionEnd = end;
          ta.focus();
          ta.dispatchEvent(new Event("input"));
          return;
        }
        break;
      }
    }
    const currentVal = ta.value;
    ta.value = currentVal.slice(0, start) + open + currentVal.slice(start, end) + close + currentVal.slice(end);
    ta.selectionStart = start;
    ta.selectionEnd = end + open.length + close.length;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  // 選択範囲を `![[...]]` で挟む。既に挟まれていれば外す。入れ子になる場合は何もしない
  wrapSelectionWithEmbedBrackets() {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;
    const selected = val.slice(start, end);
    const unwrapMatch = selected.match(/^(!?)\[\[([^\]]*)\]\]$/);
    if (unwrapMatch) {
      const inner = unwrapMatch[2];
      const newVal2 = val.slice(0, start) + inner + val.slice(end);
      ta.value = newVal2;
      const caret2 = start + inner.length;
      ta.selectionStart = ta.selectionEnd = caret2;
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      return;
    }
    if (/!?\[\[[^\]]*\]\]/.test(selected)) return;
    const wrapped = "![[" + selected + "]]";
    const newVal = val.slice(0, start) + wrapped + val.slice(end);
    ta.value = newVal;
    const caret = start + wrapped.length;
    ta.selectionStart = ta.selectionEnd = caret;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  toggleBlockPrefix(prefix) {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = val.indexOf("\n", end - 1);
    const blockEnd = lineEnd === -1 ? val.length : lineEnd;
    const block = val.slice(lineStart, blockEnd);
    const lines = block.split("\n");
    const allHavePrefix = lines.every((l) => l.startsWith(prefix));
    const newLines = allHavePrefix ? lines.map((l) => l.slice(prefix.length)) : lines.map((l) => prefix + l);
    const newBlock = newLines.join("\n");
    ta.value = val.slice(0, lineStart) + newBlock + val.slice(blockEnd);
    const diff = newBlock.length - block.length;
    ta.selectionStart = ta.selectionEnd = blockEnd + diff;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  openSearch(tag) {
    var _a, _b;
    const searchPlugin = (_b = (_a = this.app.internalPlugins) == null ? void 0 : _a.getPluginById) == null ? void 0 : _b.call(
      _a,
      "global-search"
    );
    if (searchPlugin == null ? void 0 : searchPlugin.instance) {
      searchPlugin.instance.openGlobalSearch(`"${tag.replace(/"/g, '\\"')}"`);
    } else {
      new import_obsidian4.Notice("\u691C\u7D22\u30D7\u30E9\u30B0\u30A4\u30F3\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    }
  }
  insertMarkdownLink() {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;
    const selected = val.slice(start, end);
    ta.value = val.slice(0, start) + "[" + selected + "]()" + val.slice(end);
    const cursorPos = start + 1 + selected.length + 2;
    ta.selectionStart = ta.selectionEnd = cursorPos;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }
  // メニューは同時に1つだけ開く。トリガーボタンには開いている間 active クラスを付与
  openMenu(trigger, buildMenu, evt) {
    if (this.currentMenu) {
      this.currentMenu.hide();
    }
    const menu = new import_obsidian4.Menu();
    buildMenu(menu);
    const menuDom = menu.dom;
    menuDom == null ? void 0 : menuDom.classList.add("wr-menu");
    trigger.toggleClass("wr-toolbar-active", true);
    this.currentMenu = menu;
    menu.onHide(() => {
      trigger.toggleClass("wr-toolbar-active", false);
      if (this.currentMenu === menu) {
        this.currentMenu = null;
      }
    });
    menu.showAtMouseEvent(evt);
  }
};

// src/postProcessor.ts
var import_obsidian5 = require("obsidian");
init_blockSegmenter();
function registerWrotPostProcessor(plugin) {
  plugin.registerMarkdownPostProcessor((el2, ctx) => {
    highlightAllWrBlocks(el2, plugin);
    void applyBlockIdClasses(el2, plugin, ctx == null ? void 0 : ctx.sourcePath);
  });
  plugin.registerEvent(
    plugin.app.workspace.on("active-leaf-change", () => {
      rehighlightAllReadingViews(plugin);
    })
  );
  plugin.registerEvent(
    plugin.app.workspace.on("layout-change", () => {
      rehighlightAllReadingViews(plugin);
    })
  );
  plugin.registerEvent(
    plugin.app.vault.on("modify", (file) => {
      if (!(file instanceof import_obsidian5.TFile)) return;
      invalidateMemoCache(file.path);
      if (Date.now() < plugin.quoteRefreshSuppressedUntil) return;
      refreshQuoteCardsForFile(
        plugin.app,
        file,
        (content) => plugin.getTagRuleClassForContent(content),
        (ruleClass) => plugin.getRuleAccentColor(ruleClass)
      );
    })
  );
  plugin.registerEvent(
    plugin.app.vault.on("delete", (file) => {
      if (!(file instanceof import_obsidian5.TFile)) return;
      invalidateMemoCache(file.path);
      refreshQuoteCardsForFile(
        plugin.app,
        file,
        (content) => plugin.getTagRuleClassForContent(content),
        (ruleClass) => plugin.getRuleAccentColor(ruleClass)
      );
    })
  );
}
function highlightAllWrBlocks(el2, plugin) {
  const codeEls = el2.querySelectorAll(
    'code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]'
  );
  codeEls.forEach((code) => {
    const codeEl = code;
    const text = code.textContent || "";
    if (!text.trim()) return;
    const parentBlock = code.closest(".block-language-wr") || code.closest("pre");
    if (parentBlock instanceof HTMLElement) {
      applyTagRuleClass(parentBlock, codeEl, plugin);
    }
    const hasProcessedInCode = code.querySelector(".wr-reading-tag, .wr-reading-url, .wr-internal-link, .wr-inline-code");
    const hasProcessedInBlock = parentBlock == null ? void 0 : parentBlock.querySelector(".wr-reading-list, .wr-blockquote, .wr-embed-img, .wr-plain-text, .wr-codeblock-display, .wr-math-display");
    if (hasProcessedInCode || hasProcessedInBlock) return;
    processCodeBlock(codeEl, plugin);
  });
}
function rehighlightAllReadingViews(plugin) {
  setTimeout(() => {
    document.querySelectorAll(".markdown-reading-view").forEach((view) => {
      highlightAllWrBlocks(view, plugin);
    });
  }, 100);
}
async function applyBlockIdClasses(el2, plugin, sourcePath) {
  const codeEls = el2.querySelectorAll(
    'code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]'
  );
  if (codeEls.length === 0) return;
  if (!sourcePath) return;
  const file = plugin.app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof import_obsidian5.TFile)) return;
  let memos;
  try {
    const content = await plugin.app.vault.cachedRead(file);
    const { parseMemos: parseMemos2 } = await Promise.resolve().then(() => (init_memoParser(), memoParser_exports));
    memos = parseMemos2(content);
  } catch (e) {
    return;
  }
  codeEls.forEach((code) => {
    const codeEl = code;
    const block = codeEl.closest(".block-language-wr") || codeEl.closest("pre");
    if (!(block instanceof HTMLElement)) return;
    if (Array.from(block.classList).some((c) => c.startsWith("wr-block-id-wr-"))) return;
    const codeText = (codeEl.getAttribute("data-wr-original") || codeEl.textContent || "").trim();
    if (!codeText) return;
    const memo = memos.find((m) => m.content.trim() === codeText);
    if (!memo) return;
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    block.classList.add(`wr-block-id-wr-${T}`);
  });
}
function applyTagRuleClass(block, code, plugin) {
  const container = block.parentElement;
  const targets = [block];
  if (container) {
    container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el2) => {
      if (el2 instanceof HTMLElement) targets.push(el2);
    });
  }
  block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el2) => {
    if (el2 instanceof HTMLElement) targets.push(el2);
  });
  for (const t of targets) {
    const existing = Array.from(t.classList);
    for (const cls2 of existing) {
      if (/^wr-tag-rule-\d+$/.test(cls2)) t.classList.remove(cls2);
    }
  }
  const rawText = code.getAttribute("data-wr-original") || code.textContent || "";
  const blockTags = rawText.match(/#[^\s#]+/g) || [];
  const rule = plugin.findTagColorRule(blockTags);
  if (!rule) return;
  const idx = plugin.settings.tagColorRules.indexOf(rule);
  if (idx < 0) return;
  const cls = `wr-tag-rule-${idx}`;
  for (const t of targets) t.classList.add(cls);
}
function processCodeBlock(code, plugin) {
  var _a;
  const block = code.closest(".block-language-wr") || code.closest("pre");
  if (!block) return;
  const container = block.parentElement || block;
  container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el2) => {
    el2.classList.add("wr-flair-bg");
  });
  block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el2) => {
    el2.classList.add("wr-flair-bg");
  });
  const copyButtons = [
    ...Array.from(container.querySelectorAll(".copy-code-button")),
    ...Array.from(block.querySelectorAll(".copy-code-button"))
  ];
  const resolveAccentForBlock = () => {
    var _a2;
    const ruleClass = Array.from(block.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
    if (ruleClass) {
      const idx = parseInt(ruleClass.slice("wr-tag-rule-".length), 10);
      const rule = (_a2 = plugin.settings.tagColorRules) == null ? void 0 : _a2[idx];
      if ((rule == null ? void 0 : rule.accentColor) && /^#[0-9a-fA-F]{6}$/.test(rule.accentColor)) {
        return rule.accentColor;
      }
    }
    return getComputedStyle(document.body).getPropertyValue("--text-accent").trim() || "#adc718";
  };
  for (const btn of copyButtons) {
    btn.addEventListener("click", () => {
      const successColor = resolveAccentForBlock();
      const applySvgColor = () => {
        btn.querySelectorAll("svg, svg *").forEach((svg) => {
          svg.setAttribute("stroke", successColor);
          svg.setAttribute("color", successColor);
        });
      };
      applySvgColor();
      setTimeout(applySvgColor, 50);
      setTimeout(applySvgColor, 150);
    });
  }
  block.querySelectorAll(".wr-media-area").forEach((el2) => el2.remove());
  const resolveImagePath = (fileName) => {
    const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
    return file ? plugin.app.vault.getResourcePath(file) : null;
  };
  const blockFullText = code.textContent || "";
  const hasQuoteMarker = /\[\[[^\[\]]+#\^wr-\d{17}\]\]/.test(blockFullText);
  convertListLines(code, plugin);
  const tailUrls = [];
  const tailEmbedImages = [];
  const walkTargets = [code];
  block.querySelectorAll(".wr-reading-list, .wr-blockquote, .wr-plain-text").forEach((el2) => {
    walkTargets.push(el2);
  });
  for (const walkTarget of walkTargets) {
    const walker = document.createTreeWalker(walkTarget, NodeFilter.SHOW_TEXT);
    let textNode;
    const nodesToReplace = [];
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent || "";
      if (!text.includes("#") && !text.match(/(?:https?|obsidian):\/\//) && !text.includes("[[") && !text.includes("`") && !text.includes("*") && !text.includes("~") && !text.includes("=") && !text.includes("$")) continue;
      const frag = document.createDocumentFragment();
      const parts = text.split(/(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+=+|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)|#[^\s#]+|(?:https?|obsidian):\/\/[^\s<>"'\]]+)/g);
      let hasMatch = false;
      const IMAGE_EXT = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;
      for (const part of parts) {
        if (!part) continue;
        const codeMatch = part.match(/^`([^`]+)`$/);
        if (codeMatch) {
          const codeEl = document.createElement("span");
          codeEl.className = "wr-inline-code";
          const tickOpen = document.createElement("span");
          tickOpen.className = "wr-backtick";
          tickOpen.textContent = "`";
          const tickClose = document.createElement("span");
          tickClose.className = "wr-backtick";
          tickClose.textContent = "`";
          codeEl.appendChild(tickOpen);
          codeEl.appendChild(document.createTextNode(codeMatch[1]));
          codeEl.appendChild(tickClose);
          frag.appendChild(codeEl);
          hasMatch = true;
          continue;
        }
        const formatPatterns = [
          [/^\*\*(.+)\*\*$/, "strong", "**"],
          [/^\*(.+)\*$/, "em", "*"],
          [/^~~(.+)~~$/, "del", "~~"],
          [/^==(.+)==$/, "mark", "=="]
        ];
        let formatHandled = false;
        for (const [re, tag, marker] of formatPatterns) {
          const m = part.match(re);
          if (m) {
            const el2 = document.createElement(tag);
            if (tag === "mark") el2.className = "wr-highlight";
            const mOpen = document.createElement("span");
            mOpen.className = "wr-backtick";
            mOpen.textContent = marker;
            const mClose = document.createElement("span");
            mClose.className = "wr-backtick";
            mClose.textContent = marker;
            el2.appendChild(mOpen);
            el2.appendChild(document.createTextNode(m[1]));
            el2.appendChild(mClose);
            frag.appendChild(el2);
            hasMatch = true;
            formatHandled = true;
            break;
          }
        }
        if (formatHandled) continue;
        const mdLinkMatch = part.match(/^\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)$/);
        if (mdLinkMatch) {
          const label = mdLinkMatch[1];
          const url = mdLinkMatch[2];
          if (isSafeUrl(url)) {
            const span = document.createElement("span");
            span.className = "wr-reading-url";
            span.textContent = label;
            span.addEventListener("pointerup", (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isSafeUrl(url)) window.open(url, "_blank");
            });
            frag.appendChild(span);
            if (url.startsWith("http")) tailUrls.push(url);
            hasMatch = true;
          } else {
            frag.appendChild(document.createTextNode(part));
          }
          continue;
        }
        const embedMatch = part.match(/^!\[\[(.+)\]\]$/);
        const linkMatch = !embedMatch && part.match(/^\[\[(.+)\]\]$/);
        if (embedMatch) {
          const fileName = embedMatch[1];
          if (IMAGE_EXT.test(fileName)) {
            const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
            if (file) {
              const img = document.createElement("img");
              img.className = hasQuoteMarker ? "wr-embed-img wr-rv-inline-img" : "wr-embed-img";
              img.src = plugin.app.vault.getResourcePath(file);
              img.alt = fileName;
              img.loading = "lazy";
              if (hasQuoteMarker) {
                frag.appendChild(img);
              } else {
                tailEmbedImages.push(img);
              }
              hasMatch = true;
              continue;
            } else {
              const span = document.createElement("span");
              span.className = "wr-embed-missing";
              span.textContent = `![[${fileName}]]`;
              frag.appendChild(span);
            }
            hasMatch = true;
            continue;
          } else {
            const a = document.createElement("a");
            const resolved = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") !== null;
            a.className = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
            a.textContent = fileName;
            a.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              plugin.app.workspace.openLinkText(fileName, "", false);
            });
            frag.appendChild(a);
          }
          hasMatch = true;
        } else if (linkMatch) {
          const linkName = linkMatch[1];
          const quoteMatch = linkName.match(QUOTE_LINK_RE);
          if (quoteMatch) {
            const slot = document.createElement("span");
            slot.className = "wr-quote-card-slot";
            renderQuoteCard(slot, quoteMatch[1], quoteMatch[2], plugin.app, "", {
              timestampFormat: plugin.settings.timestampFormat,
              resolveRuleClass: (content) => plugin.getTagRuleClassForContent(content),
              resolveRuleAccent: (ruleClass) => plugin.getRuleAccentColor(ruleClass)
            });
            frag.appendChild(slot);
          } else {
            const a = document.createElement("a");
            const resolved = plugin.app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
            a.className = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
            a.textContent = linkName;
            a.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              plugin.app.workspace.openLinkText(linkName, "", false);
            });
            frag.appendChild(a);
          }
          hasMatch = true;
        } else if (part.match(/^#[^\s#]+$/)) {
          const span = document.createElement("span");
          span.className = "wr-reading-tag";
          span.textContent = part;
          frag.appendChild(span);
          hasMatch = true;
        } else if (part.match(/^\$([^$]+)\$$/)) {
          const mathContent = part.slice(1, -1);
          const mathEl = document.createElement("span");
          mathEl.className = "wr-math";
          try {
            const { renderMath: renderMath3, finishRenderMath: finishRenderMath3 } = require("obsidian");
            const rendered = renderMath3(mathContent, false);
            mathEl.appendChild(rendered);
            finishRenderMath3();
          } catch (e) {
            mathEl.textContent = part;
          }
          frag.appendChild(mathEl);
          hasMatch = true;
        } else if (part.match(/^obsidian:\/\//)) {
          const cleaned = part.replace(/[.,;:!?)]+$/, "");
          const trailing = part.slice(cleaned.length);
          let fileName = null;
          try {
            const params = new URL(cleaned).searchParams;
            const filePath = params.get("file");
            if (filePath) {
              const decoded = decodeURIComponent(filePath);
              fileName = decoded.split("/").pop() || decoded;
            }
          } catch (e) {
          }
          const lowerName = (fileName == null ? void 0 : fileName.toLowerCase()) || "";
          const looksLikeImage = IMAGE_EXT.test(lowerName);
          const resolved = fileName ? plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") : null;
          const isImageEmbed = looksLikeImage && resolved !== null;
          const isUnresolvedImage = looksLikeImage && resolved === null;
          if (!isImageEmbed) {
            const link = document.createElement("a");
            link.className = isUnresolvedImage ? "wr-internal-link wr-internal-link-unresolved" : "wr-internal-link";
            link.textContent = fileName || cleaned;
            link.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isSafeUrl(cleaned)) window.open(cleaned);
            });
            frag.appendChild(link);
            if (trailing) frag.appendChild(document.createTextNode(trailing));
          } else if (trailing) {
            frag.appendChild(document.createTextNode(trailing));
          }
          tailUrls.push(cleaned);
          hasMatch = true;
        } else if (part.match(/^https?:\/\//)) {
          const cleaned = part.replace(/[.,;:!?)]+$/, "");
          const trailing = part.slice(cleaned.length);
          const span = document.createElement("span");
          span.className = "wr-reading-url";
          span.textContent = cleaned;
          span.addEventListener("pointerup", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSafeUrl(cleaned)) window.open(cleaned, "_blank");
          });
          frag.appendChild(span);
          if (trailing) {
            frag.appendChild(document.createTextNode(trailing));
          }
          tailUrls.push(cleaned);
          hasMatch = true;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }
      if (hasMatch) {
        nodesToReplace.push({ node: textNode, fragments: frag });
      }
    }
    for (const { node, fragments } of nodesToReplace) {
      (_a = node.parentNode) == null ? void 0 : _a.replaceChild(fragments, node);
    }
  }
  const blockEl = code.closest(".block-language-wr") || code.closest("pre");
  if (blockEl) {
    const quoteSlot = hasQuoteMarker ? blockEl.querySelector(".wr-quote-card-slot") : null;
    const insertMediaNode = (node) => {
      if (quoteSlot && quoteSlot.parentNode) {
        quoteSlot.parentNode.insertBefore(node, quoteSlot);
      } else {
        blockEl.appendChild(node);
      }
    };
    if (tailEmbedImages.length > 0) {
      for (const img of tailEmbedImages) {
        insertMediaNode(img);
      }
    }
    if (tailUrls.length > 0) {
      const parsedUrls = extractUrls(tailUrls.join(" ")).filter(
        (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
      );
      if (parsedUrls.length > 0 && !blockEl.querySelector(".wr-media-area")) {
        const mediaEl = document.createElement("div");
        mediaEl.className = "wr-media-area";
        insertMediaNode(mediaEl);
        renderUrlPreviews(mediaEl, parsedUrls, plugin.ogpCache, resolveImagePath);
      }
    }
  }
}
function renderCodeBlockFragment(segment, plugin) {
  const blockEl = document.createElement("div");
  blockEl.className = "wr-codeblock-display";
  const fence = "~".repeat(Math.max(3, segment.fenceTildes));
  const source = (segment.lang ? `${fence}${segment.lang}
` : `${fence}
`) + segment.code + `
${fence}`;
  import_obsidian5.MarkdownRenderer.render(plugin.app, source, blockEl, "", plugin).catch(() => {
    blockEl.empty();
    const pre = blockEl.createEl("pre");
    const codeEl = pre.createEl("code");
    if (segment.lang) codeEl.addClass(`language-${segment.lang}`);
    codeEl.textContent = segment.code;
  });
  return blockEl;
}
function renderMathBlockFragment(segment) {
  const blockEl = document.createElement("div");
  blockEl.className = "wr-math-display";
  try {
    const rendered = (0, import_obsidian5.renderMath)(segment.tex, true);
    blockEl.appendChild(rendered);
    (0, import_obsidian5.finishRenderMath)();
  } catch (e) {
    blockEl.textContent = segment.tex;
  }
  return blockEl;
}
function convertListLines(code, plugin) {
  var _a, _b, _c;
  const fullText = code.textContent || "";
  const segments = segmentBlocks(fullText);
  const block = code.closest(".block-language-wr") || code.closest("pre");
  if (!block) return;
  code.textContent = "";
  const fragments = [];
  let currentListEl = null;
  let currentListType = null;
  let plainLines = [];
  let quoteStack = [];
  let quoteListEl = null;
  let quoteListType = null;
  let quoteListDepth = 0;
  const flushPlain = () => {
    if (plainLines.length > 0) {
      fragments.push(plainLines.join("\n"));
      plainLines = [];
    }
  };
  const flushList = () => {
    if (currentListEl) {
      fragments.push(currentListEl);
      currentListEl = null;
      currentListType = null;
    }
  };
  for (const segment of segments) {
    if (segment.kind === "codeblock") {
      flushList();
      flushPlain();
      fragments.push(renderCodeBlockFragment(segment, plugin));
      continue;
    }
    if (segment.kind === "mathblock") {
      flushList();
      flushPlain();
      fragments.push(renderMathBlockFragment(segment));
      continue;
    }
    const lines = segment.text.split("\n");
    const lineOffset = segment.startLine;
    for (let li2 = 0; li2 < lines.length; li2++) {
      const i = lineOffset + li2;
      const line = lines[li2];
      const quoteMatch = line.match(/^((?:>\s?)+)(.*)$/);
      const checkMatch = !quoteMatch && line.match(/^- \[([ x])\] (.*)$/);
      const listMatch = !quoteMatch && !checkMatch && line.match(/^- (.+)$/);
      const olMatch = !quoteMatch && !checkMatch && !listMatch && line.match(/^\d+\.\s?(.+)$/);
      if (quoteMatch) {
        if (currentListEl) {
          fragments.push(currentListEl);
          currentListEl = null;
          currentListType = null;
        }
        flushPlain();
        const depth = (quoteMatch[1].match(/>/g) || []).length;
        const body = quoteMatch[2];
        const lastFrag = fragments[fragments.length - 1];
        const continuingQuote = quoteStack.length > 0 && lastFrag instanceof HTMLElement && lastFrag === quoteStack[0];
        if (!continuingQuote) {
          const root = document.createElement("blockquote");
          root.className = "wr-blockquote";
          fragments.push(root);
          quoteStack = [root];
        }
        while (quoteStack.length > depth) {
          quoteStack.pop();
        }
        while (quoteStack.length < depth) {
          const parent = quoteStack[quoteStack.length - 1];
          const bq = document.createElement("blockquote");
          bq.className = "wr-blockquote";
          parent.appendChild(bq);
          quoteStack.push(bq);
        }
        const target = quoteStack[quoteStack.length - 1];
        const innerCheck = body.match(/^- \[([ x])\] (.*)$/);
        const innerList = !innerCheck && body.match(/^- (.+)$/);
        const innerOl = !innerCheck && !innerList && body.match(/^\d+\.\s?(.+)$/);
        if (innerCheck || innerList) {
          if (quoteListEl === null || quoteListType !== "ul" || quoteListDepth !== depth || quoteListEl.parentElement !== target) {
            quoteListEl = document.createElement("ul");
            quoteListEl.className = "wr-reading-list";
            target.appendChild(quoteListEl);
            quoteListType = "ul";
            quoteListDepth = depth;
          }
          const li = document.createElement("li");
          if (innerCheck) {
            li.className = "wr-check-item";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            if (innerCheck[1] === "x") cb.checked = true;
            const innerLineIdx = i;
            cb.addEventListener("click", async () => {
              const file = plugin.app.workspace.getActiveFile();
              if (!file) return;
              const data = await plugin.app.vault.read(file);
              const fileLines = data.split("\n");
              const blockContent = fullText.trim();
              for (let f = 0; f < fileLines.length; f++) {
                if (fileLines[f].match(/^```wr\s+/)) {
                  const bodyLines = [];
                  let k = f + 1;
                  while (k < fileLines.length && fileLines[k].trim() !== "```") {
                    bodyLines.push(fileLines[k]);
                    k++;
                  }
                  if (bodyLines.join("\n").trim() === blockContent) {
                    await toggleCheckbox(plugin.app, file, f + 1 + innerLineIdx);
                    return;
                  }
                }
              }
            });
            li.appendChild(cb);
            if (innerCheck[1] === "x" && plugin.settings.checkStrikethrough) {
              const span = document.createElement("span");
              span.className = "wr-check-done";
              span.appendChild(document.createTextNode(innerCheck[2]));
              li.appendChild(span);
            } else {
              li.appendChild(document.createTextNode(innerCheck[2]));
            }
          } else if (innerList) {
            li.appendChild(document.createTextNode(innerList[1]));
          }
          quoteListEl.appendChild(li);
        } else if (innerOl) {
          if (quoteListEl === null || quoteListType !== "ol" || quoteListDepth !== depth || quoteListEl.parentElement !== target) {
            quoteListEl = document.createElement("ol");
            quoteListEl.className = "wr-reading-list";
            target.appendChild(quoteListEl);
            quoteListType = "ol";
            quoteListDepth = depth;
          }
          const li = document.createElement("li");
          li.appendChild(document.createTextNode(innerOl[1]));
          quoteListEl.appendChild(li);
        } else {
          quoteListEl = null;
          quoteListType = null;
          if (target.childNodes.length > 0 && ((_a = target.lastChild) == null ? void 0 : _a.nodeName) !== "OL" && ((_b = target.lastChild) == null ? void 0 : _b.nodeName) !== "UL" && ((_c = target.lastChild) == null ? void 0 : _c.nodeName) !== "BLOCKQUOTE") {
            target.appendChild(document.createElement("br"));
          }
          target.appendChild(document.createTextNode(body));
        }
      } else if (checkMatch || listMatch) {
        quoteStack = [];
        quoteListEl = null;
        quoteListType = null;
        if (currentListType !== "ul") {
          if (currentListEl) fragments.push(currentListEl);
          flushPlain();
          currentListEl = document.createElement("ul");
          currentListEl.className = "wr-reading-list";
          currentListType = "ul";
        }
        const li = document.createElement("li");
        if (checkMatch) {
          li.className = "wr-check-item";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          if (checkMatch[1] === "x") cb.checked = true;
          const lineIdx = i;
          cb.addEventListener("click", async () => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) return;
            const data = await plugin.app.vault.read(file);
            const fileLines = data.split("\n");
            const blockContent = fullText.trim();
            for (let f = 0; f < fileLines.length; f++) {
              if (fileLines[f].match(/^```wr\s+/)) {
                const bodyLines = [];
                let k = f + 1;
                while (k < fileLines.length && fileLines[k].trim() !== "```") {
                  bodyLines.push(fileLines[k]);
                  k++;
                }
                if (bodyLines.join("\n").trim() === blockContent) {
                  await toggleCheckbox(plugin.app, file, f + 1 + lineIdx);
                  return;
                }
              }
            }
          });
          li.appendChild(cb);
          if (checkMatch[1] === "x" && plugin.settings.checkStrikethrough) {
            const span = document.createElement("span");
            span.className = "wr-check-done";
            span.appendChild(document.createTextNode(checkMatch[2]));
            li.appendChild(span);
          } else {
            li.appendChild(document.createTextNode(checkMatch[2]));
          }
        } else if (listMatch) {
          li.appendChild(document.createTextNode(listMatch[1]));
        }
        currentListEl.appendChild(li);
      } else if (olMatch) {
        quoteStack = [];
        quoteListEl = null;
        quoteListType = null;
        if (currentListType !== "ol") {
          if (currentListEl) fragments.push(currentListEl);
          flushPlain();
          currentListEl = document.createElement("ol");
          currentListEl.className = "wr-reading-list";
          currentListType = "ol";
        }
        const li = document.createElement("li");
        li.appendChild(document.createTextNode(olMatch[1]));
        currentListEl.appendChild(li);
      } else {
        quoteStack = [];
        quoteListEl = null;
        quoteListType = null;
        if (currentListEl) {
          fragments.push(currentListEl);
          currentListEl = null;
          currentListType = null;
        }
        plainLines.push(line);
      }
    }
  }
  if (currentListEl) fragments.push(currentListEl);
  flushPlain();
  code.setAttribute("data-wr-original", fullText);
  while (fragments.length > 0 && fragments[fragments.length - 1] === "") {
    fragments.pop();
  }
  code.classList.add("wr-code-hidden");
  let hasContent = false;
  for (const frag of fragments) {
    if (typeof frag === "string") {
      if (frag.trim() === "" && hasContent) {
        const spacer = document.createElement("div");
        spacer.className = "wr-spacer";
        block.appendChild(spacer);
      } else if (frag.trim() !== "") {
        const div = document.createElement("div");
        div.className = "wr-plain-text";
        div.textContent = frag;
        block.appendChild(div);
        hasContent = true;
      }
    } else {
      block.appendChild(frag);
      hasContent = true;
    }
  }
}

// src/editorExtension.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_obsidian6 = require("obsidian");
init_blockSegmenter();
var ogpFetched = import_state.StateEffect.define();
var tagRulesChanged = import_state.StateEffect.define();
var vaultFilesChanged = import_state.StateEffect.define();
var tagMark = import_view.Decoration.mark({ class: "wr-tag-highlight" });
var urlMark = import_view.Decoration.mark({ class: "wr-url-highlight" });
var olMark = import_view.Decoration.mark({ class: "wr-ol-highlight" });
var internalLinkMark = import_view.Decoration.mark({ class: "wr-internal-link-highlight" });
var internalLinkUnresolvedMark = import_view.Decoration.mark({
  class: "wr-internal-link-highlight wr-internal-link-unresolved"
});
var inlineCodeMark = import_view.Decoration.mark({ class: "wr-inline-code-highlight" });
var mathMark = import_view.Decoration.mark({ class: "wr-math-highlight" });
var boldMark = import_view.Decoration.mark({ class: "wr-bold-highlight" });
var italicMark = import_view.Decoration.mark({ class: "wr-italic-highlight" });
var strikeMark = import_view.Decoration.mark({ class: "wr-strike-highlight" });
var highlightMark = import_view.Decoration.mark({ class: "wr-highlight-highlight" });
var replaceHidden = import_view.Decoration.replace({});
var hiddenLine = import_view.Decoration.line({ class: "wr-hidden-line" });
var lineDecoCache = /* @__PURE__ */ new Map();
function makeLineDeco(classes) {
  const key = classes.filter(Boolean).join(" ");
  let deco = lineDecoCache.get(key);
  if (!deco) {
    deco = import_view.Decoration.line({ class: key });
    lineDecoCache.set(key, deco);
  }
  return deco;
}
var BulletWidget = class extends import_view.WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "wr-lp-marker wr-lp-bullet";
    span.textContent = "\u2022";
    return span;
  }
  eq() {
    return true;
  }
};
var CheckboxWidget = class extends import_view.WidgetType {
  constructor(checked, pos) {
    super();
    this.checked = checked;
    this.pos = pos;
  }
  toDOM(view) {
    const wrap = document.createElement("span");
    wrap.className = "wr-lp-marker wr-lp-check";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = this.checked;
    cb.addEventListener("click", (e) => {
      e.preventDefault();
      const next = !this.checked;
      cb.checked = next;
      const newChar = next ? "x" : " ";
      view.dispatch({ changes: { from: this.pos + 3, to: this.pos + 4, insert: newChar } });
    });
    wrap.appendChild(cb);
    return wrap;
  }
  // 同じ位置のcheckboxはWidget差し替えではなくDOM再利用で更新する。checked状態だけ差分反映する
  updateDOM(dom) {
    const cb = dom.querySelector('input[type="checkbox"]');
    if (!cb) return false;
    if (cb.checked !== this.checked) cb.checked = this.checked;
    return true;
  }
  eq(other) {
    return this.checked === other.checked;
  }
  ignoreEvent() {
    return false;
  }
};
var OlMarkerWidget = class extends import_view.WidgetType {
  constructor(label) {
    super();
    this.label = label;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "wr-lp-marker wr-lp-ol";
    span.textContent = this.label;
    return span;
  }
  eq(other) {
    return this.label === other.label;
  }
};
var ObsidianLinkWidget = class extends import_view.WidgetType {
  constructor(url, displayName, unresolved = false) {
    super();
    this.url = url;
    this.displayName = displayName;
    this.unresolved = unresolved;
  }
  toDOM() {
    const link = document.createElement("a");
    link.className = this.unresolved ? "wr-internal-link wr-internal-link-unresolved" : "wr-internal-link";
    link.textContent = this.displayName;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSafeUrl(this.url)) window.open(this.url);
    });
    return link;
  }
  eq(other) {
    return this.url === other.url && this.unresolved === other.unresolved;
  }
  ignoreEvent() {
    return false;
  }
};
var MdLinkWidget = class extends import_view.WidgetType {
  constructor(label, url) {
    super();
    this.label = label;
    this.url = url;
  }
  toDOM() {
    const link = document.createElement("a");
    link.className = "wr-url-highlight";
    link.textContent = this.label;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSafeUrl(this.url)) window.open(this.url, "_blank");
    });
    return link;
  }
  eq(other) {
    return this.url === other.url && this.label === other.label;
  }
  ignoreEvent() {
    return false;
  }
};
var InternalLinkWidget = class extends import_view.WidgetType {
  constructor(fileName, app, resolved) {
    super();
    this.fileName = fileName;
    this.app = app;
    this.resolved = resolved;
  }
  toDOM() {
    const link = document.createElement("a");
    link.className = this.resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
    link.textContent = this.fileName;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.app.workspace.openLinkText(this.fileName, "", false);
    });
    return link;
  }
  eq(other) {
    return this.fileName === other.fileName && this.resolved === other.resolved;
  }
  ignoreEvent() {
    return false;
  }
};
var EmbedMissingWidget = class extends import_view.WidgetType {
  constructor(fileName) {
    super();
    this.fileName = fileName;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "wr-embed-missing";
    span.textContent = `![[${this.fileName}]]`;
    return span;
  }
  eq(other) {
    return this.fileName === other.fileName;
  }
  ignoreEvent() {
    return false;
  }
};
var MathWidget = class extends import_view.WidgetType {
  constructor(tex) {
    super();
    this.tex = tex;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "wr-math";
    try {
      const { renderMath: renderMath3, finishRenderMath: finishRenderMath3 } = require("obsidian");
      const rendered = renderMath3(this.tex, false);
      span.appendChild(rendered);
      finishRenderMath3();
    } catch (e) {
      span.textContent = `$${this.tex}$`;
    }
    return span;
  }
  eq(other) {
    return this.tex === other.tex;
  }
};
var CodeBlockWidget = class extends import_view.WidgetType {
  constructor(code, lang, app, plugin, ruleClass) {
    super();
    this.code = code;
    this.lang = lang;
    this.app = app;
    this.plugin = plugin;
    this.ruleClass = ruleClass;
  }
  toDOM() {
    const container = document.createElement("div");
    container.className = "wr-codeblock-display wr-lp-codeblock wr-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    const pre = container.createEl("pre");
    if (this.lang) pre.className = `language-${this.lang}`;
    const codeEl = pre.createEl("code");
    if (this.lang) codeEl.className = `language-${this.lang}`;
    codeEl.textContent = this.code;
    if (this.lang) {
      (0, import_obsidian6.loadPrism)().then((Prism) => {
        Prism.highlightElement(codeEl);
      }).catch(() => {
      });
    }
    return container;
  }
  eq(other) {
    return this.code === other.code && this.lang === other.lang && this.ruleClass === other.ruleClass;
  }
  ignoreEvent() {
    return false;
  }
};
var MathBlockWidget = class extends import_view.WidgetType {
  constructor(tex, ruleClass) {
    super();
    this.tex = tex;
    this.ruleClass = ruleClass;
  }
  toDOM() {
    const container = document.createElement("div");
    container.className = "wr-math-display wr-lp-mathblock wr-codeblock-line";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    try {
      const { renderMath: renderMath3, finishRenderMath: finishRenderMath3 } = require("obsidian");
      const rendered = renderMath3(this.tex, true);
      container.appendChild(rendered);
      finishRenderMath3();
    } catch (e) {
      container.textContent = this.tex;
    }
    return container;
  }
  eq(other) {
    return this.tex === other.tex && this.ruleClass === other.ruleClass;
  }
  ignoreEvent() {
    return false;
  }
};
var IMAGE_EXT_RE2 = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;
var EmbedImageWidget = class extends import_view.WidgetType {
  constructor(images, ruleClass) {
    super();
    this.images = images;
    this.ruleClass = ruleClass;
  }
  toDOM() {
    const container = document.createElement("div");
    container.className = "wr-media-area wr-lp-media";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    for (const { src, alt } of this.images) {
      const img = document.createElement("img");
      img.className = "wr-embed-img";
      img.src = src;
      img.alt = alt;
      img.loading = "lazy";
      container.appendChild(img);
    }
    return container;
  }
  eq(other) {
    if (this.ruleClass !== other.ruleClass) return false;
    if (this.images.length !== other.images.length) return false;
    return this.images.every((img, i) => img.src === other.images[i].src);
  }
  ignoreEvent() {
    return true;
  }
};
var InlineEmbedImageWidget = class extends import_view.WidgetType {
  constructor(src, alt) {
    super();
    this.src = src;
    this.alt = alt;
  }
  toDOM() {
    const wrapper = document.createElement("div");
    wrapper.className = "wr-lp-inline-img-wrapper";
    const img = document.createElement("img");
    img.className = "wr-embed-img wr-lp-inline-img";
    img.src = this.src;
    img.alt = this.alt;
    img.loading = "lazy";
    wrapper.appendChild(img);
    return wrapper;
  }
  eq(other) {
    return this.src === other.src && this.alt === other.alt;
  }
  ignoreEvent() {
    return true;
  }
};
var UrlPreviewWidget = class extends import_view.WidgetType {
  constructor(parsedUrls, ogpCache, ruleClass, resolveImagePath) {
    super();
    this.parsedUrls = parsedUrls;
    this.ogpCache = ogpCache;
    this.ruleClass = ruleClass;
    this.resolveImagePath = resolveImagePath;
    this.cachedSnapshot = parsedUrls.map(
      (pu) => {
        const d = ogpCache.get(pu.url);
        return !!(d && (d.title || d.description));
      }
    );
  }
  eq(other) {
    if (this.ruleClass !== other.ruleClass) return false;
    if (this.parsedUrls.length !== other.parsedUrls.length) return false;
    for (let i = 0; i < this.parsedUrls.length; i++) {
      if (this.parsedUrls[i].url !== other.parsedUrls[i].url) return false;
      if (this.cachedSnapshot[i] !== other.cachedSnapshot[i]) return false;
    }
    return true;
  }
  toDOM() {
    const container = document.createElement("div");
    container.className = "wr-media-area wr-lp-media";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    for (const pu of this.parsedUrls) {
      if (pu.type === "image") {
        renderImagePreview(container, pu.url, this.resolveImagePath);
      } else {
        const cached = this.ogpCache.get(pu.url);
        if (cached && (cached.title || cached.description)) {
          if (pu.type === "twitter") {
            renderTwitterCard(container, cached);
          } else {
            renderOGPCard(container, cached);
          }
        }
      }
    }
    return container;
  }
  ignoreEvent() {
    return false;
  }
};
var QuoteBlockWidget = class extends import_view.WidgetType {
  constructor(fileName, blockId, parsedUrls, app, currentFilePath, ruleClass, timestampFormat, ogpCache, resolveImagePath, resolveQuoteRuleClass, resolveQuoteRuleAccent) {
    super();
    this.fileName = fileName;
    this.blockId = blockId;
    this.parsedUrls = parsedUrls;
    this.app = app;
    this.currentFilePath = currentFilePath;
    this.ruleClass = ruleClass;
    this.timestampFormat = timestampFormat;
    this.ogpCache = ogpCache;
    this.resolveImagePath = resolveImagePath;
    this.resolveQuoteRuleClass = resolveQuoteRuleClass;
    this.resolveQuoteRuleAccent = resolveQuoteRuleAccent;
    this.cachedSnapshot = parsedUrls.map((pu) => {
      const d = ogpCache.get(pu.url);
      return !!(d && (d.title || d.description));
    });
  }
  eq(other) {
    if (this.fileName !== other.fileName) return false;
    if (this.blockId !== other.blockId) return false;
    if (this.ruleClass !== other.ruleClass) return false;
    if (this.timestampFormat !== other.timestampFormat) return false;
    if (this.parsedUrls.length !== other.parsedUrls.length) return false;
    for (let i = 0; i < this.parsedUrls.length; i++) {
      if (this.parsedUrls[i].url !== other.parsedUrls[i].url) return false;
      if (this.cachedSnapshot[i] !== other.cachedSnapshot[i]) return false;
    }
    return true;
  }
  toDOM() {
    const container = document.createElement("div");
    container.className = "wr-quote-block";
    if (this.ruleClass) container.classList.add(this.ruleClass);
    if (this.parsedUrls.length > 0) {
      const mediaArea = document.createElement("div");
      mediaArea.className = "wr-media-area wr-lp-media";
      if (this.ruleClass) mediaArea.classList.add(this.ruleClass);
      let hasContent = false;
      for (const pu of this.parsedUrls) {
        if (pu.type === "image") {
          renderImagePreview(mediaArea, pu.url, this.resolveImagePath);
          hasContent = true;
        } else {
          const cached = this.ogpCache.get(pu.url);
          if (cached && (cached.title || cached.description)) {
            if (pu.type === "twitter") {
              renderTwitterCard(mediaArea, cached);
            } else {
              renderOGPCard(mediaArea, cached);
            }
            hasContent = true;
          }
        }
      }
      if (hasContent) container.appendChild(mediaArea);
    }
    const slot = document.createElement("span");
    slot.className = "wr-quote-card-slot wr-lp-quote-card";
    if (this.ruleClass) slot.classList.add(this.ruleClass);
    renderQuoteCard(slot, this.fileName, this.blockId, this.app, this.currentFilePath, {
      timestampFormat: this.timestampFormat,
      resolveRuleClass: this.resolveQuoteRuleClass,
      resolveRuleAccent: this.resolveQuoteRuleAccent
    });
    container.appendChild(slot);
    return container;
  }
  // widget 内部の <a>/quote-card のクリックを CodeMirror に奪われないよう true。
  // これがないと URL カード/画像URL クリックが空振る (引用カードは元から addEventListener なので両方助かる)
  ignoreEvent() {
    return true;
  }
};
function findWrBlocks(view, plugin) {
  const blocks = [];
  const doc = view.state.doc;
  for (let ln = 1; ln <= doc.lines; ln++) {
    const line = doc.line(ln);
    if (!line.text.trim().startsWith("```wr")) continue;
    const startLn = ln;
    let endLn = 0;
    for (let j = startLn + 1; j <= doc.lines; j++) {
      if (doc.line(j).text.trim() === "```") {
        endLn = j;
        break;
      }
    }
    if (endLn === 0) continue;
    const bodyLines = [];
    for (let j = startLn + 1; j < endLn; j++) {
      bodyLines.push(doc.line(j).text);
    }
    const innerBlocks = findBlockRanges(bodyLines);
    const blockedDocLines = /* @__PURE__ */ new Set();
    for (const br of innerBlocks) {
      for (let k = br.startLine; k <= br.endLine; k++) {
        blockedDocLines.add(startLn + 1 + k);
      }
    }
    const urlTexts = [];
    const tags = [];
    for (let j = startLn + 1; j < endLn; j++) {
      if (blockedDocLines.has(j)) continue;
      const l = doc.line(j);
      const urlRegex = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
      let match;
      while ((match = urlRegex.exec(l.text)) !== null) {
        urlTexts.push(match[0]);
      }
      const tagMatches = l.text.match(/#[^\s#]+/g);
      if (tagMatches) tags.push(...tagMatches);
    }
    let ruleClass = null;
    if (plugin) {
      const rule = plugin.findTagColorRule(tags);
      if (rule) {
        const idx = plugin.settings.tagColorRules.indexOf(rule);
        if (idx >= 0) ruleClass = `wr-tag-rule-${idx}`;
      }
    }
    const fenceLine = doc.line(startLn).text;
    const blockIdMatch = fenceLine.match(/\^(wr-\d{17})/);
    const blockId = blockIdMatch ? blockIdMatch[1] : null;
    let hasQuoteMarker = false;
    let quoteLineIdx = -1;
    for (let j = startLn + 1; j < endLn; j++) {
      if (/\[\[[^\[\]]+#\^wr-\d{17}\]\]/.test(doc.line(j).text)) {
        hasQuoteMarker = true;
        quoteLineIdx = j;
        break;
      }
    }
    blocks.push({ startLn, endLn, urlTexts, ruleClass, innerBlocks, blockId, hasQuoteMarker, quoteLineIdx });
    ln = endLn;
  }
  return blocks;
}
function buildDecorations(view, ogpCache, blocks, app, plugin, checkStrikethrough) {
  var _a;
  const builder = new import_state.RangeSetBuilder();
  const doc = view.state.doc;
  const isSourceMode = !view.contentDOM.closest(".is-live-preview");
  const cursorLineNums = /* @__PURE__ */ new Set();
  for (const range of view.state.selection.ranges) {
    const startLine = doc.lineAt(range.from).number;
    const endLine = doc.lineAt(range.to).number;
    for (let n = startLine; n <= endLine; n++) cursorLineNums.add(n);
  }
  const cursorInBlock = (b) => {
    for (let n = b.startLn; n <= b.endLn; n++) {
      if (cursorLineNums.has(n)) return true;
    }
    return false;
  };
  try {
    for (const block of blocks) {
      const openLine = doc.line(block.startLn);
      builder.add(openLine.from, openLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
      const blockHasCursor = cursorInBlock(block);
      const embedImages = [];
      const innerBlockStartByDocLine = /* @__PURE__ */ new Map();
      const innerBlockInsideDocLines = /* @__PURE__ */ new Set();
      for (const br of block.innerBlocks) {
        const docStart = block.startLn + 1 + br.startLine;
        const docEnd = block.startLn + 1 + br.endLine;
        innerBlockStartByDocLine.set(docStart, { range: br, docStart, docEnd });
        for (let k = docStart; k <= docEnd; k++) {
          innerBlockInsideDocLines.add(k);
        }
      }
      for (let j = block.startLn + 1; j < block.endLn; j++) {
        const l = doc.line(j);
        const showRaw = isSourceMode || blockHasCursor;
        const innerStart = innerBlockStartByDocLine.get(j);
        if (showRaw && innerBlockInsideDocLines.has(j)) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
          continue;
        }
        if (innerStart && !showRaw) {
          const { range, docStart, docEnd } = innerStart;
          const innerBodyLines = [];
          const bodyStart = docStart + 1;
          const bodyEnd = docEnd - 1;
          for (let k = bodyStart; k <= bodyEnd; k++) {
            innerBodyLines.push(doc.line(k).text);
          }
          let widgetContent;
          if (range.kind === "mathblock" && docStart === docEnd) {
            const lineText = doc.line(docStart).text.trim();
            const inner = lineText.startsWith("$$") && lineText.endsWith("$$") && lineText.length >= 4 ? lineText.slice(2, -2) : lineText;
            widgetContent = inner;
          } else {
            widgetContent = innerBodyLines.join("\n");
          }
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
          const startLine = doc.line(docStart);
          const widget = range.kind === "codeblock" ? import_view.Decoration.replace({ widget: new CodeBlockWidget(widgetContent, range.lang || "", app, plugin, block.ruleClass) }) : import_view.Decoration.replace({ widget: new MathBlockWidget(widgetContent, block.ruleClass) });
          builder.add(startLine.from, startLine.to, widget);
          for (let k = docStart + 1; k <= docEnd; k++) {
            const kl = doc.line(k);
            builder.add(kl.from, kl.from, hiddenLine);
            if (kl.to > kl.from) {
              builder.add(kl.from, kl.to, import_view.Decoration.replace({}));
            }
          }
          j = docEnd;
          continue;
        }
        if (innerBlockInsideDocLines.has(j)) {
          continue;
        }
        const quotePrefixMatch = l.text.match(/^(?:>\s?)+/);
        const quotePrefix = quotePrefixMatch ? quotePrefixMatch[0].length : 0;
        const quoteDepth = quotePrefixMatch ? (quotePrefixMatch[0].match(/>/g) || []).length : 0;
        const innerTextAfterQuote = quoteDepth > 0 ? l.text.slice(quotePrefix) : "";
        const quoteInnerIsList = quoteDepth > 0 && /^(?:- \[[ x]\] |- |\d+\.\s?)/.test(innerTextAfterQuote);
        const isQuoteLine = quoteDepth > 0;
        const hasObsidianUrl = !showRaw && /obsidian:\/\//.test(l.text);
        const isEmbedOnlyLine = (() => {
          if (showRaw) return false;
          if (block.hasQuoteMarker) return false;
          const trimmed = l.text.trim();
          if (!/^!\[\[[^\]]+\]\]$/.test(trimmed)) return false;
          const innerName = trimmed.slice(3, -2);
          if (!IMAGE_EXT_RE2.test(innerName)) return false;
          return app.metadataCache.getFirstLinkpathDest(innerName, "") !== null;
        })();
        const isQuoteMarkerOnlyLine = (() => {
          if (showRaw) return false;
          if (!block.hasQuoteMarker) return false;
          return /^\s*\[\[[^\[\]]+#\^wr-\d{17}\]\]\s*$/.test(l.text);
        })();
        if (isEmbedOnlyLine || isQuoteMarkerOnlyLine) {
          builder.add(l.from, l.from, hiddenLine);
        } else if ((isQuoteLine || quoteInnerIsList) && !showRaw) {
          const depthClass = `wr-blockquote-depth-${Math.min(quoteDepth, 5)}`;
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-blockquote-line", depthClass, block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
        } else if (hasObsidianUrl) {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", "wr-obsidian-url-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
        } else {
          builder.add(l.from, l.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
        }
        const entries = [];
        const codeRanges = [];
        const checkMatch = l.text.match(/^- \[([ x])\] /);
        const listMatch = !checkMatch && l.text.match(/^- /);
        if (isQuoteLine) {
          if (showRaw) {
            entries.push({ from: l.from, to: l.from + quotePrefix, deco: import_view.Decoration.mark({ class: "wr-quote-highlight" }) });
          } else {
            entries.push({ from: l.from, to: l.from + quotePrefix, deco: replaceHidden });
            if (l.to > l.from + quotePrefix) {
              entries.push({ from: l.from + quotePrefix, to: l.to, deco: import_view.Decoration.mark({ class: "wr-blockquote-wrap" }) });
            }
          }
          if (quoteInnerIsList) {
            const innerCheck = innerTextAfterQuote.match(/^- \[([ x])\] /);
            const innerList = !innerCheck && innerTextAfterQuote.match(/^- /);
            const innerOl = !innerCheck && !innerList && innerTextAfterQuote.match(/^(\d+\.)\s?/);
            if (innerCheck) {
              const isChecked = innerCheck[1] === "x";
              if (showRaw) {
                const mark = isChecked ? import_view.Decoration.mark({ class: "wr-check-checked" }) : import_view.Decoration.mark({ class: "wr-check-unchecked" });
                entries.push({ from: l.from + quotePrefix, to: l.from + quotePrefix + innerCheck[0].length, deco: mark });
              } else {
                entries.push({
                  from: l.from + quotePrefix,
                  to: l.from + quotePrefix + innerCheck[0].length,
                  deco: import_view.Decoration.replace({ widget: new CheckboxWidget(isChecked, l.from + quotePrefix) })
                });
              }
              if (isChecked && checkStrikethrough && l.to > l.from + quotePrefix + innerCheck[0].length) {
                entries.push({ from: l.from + quotePrefix + innerCheck[0].length, to: l.to, deco: import_view.Decoration.mark({ class: "wr-check-done" }) });
              }
            } else if (innerList) {
              if (showRaw) {
                entries.push({ from: l.from + quotePrefix, to: l.from + quotePrefix + 2, deco: import_view.Decoration.mark({ class: "wr-list-highlight" }) });
              } else {
                entries.push({
                  from: l.from + quotePrefix,
                  to: l.from + quotePrefix + 2,
                  deco: import_view.Decoration.replace({ widget: new BulletWidget() })
                });
              }
            } else if (innerOl) {
              if (showRaw) {
                entries.push({ from: l.from + quotePrefix, to: l.from + quotePrefix + innerOl[0].length, deco: olMark });
              } else {
                entries.push({
                  from: l.from + quotePrefix,
                  to: l.from + quotePrefix + innerOl[0].length,
                  deco: import_view.Decoration.replace({ widget: new OlMarkerWidget(innerOl[1]) })
                });
              }
            }
          }
        } else if (checkMatch) {
          const isChecked = checkMatch[1] === "x";
          if (showRaw) {
            const mark = isChecked ? import_view.Decoration.mark({ class: "wr-check-checked" }) : import_view.Decoration.mark({ class: "wr-check-unchecked" });
            entries.push({ from: l.from, to: l.from + checkMatch[0].length, deco: mark });
          } else {
            entries.push({
              from: l.from,
              to: l.from + checkMatch[0].length,
              deco: import_view.Decoration.replace({ widget: new CheckboxWidget(isChecked, l.from) })
            });
          }
          if (isChecked && checkStrikethrough && l.to > l.from + checkMatch[0].length) {
            entries.push({ from: l.from + checkMatch[0].length, to: l.to, deco: import_view.Decoration.mark({ class: "wr-check-done" }) });
          }
        } else if (listMatch) {
          if (showRaw) {
            entries.push({ from: l.from, to: l.from + 2, deco: import_view.Decoration.mark({ class: "wr-list-highlight" }) });
          } else {
            entries.push({
              from: l.from,
              to: l.from + 2,
              deco: import_view.Decoration.replace({ widget: new BulletWidget() })
            });
          }
        } else {
          const olMatchResult = l.text.match(/^(\d+\.)\s?/);
          if (olMatchResult) {
            if (showRaw) {
              entries.push({ from: l.from, to: l.from + olMatchResult[0].length, deco: olMark });
            } else {
              entries.push({
                from: l.from,
                to: l.from + olMatchResult[0].length,
                deco: import_view.Decoration.replace({ widget: new OlMarkerWidget(olMatchResult[1]) })
              });
            }
          }
        }
        let match;
        const tagRegex = /#[^\s#]+/g;
        while ((match = tagRegex.exec(l.text)) !== null) {
          entries.push({ from: l.from + match.index, to: l.from + match.index + match[0].length, deco: tagMark });
        }
        const mdLinkRanges = [];
        const mdLinkRegex = /\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)/g;
        while ((match = mdLinkRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          const label = match[1];
          const url = match[2];
          if (!isSafeUrl(url)) continue;
          mdLinkRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: urlMark });
          } else {
            entries.push({
              from,
              to,
              deco: import_view.Decoration.replace({ widget: new MdLinkWidget(label, url) })
            });
          }
        }
        const insideMdLink = (f, t) => mdLinkRanges.some((r) => f >= r.from && t <= r.to);
        const urlRegex = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;
        while ((match = urlRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideMdLink(from, to)) continue;
          if (match[0].startsWith("obsidian://") && !showRaw) {
            let fileName = null;
            try {
              const params = new URL(match[0]).searchParams;
              const filePath = params.get("file");
              if (filePath) {
                const decoded = decodeURIComponent(filePath);
                fileName = decoded.split("/").pop() || decoded;
              }
            } catch (e) {
            }
            const looksLikeImage = !!fileName && IMAGE_EXT_RE2.test(fileName);
            const resolved = fileName ? app.metadataCache.getFirstLinkpathDest(fileName, "") : null;
            const isImageEmbed = looksLikeImage && resolved !== null;
            const isUnresolvedImage = looksLikeImage && resolved === null;
            if (isImageEmbed) {
              entries.push({ from, to, deco: replaceHidden });
            } else {
              entries.push({
                from,
                to,
                deco: import_view.Decoration.replace({ widget: new ObsidianLinkWidget(match[0], fileName || match[0], isUnresolvedImage) })
              });
            }
          } else {
            entries.push({ from, to, deco: urlMark });
          }
        }
        const linkRegex = /!?\[\[[^\]]+\]\]/g;
        while ((match = linkRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          const isEmbed = match[0].startsWith("!");
          const innerName = isEmbed ? match[0].slice(3, -2) : match[0].slice(2, -2);
          const resolved = app.metadataCache.getFirstLinkpathDest(innerName, "") !== null;
          if (!showRaw) {
            if (isEmbed && IMAGE_EXT_RE2.test(innerName)) {
              const file = app.metadataCache.getFirstLinkpathDest(innerName, "");
              if (file) {
                const src = app.vault.getResourcePath(file);
                if (block.hasQuoteMarker) {
                  entries.push({
                    from,
                    to,
                    deco: import_view.Decoration.replace({ widget: new InlineEmbedImageWidget(src, innerName) })
                  });
                } else {
                  entries.push({ from, to, deco: replaceHidden });
                  embedImages.push({ src, alt: innerName });
                }
                continue;
              }
              entries.push({
                from,
                to,
                deco: import_view.Decoration.replace({ widget: new EmbedMissingWidget(innerName) })
              });
              continue;
            }
            if (!isEmbed) {
              const quoteMatch = innerName.match(QUOTE_LINK_RE);
              if (quoteMatch) {
                entries.push({ from, to, deco: replaceHidden });
                continue;
              }
            }
            entries.push({
              from,
              to,
              deco: import_view.Decoration.replace({ widget: new InternalLinkWidget(innerName, app, resolved) })
            });
            continue;
          }
          entries.push({ from, to, deco: resolved ? internalLinkMark : internalLinkUnresolvedMark });
        }
        const codeRegex = /`[^`]+`/g;
        while ((match = codeRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          codeRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: inlineCodeMark });
          } else {
            entries.push({ from, to: from + 1, deco: replaceHidden });
            entries.push({ from: from + 1, to: to - 1, deco: inlineCodeMark });
            entries.push({ from: to - 1, to, deco: replaceHidden });
          }
        }
        const mathRegex = /\$([^$]+)\$/g;
        while ((match = mathRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (codeRanges.some((r) => from >= r.from && to <= r.to)) continue;
          codeRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: mathMark });
          } else {
            entries.push({
              from,
              to,
              deco: import_view.Decoration.replace({ widget: new MathWidget(match[1]) })
            });
          }
        }
        const insideCode = (f, t) => codeRanges.some((r) => f >= r.from && t <= r.to);
        const boldRanges = [];
        const boldRegex = /\*\*[^*]+\*\*/g;
        while ((match = boldRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideCode(from, to)) continue;
          boldRanges.push({ from, to });
          if (showRaw) {
            entries.push({ from, to, deco: boldMark });
          } else {
            entries.push({ from, to: from + 2, deco: replaceHidden });
            entries.push({ from: from + 2, to: to - 2, deco: boldMark });
            entries.push({ from: to - 2, to, deco: replaceHidden });
          }
        }
        {
          const chars = [...l.text];
          for (const br of boldRanges) {
            const start = br.from - l.from;
            const end = br.to - l.from;
            for (let i = start; i < end && i < chars.length; i++) chars[i] = " ";
          }
          const masked = chars.join("");
          const italicRegex = /\*([^*]+)\*/g;
          while ((match = italicRegex.exec(masked)) !== null) {
            const from = l.from + match.index;
            const to = from + match[0].length;
            if (insideCode(from, to)) continue;
            if (showRaw) {
              entries.push({ from, to, deco: italicMark });
            } else {
              entries.push({ from, to: from + 1, deco: replaceHidden });
              entries.push({ from: from + 1, to: to - 1, deco: italicMark });
              entries.push({ from: to - 1, to, deco: replaceHidden });
            }
          }
        }
        const strikeRegex = /~~[^~]+~~/g;
        while ((match = strikeRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideCode(from, to)) continue;
          if (showRaw) {
            entries.push({ from, to, deco: strikeMark });
          } else {
            entries.push({ from, to: from + 2, deco: replaceHidden });
            entries.push({ from: from + 2, to: to - 2, deco: strikeMark });
            entries.push({ from: to - 2, to, deco: replaceHidden });
          }
        }
        const highlightRegex = /==([^=]+)==/g;
        while ((match = highlightRegex.exec(l.text)) !== null) {
          const from = l.from + match.index;
          const to = from + match[0].length;
          if (insideCode(from, to)) continue;
          if (showRaw) {
            entries.push({ from, to, deco: highlightMark });
          } else {
            entries.push({ from, to: from + 2, deco: replaceHidden });
            entries.push({ from: from + 2, to: to - 2, deco: highlightMark });
            entries.push({ from: to - 2, to, deco: replaceHidden });
          }
        }
        const isReplace = (d) => d.point === true;
        entries.sort((a, b) => {
          if (a.from !== b.from) return a.from - b.from;
          const ar = isReplace(a.deco) ? 0 : 1;
          const br = isReplace(b.deco) ? 0 : 1;
          if (ar !== br) return ar - br;
          return a.to - b.to;
        });
        for (const e of entries) {
          builder.add(e.from, e.to, e.deco);
        }
      }
      const closeLine = doc.line(block.endLn);
      builder.add(closeLine.from, closeLine.from, makeLineDeco(["wr-codeblock-line", block.ruleClass, block.blockId ? `wr-block-id-${block.blockId}` : null]));
      const endLine = doc.line(block.endLn);
      if (embedImages.length > 0 && !blockHasCursor) {
        builder.add(
          endLine.to,
          endLine.to,
          import_view.Decoration.widget({
            widget: new EmbedImageWidget(embedImages, block.ruleClass),
            side: 1
          })
        );
      }
      const resolveImagePath = (fileName) => {
        const file = app.metadataCache.getFirstLinkpathDest(fileName, "");
        return file ? app.vault.getResourcePath(file) : null;
      };
      if (block.hasQuoteMarker && !blockHasCursor) {
        let quoteFileName = null;
        let quoteBlockId = null;
        for (let j = block.startLn + 1; j < block.endLn; j++) {
          const m = doc.line(j).text.match(/\[\[([^\[\]]+)#\^(wr-\d{17})\]\]/);
          if (m) {
            quoteFileName = m[1];
            quoteBlockId = m[2];
            break;
          }
        }
        if (quoteFileName && quoteBlockId) {
          const parsedUrls = block.urlTexts.length > 0 ? extractUrls(block.urlTexts.join(" ")).filter(
            (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
          ) : [];
          const currentPath = ((_a = app.workspace.getActiveFile()) == null ? void 0 : _a.path) || "";
          builder.add(
            endLine.to,
            endLine.to,
            import_view.Decoration.widget({
              widget: new QuoteBlockWidget(
                quoteFileName,
                quoteBlockId,
                parsedUrls,
                app,
                currentPath,
                block.ruleClass,
                plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm",
                ogpCache,
                resolveImagePath,
                (content) => plugin.getTagRuleClassForContent(content),
                (ruleClass) => plugin.getRuleAccentColor(ruleClass)
              ),
              side: 2
            })
          );
        }
      } else if (!block.hasQuoteMarker && block.urlTexts.length > 0) {
        const parsedUrls = extractUrls(block.urlTexts.join(" ")).filter(
          (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
        );
        if (parsedUrls.length > 0) {
          builder.add(
            endLine.to,
            endLine.to,
            import_view.Decoration.widget({
              widget: new UrlPreviewWidget(parsedUrls, ogpCache, block.ruleClass, resolveImagePath),
              side: 2
            })
          );
        }
      }
    }
  } catch (e) {
    console.debug("Wrot: decoration skipped", e);
  }
  return builder.finish();
}
function createWrEditorExtension(ogpCache, app, plugin, getCheckStrikethrough) {
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.currentView = view;
        this.blocks = findWrBlocks(view, plugin);
        this.decorations = buildDecorations(view, ogpCache, this.blocks, app, plugin, getCheckStrikethrough());
        requestAnimationFrame(() => this.fetchMissing());
      }
      update(update) {
        this.currentView = update.view;
        const hasOgpEffect = update.transactions.some(
          (tr) => tr.effects.some((e) => e.is(ogpFetched))
        );
        const hasTagRulesEffect = update.transactions.some(
          (tr) => tr.effects.some((e) => e.is(tagRulesChanged))
        );
        const hasVaultFilesEffect = update.transactions.some(
          (tr) => tr.effects.some((e) => e.is(vaultFilesChanged))
        );
        if (update.docChanged || update.viewportChanged || update.selectionSet || hasOgpEffect || hasTagRulesEffect || hasVaultFilesEffect) {
          this.blocks = findWrBlocks(update.view, plugin);
          this.decorations = buildDecorations(update.view, ogpCache, this.blocks, app, plugin, getCheckStrikethrough());
          if (!hasOgpEffect) {
            this.fetchMissing();
          }
        }
      }
      fetchMissing() {
        for (const block of this.blocks) {
          const parsedUrls = extractUrls(block.urlTexts.join(" "));
          for (const pu of parsedUrls) {
            if (pu.type === "image") continue;
            if (ogpCache.get(pu.url)) continue;
            ogpCache.fetchOGP(pu.url).then(() => {
              try {
                this.currentView.dispatch({ effects: ogpFetched.of(null) });
              } catch (e) {
              }
            });
          }
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        // wr ブロック内の URL ハイライト要素をクリックしたらブラウザで開く
        // (LV では Cmd+クリックの Obsidian 標準動作も効かないため、 シングルクリックで対応)
        click(e) {
          var _a;
          const target = e.target;
          if (!(target instanceof HTMLElement)) return false;
          const urlEl = target.closest(".wr-url-highlight");
          if (!urlEl) return false;
          if (!urlEl.closest(".wr-codeblock-line, .HyperMD-codeblock")) return false;
          const url = (_a = urlEl.textContent) == null ? void 0 : _a.trim();
          if (!url) return false;
          if (!isSafeUrl(url)) return false;
          e.preventDefault();
          e.stopPropagation();
          window.open(url, "_blank");
          return true;
        }
      }
    }
  );
}

// src/utils/ogpCache.ts
var import_obsidian7 = require("obsidian");
var TTL = 36e5;
var OGPCache = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    this.pending = /* @__PURE__ */ new Map();
    this.enabled = true;
  }
  get(url) {
    const entry = this.cache.get(url);
    if (entry && Date.now() - entry.timestamp < TTL) {
      return entry.data;
    }
    return null;
  }
  async fetchOGP(url) {
    if (!this.enabled) return null;
    if (url.startsWith("obsidian://")) return null;
    const cached = this.get(url);
    if (cached) return cached;
    const inflight = this.pending.get(url);
    if (inflight) return inflight;
    const promise = this.doFetch(url);
    this.pending.set(url, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(url);
    }
  }
  isPublicUrl(urlString) {
    try {
      const parsed = new URL(urlString);
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === "localhost" || hostname === "[::1]") return false;
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(hostname)) return false;
      if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
      return true;
    } catch (e) {
      return false;
    }
  }
  async doFetch(url) {
    if (!this.isPublicUrl(url)) return null;
    try {
      const resp = await (0, import_obsidian7.requestUrl)({
        url,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ObsidianBot/1.0)",
          Accept: "text/html"
        }
      });
      const html = resp.text;
      const data = this.parseOGP(html, url);
      this.cache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch (e) {
      return null;
    }
  }
  parseOGP(html, url) {
    var _a, _b;
    const get = (prop) => {
      const re = new RegExp(
        `<meta[^>]*(?:property|name)=["']og:${prop}["'][^>]*content=["']([^"']*)["']`,
        "i"
      );
      const match = html.match(re);
      if (match) return match[1];
      const re2 = new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:${prop}["']`,
        "i"
      );
      const match2 = html.match(re2);
      return match2 == null ? void 0 : match2[1];
    };
    const title = get("title") || ((_b = (_a = html.match(/<title[^>]*>([^<]*)<\/title>/i)) == null ? void 0 : _a[1]) == null ? void 0 : _b.trim());
    return {
      title,
      description: get("description"),
      image: get("image"),
      siteName: get("site_name"),
      url
    };
  }
  clear() {
    this.cache.clear();
  }
};

// src/main.ts
var ATTACHMENT_EXT_RE = /^(png|jpe?g|gif|webp|svg|bmp)$/i;
var WrotPlugin = class extends import_obsidian8.Plugin {
  constructor() {
    super(...arguments);
    // WrotView 内のチェックボックストグル等の自前書き込み直後は、postProcessor 側の
    // refreshQuoteCardsForFile (引用カード一斉再描画) を一時的に抑止してチラつきを防ぐ
    this.quoteRefreshSuppressedUntil = 0;
    this.bgStyleEl = null;
    this.tagRuleStyleEl = null;
    this.fontStyleEl = null;
  }
  async onload() {
    await this.loadSettings();
    await (0, import_obsidian8.loadMathJax)();
    this.ogpCache = new OGPCache();
    this.ogpCache.enabled = this.settings.enableOgpFetch;
    this.registerView(
      VIEW_TYPE_WROT,
      (leaf) => new WrotView(leaf, this)
    );
    this.addRibbonIcon("feather", "Wrot", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-wrot",
      name: "Open Wrot",
      callback: () => this.activateView()
    });
    registerWrotPostProcessor(this);
    this.registerEditorExtension([createWrEditorExtension(this.ogpCache, this.app, this, () => this.settings.checkStrikethrough)]);
    this.addSettingTab(new WrotSettingTab(this.app, this));
    this.applyFontFollow();
    this.applyBgColor();
    this.applyTagColorRules();
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.applyBgColor();
        this.applyTagColorRules();
      })
    );
    const onAttachmentChange = (file) => {
      if (!(file instanceof import_obsidian8.TFile)) return;
      if (!ATTACHMENT_EXT_RE.test(file.extension)) return;
      this.refreshAttachmentDecorations();
    };
    this.registerEvent(this.app.metadataCache.on("deleted", onAttachmentChange));
    this.registerEvent(this.app.vault.on("create", onAttachmentChange));
    this.registerEvent(this.app.vault.on("rename", onAttachmentChange));
  }
  refreshAttachmentDecorations() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      var _a;
      const view = leaf.view;
      if (!(view instanceof import_obsidian8.MarkdownView)) return;
      const previewMode = view.previewMode;
      if (previewMode == null ? void 0 : previewMode.rerender) {
        try {
          previewMode.rerender(true);
        } catch (e) {
        }
      }
      const cm = (_a = view.editor) == null ? void 0 : _a.cm;
      if (cm == null ? void 0 : cm.dispatch) {
        try {
          cm.dispatch({ effects: vaultFilesChanged.of(null) });
        } catch (e) {
        }
      }
    });
  }
  applyFontFollow() {
    document.body.classList.toggle("wr-font-follow", this.settings.followObsidianFontSize);
    if (this.fontStyleEl) {
      this.fontStyleEl.remove();
    }
    this.fontStyleEl = document.createElement("style");
    this.fontStyleEl.id = "wr-font-override";
    document.head.appendChild(this.fontStyleEl);
    if (this.settings.followObsidianFontSize) {
      this.fontStyleEl.textContent = `/* @css */
        body {
          --wr-font-text: var(--font-text-size);
          --wr-font-ui-small: calc(var(--font-text-size) * 0.929);
          --wr-font-ui-smaller: calc(var(--font-text-size) * 0.857);
          --wr-font-date: min(var(--font-text-size), 24px);
        }
      `;
    } else {
      this.fontStyleEl.textContent = `/* @css */
        body {
          --wr-font-text: 14px;
          --wr-font-ui-small: 13px;
          --wr-font-ui-smaller: 12px;
          --wr-font-date: 14px;
        }
      `;
    }
  }
  validHex(hex, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : fallback;
  }
  applyBgColor() {
    const isDark = document.body.classList.contains("theme-dark");
    const bgColor = this.validHex(
      isDark ? this.settings.bgColorDark : this.settings.bgColorLight,
      isDark ? DEFAULT_SETTINGS.bgColorDark : DEFAULT_SETTINGS.bgColorLight
    );
    const hoverColor = this.darkenColor(bgColor, 10);
    const textColor = this.validHex(
      isDark ? this.settings.textColorDark : this.settings.textColorLight,
      isDark ? DEFAULT_SETTINGS.textColorDark : DEFAULT_SETTINGS.textColorLight
    );
    const mutedColor = this.blendColor(textColor, bgColor, 0.45);
    const faintColor = this.blendColor(textColor, bgColor, 0.6);
    const unresolvedLinkColor = this.blendColor(textColor, bgColor, 0.3);
    if (this.bgStyleEl) {
      this.bgStyleEl.remove();
    }
    this.bgStyleEl = document.createElement("style");
    this.bgStyleEl.id = "wr-bg-override";
    document.head.appendChild(this.bgStyleEl);
    this.bgStyleEl.textContent = `/* @css */
      body {
        --wr-bg-color: ${bgColor};
      }
      body .wr-input-area,
      body .wr-card,
      body div.block-language-wr,
      body .language-wr,
      body .wr-ogp-card,
      body .wr-codeblock-line {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
      }
      body div.block-language-wr * {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
      }
      body .wr-flair-bg {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
      }
      body div.block-language-wr .wr-inline-code {
        background: rgba(0, 0, 0, 0.08) !important;
      }
      body div.block-language-wr .wr-highlight {
        background: var(--text-highlight-bg) !important;
      }
      /* LV: code-block-flair \u306F\u30B3\u30D4\u30FC\u30DC\u30BF\u30F3\u3092\u517C\u306D\u308B\u3002\u5F53\u305F\u308A\u5224\u5B9A\u304C\u30E1\u30E2\u672B\u5C3E\u3092\u8986\u3046\u305F\u3081\u900F\u904E\u3055\u305B\u308B */
      body .wr-codeblock-line .code-block-flair {
        background: transparent !important;
        background-color: transparent !important;
      }
      body .wr-ogp-card:hover {
        background: ${hoverColor} !important;
        background-color: ${hoverColor} !important;
      }
      body .wr-content,
      body .wr-textarea,
      body .wr-date-label,
      body .wr-today-btn,
      body .wr-inline-code,
      body .wr-plain-text,
      body div.block-language-wr *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-quote-card):not(.wr-quote-card *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .wr-codeblock-line,
      body .wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-quote-card):not(.wr-quote-card *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .cm-line.wr-codeblock-line,
      body .cm-line.wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-quote-card):not(.wr-quote-card *):not(.wr-codeblock-display):not(.wr-codeblock-display *):not(.wr-lp-marker),
      body .wr-reading-list li,
      body .wr-bullet-list li,
      body .wr-ordered-list li {
        color: ${textColor} !important;
      }
      /* \u30CD\u30B9\u30C8\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u5185\u3067Prism\u30C8\u30FC\u30AF\u30F3\u8272\u3092\u5FA9\u5143\u3059\u308B */
      body .wr-codeblock-display code[class*="language-"],
      body .wr-codeblock-display pre[class*="language-"] {
        color: var(--code-normal) !important;
      }
      body .wr-codeblock-display .token.comment,
      body .wr-codeblock-display .token.prolog,
      body .wr-codeblock-display .token.doctype,
      body .wr-codeblock-display .token.cdata { color: var(--code-comment) !important; }
      body .wr-codeblock-display .token.punctuation { color: var(--code-punctuation) !important; }
      body .wr-codeblock-display .token.property,
      body .wr-codeblock-display .token.tag,
      body .wr-codeblock-display .token.boolean,
      body .wr-codeblock-display .token.number,
      body .wr-codeblock-display .token.constant,
      body .wr-codeblock-display .token.symbol,
      body .wr-codeblock-display .token.deleted { color: var(--code-tag) !important; }
      body .wr-codeblock-display .token.selector,
      body .wr-codeblock-display .token.attr-name,
      body .wr-codeblock-display .token.string,
      body .wr-codeblock-display .token.char,
      body .wr-codeblock-display .token.builtin,
      body .wr-codeblock-display .token.inserted { color: var(--code-string) !important; }
      body .wr-codeblock-display .token.operator,
      body .wr-codeblock-display .token.entity,
      body .wr-codeblock-display .token.url,
      body .wr-codeblock-display .language-css .token.string,
      body .wr-codeblock-display .style .token.string { color: var(--code-operator) !important; }
      body .wr-codeblock-display .token.atrule,
      body .wr-codeblock-display .token.attr-value,
      body .wr-codeblock-display .token.keyword { color: var(--code-keyword) !important; }
      body .wr-codeblock-display .token.function,
      body .wr-codeblock-display .token.class-name { color: var(--code-function) !important; }
      body .wr-codeblock-display .token.regex,
      body .wr-codeblock-display .token.important,
      body .wr-codeblock-display .token.variable { color: var(--code-value) !important; }
      body .wr-nav-btn,
      body .wr-toolbar-btn,
      body .wr-copy-btn,
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator,
      body .wr-pin-indicator .svg-icon,
      body .wr-timestamp,
      body .wr-submit-btn,
      body .wr-empty,
      body .wr-ogp-title,
      body .wr-ogp-desc,
      body .wr-ogp-site,
      body .wr-flair-bg,
      body .wr-codeblock-line .code-block-flair,
      body .cm-line.wr-codeblock-line .wr-lp-marker,
      body .cm-line.wr-codeblock-line .wr-list-highlight,
      body .cm-line.wr-codeblock-line .wr-check-unchecked,
      body .cm-line.wr-codeblock-line .wr-check-checked,
      body .cm-line.wr-codeblock-line .wr-ol-highlight,
      body .cm-line.wr-codeblock-line .wr-quote-highlight,
      body .wr-blockquote,
      body .wr-blockquote *,
      body .cm-line.wr-blockquote-line,
      body .cm-line.wr-blockquote-line *,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body *:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-meta,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-image-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-math-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-code-marker {
        color: ${mutedColor} !important;
      }
      body .wr-quote-card-slot .wr-quote-card {
        border-color: ${mutedColor} !important;
      }
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mutedColor} !important;
      }
      body .wr-ogp-card {
        border-color: ${mutedColor} !important;
      }
      /* LV\u5185\u306EWidget DOM\u3067\u3082\u78BA\u5B9F\u306B\u30DE\u30FC\u30AB\u30FC\u8272\u3092\u5F53\u3066\u308B\u305F\u3081\u3001\u4E0A\u8A18\u3088\u308A\u9AD8\u3044\u7279\u7570\u5EA6\u3067\u518D\u5BA3\u8A00 */
      body .cm-line .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line .wr-ol-highlight:not(#x):not(#y):not(#z),
      body .cm-line .wr-quote-highlight:not(#x):not(#y):not(#z),
      body .cm-line.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line .wr-blockquote-wrap:not(#x):not(#y):not(#z) *,
      body .cm-line .wr-ogp-title:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-site:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-loading:not(#x):not(#y):not(#z) {
        color: ${mutedColor} !important;
      }
      /* \u30C1\u30A7\u30C3\u30AF\u30DC\u30C3\u30AF\u30B9(input)\u306E\u67A0\u7DDA\u306F\u30B5\u30D6\u30AB\u30E9\u30FC\u3001\u30C1\u30A7\u30C3\u30AF\u6E08\u307F\u5857\u308A\u3064\u3076\u3057\u306F\u30C6\u30FC\u30DE\u306E\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC */
      body .wr-check-item input[type="checkbox"],
      body .wr-bullet-list .wr-check-item input[type="checkbox"],
      body .wr-reading-list .wr-check-item input[type="checkbox"],
      body .wr-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mutedColor};
        --checkbox-border-color-hover: ${mutedColor};
        --checkbox-color: var(--text-accent);
        --checkbox-color-hover: var(--text-accent);
        accent-color: var(--text-accent);
      }
      body .wr-textarea::placeholder {
        color: ${faintColor} !important;
      }
      body .wr-toolbar-btn.wr-toolbar-active {
        color: var(--text-accent) !important;
      }
      body .cm-line.wr-codeblock-line .wr-tag-highlight,
      body .cm-line.wr-codeblock-line .wr-url-highlight,
      body .cm-line.wr-codeblock-line .wr-internal-link-highlight,
      body .cm-line.wr-codeblock-line .wr-math-highlight {
        color: var(--text-accent) !important;
      }
      body .wr-blockquote-wrap,
      body .wr-check-done {
        color: ${mutedColor} !important;
      }
      body .wr-blockquote,
      body .wr-blockquote-wrap {
        border-left-color: ${mutedColor} !important;
      }
      body .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-ordered-list > li::before,
      body ul.wr-reading-list > li:not(.wr-check-item)::before,
      body ol.wr-reading-list > li::before {
        color: ${mutedColor} !important;
      }
      body .wr-tag,
      body .wr-reading-tag,
      body .wr-internal-link,
      body .wr-url,
      body .wr-reading-url,
      body div.block-language-wr a.wr-internal-link,
      body div.block-language-wr .wr-reading-tag,
      body div.block-language-wr .wr-reading-url,
      body div.block-language-wr a,
      body .cm-line.wr-codeblock-line .wr-internal-link,
      body .cm-line.wr-codeblock-line .wr-url {
        color: var(--text-accent) !important;
      }
      body .cm-line.wr-codeblock-line .wr-internal-link.wr-internal-link-unresolved,
      body div.block-language-wr a.wr-internal-link.wr-internal-link-unresolved,
      body .wr-internal-link.wr-internal-link-unresolved {
        color: ${unresolvedLinkColor} !important;
      }
      body .wr-submit-btn.wr-submit-active {
        color: var(--text-on-accent) !important;
      }
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator .svg-icon {
        stroke: ${mutedColor} !important;
      }
      body .wr-menu {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        border-color: ${hoverColor} !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      }
      body .wr-menu .menu-item {
        color: ${textColor} !important;
        background-color: ${bgColor} !important;
      }
      body .wr-menu .menu-item .menu-item-icon .svg-icon {
        color: ${mutedColor} !important;
        stroke: ${mutedColor} !important;
      }
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):hover,
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):active,
      body .wr-menu .menu-item:not(.is-disabled):hover,
      body .wr-menu .menu-item:not(.is-disabled).selected,
      body .wr-menu .menu-item:not(.is-disabled).is-selected,
      body .wr-menu .menu-item:not(.is-disabled):active {
        background-color: ${hoverColor} !important;
      }
      body .wr-menu .menu-separator {
        border-color: ${hoverColor} !important;
        background: transparent !important;
        background-color: transparent !important;
      }
      body .wr-menu .menu-item.is-disabled {
        color: ${faintColor} !important;
      }
      body .wr-thumbnail-remove {
        background: ${this.blendColor(textColor, bgColor, 0.7)} !important;
        background-color: ${this.blendColor(textColor, bgColor, 0.7)} !important;
        color: ${bgColor} !important;
      }
      body .wr-thumbnail-remove .svg-icon {
        color: ${bgColor} !important;
        stroke: ${bgColor} !important;
      }
      body .wr-thumbnail-remove:hover {
        background: ${this.blendColor(textColor, bgColor, 0.5)} !important;
        background-color: ${this.blendColor(textColor, bgColor, 0.5)} !important;
      }
    `;
  }
  findTagColorRule(memoTags) {
    if (!this.settings.tagColorRulesEnabled) return null;
    const rules = this.settings.tagColorRules;
    if (!rules || rules.length === 0 || !memoTags || memoTags.length === 0) return null;
    for (const raw of memoTags) {
      const tag = raw.replace(/^#/, "").toLowerCase().trim();
      if (!tag) continue;
      for (const rule of rules) {
        const ruleTag = rule.tag.replace(/^#/, "").toLowerCase().trim();
        if (!ruleTag) continue;
        if (ruleTag === tag) return rule;
      }
    }
    return null;
  }
  getTagRuleClassForContent(content) {
    if (!this.settings.tagColorRulesEnabled) return null;
    const tags = content.match(/#[^\s#]+/g);
    if (!tags) return null;
    const rule = this.findTagColorRule(tags);
    if (!rule) return null;
    const idx = this.settings.tagColorRules.indexOf(rule);
    if (idx < 0) return null;
    return `wr-tag-rule-${idx}`;
  }
  getRuleAccentColor(ruleClass) {
    var _a;
    const m = ruleClass.match(/^wr-tag-rule-(\d+)$/);
    if (!m) return null;
    const idx = parseInt(m[1], 10);
    const rule = (_a = this.settings.tagColorRules) == null ? void 0 : _a[idx];
    if (!rule) return null;
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    if (rule.accentColor && hexRe.test(rule.accentColor)) return rule.accentColor;
    return null;
  }
  applyTagColorRules() {
    if (this.tagRuleStyleEl) {
      this.tagRuleStyleEl.remove();
      this.tagRuleStyleEl = null;
    }
    if (!this.settings.tagColorRulesEnabled) return;
    const rules = this.settings.tagColorRules || [];
    if (rules.length === 0) return;
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    const parts = [];
    rules.forEach((rule, i) => {
      if (!hexRe.test(rule.bgColor) || !hexRe.test(rule.textColor)) return;
      const bg = rule.bgColor;
      const fg = rule.textColor;
      const accent = rule.accentColor && hexRe.test(rule.accentColor) ? rule.accentColor : null;
      const hoverBg = this.darkenColor(bg, 10);
      const autoMuted = this.blendColor(fg, bg, 0.45);
      const subSet = !!(rule.subColor && hexRe.test(rule.subColor));
      const userMuted = subSet ? rule.subColor : autoMuted;
      const scope = rule.subColorScope;
      const pickMuted = (key) => {
        if (!subSet) return autoMuted;
        if (!scope) return userMuted;
        return scope[key] === false ? autoMuted : userMuted;
      };
      const mButtons = pickMuted("buttons");
      const mQuote = pickMuted("quote");
      const mList = pickMuted("list");
      const mOgp = pickMuted("ogp");
      const cls = `wr-tag-rule-${i}`;
      parts.push(`/* @css */
      /* Rule ${i}: \u80CC\u666F */
      body .wr-card.${cls},
      body div.block-language-wr.${cls},
      body pre.${cls},
      body .cm-line.wr-codeblock-line.${cls},
      body .wr-lp-codeblock.${cls},
      body .wr-lp-mathblock.${cls},
      body .wr-flair-bg.${cls} {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }
      /* \u5F15\u7528\u30AB\u30FC\u30C9\u306F\u5F15\u7528\u5148 bg \u3092\u906E\u65AD (\u5F15\u7528\u5143\u306E\u30EB\u30FC\u30EB\u306B\u4EFB\u305B\u308B) */
      body .wr-card.${cls} a.wr-quote-card:not([class*="wr-tag-rule-"]),
      body div.block-language-wr.${cls} a.wr-quote-card:not([class*="wr-tag-rule-"]),
      body pre.${cls} a.wr-quote-card:not([class*="wr-tag-rule-"]),
      body .cm-line.wr-codeblock-line.${cls} a.wr-quote-card:not([class*="wr-tag-rule-"]) {
        background: var(--wr-bg-color, #f8f8f8) !important;
        background-color: var(--wr-bg-color, #f8f8f8) !important;
      }
      body div.block-language-wr.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card):not(.wr-quote-card *):not(input[type="checkbox"]),
      body pre.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card):not(.wr-quote-card *):not(input[type="checkbox"]) {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }

      /* Rule ${i}: \u6587\u5B57\u8272\uFF08\u30BF\u30B0/\u30EA\u30F3\u30AF/URL/\u5F15\u7528\u30D6\u30ED\u30C3\u30AF/\u5F15\u7528\u30AB\u30FC\u30C9\u9664\u304F\uFF09 */
      body .wr-card.${cls} .wr-content,
      body .wr-card.${cls} .wr-content *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-blockquote):not(.wr-quote-card):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-blockquote *):not(.wr-quote-card *) {
        color: ${fg} !important;
      }
      body div.block-language-wr.${cls},
      body div.block-language-wr.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card):not(input[type="checkbox"]):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card *),
      body pre.${cls},
      body pre.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card):not(input[type="checkbox"]):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card *) {
        color: ${fg} !important;
      }
      body .cm-line.wr-codeblock-line.${cls},
      body .cm-line.wr-codeblock-line.${cls} *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-lp-marker):not(.wr-list-highlight):not(.wr-ol-highlight):not(.wr-quote-highlight):not(.wr-blockquote-wrap):not(.wr-check-unchecked):not(.wr-check-checked):not(.wr-check-done):not(.wr-quote-card):not(input[type="checkbox"]):not(.wr-tag-highlight *):not(.wr-internal-link-highlight *):not(.wr-url-highlight *):not(.wr-blockquote-wrap *):not(.wr-quote-card *) {
        color: ${fg} !important;
      }

      /* Rule ${i}: \u30B5\u30D6\u8981\u7D20 - \u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7\u30FB\u30E1\u30CB\u30E5\u30FC\u30FB\u30D4\u30F3 */
      body .wr-card.${cls} .wr-timestamp,
      body .wr-card.${cls} .wr-copy-btn,
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon {
        color: ${mButtons} !important;
      }
      /* Rule ${i}: \u30B5\u30D6\u8981\u7D20 - \u5F15\u7528 */
      body .wr-card.${cls} .wr-blockquote,
      body .wr-card.${cls} .wr-blockquote-wrap,
      body .wr-card.${cls} .wr-quote-highlight,
      body div.block-language-wr.${cls} .wr-blockquote,
      body pre.${cls} .wr-blockquote,
      body .cm-line.wr-codeblock-line.${cls}.wr-blockquote-line,
      body .cm-line.wr-codeblock-line.${cls} .wr-blockquote-wrap {
        color: ${mQuote} !important;
      }
      /* Rule ${i}: \u30B5\u30D6\u8981\u7D20 - \u30EA\u30B9\u30C8\u30FB\u30C1\u30A7\u30C3\u30AF\u30DC\u30C3\u30AF\u30B9 */
      body .wr-card.${cls} .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-card.${cls} .wr-ordered-list > li::before,
      body .wr-card.${cls} .wr-check-done,
      body .wr-card.${cls} .wr-check-unchecked,
      body .wr-card.${cls} .wr-check-checked,
      body .wr-card.${cls} .wr-list-highlight,
      body .wr-card.${cls} .wr-ol-highlight,
      body div.block-language-wr.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body div.block-language-wr.${cls} ol.wr-reading-list > li::before,
      body pre.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body pre.${cls} ol.wr-reading-list > li::before,
      body .cm-line.wr-codeblock-line.${cls} .wr-list-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-unchecked,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-checked,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-done,
      body .cm-line.wr-codeblock-line.${cls} .wr-ol-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-marker {
        color: ${mList} !important;
      }
      /* LV\u5185\u306EWidget DOM\u3067\u3082\u30BF\u30B0\u30EB\u30FC\u30EB\u306E\u30B5\u30D6\u30AB\u30E9\u30FC\u304C\u52DD\u3064\u3088\u3046\u306B\u3001ID\u30BB\u30EC\u30AF\u30BF\u76F8\u5F53\u306E\u7279\u7570\u5EA6\u3067\u518D\u5BA3\u8A00 */
      body .cm-line.${cls} .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-done:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-ol-highlight:not(#x):not(#y):not(#z) {
        color: ${mList} !important;
      }
      /* LV\u5185\u306EWidget DOM\u3067\u3082\u5F15\u7528\u306E\u672C\u6587\u30FB\u7E26\u7DDA\u304C\u30BF\u30B0\u30EB\u30FC\u30EB\u306Equote\u8272\u306B\u306A\u308B\u3088\u3046\u3001ID\u30BB\u30EC\u30AF\u30BF\u76F8\u5F53\u306E\u7279\u7570\u5EA6\u3067\u518D\u5BA3\u8A00 */
      body .cm-line.${cls}.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z) *,
      body .cm-line.${cls} .wr-quote-highlight:not(#x):not(#y):not(#z) {
        color: ${mQuote} !important;
      }
      /* \u30C1\u30A7\u30C3\u30AF\u30DC\u30C3\u30AF\u30B9(input)\u306E\u67A0\u7DDA\u306F\u30B5\u30D6\u30AB\u30E9\u30FC\u3001\u30C1\u30A7\u30C3\u30AF\u6E08\u307F\u5857\u308A\u3064\u3076\u3057\u306F\u30A2\u30AF\u30BB\u30F3\u30C8\u30AB\u30E9\u30FC */
      body .wr-card.${cls} .wr-check-item input[type="checkbox"],
      body div.block-language-wr.${cls} .wr-check-item input[type="checkbox"],
      body pre.${cls} .wr-check-item input[type="checkbox"],
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mList};
        --checkbox-border-color-hover: ${mList};
        --checkbox-color: ${accent != null ? accent : "var(--text-accent)"};
        --checkbox-color-hover: ${accent != null ? accent : "var(--text-accent)"};
        accent-color: ${accent != null ? accent : "var(--text-accent)"};
      }
      body .wr-card.${cls} .wr-blockquote *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body div.block-language-wr.${cls} .wr-blockquote *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body pre.${cls} .wr-blockquote *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *) {
        color: ${mQuote} !important;
      }
      /* 492\u884C\u306A\u3069\u306E\u6587\u5B57\u8272\u5F53\u3066\u306B\u7279\u7570\u5EA6\u3067\u8CA0\u3051\u308B\u74B0\u5883\u5411\u3051\u306B\u3001 ID\u76F8\u5F53\u306E\u7279\u7570\u5EA6\u3067\u518D\u5BA3\u8A00 */
      body .wr-card.${cls} .wr-blockquote:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-blockquote:not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body div.block-language-wr.${cls} .wr-blockquote:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-blockquote:not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body pre.${cls} .wr-blockquote:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-blockquote:not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url) {
        color: ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url .wr-blockquote-wrap {
        color: ${accent != null ? accent : "var(--text-accent)"} !important;
      }
      body .wr-card.${cls} .wr-blockquote,
      body .wr-card.${cls} .wr-blockquote-wrap,
      body div.block-language-wr.${cls} .wr-blockquote,
      body pre.${cls} .wr-blockquote {
        border-left-color: ${mQuote} !important;
      }
      /* Rule ${i}: \u5F15\u7528\u30AB\u30FC\u30C9\u81EA\u8EAB\u306B\u30EB\u30FC\u30EB\u30AF\u30E9\u30B9\u304C\u4ED8\u3044\u305F = \u5F15\u7528\u5143\u306E\u30EB\u30FC\u30EB */
      /* \u67A0\u7DDA\u8272\u306F\u5F15\u7528\u5148(=\u8868\u793A\u3059\u308B\u5074)\u306E\u898B\u305F\u76EE\u306B\u5408\u308F\u305B\u308B\u305F\u3081\u3001\u3053\u3053\u3067\u306F\u4E0A\u66F8\u304D\u3057\u306A\u3044 */
      body .wr-quote-card-slot a.wr-quote-card.${cls} {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }
      body .wr-quote-card-slot a.wr-quote-card.${cls}:hover {
        background: ${hoverBg} !important;
        background-color: ${hoverBg} !important;
      }
      /* \u3053\u306E\u30EB\u30FC\u30EB\u30AF\u30E9\u30B9\u304C\u7956\u5148\u30AB\u30FC\u30C9\u306B\u4ED8\u3044\u3066\u3044\u308B\u5834\u5408\u3001\u914D\u4E0B\u306E\u5F15\u7528\u30AB\u30FC\u30C9\u306E\u67A0\u7DDA\u3082\u81EA\u5206\u306E\u30B5\u30D6\u30AB\u30E9\u30FC\u306B\u63C3\u3048\u308B */
      body .wr-card.${cls} .wr-quote-card-slot a.wr-quote-card,
      body div.block-language-wr.${cls} .wr-quote-card-slot a.wr-quote-card,
      body pre.${cls} .wr-quote-card-slot a.wr-quote-card,
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card-slot a.wr-quote-card {
        border-color: ${mQuote} !important;
      }
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body,
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-nested-quote-marker):not(.wr-blockquote):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(input[type="checkbox"]):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *),
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-meta,
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote} !important;
      }
      /* \u30D9\u30FC\u30B9\u306E\u5F15\u7528\u30AB\u30FC\u30C9\u672C\u6587 mutedColor \u30EB\u30FC\u30EB\u306B\u7279\u7570\u5EA6\u8CA0\u3051\u3059\u308B\u74B0\u5883\u5411\u3051\u306B\u3001ID\u76F8\u5F53\u306E\u7279\u7570\u5EA6\u3067\u518D\u5BA3\u8A00 */
      body .wr-quote-card-slot a.wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot a.wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote} !important;
      }
      /* \u30DE\u30FC\u30AB\u30FC\u306F\u6A19\u6E96 muted \u30EB\u30FC\u30EB\u306E :not() \u5217\u306B specificity \u8CA0\u3051\u3059\u308B\u305F\u3081\u540C\u5217\u3067\u63C3\u3048\u308B */
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-quote-image-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-quote-math-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-quote-code-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *) {
        color: ${mQuote} !important;
      }
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mQuote} !important;
      }
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-tag,
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-internal-link,
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-url,
      body .wr-quote-card-slot a.wr-quote-card.${cls} .wr-quote-card-body .wr-nested-quote-marker {
        color: ${accent != null ? accent : "var(--text-accent)"} !important;
      }
      body .wr-card.${cls} .wr-quote-card-body .wr-nested-quote-marker,
      body div.block-language-wr.${cls} .wr-quote-card-body .wr-nested-quote-marker,
      body pre.${cls} .wr-quote-card-body .wr-nested-quote-marker,
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card-body .wr-nested-quote-marker {
        color: ${accent != null ? accent : "var(--text-accent)"} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-line.${cls}::before {
        background-color: ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-2.${cls}::before {
        box-shadow: 18px 0 0 0 ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-3.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-4.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-5.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote},
          72px 0 0 0 ${mQuote} !important;
      }
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon {
        stroke: ${mButtons} !important;
      }
      body .wr-card.${cls} .wr-copy-btn.wr-copy-done .svg-icon {
        color: ${accent != null ? accent : "var(--text-accent)"} !important;
        stroke: ${accent != null ? accent : "var(--text-accent)"} !important;
      }
      ${accent ? `
      /* Rule ${i}: \u30A2\u30AF\u30BB\u30F3\u30C8\u8272 */
      body .wr-card.${cls} .wr-tag,
      body .wr-card.${cls} .wr-internal-link,
      body .wr-card.${cls} .wr-url,
      body div.block-language-wr.${cls} .wr-reading-tag,
      body div.block-language-wr.${cls} .wr-internal-link,
      body div.block-language-wr.${cls} .wr-reading-url,
      body div.block-language-wr.${cls} a,
      body pre.${cls} .wr-reading-tag,
      body pre.${cls} .wr-internal-link,
      body pre.${cls} .wr-reading-url,
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link,
      body .cm-line.wr-codeblock-line.${cls} .wr-url {
        color: ${accent} !important;
      }
      body .wr-card.${cls} .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: ${accent} !important;
        stroke: ${accent} !important;
      }
      ` : ""}

      /* Rule ${i}: OGP/Twitter\u30AB\u30FC\u30C9 */
      body .wr-card.${cls} .wr-ogp-card,
      body div.block-language-wr.${cls} .wr-ogp-card,
      body pre.${cls} .wr-ogp-card,
      body .wr-lp-media.${cls} .wr-ogp-card {
        background: ${bg} !important;
        background-color: ${bg} !important;
        border-color: ${mOgp} !important;
      }
      body .wr-card.${cls} .wr-ogp-card:hover,
      body div.block-language-wr.${cls} .wr-ogp-card:hover,
      body pre.${cls} .wr-ogp-card:hover,
      body .wr-lp-media.${cls} .wr-ogp-card:hover {
        background: ${hoverBg} !important;
        background-color: ${hoverBg} !important;
      }
      body .wr-card.${cls} .wr-ogp-title,
      body .wr-card.${cls} .wr-ogp-desc,
      body .wr-card.${cls} .wr-ogp-site,
      body .wr-card.${cls} .wr-ogp-loading,
      body div.block-language-wr.${cls} .wr-ogp-title,
      body div.block-language-wr.${cls} .wr-ogp-desc,
      body div.block-language-wr.${cls} .wr-ogp-site,
      body div.block-language-wr.${cls} .wr-ogp-loading,
      body pre.${cls} .wr-ogp-title,
      body pre.${cls} .wr-ogp-desc,
      body pre.${cls} .wr-ogp-site,
      body pre.${cls} .wr-ogp-loading,
      body .wr-lp-media.${cls} .wr-ogp-title,
      body .wr-lp-media.${cls} .wr-ogp-desc,
      body .wr-lp-media.${cls} .wr-ogp-site,
      body .wr-lp-media.${cls} .wr-ogp-loading {
        color: ${mOgp} !important;
      }
      /* \u89AA\u8981\u7D20\u306E\u6587\u5B57\u8272\u5F53\u3066\u306B\u7279\u7570\u5EA6\u8CA0\u3051\u3059\u308B\u74B0\u5883\u5411\u3051\u306B\u3001 ID\u76F8\u5F53\u306E\u7279\u7570\u5EA6\u3067\u518D\u5BA3\u8A00 */
      body .wr-card.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z) {
        color: ${mOgp} !important;
      }
      `);
    });
    if (parts.length === 0) return;
    this.tagRuleStyleEl = document.createElement("style");
    this.tagRuleStyleEl.id = "wr-tag-rule-override";
    this.tagRuleStyleEl.textContent = parts.join("");
    document.head.appendChild(this.tagRuleStyleEl);
  }
  refreshReadingViews() {
    const sweepSelector = '.wr-card[class*="wr-tag-rule-"], div.block-language-wr[class*="wr-tag-rule-"], pre[class*="wr-tag-rule-"], .cm-line[class*="wr-tag-rule-"], .code-block-flair[class*="wr-tag-rule-"], .copy-code-button[class*="wr-tag-rule-"], .wr-flair-bg[class*="wr-tag-rule-"]';
    document.querySelectorAll(sweepSelector).forEach((el2) => {
      const existing = Array.from(el2.classList);
      for (const cls of existing) {
        if (/^wr-tag-rule-\d+$/.test(cls)) el2.classList.remove(cls);
      }
    });
    if (!this.settings.tagColorRulesEnabled) return;
    document.querySelectorAll('code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]').forEach((code) => {
      const block = code.closest(".block-language-wr") || code.closest("pre");
      if (!(block instanceof HTMLElement)) return;
      const targets = [block];
      const container = block.parentElement;
      if (container) {
        container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el2) => {
          if (el2 instanceof HTMLElement) targets.push(el2);
        });
      }
      block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el2) => {
        if (el2 instanceof HTMLElement) targets.push(el2);
      });
      const rawText = code.getAttribute("data-wr-original") || code.textContent || "";
      const blockTags = rawText.match(/#[^\s#]+/g) || [];
      const rule = this.findTagColorRule(blockTags);
      if (!rule) return;
      const idx = this.settings.tagColorRules.indexOf(rule);
      if (idx < 0) return;
      const cls = `wr-tag-rule-${idx}`;
      for (const t of targets) t.classList.add(cls);
    });
  }
  refreshAllWrDecorations() {
    this.refreshViews();
    this.refreshReadingViews();
    this.app.workspace.iterateAllLeaves((leaf) => {
      var _a;
      const view = leaf.view;
      if (!(view instanceof import_obsidian8.MarkdownView)) return;
      const cm = (_a = view.editor) == null ? void 0 : _a.cm;
      if (cm == null ? void 0 : cm.dispatch) {
        try {
          cm.dispatch({ effects: tagRulesChanged.of(null) });
        } catch (e) {
        }
      }
    });
  }
  blendColor(fg, bg, ratio) {
    const fR = parseInt(fg.slice(1, 3), 16);
    const fG = parseInt(fg.slice(3, 5), 16);
    const fB = parseInt(fg.slice(5, 7), 16);
    const bR = parseInt(bg.slice(1, 3), 16);
    const bG = parseInt(bg.slice(3, 5), 16);
    const bB = parseInt(bg.slice(5, 7), 16);
    const r = Math.round(fR + (bR - fR) * ratio);
    const g = Math.round(fG + (bG - fG) * ratio);
    const b = Math.round(fB + (bB - fB) * ratio);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  darkenColor(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  refreshViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      leaf.view.refresh();
    }
  }
  updateSubmitLabel() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view.submitLabelEl) {
        view.submitLabelEl.textContent = `${this.settings.submitLabel} `;
      }
    }
  }
  updateSubmitIcon() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view.submitIconEl) {
        view.submitIconEl.empty();
        if (this.settings.submitIcon) {
          (0, import_obsidian8.setIcon)(view.submitIconEl, this.settings.submitIcon);
        }
      }
    }
  }
  updateInputPlaceholder() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view.textarea) {
        view.textarea.setAttribute("placeholder", this.settings.inputPlaceholder);
      }
    }
  }
  onunload() {
    var _a, _b, _c;
    (_a = this.bgStyleEl) == null ? void 0 : _a.remove();
    this.bgStyleEl = null;
    (_b = this.tagRuleStyleEl) == null ? void 0 : _b.remove();
    this.tagRuleStyleEl = null;
    (_c = this.fontStyleEl) == null ? void 0 : _c.remove();
    this.fontStyleEl = null;
    document.body.classList.remove("wr-font-follow");
  }
  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_WROT);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }
    let leaf;
    switch (this.settings.viewPlacement) {
      case "left":
        leaf = workspace.getLeftLeaf(false);
        break;
      case "right":
        leaf = workspace.getRightLeaf(false);
        break;
      case "main":
      default:
        leaf = workspace.getLeaf("tab");
        break;
    }
    await leaf.setViewState({ type: VIEW_TYPE_WROT, active: true });
    workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    var _a;
    const raw = (_a = await this.loadData()) != null ? _a : {};
    let dirty = false;
    for (const key of ["autoLinkEnabled", "autoLinkExcludeList"]) {
      if (key in raw) {
        delete raw[key];
        dirty = true;
      }
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
    if (dirty) {
      await this.saveData(this.settings);
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
    if (this.ogpCache) {
      this.ogpCache.enabled = this.settings.enableOgpFetch;
    }
  }
};
