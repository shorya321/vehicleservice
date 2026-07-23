/**
 * Resolves a business logo into something @react-pdf/renderer can actually draw.
 *
 * Two traps this exists to close:
 *
 * 1. lib/business/branding-utils.ts validateLogoFile() accepts image/svg+xml and image/webp,
 *    but @react-pdf/renderer's <Image> supports PNG and JPEG only. A business that uploaded
 *    an SVG would get a crashed or silently blank PDF header — on a document they are about
 *    to send a customer, which is worse than a visible fallback.
 *
 * 2. Handing @react-pdf a remote URL makes it fetch during render, which is flaky and can
 *    hang the request. Fetching to a Buffer here keeps failure local, bounded and recoverable.
 *
 * Every failure path returns null. The caller renders a typographic wordmark instead, so the
 * PDF always produces something presentable.
 */

/** @react-pdf accepts src={{ data, format }} for in-memory images. */
export interface PdfImageSource {
  data: Buffer;
  format: 'png' | 'jpg';
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 3000;

/**
 * Sniff the real format from magic bytes rather than trusting Content-Type.
 * Supabase storage serves whatever was set at upload, which is caller-supplied.
 */
function detectFormat(buffer: Buffer): 'png' | 'jpg' | null {
  if (buffer.length < 4) return null;

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  return null;
}

/**
 * Fetch and validate a logo for PDF embedding.
 * Returns null whenever the logo cannot be drawn — never throws.
 */
export async function resolveBrandLogo(
  logoUrl: string | null | undefined
): Promise<PdfImageSource | null> {
  if (!logoUrl) return null;

  // Cheap rejection before spending a request. SVG is the common case here because the
  // branding uploader accepts it for the web portal, where it renders fine.
  const withoutQuery = logoUrl.split('?')[0].toLowerCase();
  if (withoutQuery.endsWith('.svg') || withoutQuery.endsWith('.webp')) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(logoUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('svg') || contentType.includes('webp')) {
      return null;
    }

    // Trust the declared length when present, but re-check the real buffer below — a missing
    // or lying Content-Length must not let an oversized image through.
    const declaredLength = Number(response.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_LOGO_BYTES) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) return null;

    const format = detectFormat(buffer);
    if (!format) return null;

    return { data: buffer, format };
  } catch (error) {
    // Includes the AbortError from the timeout. A logo is decoration; never let it fail the
    // document the business is trying to send.
    console.error('Failed to resolve brand logo for PDF:', error);
    return null;
  }
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * theme_config is JSONB and therefore arbitrary. @react-pdf throws on a malformed colour, so
 * anything that is not a plain 6-digit hex is replaced with the caller's fallback.
 */
export function safeHexColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim())
    ? value.trim()
    : fallback;
}
