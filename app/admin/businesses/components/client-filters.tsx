'use client';

/**
 * Client Filters Wrapper
 * Manages URL search params for business filters
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { BusinessFilters, BusinessFilters as BusinessFiltersComponent } from './business-filters';

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFilters: BusinessFilters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    domainVerified: searchParams.get('domainVerified') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: 10,
  };

  const handleFiltersChange = (newFilters: BusinessFilters) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.domainVerified) params.set('domainVerified', newFilters.domainVerified);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());

    const queryString = params.toString();
    router.push(`/admin/businesses${queryString ? `?${queryString}` : ''}`);
  };

  return <BusinessFiltersComponent filters={currentFilters} onFiltersChange={handleFiltersChange} />;
}
