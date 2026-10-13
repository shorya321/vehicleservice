/**
 * The PDF theme takes a business's brand colour as given, so whatever a business picks must
 * still print legibly: type on the header band and accent amounts on white paper.
 */

import {
  contrastOnWhite,
  pdfTheme,
  platformPdfTheme,
  readableInk,
} from '@/lib/pdf/document/theme';
import { modernTheme } from '@/lib/pdf-themes/modern';

describe('readableInk', () => {
  it('keeps a colour that already reads on white', () => {
    expect(readableInk('#1e40af')).toBe('#1e40af');
  });

  it('darkens a pale brand colour, keeping its hue, until it reaches 4.5:1', () => {
    const ink = readableInk('#ffd400');
    expect(contrastOnWhite(ink)).toBeGreaterThanOrEqual(4.5);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(b);
  });

  it('falls back to the preset colour for anything that is not a 6-digit hex', () => {
    expect(readableInk('red')).toBe(modernTheme.colors.primary);
  });
});

describe('pdfTheme', () => {
  it('fills the band with the brand colour exactly as set', () => {
    expect(pdfTheme('#c6aa88').colors.primary).toBe('#c6aa88');
  });

  it('sets dark type on a light band and white type on a dark one', () => {
    expect(pdfTheme('#c6aa88').colors.primaryForeground).toBe(modernTheme.colors.foreground);
    expect(pdfTheme('#1e3a8a').colors.primaryForeground).toBe('#ffffff');
  });

  it('always prints accent amounts at 4.5:1 or better on white', () => {
    for (const colour of ['#c6aa88', '#ffd400', '#6366f1', '#00ff00', '#000000']) {
      expect(contrastOnWhite(pdfTheme(colour).colors.accent)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('never throws on a malformed theme_config colour', () => {
    expect(pdfTheme('not-a-colour').colors.primary).toBe(modernTheme.colors.primary);
  });

  it('prints platform documents in the site gold', () => {
    expect(platformPdfTheme.colors.primary).toBe('#c6aa88');
  });
});
