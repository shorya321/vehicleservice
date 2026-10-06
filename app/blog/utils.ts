import { getBookingTimezone } from '@/lib/utils/timezone'

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    timeZone: getBookingTimezone(),
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
