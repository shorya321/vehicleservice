/**
 * Vehicle photos for the quotation PDF: a photo that cannot be drawn is skipped, never fatal,
 * and every embedded photo is downsized so a long quotation stays a small file.
 */

import sharp from 'sharp';
import {
  resolveVehiclePhotos,
  PDF_VEHICLE_PHOTO_WIDTH,
} from '@/lib/business/quotations/vehicle-photos';

const pngOf = (width: number, height: number, alpha = 1) =>
  sharp({
    create: { width, height, channels: 4, background: { r: 200, g: 20, b: 20, alpha } },
  })
    .png()
    .toBuffer();

const respond = (body: Buffer | string, headers: Record<string, string> = {}) =>
  new Response(typeof body === 'string' ? body : new Uint8Array(body), { status: 200, headers });

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('resolveVehiclePhotos', () => {
  it('downsizes a large opaque photo to a JPEG at the PDF width', async () => {
    fetchMock.mockResolvedValue(respond(await pngOf(1200, 700), { 'content-type': 'image/png' }));
    const photos = await resolveVehiclePhotos([{ id: 'a', image_url: 'https://x/a.png' }]);
    expect(photos.a.format).toBe('jpg');
    const meta = await sharp(photos.a.data).metadata();
    expect(meta.width).toBe(PDF_VEHICLE_PHOTO_WIDTH);
  });

  it('keeps a transparent photo as PNG', async () => {
    fetchMock.mockResolvedValue(respond(await pngOf(600, 400, 0.4)));
    const photos = await resolveVehiclePhotos([{ id: 'a', image_url: 'https://x/a.png' }]);
    expect(photos.a.format).toBe('png');
    expect((await sharp(photos.a.data).metadata()).hasAlpha).toBe(true);
  });

  it('never enlarges a small photo', async () => {
    fetchMock.mockResolvedValue(respond(await pngOf(100, 60)));
    const photos = await resolveVehiclePhotos([{ id: 'a', image_url: 'https://x/a.png' }]);
    expect((await sharp(photos.a.data).metadata()).width).toBe(100);
  });

  it('converts a webp, which the PDF engine cannot draw, to a drawable format', async () => {
    const webp = await sharp(await pngOf(400, 300)).webp().toBuffer();
    fetchMock.mockResolvedValue(respond(webp, { 'content-type': 'image/webp' }));
    const photos = await resolveVehiclePhotos([{ id: 'a', image_url: 'https://x/a.webp' }]);
    expect(['png', 'jpg']).toContain(photos.a.format);
  });

  it('skips an SVG without fetching it', async () => {
    const photos = await resolveVehiclePhotos([{ id: 'a', image_url: 'https://x/a.svg' }]);
    expect(photos).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips a failed, oversized or garbage response but keeps the rest', async () => {
    const good = await pngOf(300, 200);
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/bad.png')) return new Response('nope', { status: 404 });
      if (url.endsWith('/huge.png')) return respond(good, { 'content-length': String(10 * 1024 * 1024) });
      if (url.endsWith('/junk.png')) return respond('not an image at all');
      if (url.endsWith('/throws.png')) throw new Error('network down');
      return respond(good);
    });
    const photos = await resolveVehiclePhotos([
      { id: 'bad', image_url: 'https://x/bad.png' },
      { id: 'huge', image_url: 'https://x/huge.png' },
      { id: 'junk', image_url: 'https://x/junk.png' },
      { id: 'throws', image_url: 'https://x/throws.png' },
      { id: 'ok', image_url: 'https://x/ok.png' },
    ]);
    expect(Object.keys(photos)).toEqual(['ok']);
  });

  it('ignores vehicles without a photo and fetches each vehicle once', async () => {
    fetchMock.mockResolvedValue(respond(await pngOf(300, 200)));
    const photos = await resolveVehiclePhotos([
      { id: 'a', image_url: 'https://x/a.png' },
      { id: 'a', image_url: 'https://x/a.png' },
      { id: 'b', image_url: null },
    ]);
    expect(Object.keys(photos)).toEqual(['a']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
