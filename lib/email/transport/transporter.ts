/**
 * Cached nodemailer transporters, keyed by configuration fingerprint.
 *
 * The fingerprint for a tenant is `${businessAccountId}:${updated_at}`, so editing
 * credentials produces a new key and the stale transporter is orphaned rather than
 * needing explicit invalidation.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { ResolvedMailConfig } from './types';

/**
 * Bounded so one warm instance serving many tenants cannot accumulate an unbounded
 * number of live transporters, each closing over a decrypted password.
 */
const MAX_TRANSPORTERS = 50;

const CONNECTION_TIMEOUT_MS = 10_000;
const GREETING_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 20_000;

/**
 * Hosts that are unreachable from the public internet, and therefore cannot be a real
 * mail provider. Matching one means we are talking to a developer's local catcher.
 */
const LOOPBACK_OR_PRIVATE_HOST =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|0\.0\.0\.0|host\.docker\.internal|mailpit|maildev)/i;

/**
 * Whether to insist the server upgrade to TLS before we authenticate.
 *
 * On by default, and non-negotiable in production: without it nodemailer will run
 * AUTH LOGIN over an unencrypted socket whenever a server fails to advertise STARTTLS,
 * putting a tenant's password on the wire in the clear.
 *
 * Relaxed only for a loopback or private-range host outside production, because local
 * catchers such as maildev and mailpit do not advertise STARTTLS at all, and without
 * this exemption every local send would fail with a TLS error and the feature would be
 * untestable on a developer machine.
 */
function shouldRequireTls(config: ResolvedMailConfig): boolean {
  if (config.smtp.secure) return false; // already implicit TLS on connect
  if (process.env.NODE_ENV === 'production') return true;

  return !LOOPBACK_OR_PRIVATE_HOST.test(config.smtp.host);
}

const transporters = new Map<string, Transporter<SMTPTransport.SentMessageInfo>>();

export function getTransporter(config: ResolvedMailConfig): Transporter<SMTPTransport.SentMessageInfo> {
  const cached = transporters.get(config.fingerprint);
  if (cached) return cached;

  const options: SMTPTransport.Options = {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,

    requireTLS: shouldRequireTls(config),

    auth: { user: config.smtp.user, pass: config.smtp.pass },

    // Note the absence of `pool`. Not pooling is deliberate, not an oversight: a
    // pooled transport keeps sockets open behind a keep-alive timer, but a serverless
    // instance freezes between invocations, so the timer never fires, the server times
    // the connection out, and the next invocation resumes holding a socket it believes
    // is live. The symptom is an intermittent ECONNRESET on the *second* send from each
    // warm instance. Caching the transporter object still avoids the re-decrypt and
    // option re-validation; every message just gets a fresh, known-good connection.

    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,

    tls: { minVersion: 'TLSv1.2' },
  };

  const transporter = nodemailer.createTransport(options);

  if (transporters.size >= MAX_TRANSPORTERS) {
    const oldest = transporters.keys().next();
    if (!oldest.done) {
      transporters.get(oldest.value)?.close();
      transporters.delete(oldest.value);
    }
  }

  transporters.set(config.fingerprint, transporter);
  return transporter;
}

/** Drops a cached transporter, closing its connection. Used on credential changes. */
export function evictTransporter(fingerprint: string): void {
  transporters.get(fingerprint)?.close();
  transporters.delete(fingerprint);
}

/** Test seam. */
export function clearTransporterCache(): void {
  // Array.from rather than iterating the Map directly: tsconfig targets ES5 without
  // downlevelIteration, so a for..of over Map.values() does not compile.
  Array.from(transporters.values()).forEach((transporter) => transporter.close());
  transporters.clear();
}

/** Diagnostics. */
export function transporterCacheSize(): number {
  return transporters.size;
}

/**
 * Opens a connection and authenticates without sending anything. Used by the
 * test-send route so an owner sees "authentication failed" before we bother
 * rendering a message.
 */
export async function verifyTransport(config: ResolvedMailConfig): Promise<void> {
  await getTransporter(config).verify();
}
