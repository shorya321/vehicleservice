/**
 * The resubmit path, at the boundary the applicant can actually reach.
 *
 * Rejection used to be terminal: six guards stacked up and the rejection email's
 * "Submit New Application" button led to a redirect loop. What this pins is the three
 * ways the new path could quietly go wrong instead.
 *
 * 1. A status other than rejected must be refused. Nothing else stops an applicant who
 *    hand-rolls the request from resubmitting an application already in review, or from
 *    reopening an approved one.
 * 2. A lapsed document must be refused. The edit path deliberately tolerates an expiry in
 *    the past, because there the row is already in review. A resubmission is a fresh
 *    submission and the create schema's future-date checks have to apply.
 * 3. A zero-row update must be reported as a failure. PostgREST does not error when RLS
 *    blocks a write, so without the explicit check the applicant is told their
 *    application went back into the queue when it did not.
 *
 * The supabase client and the mail senders are mocked. The senders' transport and props
 * are pinned elsewhere, and what matters here is which branch the action takes.
 */

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('next/server', () => ({ after: jest.fn() }))
jest.mock('@/lib/email/config', () => ({
  getAdminEmail: jest.fn(() => 'admin@example.com'),
  getAppUrl: jest.fn(() => 'https://example.com'),
}))
jest.mock('@/lib/email/services/admin-emails', () => ({
  sendNewVendorApplicationNotificationEmail: jest.fn(),
}))
jest.mock('@/lib/email/services/vendor-emails', () => ({
  sendVendorApplicationReceivedEmail: jest.fn(),
}))

const createClient = jest.fn()
jest.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }))

import { resubmitVendorApplication } from '@/app/vendor-application/actions'
import type { VendorApplicationFormData } from '@/app/vendor-application/schemas'

const APPLICATION_ID = 'application-1'
const USER_ID = 'user-1'

/** A year out, so the create schema's future-date checks pass whenever this runs. */
const futureDate = (): string => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

const values = (overrides: Partial<VendorApplicationFormData> = {}): VendorApplicationFormData => ({
  businessName: 'Fanatic Coders',
  businessEmail: 'owner@fanaticcoders.com',
  businessPhone: '+971 50 123 4567',
  businessAddress: '123 Main Street',
  businessCity: 'Dubai',
  businessCountryCode: 'AE',
  businessDescription: '',
  registrationNumber: '123456789',
  tradeLicenseNumber: 'TL-1',
  tradeLicenseExpiry: futureDate(),
  insurancePolicyNumber: 'INS-1',
  insuranceExpiry: futureDate(),
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  iban: '',
  swiftCode: '',
  ...overrides,
})

/**
 * Enough of the PostgREST builder to run the action: one read of the application row and
 * one update. `updatedRows` is what the update's `.select("id")` resolves to.
 */
function stubClient({
  status,
  updatedRows = [{ id: APPLICATION_ID }],
}: {
  status: string
  updatedRows?: { id: string }[] | null
}) {
  const update = jest.fn()

  const client = {
    auth: { getUser: jest.fn(async () => ({ data: { user: { id: USER_ID, email: 'a@b.com' } } })) },
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({ single: async () => ({ data: { full_name: 'Owner', email: 'a@b.com' } }) }),
          }),
        }
      }

      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: USER_ID, status }, error: null }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          update(payload)
          return {
            eq: () => ({
              eq: () => ({
                select: async () => ({ data: updatedRows, error: null }),
              }),
            }),
          }
        },
      }
    }),
  }

  createClient.mockResolvedValue(client)
  return { update }
}

describe('resubmitVendorApplication', () => {
  it('puts a rejected application back into the queue', async () => {
    const { update } = stubClient({ status: 'rejected' })

    const result = await resubmitVendorApplication(APPLICATION_ID, values())

    expect(result).toEqual({})
    expect(update).toHaveBeenCalledTimes(1)

    const payload = update.mock.calls[0][0]
    expect(payload.status).toBe('pending')
    expect(payload.business_name).toBe('Fanatic Coders')
    // The BEFORE UPDATE trigger owns the decision columns. Writing them here would let a
    // resubmission silently overwrite the archive.
    expect(payload).not.toHaveProperty('rejection_reason')
    expect(payload).not.toHaveProperty('reviewed_at')
    expect(payload).not.toHaveProperty('reviewed_by')
    expect(payload).not.toHaveProperty('admin_notes')
  })

  it.each(['pending', 'approved'])('refuses to resubmit a %s application', async (status) => {
    const { update } = stubClient({ status })

    const result = await resubmitVendorApplication(APPLICATION_ID, values())

    expect(result.error).toBe('Only a declined application can be resubmitted')
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses a document that has lapsed since the decision', async () => {
    const { update } = stubClient({ status: 'rejected' })

    const result = await resubmitVendorApplication(
      APPLICATION_ID,
      values({ tradeLicenseExpiry: '2020-01-01' })
    )

    expect(result.error).toBe('Please check the form and try again')
    expect(update).not.toHaveBeenCalled()
  })

  it('reports a zero-row update as a failure rather than a success', async () => {
    stubClient({ status: 'rejected', updatedRows: [] })

    const result = await resubmitVendorApplication(APPLICATION_ID, values())

    expect(result.error).toBe(
      'Your application could not be resubmitted. Please refresh and try again.'
    )
  })

  it('refuses an application belonging to somebody else', async () => {
    const { update } = stubClient({ status: 'rejected' })
    const client = await createClient()
    client.from = jest.fn(() => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { user_id: 'someone-else', status: 'rejected' }, error: null }),
        }),
      }),
    }))

    const result = await resubmitVendorApplication(APPLICATION_ID, values())

    expect(result.error).toBe('Unauthorized')
    expect(update).not.toHaveBeenCalled()
  })
})
