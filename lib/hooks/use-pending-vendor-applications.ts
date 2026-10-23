"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Number of vendor applications waiting for review, for the admin sidebar
 * badge. Re-counted on each navigation so approving one clears the badge by
 * the next page. RLS lets admins read every application; on any error the
 * badge just stays hidden (0).
 */
export function usePendingVendorApplications(): number {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    createClient()
      .from("vendor_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count: pending, error }) => {
        if (cancelled) return
        if (error) {
          console.error("[Sidebar] Pending vendor applications count failed:", error.message)
          return
        }
        setCount(pending ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  return count
}
