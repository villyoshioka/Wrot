import { HEX_COLOR_RE } from "./patterns";

/** Hex color arithmetic for the user-configurable palette. All inputs are #rrggbb. */

function toHex(n: number): string {
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
