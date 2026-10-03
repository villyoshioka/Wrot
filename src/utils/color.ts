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

/** OKLab perceptual lightness of a color, 0 (black) to 1 (white). */
export function oklabLightness(hex: string): number {
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
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
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
