import type { EmailProviderPreset } from '@/lib/business/email/provider-presets';

/**
 * The email settings as the browser is allowed to see them.
 *
 * There is no password field of any kind, only whether one is stored and when it last
 * changed. The ciphertext is not granted to the authenticated role, so it cannot reach
 * here even by mistake.
 */
export interface EmailSettings {
  enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password_updated_at: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  provider_preset: EmailProviderPreset;
  allow_platform_fallback: boolean;
  last_test_at: string | null;
  last_test_status: 'success' | 'failure' | null;
  last_test_error: string | null;
  last_success_at: string | null;
  consecutive_failures: number;
  has_password: boolean;
}

export interface EmailLogEntry {
  id: string;
  kind: string;
  to_email: string;
  from_email: string;
  subject: string;
  provider: 'business_smtp' | 'platform_smtp';
  status: 'sent' | 'failed' | 'fell_back';
  smtp_host: string | null;
  message_id: string | null;
  error_code: string | null;
  error_message: string | null;
  duration_ms: number | null;
  attempt: number;
  created_at: string;
}

/** What the status pill communicates, in order of increasing urgency. */
export type ConnectionState =
  | 'platform'
  | 'untested'
  | 'verified_off'
  | 'connected'
  | 'failing';

export function connectionState(settings: EmailSettings | null): ConnectionState {
  if (!settings) return 'platform';
  if (settings.consecutive_failures >= 3) return 'failing';
  if (settings.last_test_status === 'failure') return 'failing';
  if (settings.last_test_status !== 'success') return 'untested';

  return settings.enabled ? 'connected' : 'verified_off';
}
