/**
 * Server-only backing store for the brand resolver.
 *
 * Imported only by lib/email/utils/send-email.ts, so node:async_hooks never reaches
 * the client graph that renders templates for the admin preview page.
 *
 * Why AsyncLocalStorage and not a module-scope `let currentBrand`: render() awaits
 * internally, and a warm serverless instance interleaves concurrent requests at every
 * await. A plain module variable means two tenants rendering at the same moment can
 * cross-contaminate, so tenant A's customer receives an email footed with tenant B's
 * name. That is a low-frequency, non-reproducible, and legally significant bug in a
 * white-label product. ALS binds the value to the async execution context instead, and
 * the store propagates across the awaits inside render() because those continuations
 * were created within store.run().
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { registerBrandResolver, type EmailBrand } from './brand';

const store = new AsyncLocalStorage<EmailBrand>();

registerBrandResolver(() => store.getStore() ?? null);

/** Renders `fn` with `brand` visible to getCurrentBrand(), including across awaits. */
export function runWithBrand<T>(brand: EmailBrand, fn: () => Promise<T>): Promise<T> {
  return store.run(brand, fn);
}

/** The brand in scope right now, if any. Exported for tests and diagnostics. */
export function getScopedBrand(): EmailBrand | null {
  return store.getStore() ?? null;
}
