/**
 * pdfcn theme for our documents: the Modern preset with the issuer's colour as its ink.
 *
 * The brand colour does two jobs: it fills the header band and table header as set, with
 * whichever of white or dark type reads better on it, and it colours amounts on white paper.
 * For the second job a colour too light to read (under 4.5:1) is darkened, keeping its hue.
 */

import { modernTheme } from '@/lib/pdf-themes/modern';
import type { PdfcnTheme } from '@/types/pdf-themes';
import { pdfColors } from '../colors';

const MIN_CONTRAST = 4.5;
const HEX = /^#[0-9a-f]{6}$/i;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio of a colour against white paper. */
export function contrastOnWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Darken towards black in small steps until white type on it reads at 4.5:1. */
export function readableInk(hex: string): string {
  if (!HEX.test(hex)) return modernTheme.colors.primary;
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  for (let factor = 1; factor > 0; factor -= 0.04) {
    const candidate = toHex(r * factor, g * factor, b * factor);
    if (contrastOnWhite(candidate) >= MIN_CONTRAST) return candidate;
  }
  return modernTheme.colors.primary;
}

/** White or near-black, whichever reads better on `hex`. */
function textOn(hex: string): string {
  const dark = modernTheme.colors.foreground;
  const onWhite = contrastOnWhite(hex);
  const onDark = (luminance(hex) + 0.05) / (luminance(dark) + 0.05);
  return onWhite >= onDark ? pdfColors.white : dark;
}

/**
 * The Modern preset in the issuer's colour. `primary` is the brand colour exactly as the
 * business set it (header band, table header) with white or dark type chosen for it; `accent`
 * is the same hue darkened to read as text on white paper (amounts and totals).
 */
export function pdfTheme(brandColor: string): PdfcnTheme {
  const band = HEX.test(brandColor) ? brandColor : modernTheme.colors.primary;
  return {
    ...modernTheme,
    name: 'document',
    // Documents are denser than pdfcn's 11pt default: a wallet statement row has five columns.
    typography: {
      ...modernTheme.typography,
      body: { ...modernTheme.typography.body, fontSize: 9.5, lineHeight: 1.4 },
    },
    colors: {
      ...modernTheme.colors,
      primary: band,
      primaryForeground: textOn(band),
      accent: readableInk(band),
    },
  };
}

/** Platform documents (customer booking invoices) print in the site's brand gold. */
export const platformPdfTheme: PdfcnTheme = pdfTheme(pdfColors.gold);
