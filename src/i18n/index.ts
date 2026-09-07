import { getLanguage } from "obsidian";
import ja, { type Translations } from "./ja";
import en from "./en";
import enGB from "./en-GB";
import es from "./es";
import ko from "./ko";
import pt from "./pt";
import fr from "./fr";
import de from "./de";
import it from "./it";
import ru from "./ru";
import zhTW from "./zh-TW";
import zhCN from "./zh-CN";

type LocaleCode =
  | "ja"
  | "en"
  | "en-GB"
  | "ko"
  | "es"
  | "pt"
  | "fr"
  | "de"
  | "it"
  | "ru"
  | "zh-TW"
  | "zh-CN"
  | "zh";

// Exact-match locale set; subtagged codes (en-GB etc.) must be listed here.
// Obsidian reports Simplified Chinese as bare "zh", so "zh" aliases "zh-CN".
const SUPPORTED_LOCALES: ReadonlyArray<LocaleCode> = ["ja", "en", "en-GB", "es", "ko", "pt", "fr", "de", "it", "ru", "zh-TW", "zh-CN", "zh"];

const DICTIONARIES: Partial<Record<LocaleCode, Translations>> = {
  ja,
  en,
  "en-GB": enGB,
  es,
  ko,
  pt,
  fr,
  de,
  it,
  ru,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  zh: zhCN,
};

const FALLBACK_LOCALE: LocaleCode = "en";

let activeLocale: LocaleCode = FALLBACK_LOCALE;
let activeDict: Translations = en;

// Distinguishes an unsupported language (which falls back to en) from English itself.
let usingFallbackLocale = false;

// Resolution order: exact match → base-language fallback → null (caller falls back to en).
function resolveLocale(raw: string | undefined | null): LocaleCode | null {
  if (!raw) return null;
  const normalized = raw.trim();
  if (!normalized) return null;

  if ((SUPPORTED_LOCALES as ReadonlyArray<string>).includes(normalized)) {
    return normalized as LocaleCode;
  }
  const baseCandidate = normalized.split(/[-_]/)[0];
  if (
    baseCandidate !== normalized &&
    (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(baseCandidate)
  ) {
    return baseCandidate as LocaleCode;
  }
  return null;
}

export function initI18n(): void {
  let lang: string | undefined;
  try {
    lang = getLanguage();
  } catch {
    lang = undefined;
  }
  const resolved = resolveLocale(lang);
  usingFallbackLocale = resolved === null;
  activeLocale = resolved ?? FALLBACK_LOCALE;
  activeDict = DICTIONARIES[activeLocale] ?? en;
}

/**
 * Default date formats for the running locale. An unsupported language reads the en
 * dictionary for its UI text, but a month-first date would be a foreign convention there,
 * and a spelled-out month would come out in the user's own language inside an English
 * order; year-first digits are the one form that belongs to no single country.
 */
export function defaultHeaderDateFormat(): string {
  return usingFallbackLocale ? "YYYY/MM/DD" : t("defaults.headerDateFormat");
}

export function defaultTimestampFormat(): string {
  return usingFallbackLocale ? "YYYY/MM/DD HH:mm:ss" : t("defaults.timestampFormat");
}

export function getActiveLocale(): LocaleCode {
  return activeLocale;
}

function applyParams(text: string, params: Record<string, string | number> | undefined): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- member access on untyped Obsidian/CodeMirror internal API
      return String(params[key]);
    }
    return match;
  });
}

export function t(
  key: keyof Translations,
  params?: Record<string, string | number>
): string {
  const value = activeDict[key];
  if (typeof value === "string") return applyParams(value, params);
  // Missing dictionary key: return the key itself instead of breaking.
  return applyParams(String(key), params);
}
