/**
 * Turns a brand's colours into the full set of tones the email layout paints with.
 *
 * Isomorphic and pure: imported by templates that the admin preview renders in the
 * browser, and re-exported to the business module through lib/business/email/brand.ts.
 *
 * A brand only carries eight required colours (plus an optional platform accent). The
 * layout needs a few more, such as a pale tint for reference chips and a readable ink for
 * eyebrows and links. Those are derived here rather than stored, so a tenant's theme
 * produces a coherent email without anyone configuring twenty swatches.
 */

import type { EmailBrandColors } from '../transport/types';

export interface EmailPalette {
  /** The masthead band behind the logo or wordmark. */
  readonly band: string;
  /** Wordmark colour on the band. */
  readonly bandText: string;
  /** Hairline under the band. A tint of the band when the brand has no separate accent. */
  readonly rule: string;
  /** Timeline dots and the base the pale tints are mixed from. */
  readonly accent: string;
  /** Eyebrows, links and labels that must stay readable on white. */
  readonly accentInk: string;
  /** Tinted panels: reference chip, stat block. */
  readonly pale: string;
  readonly paleLine: string;
  readonly ink: string;
  readonly body: string;
  readonly muted: string;
  readonly line: string;
  readonly page: string;
  readonly card: string;
  /** Header strip of journey cards and other quiet fills. */
  readonly soft: string;
  readonly button: string;
  readonly buttonText: string;
}

export const EMAIL_FONT_DISPLAY = "'Playfair Display', Georgia, 'Times New Roman', serif";
export const EMAIL_FONT_SANS =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const EMAIL_FONT_MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";

/** Loaded where the client allows it (Apple Mail, iOS, Outlook.com). Others use the fallbacks. */
export const EMAIL_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500&family=Inter:wght@400;500;600&display=swap';

const HEX = /^#[0-9a-f]{6}$/i;

function rgb(value: string): [number, number, number] | null {
  if (!HEX.test(value)) return null;
  return [
    parseInt(value.slice(1, 3), 16),
    parseInt(value.slice(3, 5), 16),
    parseInt(value.slice(5, 7), 16),
  ];
}

function toHex(channels: readonly number[]): string {
  return `#${channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/** `amount` of `color` laid over `base`. Falls back to `base` for anything not a 6-digit hex. */
export function mixColor(color: string, base: string, amount: number): string {
  const a = rgb(color);
  const b = rgb(base);
  if (!a || !b) return base;
  return toHex(a.map((c, i) => c * amount + b[i] * (1 - amount)));
}

function luminance(value: string): number {
  const channels = rgb(value);
  if (!channels) return 1;
  const [r, g, b] = channels.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function emailPalette(colors: EmailBrandColors): EmailPalette {
  const accent = colors.accent ?? colors.primary;
  const readableOnCard = contrastRatio(colors.primary, colors.surface) >= 4.5;

  return {
    band: colors.primary,
    bandText: colors.accent ?? colors.primaryText,
    rule: colors.accent ?? mixColor(colors.primary, '#ffffff', 0.55),
    accent,
    accentInk: colors.accentText ?? (readableOnCard ? colors.primary : colors.heading),
    pale: mixColor(accent, colors.surface, 0.16),
    paleLine: mixColor(accent, colors.surface, 0.34),
    ink: colors.heading,
    body: colors.text,
    muted: colors.muted,
    line: colors.border,
    page: colors.background,
    card: colors.surface,
    soft: mixColor(colors.background, colors.surface, 0.5),
    button: colors.primary,
    buttonText: colors.primaryText,
  };
}
