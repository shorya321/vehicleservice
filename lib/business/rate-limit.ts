/**
 * Minimal in-process rate limiter.
 *
 * BEST-EFFORT ONLY. State lives in this process's memory, so it resets on
 * deploy and is not shared across instances - on a multi-instance deployment
 * the effective limit is (max x instance count). It exists to blunt password
 * guessing from a single hijacked session, not as a security boundary.
 *
 * Supabase Auth applies its own per-IP limit to signInWithPassword (~30 per
 * 5 minutes by default), which is the real backstop underneath this.
 *
 * Follow-up if this needs to be durable: persist attempts to a table, the way
 * password_reset_tokens does, and key on user id + IP.
 */

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptRecord>();

/** Stop the Map growing without bound in a long-lived process. */
function pruneExpired(now: number): void {
  attempts.forEach((record, key) => {
    if (record.resetAt <= now) {
      attempts.delete(key);
    }
  });
}

export interface RateLimitOptions {
  /** Attempts permitted within the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Attempts left after this one. */
  remaining: number;
  /** Seconds until the window resets - suitable for a Retry-After header. */
  retryAfterSeconds: number;
}

/**
 * Record an attempt against `key` and report whether it is permitted.
 * Call `resetAttempts(key)` on success so a legitimate user is not penalised
 * for earlier typos.
 */
export function checkAttempt(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  if (attempts.size > 1000) {
    pruneExpired(now);
  }

  const existing = attempts.get(key);

  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: options.max - existing.count,
    retryAfterSeconds: 0,
  };
}

export function resetAttempts(key: string): void {
  attempts.delete(key);
}
