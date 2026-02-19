"use client"

import { usePathname } from "next/navigation"
import { VendorLayout } from "./vendor-layout"

const EXCLUDED_PATHS = ["/vendor/login"]

export function VendorLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldShowLayout = !EXCLUDED_PATHS.some(path => pathname.startsWith(path))

  if (!shouldShowLayout) return <>{children}</>
  return <VendorLayout>{children}</VendorLayout>
}
