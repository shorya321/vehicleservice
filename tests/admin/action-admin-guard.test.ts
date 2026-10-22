/**
 * Every exported Server Action in the zones and businesses admin modules checks
 * the caller is an admin before it touches the database.
 *
 * Until now these leaned on proxy.ts alone: Next forwards an action POST to the
 * page that owns it, and that internal request meets the /admin role gate. That
 * is one layer. The businesses actions run on the service-role client, which
 * ignores RLS, so if anything ever reached them without passing the proxy (an
 * action bundled into a non-admin page, a proxy exemption) they would approve,
 * suspend or delete accounts for anyone. These tests pin the second layer.
 *
 * What is pinned, per action:
 * 1. A refused caller gets the module's usual error shape back, so the existing
 *    toasts show it, and no query or helper runs.
 * 2. An admin still reaches the database (the guard does not block real use).
 */

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const requireAdminAction = jest.fn()
jest.mock('@/lib/auth/admin-action', () => ({ requireAdminAction: () => requireAdminAction() }))

/** A chainable query stub: every builder call returns itself, awaiting it yields an empty result. */
const fromCalls: string[] = []
function makeClient() {
  const result = { data: null, error: null, count: 0 }
  const builder: Record<string, unknown> = {}
  const chain = new Proxy(builder, {
    get(_target, prop) {
      if (prop === 'then') return (resolve: (v: typeof result) => unknown) => resolve(result)
      return () => chain
    },
  })
  return {
    from: (table: string) => {
      fromCalls.push(table)
      return chain
    },
    auth: { admin: { deleteUser: jest.fn() } },
  }
}

jest.mock('@/lib/supabase/server', () => ({ createClient: async () => makeClient() }))
jest.mock('@supabase/supabase-js', () => ({ createClient: () => makeClient() }))
jest.mock('@/lib/vercel/api', () => ({ removeDomainFromVercel: jest.fn(), isVercelConfigured: () => false }))
jest.mock('@/lib/stripe/server', () => ({ stripe: null }))

const approveBusinessAccount = jest.fn()
const rejectBusinessAccount = jest.fn()
jest.mock('@/lib/business/admin/account-status', () => ({
  approveBusinessAccount: (id: string) => approveBusinessAccount(id),
  rejectBusinessAccount: (id: string) => rejectBusinessAccount(id),
}))

import * as zones from '@/app/admin/(shell)/zones/actions'
import * as zoneLocations from '@/app/admin/(shell)/zones/[id]/locations/actions'
import * as businesses from '@/app/admin/(shell)/businesses/actions'

const ID = '00000000-0000-0000-0000-000000000001'
const DENIED = 'Only admins can do that.'

function zoneForm(): FormData {
  const fd = new FormData()
  fd.set('name', 'Zone')
  fd.set('slug', 'zone')
  fd.set('sort_order', '1')
  fd.set('is_active', 'true')
  return fd
}

type Case = {
  name: string
  run: () => Promise<unknown>
  /** What a refused caller gets back. */
  refused: unknown
}

