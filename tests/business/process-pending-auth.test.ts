/**
 * Auth-gate regression tests for the auto-recharge cron worker.
 *
 * Locks the critical fix: the endpoint that drives off-session card charges
 * must reject unauthenticated callers. GET allows the Vercel cron
 * (x-vercel-cron header) or a CRON_SECRET bearer; POST requires the bearer.
 *
 * Stripe/admin are mocked so no real charge or DB call happens; the gate
 * returns before any of that.
 */

// Must be set before the route module is imported (it reads process.env).
process.env.CRON_SECRET = 'test-cron-secret'

// Admin client: chainable builder. The GET pending query ends in `.limit()`
// and resolves to an empty set, so a gate-passing GET returns 200 without
// touching Stripe or a real DB.
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    const builder: Record<string, unknown> = {
      from: () => builder,
      select: () => builder,
      eq: () => builder,
      lte: () => builder,
      order: () => builder,
      limit: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
    }
    return builder
  },
}))
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({}),
}))

import { GET, POST } from '@/app/api/business/wallet/auto-recharge/process-pending/route'

type Headers = Record<string, string>

function makeReq(opts: { headers?: Headers; body?: unknown } = {}) {
  const headers = opts.headers ?? {}
  const normalized: Headers = {}
  for (const [k, v] of Object.entries(headers)) normalized[k.toLowerCase()] = v
  return {
    headers: { get: (k: string) => normalized[k.toLowerCase()] ?? null },
    json: async () => opts.body ?? {},
  } as unknown as import('next/server').NextRequest
}

const BEARER = { authorization: 'Bearer test-cron-secret' }

describe('process-pending auth gate', () => {
  describe('GET (cron)', () => {
    it('rejects with 401 when no secret and no vercel-cron header', async () => {
      const res = await GET(makeReq())
      expect(res.status).toBe(401)
    })

    it('rejects with 401 on a wrong bearer', async () => {
      const res = await GET(makeReq({ headers: { authorization: 'Bearer wrong' } }))
      expect(res.status).toBe(401)
    })

    it('passes the gate for a Vercel cron request (x-vercel-cron: 1)', async () => {
      const res = await GET(makeReq({ headers: { 'x-vercel-cron': '1' } }))
      expect(res.status).toBe(200)
    })

    it('passes the gate for a valid CRON_SECRET bearer', async () => {
      const res = await GET(makeReq({ headers: BEARER }))
      expect(res.status).toBe(200)
    })
  })

  describe('POST (single attempt)', () => {
    it('rejects with 401 when no bearer', async () => {
      const res = await POST(makeReq({ body: { attempt_id: 'a1' } }))
      expect(res.status).toBe(401)
    })

    it('rejects with 401 on a wrong bearer', async () => {
      const res = await POST(makeReq({ headers: { authorization: 'Bearer wrong' }, body: { attempt_id: 'a1' } }))
      expect(res.status).toBe(401)
    })

    it('passes the gate with a valid bearer (then 400 on missing attempt_id)', async () => {
      const res = await POST(makeReq({ headers: BEARER, body: {} }))
      expect(res.status).toBe(400)
    })
  })
})
