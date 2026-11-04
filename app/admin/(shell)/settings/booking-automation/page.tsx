import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { getBookingAutomationStatus } from '@/lib/bookings/automation-status'
import { BookingAutomationForm } from './components/booking-automation-form'

export const metadata: Metadata = {
  title: 'Booking Automation | Admin Portal',
  description: 'Automatically close customer checkouts that were never paid',
}

export const dynamic = 'force-dynamic'

export default async function BookingAutomationPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized')
  }

  const status = await getBookingAutomationStatus()

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Booking automation' }]} />
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Booking Automation</h1>
          <p className="text-muted-foreground">
            A customer booking is saved when they reach the payment page. If they leave without paying, it is closed
            automatically after the time below. The customer is not notified and nothing is charged.
          </p>
        </div>
        <BookingAutomationForm status={status} />
      </div>
    </AnimatedPage>
  )
}