const writes: Case[] = [
  { name: 'zones.createZone', run: () => zones.createZone(zoneForm()), refused: { error: DENIED } },
  { name: 'zones.updateZone', run: () => zones.updateZone(ID, zoneForm()), refused: { error: DENIED } },
  { name: 'zones.deleteZone', run: () => zones.deleteZone(ID), refused: { error: DENIED } },
  { name: 'zones.updateZonePricing', run: () => zones.updateZonePricing(ID, ID, 100), refused: { error: DENIED } },
  { name: 'zones.toggleZoneStatus', run: () => zones.toggleZoneStatus(ID, true), refused: { error: DENIED } },
  { name: 'zones.bulkDeleteZones', run: () => zones.bulkDeleteZones([ID]), refused: { error: DENIED } },
  { name: 'zones.bulkToggleZoneStatus', run: () => zones.bulkToggleZoneStatus([ID], true), refused: { error: DENIED } },
  { name: 'zoneLocations.assignLocationToZone', run: () => zoneLocations.assignLocationToZone(ID, ID), refused: { error: DENIED } },
  { name: 'zoneLocations.bulkAssignLocationsToZone', run: () => zoneLocations.bulkAssignLocationsToZone([ID], ID), refused: { error: DENIED } },
  { name: 'businesses.quickApproveBusinessAction', run: () => businesses.quickApproveBusinessAction(ID), refused: { success: false, error: DENIED } },
  { name: 'businesses.quickRejectBusinessAction', run: () => businesses.quickRejectBusinessAction(ID), refused: { success: false, error: DENIED } },
  { name: 'businesses.quickSuspendBusinessAction', run: () => businesses.quickSuspendBusinessAction(ID), refused: { success: false, error: DENIED } },
  { name: 'businesses.quickReactivateBusinessAction', run: () => businesses.quickReactivateBusinessAction(ID), refused: { success: false, error: DENIED } },
  { name: 'businesses.bulkApproveBusinessesAction', run: () => businesses.bulkApproveBusinessesAction([ID]), refused: { success: false, error: DENIED } },
  { name: 'businesses.bulkSuspendBusinessesAction', run: () => businesses.bulkSuspendBusinessesAction([ID]), refused: { success: false, error: DENIED } },
  { name: 'businesses.bulkReactivateBusinessesAction', run: () => businesses.bulkReactivateBusinessesAction([ID]), refused: { success: false, error: DENIED } },
  { name: 'businesses.deleteBusinessAction', run: () => businesses.deleteBusinessAction(ID), refused: { success: false, error: DENIED } },
  { name: 'businesses.bulkDeleteBusinessesAction', run: () => businesses.bulkDeleteBusinessesAction([ID, ID]), refused: { success: false, error: DENIED } },
]

/** Reads are rendered by admin pages; a refused caller gets the same empty result a query error gives. */
const reads: Case[] = [
  { name: 'zones.getZones', run: () => zones.getZones({ page: 2 }), refused: { zones: [], total: 0, page: 2, limit: 10, totalPages: 0 } },
  { name: 'zones.getZone', run: () => zones.getZone(ID), refused: null },
  { name: 'zones.getZonePricing', run: () => zones.getZonePricing(), refused: [] },
  { name: 'zoneLocations.getLocationsWithZones', run: () => zoneLocations.getLocationsWithZones({ page: 3 }), refused: { locations: [], total: 0, page: 3, limit: 10, totalPages: 0 } },
]

beforeEach(() => {
  fromCalls.length = 0
  requireAdminAction.mockReset()
  approveBusinessAccount.mockReset().mockResolvedValue({ success: true, emailDelivered: true })
  rejectBusinessAccount.mockReset().mockResolvedValue({ success: true, emailDelivered: true })
})

describe.each([...writes, ...reads])('$name', ({ run, refused }) => {
  it('refuses a non-admin before any query or helper runs', async () => {
    requireAdminAction.mockResolvedValue({ error: DENIED })

    await expect(run()).resolves.toEqual(refused)
    expect(fromCalls).toEqual([])
    expect(approveBusinessAccount).not.toHaveBeenCalled()
    expect(rejectBusinessAccount).not.toHaveBeenCalled()
  })

  it('lets an admin through to the database', async () => {
    requireAdminAction.mockResolvedValue({ userId: 'admin-1' })

    // The stub answers every query with no row and no error, which a real
    // `.single()` never does, so a read may throw afterwards. Only reaching
    // the database matters here.
    await run().catch(() => undefined)
    const reached = fromCalls.length > 0 || approveBusinessAccount.mock.calls.length > 0 || rejectBusinessAccount.mock.calls.length > 0
    expect(reached).toBe(true)
  })
})

it('bulk delete checks the caller once, not once per business', async () => {
  requireAdminAction.mockResolvedValue({ userId: 'admin-1' })

  await businesses.bulkDeleteBusinessesAction([ID, ID, ID])
  expect(requireAdminAction).toHaveBeenCalledTimes(1)
})
