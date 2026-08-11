/**
 * Resolves which credentials and which brand an email goes out on.
 *
 * The contract that matters: this never throws. Any failure to resolve a tenant
 * configuration degrades to the platform transport, because the caller is usually
 * mid-booking and an unsendable confirmation must not become a failed booking.
 *
 * Note that a fallback keeps the tenant's *brand* even when it loses the tenant's
 * *transport*, so a customer still sees the business they booked with rather than the
 * platform they have never heard of.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformBrand } from '../brand/brand';
import { getPlatformMailConfig } from './platform-config';
import { decryptSecret } from './crypto';
import { buildBusinessBrand, type BusinessBrandRow } from './business-brand';
import type { ResolvedMailConfig } from './types';

/**
 * Sixty seconds is the ceiling on how long a rotated credential keeps being used.
 *
 * bustMailConfigCache only reaches the one instance that served the PATCH, so on a
 * multi-instance deployment the bust is a latency optimisation for the
 * save-then-test-send flow. The TTL is the actual correctness guarantee.
 */
const CONFIG_TTL_MS = 60_000;

/**
 * Bounds how many decrypted passwords a single warm instance holds at once. A security
 * bound, not a memory one.
 */
const MAX_CACHED_CONFIGS = 200;

/**
 * After this many consecutive failures the sender stops attempting the tenant transport
 * altogether, so a business whose credentials broke does not add an SMTP timeout to
 * every booking request until someone notices.
 */
const CIRCUIT_BREAKER_THRESHOLD = 3;

interface CacheEntry {
  readonly config: ResolvedMailConfig;
  readonly expiresAt: number;
}

const configCache = new Map<string, CacheEntry>();

/**
 * One tenant has two resolutions, and they must not share a slot.
 *
 * A passenger email resolves to the tenant's own transport; an owner notification
 * resolves to the platform transport wearing the tenant's brand. Keyed on the tenant id
 * alone, whichever ran first would be served to the other, and owner mail would start
 * going out over tenant credentials or, worse, passenger mail would stop doing so.
 */
function cacheKey(businessAccountId: string, forcePlatformTransport: boolean): string {
  return `${businessAccountId}:${forcePlatformTransport ? 'platform' : 'tenant'}`;
}

function readCache(key: string): ResolvedMailConfig | null {
  const entry = configCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    configCache.delete(key);
    return null;
  }

  return entry.config;
}

function writeCache(key: string, config: ResolvedMailConfig): void {
  if (configCache.size >= MAX_CACHED_CONFIGS) {
    const oldest = configCache.keys().next();
    if (!oldest.done) configCache.delete(oldest.value);
  }

  configCache.set(key, { config, expiresAt: Date.now() + CONFIG_TTL_MS });
}

/**
 * Drops one tenant's cached config so the next send re-reads the database.
 *
 * Clears both resolutions: a credential change invalidates the tenant transport, and a
 * branding change invalidates the brand carried by both.
 */
export function bustMailConfigCache(businessAccountId: string): void {
  configCache.delete(cacheKey(businessAccountId, false));
  configCache.delete(cacheKey(businessAccountId, true));
}

/** Test seam. */
export function clearMailConfigCache(): void {
  configCache.clear();
}

/**
 * Platform transport, but wearing the tenant's brand.
 *
 * Two callers with different intent: a degraded resolution (no credentials, breaker
 * tripped, decryption failed), and a deliberate `forcePlatformTransport` for owner
 * notifications. Only the deliberate one takes the tenant's name onto the From header,
 * because on the degraded path the existing envelope behaviour is load-bearing for the
 * `fell_back` accounting and must not shift.
 */
function platformWithBrand(
  businessAccountId: string,
  row: BusinessBrandRow | null,
  deliberate = false
): ResolvedMailConfig {
  const platform = getPlatformMailConfig();
  const brand = row ? buildBusinessBrand(row) : getPlatformBrand();

  return {
    ...platform,
    businessAccountId,
    brand,
    identity: deliberate ? { ...platform.identity, fromName: brand.name } : platform.identity,
  };
}

interface SettingsRow {
  enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password_encrypted: string;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  allow_platform_fallback: boolean;
  consecutive_failures: number;
  updated_at: string;
}

