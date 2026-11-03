import { HEX_COLOR_RE } from "./patterns";

/** Hex color arithmetic for the user-configurable palette. All inputs are #rrggbb. */

/** One channel as a two-digit hex pair. */
export function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

/** Mixes `fg` toward `bg`; ratio 0 keeps fg, 1 returns bg. */
export function blendColor(fg: string, bg: string, ratio: number): string {
  const fR = parseInt(fg.slice(1, 3), 16);
  const fG = parseInt(fg.slice(3, 5), 16);
  const fB = parseInt(fg.slice(5, 7), 16);
  const bR = parseInt(bg.slice(1, 3), 16);
  const bG = parseInt(bg.slice(3, 5), 16);
  const bB = parseInt(bg.slice(5, 7), 16);
  const r = Math.round(fR + (bR - fR) * ratio);
  const g = Math.round(fG + (bG - fG) * ratio);
  const b = Math.round(fB + (bB - fB) * ratio);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Subtracts `amount` from each channel, clamped at zero. Used for hover states. */
export function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Returns the color if it is a well-formed hex value, otherwise the fallback. */
export function validHex(hex: string, fallback: string): string {
  return HEX_COLOR_RE.test(hex) ? hex : fallback;
}

/** OKLab coordinates [L, a, b] of a color. */
function oklab(hex: string): [number, number, number] {
  const lin = (i: number): number => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = lin(1);
  const g = lin(3);
  const b = lin(5);
  const l = Math.cbrt(0.4122214708 * r + 0.5363329405 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** The sRGB hex for OKLab coordinates, channels clipped into gamut. */
function oklabToHex(L: number, a: number, b: number): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const gamma = (c: number): number => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  return `#${[
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => toHex(gamma(c))).join("")}`;
}

/** OKLab perceptual lightness of a color, 0 (black) to 1 (white). */
function oklabLightness(hex: string): number {
  return oklab(hex)[0];
}

/** OKLab lightnesses for code colors on a given text and background. */
export interface CodeLightness {
  /** Token colors. */
  base: number;
  /** Punctuation. */
  muted: number;
  /** Comments. */
  faint: number;
}

/**
 * Token colors sit halfway between the text's lightness and a fixed step off the background
 * toward whichever side has room, so they follow the text yet stand off the background. Each
 * level also keeps a minimum gap from the background, so a text color picked close to it
 * cannot drag the code down with it.
 */
export function codeLightness(text: string, bg: string): CodeLightness {
  const bgL = oklabLightness(bg);
  const textL = oklabLightness(text);
  const dir = bgL < 0.5 ? 1 : -1;
  const step = Math.min(0.88, Math.max(0.25, bgL + 0.45 * dir));
  const textGap = Math.abs(textL - bgL);
  // At least `minGap` from the background, on its roomier side.
  const off = (l: number, minGap: number): number => {
    const gapped = dir > 0 ? Math.max(l, bgL + minGap) : Math.min(l, bgL - minGap);
    return Math.round(Math.min(1, Math.max(0, gapped)) * 1000) / 1000;
  };
  return {
    base: off((textL + step) / 2, 0.3),
    muted: off(bgL + dir * 0.6 * textGap, 0.25),
    faint: off(bgL + dir * 0.45 * textGap, 0.2),
  };
}

// How far (OKLab distance) a highlight must stand off its background: about where the default
// yellow sits on white, which reads clearly.
const HIGHLIGHT_MIN_DIFF = 0.095;

/**
 * A highlight colour as Obsidian lays it (30% of the theme colour over the background), made
 * opaque for that background. Where it would sit too close to the background to make out (a
 * yellow highlight on a pale yellow memo), it is pushed darker, or lighter on a dark
 * background, keeping its hue, just far enough to show. A clear one is returned as laid.
 */
export function visibleHighlight(color: string, bg: string): string {
  const laid = blendColor(color, bg, 0.7);
  const [hl, ha, hb] = oklab(laid);
  const [bl, ba, bb] = oklab(bg);
  const hueDiff = Math.hypot(ha - ba, hb - bb);
  if (Math.hypot(hl - bl, hueDiff) >= HIGHLIGHT_MIN_DIFF) return laid;
  const need = Math.sqrt(Math.max(0, HIGHLIGHT_MIN_DIFF ** 2 - hueDiff ** 2));
  return oklabToHex(bl >= 0.5 ? bl - need : bl + need, ha, hb);
}

// OKLab distance under which a diagram color counts as lost in the background, and the
// lightness step it is moved by when it does.
const DIAGRAM_NEAR_DIFF = 0.15;
const DIAGRAM_PUSH_L = 0.45;

function nearBackground(color: string, bg: string): boolean {
  const [l, a, b] = oklab(color);
  const [bl, ba, bb] = oklab(bg);
  return Math.hypot(l - bl, a - ba, b - bb) < DIAGRAM_NEAR_DIFF;
}

/**
 * A diagram color on a memo. Left as it is unless it nearly matches the background; then its
 * lightness moves off the background, keeping its hue.
 */
export function visibleDiagramColor(color: string, bg: string): string {
  if (!nearBackground(color, bg)) return color;
  const [, a, b] = oklab(color);
  const bl = oklabLightness(bg);
  return oklabToHex(bl >= 0.5 ? bl - DIAGRAM_PUSH_L : bl + DIAGRAM_PUSH_L, a, b);
}

/** Obsidian's own highlight colours, for a theme whose values cannot be read. */
const DEFAULT_HIGHLIGHT_THEME: Record<"light" | "dark", Record<string, string>> = {
  light: { red: "#e93147", orange: "#ec7500", yellow: "#e0ac00", green: "#08b94e", blue: "#086ddd", purple: "#7852ee" },
  dark: { red: "#fb464c", orange: "#e9973f", yellow: "#e0de71", green: "#44cf6e", blue: "#027aff", purple: "#a882ff" },
};

/**
 * The theme's colour variables (--color-red and the rest) as hex, falling back to Obsidian's
 * defaults for any that do not resolve to an opaque sRGB colour. A canvas turns whatever form
 * the theme wrote them in into hex without touching the document.
 */
export function readThemeHighlightColors(doc: Document, dark: boolean): Record<string, string> {
  const defaults = DEFAULT_HIGHLIGHT_THEME[dark ? "dark" : "light"];
  const style = doc.defaultView?.getComputedStyle(doc.body);
  const ctx = createEl("canvas").getContext("2d");
  const out: Record<string, string> = {};
  for (const [name, fallback] of Object.entries(defaults)) {
    const raw = style?.getPropertyValue(`--color-${name}`).trim() ?? "";
    let hex = fallback;
    if (raw && ctx) {
      ctx.fillStyle = fallback;
      ctx.fillStyle = raw;
      const parsed = String(ctx.fillStyle);
      if (HEX_COLOR_RE.test(parsed)) hex = parsed;
    }
    out[name] = hex;
  }
  return out;
}

/** The theme's diagram colors as hex. */
export interface DiagramTheme {
  series: string[];
  accent: string;
  critical: string;
}

/**
 * The theme's diagram colors. Null where they cannot all be read (Obsidian before 1.15 has none),
 * which leaves them to the engine.
 */
export function readDiagramTheme(doc: Document): DiagramTheme | null {
  const style = doc.defaultView?.getComputedStyle(doc.body);
  const ctx = createEl("canvas").getContext("2d");
  if (!style || !ctx) return null;
  const read = (name: string): string | null => {
    const raw = style.getPropertyValue(name).trim();
    // A value the canvas rejects leaves the previous color, so two starting colors expose it.
    ctx.fillStyle = "#000000";
    ctx.fillStyle = raw;
    const parsed = String(ctx.fillStyle);
    ctx.fillStyle = "#ffffff";
    ctx.fillStyle = raw;
    return parsed === String(ctx.fillStyle) && HEX_COLOR_RE.test(parsed) ? parsed : null;
  };
  const series = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => read(`--mermaid-color-${i}`));
  const accent = read("--mermaid-accent");
  const critical = read("--mermaid-critical");
  if (!accent || !critical || series.some((color) => color === null)) return null;
  return { series: series as string[], accent, critical };
}

/**
 * The theme's series colors for a memo: any that nearly match its background move to the end, so
 * a diagram reaches them last. The colors stay as they are, since items must stay distinct from
 * one another.
 */
export function orderDiagramSeries(series: string[], bg: string): string[] {
  return [
    ...series.filter((color) => !nearBackground(color, bg)),
    ...series.filter((color) => nearBackground(color, bg)),
  ];
}

/**
 * The theme's diagram colors ordered for a memo. An accent or critical color that nearly matches
 * the background takes one of the series colors that does not.
 */
export function diagramThemeFor(theme: DiagramTheme, bg: string): DiagramTheme {
  const series = orderDiagramSeries(theme.series, bg);
  return {
    series,
    accent: nearBackground(theme.accent, bg) ? series[0] : theme.accent,
    critical: nearBackground(theme.critical, bg) ? series[1] : theme.critical,
  };
}
