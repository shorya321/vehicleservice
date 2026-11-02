/**
 * The customer invoice draws the admin logo (Settings > admin logo) in its header chip.
 * Pins the source order and that every failure still yields the bundled artwork, so a
 * logo problem can never break an invoice download.
 */

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/site-settings/server', () => ({ getSiteSettings: jest.fn() }));
jest.mock('@/lib/business/quotations/brand-logo', () => ({ resolveBrandLogo: jest.fn() }));

import { getSiteSettings } from '@/lib/site-settings/server';
import { resolveBrandLogo } from '@/lib/business/quotations/brand-logo';
import { loadPlatformPdfLogo } from '@/lib/pdf/platform-logo';
import { imagePixelSize } from '@/lib/pdf/utils/image';

const settings = getSiteSettings as jest.Mock;
const fetchLogo = resolveBrandLogo as jest.Mock;

const NO_UPLOADS = { admin_logo_url: null, admin_logo_dark_url: null };
const UPLOAD = { data: Buffer.from([0x89, 0x50, 0x4e, 0x47]), format: 'png' as const };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('loadPlatformPdfLogo', () => {
  it('uses the bundled light artwork when the admin has uploaded nothing', async () => {
    settings.mockResolvedValue(NO_UPLOADS);
    const logo = await loadPlatformPdfLogo();
    expect(fetchLogo).not.toHaveBeenCalled();
    expect(logo?.format).toBe('png');
    expect(imagePixelSize(logo!)).toEqual({ width: 791, height: 160 });
  });

  it('uses the light admin upload, which reads on the white header chip', async () => {
    settings.mockResolvedValue({ admin_logo_url: 'https://cdn.test/light.png', admin_logo_dark_url: 'https://cdn.test/dark.png' });
    fetchLogo.mockResolvedValue(UPLOAD);
    await expect(loadPlatformPdfLogo()).resolves.toBe(UPLOAD);
    expect(fetchLogo).toHaveBeenCalledWith('https://cdn.test/light.png');
  });

  it('falls back to the bundled artwork when the upload cannot be drawn', async () => {
    settings.mockResolvedValue({ admin_logo_url: 'https://cdn.test/logo.svg', admin_logo_dark_url: null });
    fetchLogo.mockResolvedValue(null);
    const logo = await loadPlatformPdfLogo();
    expect(imagePixelSize(logo!)).toEqual({ width: 791, height: 160 });
  });

  it('falls back to the bundled artwork when settings cannot be read', async () => {
    settings.mockRejectedValue(new Error('db down'));
    const logo = await loadPlatformPdfLogo();
    expect(imagePixelSize(logo!)).toEqual({ width: 791, height: 160 });
  });
});
