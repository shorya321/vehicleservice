import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { BookingInvoicePDF, type BookingInvoiceLineItem } from '@/lib/pdf/generators/booking-invoice'
import { generatePDFBuffer, getPDFDownloadHeaders } from '@/lib/pdf/utils/pdf-generator'
import { formatAmount } from '@/lib/currency/format'
import { formatChildAges } from '@/lib/utils/child-ages'
import { BRAND_ADDRESS, BRAND_NAME } from '@/lib/email/config'
import { GROUP_NUMBER_PREFIX } from '@/lib/trips/constants'
import { legLabel } from '@/lib/trips/display'
import { jsx } from 'react/jsx-runtime'

type AdminClient = ReturnType<typeof createAdminClient>

interface InvoiceFormatters {
  toDisplay: (amountAed: number) => string
  showAedNote: boolean
  formatDate: (iso: string) => string
  formatDateTime: (iso: string) => string
  amenityLabels: Record<string, string>
}

/**
 * The group this reference belongs to: a `GR...` group number, or any journey's own
 * booking number. Null for an ordinary booking.
 */
export async function resolveInvoiceGroupId(adminClient: AdminClient, reference: string): Promise<string | null> {
  if (reference.startsWith(GROUP_NUMBER_PREFIX)) {
    const { data } = await adminClient.from('booking_groups').select('id').eq('group_number', reference).maybeSingle()
    return data?.id ?? null
  }
  const { data } = await adminClient.from('bookings').select('booking_group_id').eq('booking_number', reference).maybeSingle()
  return data?.booking_group_id ?? null
}

/**
 * One invoice for a round trip or multi-city trip: it was one payment, so it is one
 * invoice. A line per journey fare, the extras for every journey, the round-trip saving,
 * and the group total verbatim.
 */
export async function groupInvoiceResponse(
  adminClient: AdminClient,
  groupId: string,
  fmt: InvoiceFormatters
): Promise<Response | null> {
  const [{ data: group }, { data: legs }] = await Promise.all([
    adminClient
      .from('booking_groups')
      .select('group_number, trip_type, total_price, discount_amount, discount_percent, payment_status, payment_method_details, paid_at, created_at')
      .eq('id', groupId)
      .single(),
    adminClient
      .from('bookings')
      .select(`
        booking_number, trip_type, leg_index, pickup_address, dropoff_address, pickup_datetime,
        passenger_count, adults, children, infants, base_price,
        booking_passengers (first_name, last_name, email, phone, is_primary),
        booking_amenities (amenity_type, quantity, price, child_ages, addon:addons (name)),
        vehicle_type:vehicle_types (name)
      `)
      .eq('booking_group_id', groupId)
      .order('leg_index', { ascending: true }),
  ])

  if (!group || !legs || legs.length === 0) return null
  if (group.payment_status !== 'completed') {
    return Response.json({ error: 'Invoice not available for this booking' }, { status: 404 })
  }

  const lead = legs[0]
  const legCount = legs.length
  const primary = lead.booking_passengers?.find((p) => p.is_primary) ?? lead.booking_passengers?.[0]
  const vehicle = lead.vehicle_type as unknown as { name: string } | null

  const lineItems: BookingInvoiceLineItem[] = [
    ...legs.map((leg) => ({
      label: `${legLabel(leg, legCount) ?? 'Journey'} fare · ${leg.passenger_count} passenger${leg.passenger_count > 1 ? 's' : ''}`,
      quantity: 1,
      unitAmount: fmt.toDisplay(Number(leg.base_price)),
      amount: fmt.toDisplay(Number(leg.base_price)),
    })),
    ...legs.flatMap((leg) =>
      (leg.booking_amenities ?? []).map((amenity) => {
        const addon = amenity.addon as unknown as { name: string } | null
        const baseLabel =
          amenity.amenity_type === 'addon' && addon ? addon.name : fmt.amenityLabels[amenity.amenity_type] ?? amenity.amenity_type
        const quantity = Math.max(1, amenity.quantity ?? 1)
        return {
          label: `${baseLabel}${formatChildAges(amenity.child_ages)} (${legLabel(leg, legCount) ?? 'Journey'})`,
          quantity,
          unitAmount: fmt.toDisplay(Number(amenity.price) / quantity),
          amount: fmt.toDisplay(Number(amenity.price)),
        }
      })
    ),
    ...(Number(group.discount_amount) > 0
      ? [{
          label: `Round trip saving (${Number(group.discount_percent)}%)`,
          quantity: 1,
          unitAmount: `-${fmt.toDisplay(Number(group.discount_amount))}`,
          amount: `-${fmt.toDisplay(Number(group.discount_amount))}`,
        }]
      : []),
  ]

  const paymentDetails = group.payment_method_details as { type?: string } | null
  const issuedAt = group.paid_at ?? group.created_at ?? new Date().toISOString()

  const pdfData = {
    invoiceNumber: group.group_number,
    issuedDate: fmt.formatDate(issuedAt),
    paymentMethod: paymentDetails?.type
      ? paymentDetails.type.charAt(0).toUpperCase() + paymentDetails.type.slice(1)
      : undefined,
    companyName: BRAND_NAME,
    companyAddress: BRAND_ADDRESS,
    companyEmail: process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_FROM_EMAIL,
    customerName: primary ? `${primary.first_name} ${primary.last_name}` : 'Customer',
    customerEmail: primary?.email ?? undefined,
    customerPhone: primary?.phone ?? undefined,
    pickupAddress: lead.pickup_address,
    dropoffAddress: lead.dropoff_address,
    journeys: legs.map((leg) => ({
      label: legLabel(leg, legCount) ?? 'Journey',
      route: `${leg.pickup_address} to ${leg.dropoff_address}`,
      when: fmt.formatDateTime(leg.pickup_datetime),
    })),
    vehicleTypeName: vehicle?.name,
    passengerCount: lead.passenger_count,
    adults: lead.adults,
    children: lead.children,
    infants: lead.infants,
    lineItems,
    totalDisplay: fmt.toDisplay(Number(group.total_price)),
    totalAed: formatAmount(Number(group.total_price), 'AED'),
    showAedNote: fmt.showAedNote,
    generatedDate: fmt.formatDateTime(new Date().toISOString()),
  }

  const pdfBuffer = await generatePDFBuffer(jsx(BookingInvoicePDF, pdfData))
  const fileName = `invoice-${group.group_number.replace(/[^a-zA-Z0-9-]/g, '_')}`
  return new Response(new Uint8Array(pdfBuffer), { headers: getPDFDownloadHeaders(fileName) })
}
