/**
 * The PDF engine stretches a height-only <Image> to its column width, so the header logo chip
 * ran across the whole band. The header now sizes the logo from its real pixel dimensions.
 */

import { imagePixelSize } from '@/lib/pdf/utils/image';
import { fitLogo, LOGO_HEIGHT, LOGO_MAX_WIDTH } from '@/lib/pdf/document/logo-fit';

function pngHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function jpegWithApp0(width: number, height: number, sofMarker = 0xc0): Buffer {
  const soi = Buffer.from([0xff, 0xd8]);
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, ...Buffer.alloc(14)]);
  // DHT before the frame must be skipped, not read as a frame.
  const dht = Buffer.from([0xff, 0xc4, 0x00, 0x04, 0x00, 0x00]);
  const sof = Buffer.alloc(11);
  sof[0] = 0xff;
  sof[1] = sofMarker;
  sof.writeUInt16BE(11, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([soi, app0, dht, sof]);
}

describe('imagePixelSize', () => {
  it('reads PNG dimensions from IHDR', () => {
    expect(imagePixelSize({ data: pngHeader(156, 57), format: 'png' })).toEqual({
      width: 156,
      height: 57,
    });
  });

  it('reads JPEG dimensions from the first frame, skipping APP0 and DHT', () => {
    expect(imagePixelSize({ data: jpegWithApp0(640, 480), format: 'jpg' })).toEqual({
      width: 640,
      height: 480,
    });
  });

  it('reads progressive JPEG frames (SOF2)', () => {
    expect(imagePixelSize({ data: jpegWithApp0(300, 100, 0xc2), format: 'jpg' })).toEqual({
      width: 300,
      height: 100,
    });
  });

  it('returns null for truncated or wrong-format buffers instead of throwing', () => {
    expect(imagePixelSize({ data: Buffer.from([0x89, 0x50]), format: 'png' })).toBeNull();
    expect(imagePixelSize({ data: pngHeader(156, 57), format: 'jpg' })).toBeNull();
    expect(imagePixelSize({ data: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]), format: 'jpg' })).toBeNull();
  });

  it('returns null for zero dimensions', () => {
    expect(imagePixelSize({ data: pngHeader(0, 57), format: 'png' })).toBeNull();
  });
});

describe('fitLogo', () => {
  it('scales a normal logo to the header height, keeping aspect ratio', () => {
    const fit = fitLogo({ width: 156, height: 57 });
    expect(fit.height).toBe(LOGO_HEIGHT);
    expect(fit.width).toBeCloseTo((156 / 57) * LOGO_HEIGHT, 5);
  });

  it('caps a very wide logo at the max width and shrinks the height to match', () => {
    const fit = fitLogo({ width: 1000, height: 100 });
    expect(fit.width).toBe(LOGO_MAX_WIDTH);
    expect(fit.height).toBeCloseTo(LOGO_MAX_WIDTH / 10, 5);
  });
});
