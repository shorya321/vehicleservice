/**
 * AES-256-GCM envelope encryption for per-tenant SMTP passwords.
 *
 * This is the first encryption utility in the repo, so the choices are spelled out:
 *
 * - GCM, not CBC, so tampering is detected rather than silently decrypting to garbage.
 * - A random 12-byte IV per encryption, so encrypting the same password twice never
 *   produces the same ciphertext.
 * - Additional authenticated data binds the ciphertext to one business account. A row
 *   copied from one tenant into another fails authentication instead of quietly
 *   sending as that tenant. This is the single most important property here.
 * - A version tag in the envelope, so a future key rotation can be staged rather than
 *   requiring every row to be re-encrypted at once.
 *
 * Not Supabase Vault / pgsodium: 20251114_fix_gen_random_bytes_error.sql exists
 * because this project already removed a pgcrypto dependency once, the plaintext has
 * to reach node to feed nodemailer either way, and a SQL-side scheme would be neither
 * unit-testable nor reproducible locally.
 */

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Raised when the key is absent or malformed. Distinct from a decryption failure,
 * because the two get handled differently: a config error means "refuse to save",
 * a decryption error means "fall back to the platform sender".
 *
 * The explicit setPrototypeOf is load-bearing, not ceremony. tsconfig targets ES5,
 * where subclassing a built-in loses the prototype link and `instanceof` silently
 * returns false, so every `catch (e) { if (e instanceof MailCryptoError) }` in the
 * codebase would fall through to the wrong branch.
 */
export class MailCryptoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailCryptoConfigError';
    Object.setPrototypeOf(this, MailCryptoConfigError.prototype);
  }
}

/** Raised when an envelope is malformed, tampered with, or encrypted under another key or scope. */
export class MailCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailCryptoError';
    Object.setPrototypeOf(this, MailCryptoError.prototype);
  }
}

const ENVELOPE_VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const AAD_PURPOSE = 'business_smtp_password';

if (typeof window !== 'undefined') {
  throw new Error('lib/email/transport/crypto is server-only and must never reach the client bundle');
}

interface Keyring {
  readonly activeVersion: number;
  readonly keys: ReadonlyMap<number, Buffer>;
}

let cachedKeyring: Keyring | null = null;

function decodeKey(raw: string, label: string): Buffer {
  const key = Buffer.from(raw.trim(), 'base64');
  if (key.length !== KEY_BYTES) {
    // Report the length, never the value.
    throw new MailCryptoConfigError(
      `${label} must decode to ${KEY_BYTES} bytes, got ${key.length}. Generate one with: openssl rand -base64 32`
    );
  }
  return key;
}

/**
 * Parses the retired-key list used during a rotation window.
 * Format: "1:<base64>,2:<base64>" - decrypt-only, never used for new writes.
 */
function parseRetiredKeys(raw: string | undefined): Map<number, Buffer> {
  const keys = new Map<number, Buffer>();
  if (!raw) return keys;

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) {
      throw new MailCryptoConfigError('EMAIL_ENCRYPTION_KEYS_RETIRED entries must look like "<version>:<base64Key>"');
    }

    const version = Number(trimmed.slice(0, separator));
    if (!Number.isInteger(version) || version < 1) {
      throw new MailCryptoConfigError('EMAIL_ENCRYPTION_KEYS_RETIRED versions must be positive integers');
    }

    keys.set(version, decodeKey(trimmed.slice(separator + 1), `EMAIL_ENCRYPTION_KEYS_RETIRED[${version}]`));
  }

  return keys;
}

/**
 * Resolved lazily on first use, never at import, so a missing key cannot break the
 * build or an unrelated route that merely sits in the same module graph.
 */
function getKeyring(): Keyring {
  if (cachedKeyring) return cachedKeyring;

  // ENCRYPTION_KEY is the documented fallback: it is already provisioned in
  // production and CI, so this feature does not need a new secret deployed first.
  const rawActive = process.env.EMAIL_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!rawActive) {
    throw new MailCryptoConfigError('EMAIL_ENCRYPTION_KEY (or ENCRYPTION_KEY) is not set');
  }

  const activeVersionRaw = process.env.EMAIL_ENCRYPTION_KEY_VERSION ?? '1';
  const activeVersion = Number(activeVersionRaw);
  if (!Number.isInteger(activeVersion) || activeVersion < 1) {
    throw new MailCryptoConfigError('EMAIL_ENCRYPTION_KEY_VERSION must be a positive integer');
  }

  const keys = parseRetiredKeys(process.env.EMAIL_ENCRYPTION_KEYS_RETIRED);
  keys.set(activeVersion, decodeKey(rawActive, 'EMAIL_ENCRYPTION_KEY'));

  cachedKeyring = { activeVersion, keys };
  return cachedKeyring;
}

