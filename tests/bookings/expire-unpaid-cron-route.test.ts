/**
 * The backup cron route must fail closed: it runs on every host the app ships to,
 * and on a host without CRON_SECRET nobody may trigger it.
 */

const mockRpc = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: (...args: unknown[]) => mockRpc(...args) }),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}))

import { GET } from '@/app/api/cron/expire-unpaid-bookings/route'

const ORIGINAL_SECRET = process.env.CRON_SECRET

function request(authorization?: string): Request {
  return {
    headers: { get: (name: string) => (name.toLowerCase() === 'authorization' ? authorization ?? null : null) },
  } as unknown as Request
}

type Reply = { body: Record<string, unknown>; status: number }

beforeEach(() => {
  mockRpc.mockReset()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL_SECRET
})

describe('GET /api/cron/expire-unpaid-bookings', () => {
  it('refuses when CRON_SECRET is not set, even with a header', async () => {
    delete process.env.CRON_SECRET
    const reply = (await GET(request('Bearer anything'))) as unknown as Reply
    expect(reply.status).toBe(401)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('refuses a missing or wrong token', async () => {
    process.env.CRON_SECRET = 'right-secret'
    expect(((await GET(request())) as unknown as Reply).status).toBe(401)
    expect(((await GET(request('Bearer wrong'))) as unknown as Reply).status).toBe(401)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('runs the job, honouring the admin switch, with the right token', async () => {
    process.env.CRON_SECRET = 'right-secret'
    mockRpc.mockResolvedValue({ data: 3, error: null })
    const reply = (await GET(request('Bearer right-secret'))) as unknown as Reply
    expect(reply.status).toBe(200)
    expect(reply.body).toEqual({ success: true, expired: 3 })
    expect(mockRpc).toHaveBeenCalledWith('expire_unpaid_bookings', { p_force: false })
  })

  it('reports a database failure as 500 without details', async () => {
    process.env.CRON_SECRET = 'right-secret'
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const reply = (await GET(request('Bearer right-secret'))) as unknown as Reply
    expect(reply.status).toBe(500)
    expect(reply.body).toEqual({ error: 'Expiry failed' })
  })
})
