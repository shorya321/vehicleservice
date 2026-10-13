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
