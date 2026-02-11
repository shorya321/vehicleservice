"use client"

import { usePathname } from "next/navigation"
import { AdminLayout } from "./admin-layout"

const EXCLUDED_PATHS = ["/admin/login"]

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldShowLayout = !EXCLUDED_PATHS.some(path => pathname.startsWith(path))

  if (!shouldShowLayout) return <>{children}</>
  return <AdminLayout>{children}</AdminLayout>
}
