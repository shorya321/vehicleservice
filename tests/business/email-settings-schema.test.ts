/**
 * Validation for the business SMTP settings form.
 *
 * Two classes of assertion here are security rather than ergonomics: the CRLF rejection
 * (a newline in from_name would let a tenant inject arbitrary headers into every message
 * it sends) and PRIVATE_HOST_PATTERN (without it the test-send button is a port scanner
 * aimed at internal infrastructure from a platform IP).
 */

import {
  businessEmailSettingsSchema,
  businessEmailTestSchema,
  EMAIL_ADDRESS_REGEX,
  PRIVATE_HOST_PATTERN,
} from '@/lib/business/validators';
import {
  PROVIDER_PRESETS,
  secureForPort,
  sesHostForRegion,
} from '@/lib/business/email/provider-presets';

function valid(overrides: Record<string, unknown> = {}) {
  return {
    enabled: false,
    provider_preset: 'resend',
    smtp_host: 'smtp.resend.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: 'resend',
    smtp_password: 're_live_key',
    from_name: 'Acme Transfers',
    from_email: 'bookings@acmehotel.com',
    reply_to: 'support@acmehotel.com',
    allow_platform_fallback: true,
    ...overrides,
  };
}

describe('businessEmailSettingsSchema', () => {
  it('accepts a complete configuration', () => {
    expect(businessEmailSettingsSchema.safeParse(valid()).success).toBe(true);
  });

  it('treats the password as optional, so a save can keep the stored one', () => {
    const parsed = businessEmailSettingsSchema.safeParse(valid({ smtp_password: undefined }));

    expect(parsed.success).toBe(true);
  });

  it('coerces a port arriving as a string from a number input', () => {
    const parsed = businessEmailSettingsSchema.safeParse(valid({ smtp_port: '587' }));

    expect(parsed.success && parsed.data.smtp_port).toBe(587);
  });

  it.each([0, 65536, 1.5])('rejects the invalid port %s', (port) => {
    expect(businessEmailSettingsSchema.safeParse(valid({ smtp_port: port })).success).toBe(false);
  });

  it('lowercases the sender address so comparisons are stable', () => {
    const parsed = businessEmailSettingsSchema.safeParse(valid({ from_email: 'Bookings@AcmeHotel.com' }));

    expect(parsed.success && parsed.data.from_email).toBe('bookings@acmehotel.com');
  });

  it('turns a blank reply-to into null rather than an empty string', () => {
    const parsed = businessEmailSettingsSchema.safeParse(valid({ reply_to: '' }));

    expect(parsed.success && parsed.data.reply_to).toBeNull();
  });

  describe('header injection', () => {
    it.each([
      ['from_name', 'Acme\r\nBcc: victim@example.com'],
      ['smtp_host', 'smtp.example.com\r\nX-Evil: 1'],
      ['smtp_username', 'user\nInjected: 1'],
      ['smtp_password', 'secret\r\nX: 1'],
    ])('rejects a newline in %s', (field, value) => {
      expect(businessEmailSettingsSchema.safeParse(valid({ [field]: value })).success).toBe(false);
    });
  });

  describe('TLS mode must match the port', () => {
    it('rejects 465 without TLS on connect', () => {
      const parsed = businessEmailSettingsSchema.safeParse(
        valid({ smtp_port: 465, smtp_secure: false })
      );

      expect(parsed.success).toBe(false);
      expect(!parsed.success && parsed.error.errors[0].path).toEqual(['smtp_secure']);
    });

    it('rejects 587 with TLS on connect', () => {
      expect(
        businessEmailSettingsSchema.safeParse(valid({ smtp_port: 587, smtp_secure: true })).success
      ).toBe(false);
    });

    it('accepts the two correct pairings', () => {
      expect(
        businessEmailSettingsSchema.safeParse(valid({ smtp_port: 465, smtp_secure: true })).success
      ).toBe(true);
      expect(
        businessEmailSettingsSchema.safeParse(valid({ smtp_port: 2525, smtp_secure: false })).success
      ).toBe(true);
    });
  });

  describe('host shape', () => {
    it.each(['https://smtp.example.com', 'smtp.example.com:587', 'smtp example com'])(
      'rejects %s, which is not a bare hostname',
      (host) => {
        expect(businessEmailSettingsSchema.safeParse(valid({ smtp_host: host })).success).toBe(false);
      }
    );
  });
});

describe('EMAIL_ADDRESS_REGEX', () => {
  it.each(['a+tag@sub.example.co.uk', 'bookings@acme-hotel.com', "o'brien@example.com"])(
    'accepts %s',
    (address) => {
      expect(EMAIL_ADDRESS_REGEX.test(address)).toBe(true);
    }
  );

  it.each(['a@b', 'a@b.c', 'no-at-sign.com', 'two@@example.com', 'spaced address@example.com'])(
    'rejects %s',
    (address) => {
      expect(EMAIL_ADDRESS_REGEX.test(address)).toBe(false);
    }
  );
});

describe('PRIVATE_HOST_PATTERN', () => {
  it.each([
    'localhost',
    '127.0.0.1',
    '10.0.0.5',
    '192.168.1.10',
    // The cloud metadata endpoint, the classic SSRF target.
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
  ])('matches the unroutable host %s', (host) => {
    expect(PRIVATE_HOST_PATTERN.test(host)).toBe(true);
  });

  it.each([
    'smtp.resend.com',
    'email-smtp.eu-west-1.amazonaws.com',
    // Just outside the private range on both sides, so the boundary is not too greedy.
    '172.15.0.1',
    '172.32.0.1',
    '10gen.example.com',
  ])('does not match the public host %s', (host) => {
    expect(PRIVATE_HOST_PATTERN.test(host)).toBe(false);
  });
});

describe('businessEmailTestSchema', () => {
  it('normalises the recipient to lowercase', () => {
    const parsed = businessEmailTestSchema.safeParse({ to_email: ' Owner@Acme.com ' });

    expect(parsed.success && parsed.data.to_email).toBe('owner@acme.com');
  });

  it('rejects a malformed recipient', () => {
    expect(businessEmailTestSchema.safeParse({ to_email: 'not-an-email' }).success).toBe(false);
  });
});

describe('provider presets', () => {
  it('every preset with a host would pass the schema and the private-host guard', () => {
    for (const preset of Object.values(PROVIDER_PRESETS)) {
      if (!preset.host) continue;

      expect(PRIVATE_HOST_PATTERN.test(preset.host)).toBe(false);
      expect([25, 465, 587, 2525]).toContain(preset.port);
      // Every preset must agree with the port/TLS rule the schema enforces.
      expect(preset.secure).toBe(secureForPort(preset.port));
    }
  });

  it('pins the usernames that providers require verbatim', () => {
    expect(PROVIDER_PRESETS.resend.fixedUsername).toBe('resend');
    expect(PROVIDER_PRESETS.sendgrid.fixedUsername).toBe('apikey');
  });

  it('builds a valid SES host for a region', () => {
    const host = sesHostForRegion('eu-central-1');

    expect(host).toBe('email-smtp.eu-central-1.amazonaws.com');
    expect(businessEmailSettingsSchema.safeParse(valid({ smtp_host: host })).success).toBe(true);
  });

  it('marks Gmail as managing its own domain, so the DNS checklist is suppressed', () => {
    expect(PROVIDER_PRESETS.gmail.managedDomain).toBe(true);
    expect(PROVIDER_PRESETS.resend.managedDomain).toBeUndefined();
  });
});
