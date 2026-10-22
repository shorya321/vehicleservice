import { Metadata } from 'next'
import { Building2, Route, Trash2, User } from 'lucide-react'
import { StatCard } from '@/components/admin/ui/stat-card'
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

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Deleted Trips"
          value={rows.length}
          hint="Restorable for 30 days"
          icon={Trash2}
          tone={{ disc: 'bg-red-500/20', icon: 'text-red-500', value: 'text-red-700 dark:text-red-400' }}
          delay={0.1}
        />
        <StatCard
          label="Customer"
          value={rows.filter((row) => row.source === 'customer').length}
          hint="Customer bookings"
          icon={User}
          tone={{ disc: 'bg-primary/20', icon: 'text-primary', value: 'text-sky-700 dark:text-sky-400' }}
          delay={0.2}
        />
        <StatCard
          label="Business"
          value={rows.filter((row) => row.source === 'business').length}
          hint="Business portal bookings"
          icon={Building2}
          tone={{ disc: 'bg-amber-500/20', icon: 'text-amber-500', value: 'text-amber-700 dark:text-amber-400' }}
          delay={0.3}
        />
        <StatCard
          label="Journeys"
          value={rows.reduce((sum, row) => sum + row.legCount, 0)}
          hint="Legs across all trips"
          icon={Route}
          tone={{ disc: 'bg-emerald-500/20', icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' }}
          delay={0.4}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-card p-6 text-sm text-destructive">{error}</div>
      ) : (
        <TrashTable rows={rows} />
      )}
    </AnimatedPage>
  )
}
