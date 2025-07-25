"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { AdminVehicleFiltersComponent } from "./admin-vehicle-filters"
import { AdminVehicleFilters } from "../actions"

interface ClientFiltersProps {
  vendors: Array<{
    id: string
    business_name: string
    business_email: string
  }>
}

export function ClientFilters({ vendors }: ClientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters: AdminVehicleFilters = {
    search: searchParams.get('search') || undefined,
    vendorId: searchParams.get('vendorId') || 'all',
    categoryId: searchParams.get('categoryId') || 'all',
    status: (searchParams.get('status') as any) || 'all',
    fuelType: (searchParams.get('fuelType') as any) || 'all',
    transmission: (searchParams.get('transmission') as any) || 'all',
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    seats: searchParams.get('seats') ? parseInt(searchParams.get('seats')!) : undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
  }

  const handleFiltersChange = (newFilters: AdminVehicleFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.vendorId && newFilters.vendorId !== 'all') params.set('vendorId', newFilters.vendorId)
    if (newFilters.categoryId && newFilters.categoryId !== 'all') params.set('categoryId', newFilters.categoryId)
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status)
    if (newFilters.fuelType && newFilters.fuelType !== 'all') params.set('fuelType', newFilters.fuelType)
    if (newFilters.transmission && newFilters.transmission !== 'all') params.set('transmission', newFilters.transmission)
    if (newFilters.minPrice !== undefined) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice !== undefined) params.set('maxPrice', newFilters.maxPrice.toString())
    if (newFilters.seats !== undefined) params.set('seats', newFilters.seats.toString())
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString())
    
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : '/admin/vehicles')
  }

  return <AdminVehicleFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} vendors={vendors} />
}