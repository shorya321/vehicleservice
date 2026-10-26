import * as React from "react"
import Image from "next/image"
import type { ResolvedLogo } from "@/lib/site-settings/logo"

interface BrandLogoProps {
  alt: string
  /** From `resolveSiteLogo` or `builtInLogo` in `lib/site-settings/logo.ts`. */
  logo: ResolvedLogo
  /** Height and any sizing utilities, applied to both images. */
  className?: string
  priority?: boolean
}

/**
 * Both theme variants render and CSS picks one (`dark:` on the html class
 * next-themes sets), so there is no theme flash and no hydration branch. When
 * the admin uploaded a single file, both images point at it.
 */
export function BrandLogo({ alt, logo, className = "h-9", priority = false }: BrandLogoProps): React.JSX.Element {
  const shared = { width: logo.width, height: logo.height, priority }
  const fit = logo.custom ? "object-contain" : ""

  if (logo.light === logo.dark) {
    return <Image {...shared} alt={alt} src={logo.light} className={`w-auto ${fit} ${className}`} />
  }

  return (
    <span className="inline-flex align-middle">
      <Image {...shared} alt={alt} src={logo.light} className={`w-auto ${fit} dark:hidden ${className}`} />
      <Image {...shared} alt={alt} src={logo.dark} className={`hidden w-auto ${fit} dark:block ${className}`} />
    </span>
  )
}
