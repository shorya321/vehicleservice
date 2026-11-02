/**
 * Platform mail carries the admin logo (Settings > admin logo), so a logo change in the
 * admin shows up in customer, vendor and driver mail without a deploy. These pin which
 * file is picked, that a file no mail client can show never reaches the masthead, and
 * that a tenant brand never picks it up.
 */

import { jsx } from 'react/jsx-runtime';
import { render } from '@react-email/render';

import { runWithBrand } from '@/lib/email/brand/brand-store.server';
import { getPlatformBrand } from '@/lib/email/brand/brand';
import { BUILT_IN_EMAIL_LOGO, emailAssetOrigin, pickPlatformEmailLogo } from '@/lib/email/brand/platform-logo';
import { buildBusinessBrand } from '@/lib/email/transport/business-brand';
import PasswordResetEmail from '@/lib/email/templates/auth/password-reset';
import BusinessAccountApprovedEmail from '@/lib/business/email/templates/account-approved';

const NO_UPLOADS = {
  header_logo_url: null,
  header_logo_dark_url: null,
  footer_logo_url: null,
  footer_logo_dark_url: null,
  admin_logo_url: null,
  admin_logo_dark_url: null,
};

const PROD = 'https://infiniatransfers.com';
const UPLOAD = 'https://abc.supabase.co/storage/v1/object/public/site/logo';

describe('emailAssetOrigin', () => {
  it('keeps a public https origin and drops a trailing slash', () => {
    expect(emailAssetOrigin('https://staging.infiniatransfers.com/')).toBe('https://staging.infiniatransfers.com');
  });

  it.each(['http://localhost:3001', 'https://localhost:3001', 'http://127.0.0.1:3001', 'http://infiniatransfers.com', '', 'not a url'])(
    'falls back to production for %p, which a mail client cannot fetch',
    (url) => {
      expect(emailAssetOrigin(url)).toBe(PROD);
    }
  );
});

describe('pickPlatformEmailLogo', () => {
  it('uses the bundled dark artwork when the admin has uploaded nothing', () => {
    expect(pickPlatformEmailLogo(NO_UPLOADS, PROD)).toEqual({
      url: `${PROD}${BUILT_IN_EMAIL_LOGO.path}`,
      width: BUILT_IN_EMAIL_LOGO.width,
      height: BUILT_IN_EMAIL_LOGO.height,
    });
  });

  it('prefers the dark admin upload, because the masthead is always dark', () => {
    const logo = pickPlatformEmailLogo(
      { ...NO_UPLOADS, admin_logo_url: `${UPLOAD}-light.png`, admin_logo_dark_url: `${UPLOAD}-dark.png` },
      PROD
    );
    expect(logo).toEqual({ url: `${UPLOAD}-dark.png`, width: null, height: 40 });
  });

  it('uses a light-only admin upload, as the admin sidebar does', () => {
    expect(pickPlatformEmailLogo({ ...NO_UPLOADS, admin_logo_url: `${UPLOAD}.jpg` }, PROD).url).toBe(`${UPLOAD}.jpg`);
  });

  it('ignores the public site header logo', () => {
    expect(pickPlatformEmailLogo({ ...NO_UPLOADS, header_logo_dark_url: `${UPLOAD}.png` }, PROD).url).toBe(
      `${PROD}${BUILT_IN_EMAIL_LOGO.path}`
    );
  });

  it.each([`${UPLOAD}.svg`, `${UPLOAD}.webp`, `${UPLOAD}.SVG?v=2`, '/brand/x.png', 'javascript:alert(1)'])(
    'falls back to the bundled artwork for %p, which mail clients cannot show',
    (url) => {
      expect(pickPlatformEmailLogo({ ...NO_UPLOADS, admin_logo_dark_url: url }, PROD).url).toBe(
        `${PROD}${BUILT_IN_EMAIL_LOGO.path}`
      );
    }
  );
});

describe('masthead', () => {
  const platformLogo = { url: `${PROD}${BUILT_IN_EMAIL_LOGO.path}`, width: 198, height: 40 };

  it('platform layout draws the admin logo in place of the wordmark', async () => {
    const html = await runWithBrand({ ...getPlatformBrand(), platformLogo }, () =>
      render(jsx(PasswordResetEmail, { name: 'Sam', resetUrl: `${PROD}/reset` }))
    );
    expect(html).toContain(`src="${platformLogo.url}"`);
    expect(html).toContain('alt="Infinia Transfers"');
    expect(html).toContain('width="198"');
    expect(html).not.toContain('>INFINIA<');
  });

  it('platform layout keeps the wordmark when no logo was resolved', async () => {
    const html = await runWithBrand(getPlatformBrand(), () =>
      render(jsx(PasswordResetEmail, { name: 'Sam', resetUrl: `${PROD}/reset` }))
    );
    expect(html).toContain('>INFINIA<');
    expect(html).not.toContain('<img');
  });

  it('business layout ignores the platform logo entirely', async () => {
    const props = { businessName: 'Acme', ownerName: 'Ali', loginUrl: `${PROD}/business/login` };
    const without = await runWithBrand(getPlatformBrand(), () => render(jsx(BusinessAccountApprovedEmail, props)));
    const withLogo = await runWithBrand({ ...getPlatformBrand(), platformLogo }, () =>
      render(jsx(BusinessAccountApprovedEmail, props))
    );
    expect(withLogo).toBe(without);
  });

  it('a tenant brand never carries a platform logo', () => {
    const brand = buildBusinessBrand({
      business_name: 'Acme Transfers',
      brand_name: null,
      logo_url: null,
      business_email: null,
      address: null,
      subdomain: null,
      custom_domain: null,
      custom_domain_verified: null,
    });
    expect(brand.platformLogo).toBeUndefined();
  });
});
