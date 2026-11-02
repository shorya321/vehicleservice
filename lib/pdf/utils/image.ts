/**
 * The PDF engine (Forme) takes images as file paths or data URIs. Our resolvers produce an
 * in-memory { data, format } (see lib/business/quotations/brand-logo.ts), so this is the one
 * place that turns that into something the engine can draw.
 */

export interface PdfImageBytes {
  data: Buffer;
  format: 'png' | 'jpg';
}

export function toDataUri(image: PdfImageBytes): string {
  const mime = image.format === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${image.data.toString('base64')}`;
}

export interface PixelSize {
  width: number;
  height: number;
}

function pngSize(buf: Buffer): PixelSize | null {
  const isPng = buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47 && buf.toString('ascii', 12, 16) === 'IHDR';
  return isPng ? { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) } : null;
}

/** SOF0..SOF15 carry the frame size; C4 (DHT), C8 (JPG) and CC (DAC) share the range but do not. */
function isFrameMarker(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function jpegSize(buf: Buffer): PixelSize | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    const segmentLength = buf.readUInt16BE(offset + 2);
    if (isFrameMarker(marker)) {
      if (offset + 9 > buf.length) return null;
      return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
    }
    if (segmentLength < 2) return null;
    offset += 2 + segmentLength;
  }
  return null;
}

/**
 * Real pixel size of a PNG or JPEG, read from its header. The engine stretches an <Image>
 * given only a height, so callers size it explicitly from this. Null when the bytes cannot
 * be read; callers then keep their previous sizing.
 */
export function imagePixelSize(image: PdfImageBytes): PixelSize | null {
  try {
    const size = image.format === 'png' ? pngSize(image.data) : jpegSize(image.data);
    return size && size.width > 0 && size.height > 0 ? size : null;
  } catch {
    return null;
  }
}
