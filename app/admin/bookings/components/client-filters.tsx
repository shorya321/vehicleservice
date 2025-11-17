'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BookingFiltersComponent } from './booking-filters'
import { BookingFilters } from '../actions'

interface ClientFiltersProps {
  initialFilters: BookingFilters
}

export function ClientFilters({ initialFilters }: ClientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFiltersChange = (filters: BookingFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update search params
    if (filters.search) {
      params.set('search', filters.search)
    } else {
      params.delete('search')
    }

    if (filters.status) {
      params.set('status', filters.status)
    } else {
      params.delete('status')
    }

    if (filters.paymentStatus) {
      params.set('paymentStatus', filters.paymentStatus)
    } else {
      params.delete('paymentStatus')
    }

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom)
    } else {
      params.delete('dateFrom')
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo)
    } else {
      params.delete('dateTo')
    }

    if (filters.vehicleTypeId) {
      params.set('vehicleTypeId', filters.vehicleTypeId)
    } else {
      params.delete('vehicleTypeId')
    }

    if (filters.customerId) {
      params.set('customerId', filters.customerId)
    } else {
      params.delete('customerId')
    }

    if (filters.bookingType && filters.bookingType !== 'all') {
      params.set('bookingType', filters.bookingType)
    } else {
      params.delete('bookingType')
    }

    if (filters.page) {
      params.set('page', filters.page.toString())
    } else {
      params.delete('page')
    }

    // Navigate with new params
    router.push(`/admin/bookings?${params.toString()}`)
  }

  return (
    <BookingFiltersComponent 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange}
    />
  )
}