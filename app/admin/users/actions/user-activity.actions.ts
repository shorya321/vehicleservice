"use server"

import { createClient } from "@/lib/supabase/server"

export async function logUserActivity(
  userId: string,
  action: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (error) {
      console.error('Failed to log activity:', error)
    }
  } catch (error) {
    console.error('Log activity error:', error)
  }
}

export async function getUserActivityLogs(userId: string) {
  const supabase = await createClient()
  
  const { data: logs, error } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching activity logs:', error)
    return []
  }

  return logs || []
}