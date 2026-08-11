/**
 * Tenant brand scoping during template rendering.
 *
 * The interleaving test is the whole reason this uses AsyncLocalStorage rather than a
 * module-scope variable. A warm serverless instance renders concurrent requests, and
 * @react-email/render awaits internally, so a shared mutable "current brand" would let
 * one tenant's customer receive an email footed with another tenant's name.
 */

import {
  clearBrandResolver,
  getCurrentBrand,
  getPlatformBrand,
  PLATFORM_BRAND_COLORS,
  type EmailBrand,
} from '@/lib/email/brand/brand';
import { getScopedBrand, runWithBrand } from '@/lib/email/brand/brand-store.server';

function tenantBrand(name: string): EmailBrand {
  return {
    name,
    address: `${name} HQ`,
    url: `https://${name.toLowerCase()}.example.com`,
    logoUrl: null,
    supportEmail: `support@${name.toLowerCase()}.example.com`,
    showPlatformLinks: false,
    // Scoping is what is under test here, not the palette.
    colors: PLATFORM_BRAND_COLORS,
  };
}

/** Stands in for @react-email/render: async, and yields control part-way through. */
async function renderFooter(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  const brand = getCurrentBrand();
  await new Promise((resolve) => setTimeout(resolve, 0));

  return `${brand.name} | ${brand.showPlatformLinks ? 'platform-links' : 'tenant-links'}`;
}

describe('email brand scope', () => {
  it('falls back to the platform brand outside any scope', () => {
    expect(getScopedBrand()).toBeNull();
    expect(getCurrentBrand().name).toBe(getPlatformBrand().name);
    expect(getCurrentBrand().showPlatformLinks).toBe(true);
  });

  it('exposes the tenant brand inside a scope', async () => {
    const acme = tenantBrand('Acme');

    const footer = await runWithBrand(acme, renderFooter);

    expect(footer).toBe('Acme | tenant-links');
  });

  it('restores the platform brand after the scope ends', async () => {
    await runWithBrand(tenantBrand('Acme'), renderFooter);

    expect(getCurrentBrand().name).toBe(getPlatformBrand().name);
  });

  it('does not bleed between two renders interleaved across awaits', async () => {
    const [acme, globex, platform] = await Promise.all([
      runWithBrand(tenantBrand('Acme'), renderFooter),
      runWithBrand(tenantBrand('Globex'), renderFooter),
      renderFooter(),
    ]);

    expect(acme).toBe('Acme | tenant-links');
    expect(globex).toBe('Globex | tenant-links');
    expect(platform).toBe(`${getPlatformBrand().name} | platform-links`);
  });

  it('survives many concurrent renders', async () => {
    const names = Array.from({ length: 25 }, (_, index) => `Tenant${index}`);

    const rendered = await Promise.all(names.map((name) => runWithBrand(tenantBrand(name), renderFooter)));

    expect(rendered).toEqual(names.map((name) => `${name} | tenant-links`));
  });

  it('keeps nested scopes independent', async () => {
    const outer = await runWithBrand(tenantBrand('Outer'), async () => {
      const inner = await runWithBrand(tenantBrand('Inner'), renderFooter);
      const afterInner = await renderFooter();

      return { inner, afterInner };
    });

    expect(outer.inner).toBe('Inner | tenant-links');
    expect(outer.afterInner).toBe('Outer | tenant-links');
  });

  it('degrades to the platform brand when no resolver is registered', () => {
    clearBrandResolver();

    expect(getCurrentBrand().name).toBe(getPlatformBrand().name);

    // Re-register for any test that runs afterwards in the same worker.
    jest.resetModules();
  });
});
