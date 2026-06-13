'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface ServiceCodeFilters {
  search?: string
  serviceType?: string | 'all'
  isActive?: boolean | 'all'
  page?: number
  limit?: number
}

export interface ServiceCode {
  code: string
  description: string
  service_type: string
  is_active: boolean | null
  created_at: string | null
}

export interface PaginatedServiceCodes {
  serviceCodes: ServiceCode[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ServiceCodeStats {
  total: number
  active: number
  inactive: number
  serviceTypes: { type: string; count: number }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export async function getServiceCodes(
  filters: ServiceCodeFilters = {}
): Promise<PaginatedServiceCodes> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const page = filters.page || 1
  const limit = filters.limit || 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('service_codes')
    .select('*', { count: 'exact' })

  if (filters.search) {
    query = query.or(
      `code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  if (filters.serviceType && filters.serviceType !== 'all') {
    query = query.eq('service_type', filters.serviceType)
  }

  if (filters.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('is_active', filters.isActive)
  }

  const { data, error, count } = await query
    .order('service_type')
    .order('code')
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    serviceCodes: (data || []) as ServiceCode[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getServiceCodeStats(): Promise<ServiceCodeStats> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { data, error } = await supabase
    .from('service_codes')
    .select('code, service_type, is_active')

  if (error) throw new Error(error.message)

  const codes = (data || []) as ServiceCode[]
  const active = codes.filter((c) => c.is_active === true).length
  const typeMap = new Map<string, number>()
  for (const c of codes) {
    typeMap.set(c.service_type, (typeMap.get(c.service_type) || 0) + 1)
  }

  return {
    total: codes.length,
    active,
    inactive: codes.length - active,
    serviceTypes: Array.from(typeMap, ([type, count]) => ({ type, count })),
  }
}

export async function getServiceCodeByCode(
  code: string
): Promise<ServiceCode | null> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { data, error } = await supabase
    .from('service_codes')
    .select('*')
    .eq('code', code)
    .single()

  if (error) return null
  return data as ServiceCode
}

export async function createServiceCode(input: {
  code: string
  description: string
  service_type: string
  is_active: boolean
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { error } = await supabase.from('service_codes').insert({
    code: input.code.toUpperCase(),
    description: input.description,
    service_type: input.service_type,
    is_active: input.is_active,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `Code "${input.code}" already exists` }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/service-codes')
  return { success: true }
}

export async function updateServiceCode(
  code: string,
  input: {
    description: string
    service_type: string
    is_active: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { error } = await supabase
    .from('service_codes')
    .update({
      description: input.description,
      service_type: input.service_type,
      is_active: input.is_active,
    })
    .eq('code', code)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/service-codes')
  return { success: true }
}

export async function toggleServiceCodeStatus(
  code: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { error } = await supabase
    .from('service_codes')
    .update({ is_active: isActive })
    .eq('code', code)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/service-codes')
  return { success: true }
}

export async function deleteServiceCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { count } = await supabase
    .from('trip_number_counters')
    .select('*', { count: 'exact', head: true })
    .eq('service_code', code)

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete — code "${code}" is used by ${count} trip number sequence(s). Deactivate instead.`,
    }
  }

  const { error } = await supabase
    .from('service_codes')
    .delete()
    .eq('code', code)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/service-codes')
  return { success: true }
}
