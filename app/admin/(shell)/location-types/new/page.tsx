import type { Metadata } from 'next'
import { LocationTypeForm } from '../components/location-type-form'

export const metadata: Metadata = {
  title: 'New Location Type | Admin',
}

export default function NewLocationTypePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Location Type</h1>
        <p className="text-muted-foreground">
          Add a new location type category
        </p>
      </div>
      <LocationTypeForm />
    </div>
  )
}
