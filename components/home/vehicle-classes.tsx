import { getCachedVehicleClasses } from '@/lib/home/catalog'
import { VehicleClassesClient } from './vehicle-classes-client'

export async function VehicleClasses() {
  // Fetch vehicle classes from database (Server Component)
  const categories = await getCachedVehicleClasses()

  // Pass data to Client Component for rendering with animations
  return <VehicleClassesClient categories={categories} />
}
