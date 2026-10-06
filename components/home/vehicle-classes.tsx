import { getCachedVehicleClasses } from '@/lib/home/catalog'
import { VehicleClassesClient } from './vehicle-classes-client'
import type { SectionHeader } from '@/lib/cms/fields'

export async function VehicleClasses({ content }: { content: SectionHeader }) {
  // Fetch vehicle classes from database (Server Component)
  const categories = await getCachedVehicleClasses()

  // Pass data to Client Component for rendering with animations
  return <VehicleClassesClient categories={categories} content={content} />
}
