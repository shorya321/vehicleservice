/**
 * The email palette derives every tone the layout paints with from a brand's colours.
 * These pin the two things that matter: the platform keeps its gold and charcoal, and a
 * tenant's derived tones always come from the tenant's own accent and stay readable.
 */

import { PLATFORM_BRAND_COLORS } from '@/lib/email/brand/brand';
import { contrastRatio, emailPalette, mixColor } from '@/lib/email/brand/palette';
import { buildBusinessBrand } from '@/lib/email/transport/business-brand';

function tenant(primary: string) {
  return buildBusinessBrand({
    business_name: 'Acme Transfers',
    brand_name: null,
    logo_url: null,
    business_email: null,
    address: null,
    subdomain: 'acme',
    custom_domain: null,
    custom_domain_verified: null,
    theme_config: {
      accent: { primary },
      light: { surface: '#FAFAFA', card: '#FFFFFF', text_primary: '#09090B', text_secondary: '#71717A', border: '#E4E4E7' },
    },
  });
}

describe('emailPalette', () => {
  it('paints the platform in charcoal and gold', () => {
    const p = emailPalette(PLATFORM_BRAND_COLORS);

    expect(p.band).toBe('#1a1917');
    expect(p.bandText).toBe('#c6aa88');
    expect(p.rule).toBe('#c6aa88');
    expect(p.accentInk).toBe('#6b5530');
    expect(p.button).toBe('#1a1917');
  });

  it('builds a tenant palette from the tenant accent only', () => {
    const p = emailPalette(tenant('#1F6F6B').colors);

    expect(p.band).toBe('#1F6F6B');
    expect(p.button).toBe('#1F6F6B');
    expect(p.accent).toBe('#1F6F6B');
    expect(p.accentInk).toBe('#1F6F6B');
    expect(p.page).toBe('#FAFAFA');
    expect(p.line).toBe('#E4E4E7');
    expect(p.pale).toBe(mixColor('#1F6F6B', '#FFFFFF', 0.16));
    // Nothing platform-gold leaks into a themed tenant.
    expect(Object.values(p)).not.toContain('#c6aa88');
    expect(Object.values(p)).not.toContain('#6b5530');
  });

  it('falls back to the heading colour for eyebrows and links on a pale accent', () => {
    const p = emailPalette(tenant('#FFF8E1').colors);

    expect(p.accentInk).toBe('#09090B');
    expect(contrastRatio(p.band, p.bandText)).toBeGreaterThan(4.5);
  });

  it('keeps tints light enough to sit under body text', () => {
    const p = emailPalette(tenant('#BA955E').colors);

    expect(contrastRatio(p.ink, p.pale)).toBeGreaterThan(7);
  });
});

describe('mixColor', () => {
  it('mixes two hex colours', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('returns the base for anything that is not a 6-digit hex', () => {
    expect(mixColor('red', '#ffffff', 0.5)).toBe('#ffffff');
  });
});
