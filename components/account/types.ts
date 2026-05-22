export interface AccountUser {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  phone: string | null
  date_of_birth: string | null
  address_street: string | null
  address_city: string | null
  address_country: string | null
  created_at: string
}

export function calculateCompletion(user: Pick<AccountUser, "full_name" | "phone" | "date_of_birth" | "address_street" | "address_city" | "address_country">): number {
  let score = 0
  if (user.full_name) score += 25
  if (user.phone) score += 25
  if (user.date_of_birth) score += 25
  if (user.address_street && user.address_city && user.address_country) score += 25
  return score
}

export interface BookingListItem {
  id: string
  booking_number: string
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  booking_status: string
  payment_status: string
  total_price: number
  currency: string
  vehicle_type?: { name: string; image_url?: string } | null
  booking_assignments?: Array<{
    status: string
    vendor?: { business_name: string } | null
    driver?: { first_name: string; last_name: string } | null
  }>
}

export interface ReviewListItem {
  id: string
  rating: number
  review_text: string | null
  status: string
  route_from: string | null
  route_to: string | null
  vehicle_class: string | null
  created_at: string
  booking_id: string
}

export interface NotificationListItem {
  id: string
  title: string
  message: string
  category: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, unknown>
}

export interface EligibleBooking {
  id: string
  booking_number: string
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  vehicle_types?: { name: string } | null
}
