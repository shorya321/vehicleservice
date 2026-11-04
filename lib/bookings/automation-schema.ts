import { z } from 'zod'
import { UNPAID_EXPIRY_MAX_MINUTES, UNPAID_EXPIRY_MIN_MINUTES } from './unpaid-expiry'

/** Admin form for Settings → Booking automation. */
export const bookingAutomationSchema = z.object({
  enabled: z.boolean(),
  minutes: z.coerce
    .number({ message: 'Enter a number of minutes' })
    .int('Use whole minutes')
    .min(UNPAID_EXPIRY_MIN_MINUTES, `At least ${UNPAID_EXPIRY_MIN_MINUTES} minutes`)
    .max(UNPAID_EXPIRY_MAX_MINUTES, `At most ${UNPAID_EXPIRY_MAX_MINUTES} minutes (24 hours)`),
})

export type BookingAutomationValues = z.infer<typeof bookingAutomationSchema>
