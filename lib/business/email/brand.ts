/**
 * The brand a business email renders under, and the one boundary file that is safe in a
 * browser bundle.
 *
 * Split out from platform.ts, which is server-only. Templates need the brand and nothing
 * else, and templates are rendered in the browser by
 * app/admin/emails/components/email-management-client.tsx for the admin preview. Reading
 * the brand through the sender's module dragged nodemailer, AsyncLocalStorage and
 * lib/email/transport/crypto (which throws outright when `window` is defined) into the
 * client bundle, and the Vercel build failed generating that chunk.
 *
 * Everything re-exported here is isomorphic. lib/email/brand/brand.ts imports nothing
 * from node, and its only import is a type from transport/types, which is erased at
 * compile time and is node-free by design anyway.
 *
 * This is one of exactly two files under lib/business/email/ permitted to import
 * lib/email. The other is platform.ts. Renderable code (templates, styles, components)
 * must import from here and never from there.
 */

import { getCurrentBrand } from '@/lib/email/brand/brand';
import type { EmailBrand, EmailBrandColors } from '@/lib/email/transport/types';
import type { DriverAssignedTripDetails, EmailResult } from '@/lib/email/types';

export type { EmailBrand, EmailBrandColors, EmailResult, DriverAssignedTripDetails };

/**
 * The brand the email currently being rendered belongs to.
 *
 * Read during render rather than passed as a prop, so a template's props stay about the
 * booking and never about who is sending it. Outside a send (the admin preview page, a
 * unit test) this resolves to the platform brand, which is exactly right for an admin
 * previewing platform mail.
 */
export function getBusinessBrand(): EmailBrand {
  return getCurrentBrand();
}
