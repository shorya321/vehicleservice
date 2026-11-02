/**
 * Header logo box. The engine does not derive width from height for an <Image>, so the
 * header passes both, scaled from the logo's pixel size to fit this box.
 */

import type { PixelSize } from '../utils/image';

export const LOGO_HEIGHT = 30;
export const LOGO_MAX_WIDTH = 140;

export function fitLogo(size: PixelSize): PixelSize {
  const ratio = size.width / size.height;
  const widthAtFullHeight = LOGO_HEIGHT * ratio;
  if (widthAtFullHeight <= LOGO_MAX_WIDTH) {
    return { width: widthAtFullHeight, height: LOGO_HEIGHT };
  }
  return { width: LOGO_MAX_WIDTH, height: LOGO_MAX_WIDTH / ratio };
}
