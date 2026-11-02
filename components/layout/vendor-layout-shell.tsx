"use client"

import { usePathname } from "next/navigation"
import { VendorLayout } from "./vendor-layout"
import type { PortalLogo } from "@/lib/site-settings/logo"

const EXCLUDED_PATHS = ["/vendor/login"]

interface VendorLayoutShellProps {
  children: React.ReactNode
  logo?: PortalLogo
}

export function VendorLayoutShell({ children, logo }: VendorLayoutShellProps) {
  const pathname = usePathname()
  const shouldShowLayout = !EXCLUDED_PATHS.some(path => pathname.startsWith(path))

  if (!shouldShowLayout) return <>{children}</>
  return <VendorLayout logo={logo}>{children}</VendorLayout>
}
