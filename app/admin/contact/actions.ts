'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'
import { sendContactReplyEmail } from '@/lib/email/services/contact-emails'

export interface ContactSubmissionFilters {
  search?: string
  status?: string | 'all'
  priority?: string | 'all'
  page?: number
  limit?: number
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: string
  priority: string
  admin_notes: string | null
  replied_at: string | null
  replied_by: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedContactSubmissions {
  submissions: ContactSubmission[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ContactStats {
  total: number
  newCount: number
  repliedCount: number
  archivedCount: number
}

export async function getContactStats(): Promise<ContactStats> {
  await requireAdmin()
  const supabase = await createClient()

  const { count: total } = await supabase
    .from('contact_submissions')
    .select('*', { count: 'exact', head: true })

  const { count: newCount } = await supabase
    .from('contact_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  const { count: repliedCount } = await supabase
    .from('contact_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'replied')

  const { count: archivedCount } = await supabase
    .from('contact_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'archived')

  return {
    total: total || 0,
    newCount: newCount || 0,
    repliedCount: repliedCount || 0,
    archivedCount: archivedCount || 0,
  }
}

export async function getContactSubmissions(
  filters: ContactSubmissionFilters = {}
): Promise<PaginatedContactSubmissions> {
  await requireAdmin()
  const supabase = await createClient()

  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('contact_submissions')
    .select('*', { count: 'exact' })

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
    )
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[Contact Admin] Error fetching submissions:', error)
    throw new Error(error.message)
  }

  return {
    submissions: (data || []) as ContactSubmission[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getContactSubmission(
  id: string
): Promise<ContactSubmission | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Contact Admin] Error fetching submission:', error)
    return null
  }

  return data as ContactSubmission
}

export async function updateSubmissionStatus(id: string, status: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('contact_submissions')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[Contact Admin] Error updating status:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/contact')
  revalidatePath(`/admin/contact/${id}`)
}

export async function updateSubmissionPriority(id: string, priority: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('contact_submissions')
    .update({ priority })
    .eq('id', id)

  if (error) {
    console.error('[Contact Admin] Error updating priority:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/contact')
  revalidatePath(`/admin/contact/${id}`)
}

export async function addAdminNote(id: string, note: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('contact_submissions')
    .update({ admin_notes: note })
    .eq('id', id)

  if (error) {
    console.error('[Contact Admin] Error adding note:', error)
    throw new Error(error.message)
  }

  revalidatePath(`/admin/contact/${id}`)
}

export async function replyToSubmission(id: string, message: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  // Get submission details for the email
  const { data: submission, error: fetchError } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !submission) {
    throw new Error('Submission not found')
  }

  // Update status to replied
  const { error } = await supabase
    .from('contact_submissions')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
      replied_by: admin.id,
    })
    .eq('id', id)

  if (error) {
    console.error('[Contact Admin] Error updating reply status:', error)
    throw new Error(error.message)
  }

  // Send reply email
  try {
    await sendContactReplyEmail({
      email: submission.email,
      name: submission.name,
      replyMessage: message,
    })
  } catch (emailError) {
    console.error('[Contact Admin] Error sending reply email:', emailError)
    // Don't throw — the status is already updated
  }

  revalidatePath('/admin/contact')
  revalidatePath(`/admin/contact/${id}`)
}

export async function deleteSubmission(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('contact_submissions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Contact Admin] Error deleting submission:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/contact')
}
