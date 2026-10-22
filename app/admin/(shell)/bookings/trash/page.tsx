import { Metadata } from 'next'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { AnimatedPage } from '@/components/layout/animated-page'
import { getTrashedBookings } from './actions'
import { TrashTable } from './components/trash-table'

export const metadata: Metadata = {
  title: 'Deleted Bookings - Admin',
  description: 'Restore or permanently remove deleted bookings',
}

export default async function BookingsTrashPage(): Promise<React.JSX.Element> {
  const { rows, error } = await getTrashedBookings()

  return (
    <AnimatedPage>
      <Breadcrumb
        items={[
          { label: 'Bookings', href: '/admin/bookings' },
          { label: 'Trash', href: '/admin/bookings/trash' },
        ]}
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Deleted Bookings</h1>
        <p className="text-muted-foreground">
          Deleted trips stay here for 30 days and can be restored with the same booking and trip
          numbers. Vendor assignments are not restored.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-card p-6 text-sm text-destructive">{error}</div>
      ) : (
        <TrashTable rows={rows} />
      )}
    </AnimatedPage>
  )
}
