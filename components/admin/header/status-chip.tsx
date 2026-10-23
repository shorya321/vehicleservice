import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PortalStatus } from "@/lib/portal-header/controls"

interface StatusChipProps {
  status: PortalStatus | null
}

/** Rounded status pill in the header. Hidden below the sm breakpoint. */
export function StatusChip({ status }: StatusChipProps) {
  if (!status) return null

  return (
    <Link
      href={status.href}
      className={cn("hdr-chip hidden sm:inline-flex", `hdr-chip--${status.tone}`)}
    >
      <span className="hdr-chip__dot" aria-hidden="true" />
      {status.label}
    </Link>
  )
}
