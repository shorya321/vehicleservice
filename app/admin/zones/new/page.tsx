import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/components/layout/admin-layout'
import { ZoneForm } from '../components/zone-form'

export const metadata: Metadata = {
  title: 'New Zone | Admin',
  description: 'Create a new pricing zone',
}

export default function NewZonePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/zones">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Zone</h1>
            <p className="text-muted-foreground">
              Add a new pricing zone to the system
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ZoneForm />
        </div>
      </div>
    </AdminLayout>
  )
}