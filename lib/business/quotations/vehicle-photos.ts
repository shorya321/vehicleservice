/**
 * Resolves vehicle type photos into in-memory images @react-pdf/renderer can draw.
 *
 * Same contract as brand-logo.ts: fetched here to a Buffer so @react-pdf never fetches during
 * render, PNG/JPEG only, and every failure skips that one vehicle. A missing photo only means
 * the trip prints without one; it must never fail the document.
 *
 * Photos are downsized with sharp before embedding. The uploaded originals run about 600 KB
 * each, and a 20-trip quotation with alternatives would otherwise produce a PDF of tens of MB.
 */

import sharp from 'sharp';
import type { PdfImageSource } from './brand-logo';

export interface VehiclePhotoRow {
  id: string;
  image_url: string | null;
}

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
/** Fallback cap when sharp is unavailable and the original is embedded as-is. */
const MAX_RAW_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 3000;
/** Pixels. Twice the largest box it is drawn into (88pt), so it stays sharp when printed. */
export const PDF_VEHICLE_PHOTO_WIDTH = 240;

function detectFormat(buffer: Buffer): 'png' | 'jpg' | 'other' | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  return 'other';
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    if ((response.headers.get('content-type') ?? '').toLowerCase().includes('svg')) return null;
    const declared = Number(response.headers.get('content-length') ?? '0');
    if (declared > MAX_SOURCE_BYTES) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_SOURCE_BYTES) return null;
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Downsize for embedding. A photo with transparency stays PNG so a cut-out car sits on the
 * page; an opaque one becomes JPEG, several times smaller than the same pixels as PNG.
 */
async function toPdfImage(buffer: Buffer): Promise<PdfImageSource | null> {
  const format = detectFormat(buffer);
  if (!format) return null;
  try {
    const image = sharp(buffer).resize({
      width: PDF_VEHICLE_PHOTO_WIDTH,
      withoutEnlargement: true,
    });
    const { hasAlpha } = await image.metadata();
    if (hasAlpha && !(await image.clone().stats()).isOpaque) {
      return { data: await image.png({ compressionLevel: 9 }).toBuffer(), format: 'png' };
    }
    return {
      data: await image.flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer(),
      format: 'jpg',
    };
  } catch (error) {
    console.error('Failed to downsize vehicle photo for PDF:', error);
    // Only a format @react-pdf can draw, and only when it is small enough to embed raw.
    if (format === 'other' || buffer.length > MAX_RAW_BYTES) return null;
    return { data: buffer, format };
  }
}

async function resolveOne(url: string): Promise<PdfImageSource | null> {
  if (url.split('?')[0].toLowerCase().endsWith('.svg')) return null;
  try {
    const buffer = await fetchBuffer(url);
    return buffer ? await toPdfImage(buffer) : null;
  } catch (error) {
    // Includes the AbortError from the timeout.
    console.error('Failed to resolve vehicle photo for PDF:', error);
    return null;
  }
}

/**
 * Photos keyed by vehicle type id. Vehicles without a usable photo are simply absent.
 * Never throws.
 */
export async function resolveVehiclePhotos(
  rows: readonly VehiclePhotoRow[]
): Promise<Record<string, PdfImageSource>> {
  const unique = new Map<string, string>();
  for (const row of rows) {
    if (row.image_url && !unique.has(row.id)) unique.set(row.id, row.image_url);
  }

  const entries = await Promise.all(
    Array.from(unique, async ([id, url]) => [id, await resolveOne(url)] as const)
  );

  const photos: Record<string, PdfImageSource> = {};
  for (const [id, photo] of entries) {
    if (photo) photos[id] = photo;
  }
  return photos;
}
