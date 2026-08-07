/**
 * Envelope encryption for per-tenant SMTP passwords.
 *
 * The assertion that matters most here is the AAD binding: a ciphertext lifted out of
 * one tenant's row and dropped into another's must fail to decrypt. Without it, a
 * database-level mistake would let one business silently send mail as another.
 */

import {
  MailCryptoConfigError,
  MailCryptoError,
  decryptSecret,
  encryptSecret,
  envelopeKeyVersion,
  isEncryptedEnvelope,
  isMailCryptoConfigured,
  maskSecret,
  redactSecrets,
  resetMailCryptoCache,
  secretsMatch,
} from '@/lib/email/transport/crypto';

const KEY_A = Buffer.alloc(32, 1).toString('base64');
const KEY_B = Buffer.alloc(32, 2).toString('base64');

const TENANT = '11111111-1111-4111-8111-111111111111';
const OTHER_TENANT = '22222222-2222-4222-8222-222222222222';
const PASSWORD = 're_test_ApiKey_0123456789';

function useKey(key: string, version = '1', retired?: string): void {
  process.env.EMAIL_ENCRYPTION_KEY = key;
  process.env.EMAIL_ENCRYPTION_KEY_VERSION = version;

  if (retired) {
    process.env.EMAIL_ENCRYPTION_KEYS_RETIRED = retired;
  } else {
    delete process.env.EMAIL_ENCRYPTION_KEYS_RETIRED;
  }

  resetMailCryptoCache();
}

