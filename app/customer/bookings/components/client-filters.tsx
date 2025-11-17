'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BookingFiltersComponent, BookingFilters } from '@/components/bookings/booking-filters'

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

    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status)
    } else {
      params.delete('status')
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      params.set('paymentStatus', filters.paymentStatus)
    } else {
      params.delete('paymentStatus')
    }

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom.toISOString())
    } else {
      params.delete('dateFrom')
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo.toISOString())
    } else {
      params.delete('dateTo')
    }

    if (filters.page) {
      params.set('page', filters.page.toString())
    } else {
      params.delete('page')
    }

    // Navigate with new params
    router.push(`/customer/bookings?${params.toString()}`)
  }

  return (
    <BookingFiltersComponent 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange}
    />
  )
}