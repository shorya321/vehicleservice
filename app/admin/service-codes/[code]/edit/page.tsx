import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServiceCodeByCode } from '../../actions'
import { ServiceCodeForm } from '../../components/service-code-form'

export const metadata: Metadata = {
  title: 'Edit Service Code | Admin',
}

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function EditServiceCodePage({ params }: PageProps) {
  const { code } = await params
  const serviceCode = await getServiceCodeByCode(code)

  if (!serviceCode) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Service Code: {serviceCode.code}
        </h1>
        <p className="text-muted-foreground">
          Modify service code details
        </p>
      </div>
      <ServiceCodeForm initialData={serviceCode} />
    </div>
  )
}
