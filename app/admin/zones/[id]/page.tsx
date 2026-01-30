import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/components/layout/admin-layout'
import { ZoneForm } from '../components/zone-form'
import { getZone } from '../actions'

export const metadata: Metadata = {
  title: 'Edit Zone | Admin',
  description: 'Edit pricing zone details',
}

interface EditZonePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditZonePage({ params }: EditZonePageProps) {
  const { id } = await params
  const zone = await getZone(id)

  if (!zone) {
    notFound()
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Edit Zone</h1>
            <p className="text-muted-foreground">
              Update zone details and settings
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <ZoneForm zone={zone} />
        </div>
      </div>
    </AdminLayout>
  )
}