export interface ResolveOptions {
  /**
   * Build a tenant config even when `enabled` is false or the circuit breaker has
   * tripped. Only the test-send route passes this.
   *
   * Without it the feature deadlocks: sending cannot be switched on until a test
   * succeeds, but the test would resolve to the platform transport precisely because
   * sending is not switched on yet. A test send is also how an owner recovers from a
   * tripped breaker after fixing their password, so the breaker is bypassed too.
   */
  readonly ignoreEnabled?: boolean;
  /**
   * Send on platform credentials while keeping the tenant's brand. Used for
   * notifications addressed to the business owner rather than to their customer.
   *
   * The reason is availability, not aesthetics: if a tenant's own mail server is what
   * carries the alert that their mail server is failing, the alert never arrives. The
   * owner is the platform's customer, so the platform speaks to them directly, in their
   * own livery.
   */
  readonly forcePlatformTransport?: boolean;
}

function usable(settings: SettingsRow | null, ignoreEnabled: boolean): settings is SettingsRow {
  if (!settings) return false;
  if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password_encrypted) return false;
  if (!settings.from_email) return false;

  // Both of these are deliberately skipped for a test send.
  if (!ignoreEnabled) {
    if (!settings.enabled) return false;
    if (settings.consecutive_failures >= CIRCUIT_BREAKER_THRESHOLD) return false;
  }

  return true;
}

/**
 * @param businessAccountId the tenant to send as, or null for platform mail.
 */
export async function resolveMailConfig(
  businessAccountId: string | null,
  options: ResolveOptions = {}
): Promise<ResolvedMailConfig> {
  if (!businessAccountId) {
    return getPlatformMailConfig();
  }

  const ignoreEnabled = options.ignoreEnabled === true;
  const forcePlatform = options.forcePlatformTransport === true;
  const key = cacheKey(businessAccountId, forcePlatform);

  // A test-send config must never touch the shared cache in either direction. Reading
  // could return a stale platform config; writing would poison the cache so that real
  // booking emails start using a transport the owner has not switched on yet.
  const cached = ignoreEnabled ? null : readCache(key);
  if (cached) return cached;

  let brandRow: BusinessBrandRow | null = null;

  try {
    const admin = createAdminClient();

    // One round trip for both the brand and the credentials.
    const { data, error } = await admin
      .from('business_accounts')
      .select(
        `id, business_name, brand_name, logo_url, business_email, address,
         subdomain, custom_domain, custom_domain_verified, theme_config,
         business_email_settings (
           enabled, smtp_host, smtp_port, smtp_secure, smtp_username,
           smtp_password_encrypted, from_email, from_name, reply_to,
           allow_platform_fallback, consecutive_failures, updated_at
         )`
      )
      .eq('id', businessAccountId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('[mail-config] lookup failed:', error.message);
      const config = platformWithBrand(businessAccountId, null, forcePlatform);
      if (!ignoreEnabled) writeCache(key, config);
      return config;
    }

    brandRow = data as unknown as BusinessBrandRow;

    // Owner notifications stop here: the row was fetched for the brand, and the tenant's
    // credentials are deliberately not consulted.
    if (forcePlatform) {
      const config = platformWithBrand(businessAccountId, brandRow, true);
      if (!ignoreEnabled) writeCache(key, config);
      return config;
    }

    // PostgREST returns an embedded one-to-one as either an object or a single-element
    // array depending on how it infers the relationship, so normalise both shapes.
    const embedded = (data as { business_email_settings?: SettingsRow | SettingsRow[] | null })
      .business_email_settings;
    const settings = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;

    if (!usable(settings, ignoreEnabled)) {
      const config = platformWithBrand(businessAccountId, brandRow);
      if (!ignoreEnabled) writeCache(key, config);
      return config;
    }

    const password = decryptSecret(settings.smtp_password_encrypted, businessAccountId);
    const brand = buildBusinessBrand(brandRow);

    const config: ResolvedMailConfig = {
      provider: 'business_smtp',
      businessAccountId,
      smtp: {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        user: settings.smtp_username,
        pass: password,
      },
      identity: {
        fromEmail: settings.from_email,
        fromName: settings.from_name || brand.name,
        replyTo: settings.reply_to,
      },
      brand,
      // updated_at in the key means a credential edit yields a new transporter and the
      // stale one is orphaned, with no explicit invalidation needed.
      fingerprint: `${businessAccountId}:${settings.updated_at}`,
      allowPlatformFallback: settings.allow_platform_fallback,
    };

    if (!ignoreEnabled) writeCache(key, config);
    return config;
  } catch (error) {
    // Most likely a decryption failure: a rotated key, or a row copied between tenants.
    // Never log the ciphertext.
    console.error(
      `[mail-config] falling back to platform for business ${businessAccountId}:`,
      error instanceof Error ? error.message : 'unknown error'
    );

    const config = platformWithBrand(businessAccountId, brandRow, forcePlatform);
    if (!ignoreEnabled) writeCache(key, config);
    return config;
  }
}
