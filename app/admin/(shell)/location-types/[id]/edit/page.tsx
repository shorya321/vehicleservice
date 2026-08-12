import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocationTypeById } from '../../actions'
import { LocationTypeForm } from '../../components/location-type-form'

export const metadata: Metadata = {
  title: 'Edit Location Type | Admin',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditLocationTypePage({ params }: PageProps) {
  const { id } = await params
  const locationType = await getLocationTypeById(id)

  if (!locationType) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Location Type</h1>
        <p className="text-muted-foreground">
          Update {locationType.label} settings
        </p>
      </div>
      <LocationTypeForm initialData={locationType} />
    </div>
  )
}
