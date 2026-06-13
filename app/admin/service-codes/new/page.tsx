import type { Metadata } from 'next'
import { ServiceCodeForm } from '../components/service-code-form'

export const metadata: Metadata = {
  title: 'New Service Code | Admin',
}

export default function NewServiceCodePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Service Code
        </h1>
        <p className="text-muted-foreground">
          Add a new trip number service code
        </p>
      </div>
      <ServiceCodeForm />
    </div>
  )
}
