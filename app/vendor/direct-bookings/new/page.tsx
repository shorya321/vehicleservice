import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireVendor } from '@/lib/auth/user-actions'
import { createClient } from '@/lib/supabase/server'
import { getVendorFleetOptions } from '../actions'
import { DirectBookingForm } from '../components/direct-booking-form'

export const metadata: Metadata = {
  title: 'New Offline Booking - Vendor Portal',
  description: 'Record a booking taken offline from a customer',
}

export default async function NewDirectBookingPage() {
  const user = await requireVendor()
  const supabase = await createClient()

  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendorApplication || vendorApplication.status !== 'approved') {
    redirect('/vendor/profile')
  }

  const fleet = await getVendorFleetOptions(vendorApplication.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/direct-bookings">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to offline bookings</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Offline Booking</h1>
          <p className="text-muted-foreground">
            Record a booking a customer made with you offline
          </p>
        </div>
      </div>

      <DirectBookingForm fleet={fleet} mode="create" />
    </div>
  )
}
