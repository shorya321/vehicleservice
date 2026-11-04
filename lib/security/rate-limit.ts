/**
 * Minimal in-process rate limiter for the customer side.
 *
 * BEST-EFFORT ONLY. State lives in this process's memory, so it resets on deploy
 * and is not shared across instances: on a multi-instance deployment the effective
 * limit is (max x instance count). It blunts scripted guest bookings from one
 * address; it is not a security boundary.
 *
 * The business module keeps its own copy (`lib/business/rate-limit.ts`) and the two
 * must not import each other.
 */

interface AttemptRecord {
  readonly count: number
  readonly resetAt: number
}

const attempts = new Map<string, AttemptRecord>()

const PRUNE_THRESHOLD = 1000

function pruneExpired(now: number): void {
  attempts.forEach((record, key) => {
    if (record.resetAt <= now) attempts.delete(key)
  })
}

export interface RateLimitOptions {
  /** Attempts permitted within the window. */
  max: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the window resets. */
  retryAfterSeconds: number
}

/** Records an attempt against `key` and reports whether it is permitted. */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now: number = Date.now()
): RateLimitResult {
  if (attempts.size > PRUNE_THRESHOLD) pruneExpired(now)

  const existing = attempts.get(key)
  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.max - 1, retryAfterSeconds: 0 }
  }

  const next: AttemptRecord = { count: existing.count + 1, resetAt: existing.resetAt }
  attempts.set(key, next)

  if (next.count > options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((next.resetAt - now) / 1000)),
    }
  }
  return { allowed: true, remaining: options.max - next.count, retryAfterSeconds: 0 }
}

/** Test helper: forget every recorded attempt. */
export function clearRateLimits(): void {
  attempts.clear()
}