describe('mail secret crypto', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    useKey(KEY_A);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetMailCryptoCache();
  });

  describe('round trip', () => {
    it('decrypts what it encrypted', () => {
      const envelope = encryptSecret(PASSWORD, TENANT);

      expect(decryptSecret(envelope, TENANT)).toBe(PASSWORD);
    });

    it('never stores the plaintext in the envelope', () => {
      const envelope = encryptSecret(PASSWORD, TENANT);

      expect(envelope).not.toContain(PASSWORD);
    });

    it('produces a different ciphertext each time, because the IV is random', () => {
      const first = encryptSecret(PASSWORD, TENANT);
      const second = encryptSecret(PASSWORD, TENANT);

      expect(first).not.toBe(second);
      expect(decryptSecret(first, TENANT)).toBe(PASSWORD);
      expect(decryptSecret(second, TENANT)).toBe(PASSWORD);
    });

    it('handles a password containing the envelope separator', () => {
      const awkward = 'pa:ss:word:with:colons';
      const envelope = encryptSecret(awkward, TENANT);

      expect(decryptSecret(envelope, TENANT)).toBe(awkward);
    });

    it('handles unicode', () => {
      const unicode = 'pässwörd-□-😀';

      expect(decryptSecret(encryptSecret(unicode, TENANT), TENANT)).toBe(unicode);
    });
  });

  describe('tenant binding', () => {
    it('refuses to decrypt another tenant ciphertext', () => {
      const envelope = encryptSecret(PASSWORD, TENANT);

      expect(() => decryptSecret(envelope, OTHER_TENANT)).toThrow(MailCryptoError);
    });

    it('requires a business account id on both sides', () => {
      expect(() => encryptSecret(PASSWORD, '')).toThrow(MailCryptoError);
      expect(() => decryptSecret(encryptSecret(PASSWORD, TENANT), '')).toThrow(MailCryptoError);
    });
  });

  describe('tampering', () => {
    it('rejects a flipped bit in the ciphertext', () => {
      const parts = encryptSecret(PASSWORD, TENANT).split(':');
      const ciphertext = Buffer.from(parts[4], 'base64');
      ciphertext[0] ^= 0xff;
      parts[4] = ciphertext.toString('base64');

      expect(() => decryptSecret(parts.join(':'), TENANT)).toThrow(MailCryptoError);
    });

    it('rejects a flipped bit in the auth tag', () => {
      const parts = encryptSecret(PASSWORD, TENANT).split(':');
      const tag = Buffer.from(parts[3], 'base64');
      tag[0] ^= 0xff;
      parts[3] = tag.toString('base64');

      expect(() => decryptSecret(parts.join(':'), TENANT)).toThrow(MailCryptoError);
    });

    it.each([
      ['empty', ''],
      ['plaintext', PASSWORD],
      ['too few segments', 'v1:1:aaa:bbb'],
      ['wrong version', 'v2:1:aaa:bbb:ccc'],
      ['short iv', 'v1:1:AAAA:AAAA:AAAA'],
    ])('rejects a malformed envelope: %s', (_label, envelope) => {
      expect(() => decryptSecret(envelope, TENANT)).toThrow(MailCryptoError);
    });
  });

  describe('keys', () => {
    it('refuses to decrypt under a different key', () => {
      const envelope = encryptSecret(PASSWORD, TENANT);
      useKey(KEY_B);

      expect(() => decryptSecret(envelope, TENANT)).toThrow(MailCryptoError);
    });

    it('still decrypts an old envelope while its key is listed as retired', () => {
      const oldEnvelope = encryptSecret(PASSWORD, TENANT);
      expect(envelopeKeyVersion(oldEnvelope)).toBe(1);

      useKey(KEY_B, '2', `1:${KEY_A}`);

      expect(decryptSecret(oldEnvelope, TENANT)).toBe(PASSWORD);
      expect(envelopeKeyVersion(encryptSecret(PASSWORD, TENANT))).toBe(2);
    });

    it('falls back to ENCRYPTION_KEY when the dedicated variable is unset', () => {
      delete process.env.EMAIL_ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = KEY_A;
      resetMailCryptoCache();

      expect(decryptSecret(encryptSecret(PASSWORD, TENANT), TENANT)).toBe(PASSWORD);
    });

    it('reports misconfiguration rather than pretending to work', () => {
      delete process.env.EMAIL_ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      resetMailCryptoCache();

      expect(isMailCryptoConfigured()).toBe(false);
      expect(() => encryptSecret(PASSWORD, TENANT)).toThrow(MailCryptoConfigError);
    });

    it('rejects a key that is not 32 bytes', () => {
      useKey(Buffer.alloc(16, 1).toString('base64'));

      expect(isMailCryptoConfigured()).toBe(false);
      expect(() => encryptSecret(PASSWORD, TENANT)).toThrow(MailCryptoConfigError);
    });

    it('never leaks key material or plaintext in an error message', () => {
      const envelope = encryptSecret(PASSWORD, TENANT);
      useKey(KEY_B);

      try {
        decryptSecret(envelope, TENANT);
        throw new Error('expected decryptSecret to throw');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).not.toContain(PASSWORD);
        expect(message).not.toContain(KEY_A);
        expect(message).not.toContain(KEY_B);
      }
    });
  });

  describe('helpers', () => {
    it('recognises its own envelopes', () => {
      expect(isEncryptedEnvelope(encryptSecret(PASSWORD, TENANT))).toBe(true);
      expect(isEncryptedEnvelope(PASSWORD)).toBe(false);
    });

    it('masks all but the last four characters', () => {
      expect(maskSecret('abcdefghij')).toBe('••••••••ghij');
      expect(maskSecret('abc')).not.toContain('abc');
    });

    it('scrubs a password out of a server response, including its base64 form', () => {
      const base64 = Buffer.from(PASSWORD, 'utf8').toString('base64');
      const response = `535 auth failed for user resend with ${PASSWORD} (${base64})`;

      const redacted = redactSecrets(response, [PASSWORD, 'resend']);

      expect(redacted).not.toContain(PASSWORD);
      expect(redacted).not.toContain(base64);
      expect(redacted).toContain('535 auth failed');
    });

    it('leaves text alone when there is nothing to scrub', () => {
      expect(redactSecrets('550 sender not verified', [])).toBe('550 sender not verified');
    });

    it('compares secrets without leaking length-independent timing', () => {
      expect(secretsMatch(PASSWORD, PASSWORD)).toBe(true);
      expect(secretsMatch(PASSWORD, `${PASSWORD}x`)).toBe(false);
      expect(secretsMatch(PASSWORD, 'other')).toBe(false);
    });
  });
});
