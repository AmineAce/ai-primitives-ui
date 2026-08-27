export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export type Ink = (a: number) => number;

/* Light themes need dim layers lifted so near-black ink stays visible
   on white; bright ink on dark backgrounds renders as authored.
   Derived from ink luminance so consumers need no theme plumbing. */
export function makeInk(rgb: RgbColor): Ink {
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  if (lum >= 0.5) return (a: number) => a;
  return (a: number) =>
    Math.min(1, Math.max(a, Math.min(a * 1.5 + 0.06, a + 0.25)));
}

/* Convenience: derive the ink curve directly from any CSS color string. */
export function inkFromColor(
  color: string,
  fallback: RgbColor = DEFAULT_DOT_RGB,
): Ink {
  return makeInk(parseColor(color) ?? fallback);
}

export const DEFAULT_DOT_RGB: RgbColor = { r: 201, g: 209, b: 217 };
export const ORB_FG_VAR = "--orb-fg";
export const FG_FALLBACK_VAR = "--fg-default";

export function toColorPrefix(color: RgbColor): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, `;
}

const SENTINEL = "rgb(0, 1, 0)";
const RGB_RE = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/;

let sentinelCtx: CanvasRenderingContext2D | null | undefined;
function getSentinelCtx(): CanvasRenderingContext2D | null {
  if (sentinelCtx !== undefined) return sentinelCtx;
  if (typeof document === "undefined") {
    sentinelCtx = null;
    return sentinelCtx;
  }
  const canvas = document.createElement("canvas");
  sentinelCtx = canvas.getContext("2d");
  return sentinelCtx;
}

const colorCache = new Map<string, RgbColor | null>();

export function parseColor(value: string): RgbColor | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cached = colorCache.get(trimmed);
  if (cached !== undefined) return cached;
  let result: RgbColor | null = null;
  if (trimmed[0] === "#") {
    const hex = trimmed.slice(1);
    const full =
      hex.length === 3
        ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        result = { r, g, b };
      }
    }
  } else {
    const ctx = getSentinelCtx();
    if (ctx) {
      ctx.fillStyle = SENTINEL;
      ctx.fillStyle = trimmed;
      const normalized = ctx.fillStyle;
      if (normalized !== SENTINEL) {
        const match = RGB_RE.exec(normalized);
        if (match) {
          result = {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
          };
        }
      }
    }
  }
  // Cache up to 64 entries to avoid unbounded growth
  if (colorCache.size >= 64) colorCache.clear();
  colorCache.set(trimmed, result);
  return result;
}
