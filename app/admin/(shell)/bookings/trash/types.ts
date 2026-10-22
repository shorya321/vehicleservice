/** One trip in the admin trash, already formatted for display in the operating timezone. */
export interface TrashedBookingRow {
  id: string
  source: 'customer' | 'business'
  tripLabel: string
  tripType: string
  customerName: string
  businessName: string | null
  legCount: number
  bookingStatus: string | null
  totalPrice: number | null
  fromQuotation: boolean
  pickupAt: string
  deletedAt: string
  deletedBy: string
  expiresAt: string
}
