import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ZoneForm } from '../components/zone-form'
import { getZone } from '../actions'
import { requireAdmin } from '@/lib/auth/actions'

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
  await requireAdmin()

  const { id } = await params
  const zone = await getZone(id)

  if (!zone) {
    notFound()
  }

  return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/zones">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle>Edit Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ZoneForm zone={zone} />
          </CardContent>
        </Card>
      </div>
  )
}