/** Test seam: forces the next call to re-read the environment. */
export function resetMailCryptoCache(): void {
  cachedKeyring = null;
}

/**
 * Whether encryption is usable right now. The settings write path checks this first
 * and refuses to save, because storing a credential that cannot be read back is worse
 * than not storing it at all.
 */
export function isMailCryptoConfigured(): boolean {
  try {
    getKeyring();
    return true;
  } catch {
    return false;
  }
}

function buildAad(businessAccountId: string): Buffer {
  return Buffer.from(`${AAD_PURPOSE}:${businessAccountId}`, 'utf8');
}

/**
 * Encrypts an SMTP password for one specific business account.
 *
 * @returns `v1:<keyVersion>:<iv>:<tag>:<ciphertext>`, all base64. Base64's alphabet
 *          contains no colon, so splitting on ':' is unambiguous.
 */
export function encryptSecret(plaintext: string, businessAccountId: string): string {
  if (!plaintext) {
    throw new MailCryptoError('Refusing to encrypt an empty secret');
  }
  if (!businessAccountId) {
    throw new MailCryptoError('A business account id is required to bind the ciphertext');
  }

  const { activeVersion, keys } = getKeyring();
  const key = keys.get(activeVersion);
  if (!key) {
    throw new MailCryptoConfigError(`No key available for active version ${activeVersion}`);
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(buildAad(businessAccountId));

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENVELOPE_VERSION,
    String(activeVersion),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

/**
 * Decrypts an envelope produced by {@link encryptSecret}.
 *
 * Throws if the envelope is malformed, was encrypted under a key we no longer hold,
 * was tampered with, or belongs to a different business account. No thrown message
 * ever contains the plaintext, the ciphertext, or any key material.
 */
export function decryptSecret(envelope: string, businessAccountId: string): string {
  if (!businessAccountId) {
    throw new MailCryptoError('A business account id is required to decrypt');
  }

  const parts = envelope.split(':');
  if (parts.length !== 5 || parts[0] !== ENVELOPE_VERSION) {
    throw new MailCryptoError('Malformed secret envelope');
  }

  const [, versionRaw, ivB64, tagB64, ciphertextB64] = parts;
  const version = Number(versionRaw);
  if (!Number.isInteger(version) || version < 1) {
    throw new MailCryptoError('Malformed secret envelope version');
  }

  const key = getKeyring().keys.get(version);
  if (!key) {
    throw new MailCryptoError(
      `No key available for envelope version ${version}. Add it to EMAIL_ENCRYPTION_KEYS_RETIRED to decrypt existing rows.`
    );
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new MailCryptoError('Malformed secret envelope');
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(buildAad(businessAccountId));
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    // Deliberately opaque: a caller must not be able to distinguish "wrong key" from
    // "wrong tenant" from "tampered", and the underlying error text is not useful.
    throw new MailCryptoError('Could not decrypt the stored credential');
  }
}

/** Whether a stored value looks like one of our envelopes rather than a stray plaintext. */
export function isEncryptedEnvelope(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 5 && parts[0] === ENVELOPE_VERSION;
}

/** The key version an envelope was written under, for rotation reporting. */
export function envelopeKeyVersion(envelope: string): number | null {
  const parts = envelope.split(':');
  if (parts.length !== 5 || parts[0] !== ENVELOPE_VERSION) return null;

  const version = Number(parts[1]);
  return Number.isInteger(version) && version >= 1 ? version : null;
}

/** Renders a secret for display: last four characters only. */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return '•'.repeat(8);
  return `${'•'.repeat(8)}${plaintext.slice(-4)}`;
}

/**
 * Scrubs known secrets out of arbitrary text before it is logged or persisted.
 *
 * Some SMTP servers echo the submitted username, and occasionally the base64 AUTH
 * blob, back inside a 535 response. Every path that records an SMTP error runs
 * through here.
 */
export function redactSecrets(text: string, secrets: readonly string[]): string {
  let output = text;

  for (const secret of secrets) {
    if (!secret || secret.length < 4) continue;

    for (const variant of [secret, Buffer.from(secret, 'utf8').toString('base64')]) {
      output = output.split(variant).join('[redacted]');
    }
  }

  return output;
}

/**
 * Constant-time comparison for secrets. Exported for the settings route, which needs
 * to tell "the owner re-submitted the same password" from "the owner rotated it"
 * without leaking timing information.
 */
export function secretsMatch(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;

  return timingSafeEqual(bufferA, bufferB);
}
