/**
 * OKLCH color utilities for the theme editor.
 *
 * parseOklch / formatOklch — round-trip between CSS string and object.
 * oklchToHex — canvas-based conversion (client-side only).
 * contrastRatio — WCAG 2.x contrast ratio between two CSS color strings.
 */

export interface OklchColor {
  l: number; // 0–1
  c: number; // 0–0.4
  h: number; // 0–360
  alpha?: number;
}

// Match oklch(L C H) and oklch(L C H / alpha)
const OKLCH_RE =
  /^oklch\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/;

/**
 * Parse a CSS oklch() string into an OklchColor object.
 * Returns null if the string does not match.
 */
export function parseOklch(css: string): OklchColor | null {
  const m = OKLCH_RE.exec(css.trim());
  if (!m) return null;

  const l = parseFloat(m[1]);
  const c = parseFloat(m[2]);
  const h = parseFloat(m[3]);

  let alpha: number | undefined;
  if (m[4] !== undefined) {
    if (m[4].endsWith('%')) {
      alpha = parseFloat(m[4]) / 100;
    } else {
      alpha = parseFloat(m[4]);
    }
  }

  return { l, c, h, alpha };
}

/**
 * Format an OklchColor object as a CSS oklch() string.
 */
export function formatOklch(color: OklchColor): string {
  const l = round(color.l, 4);
  const c = round(color.c, 4);
  const h = round(color.h, 2);

  if (color.alpha !== undefined && color.alpha < 1) {
    return `oklch(${l} ${c} ${h} / ${round(color.alpha, 3)})`;
  }
  return `oklch(${l} ${c} ${h})`;
}

/**
 * Convert a CSS oklch() string to a hex color string.
 * Uses a 1x1 off-screen canvas for browser color conversion.
 * Returns '#000000' as fallback if conversion fails.
 *
 * Client-side only — requires canvas API.
 */
// Shared canvas for color conversion (avoids creating one per call)
let _sharedCanvas: HTMLCanvasElement | null = null;
function getCanvasCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!_sharedCanvas) {
    _sharedCanvas = document.createElement('canvas');
    _sharedCanvas.width = 1;
    _sharedCanvas.height = 1;
  }
  return _sharedCanvas.getContext('2d');
}

export function oklchToHex(cssColor: string): string {
  try {
    const ctx = getCanvasCtx();
    if (!ctx) return '#000000';

    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return '#000000';
  }
}

/**
 * Compute WCAG 2.x contrast ratio between two CSS color strings.
 * Returns a number >= 1. Higher is better contrast.
 *
 * Client-side only — uses canvas to resolve CSS colors to RGB.
 */
export function contrastRatio(color1: string, color2: string): number {
  const rgb1 = cssToRgb(color1);
  const rgb2 = cssToRgb(color2);
  if (!rgb1 || !rgb2) return 1;

  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// --- Internal helpers ---

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function hex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

function cssToRgb(cssColor: string): [number, number, number] | null {
  try {
    const ctx = getCanvasCtx();
    if (!ctx) return null;

    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  } catch {
    return null;
  }
}

/**
 * sRGB relative luminance per WCAG 2.x definition.
 * Input: [r, g, b] in 0–255 range.
 */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
