import Link from 'next/link'
import { ArrowRight, CalendarCheck, Car, Settings, Store, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickAction {
  href: string
  title: string
  description: string
  icon: LucideIcon
}

// Same four destinations, in the same order, as before the tile redesign.
const QUICK_ACTIONS: QuickAction[] = [
  { href: '/admin/bookings', title: 'View All Bookings', description: 'Customer and business', icon: CalendarCheck },
  { href: '/admin/vendor-applications', title: 'Manage Vendors', description: 'Applications and partners', icon: Store },
  { href: '/admin/vehicles', title: 'Fleet Status', description: 'Vehicles and availability', icon: Car },
  { href: '/admin/settings', title: 'System Settings', description: 'General, theme, currency', icon: Settings },
]

export function QuickActionsCard() {
  return (
    <Card className="admin-card-hover">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        <CardDescription className="mt-0.5">Common admin tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5 p-5">
        {QUICK_ACTIONS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="admin-quick-tile">
            <span className="flex items-center justify-between">
              <span className="admin-quick-tile-icon">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <ArrowRight className="admin-quick-tile-arrow h-4 w-4 text-primary" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
