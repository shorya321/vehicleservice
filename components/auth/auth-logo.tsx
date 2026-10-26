import Link from "next/link"
import type { SiteSettingsConfig } from "@/lib/site-settings/types"
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/types"
import { BrandLogo } from "@/components/layout/brand-logo"
import { builtInLogo, resolveSiteLogo } from "@/lib/site-settings/logo"

interface AuthLogoProps {
  className?: string
  siteSettings?: SiteSettingsConfig
  /** Stacked for centred form screens, horizontal beside the hero copy. */
  variant?: "stacked" | "horizontal"
}

export function AuthLogo({ className, siteSettings, variant = "stacked" }: AuthLogoProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS
  // An upload is used as is; the bundled artwork changes shape with the screen.
  const uploaded = resolveSiteLogo(settings, "header")
  const logo = uploaded.custom ? uploaded : builtInLogo(variant)
  const logoClass = logo.custom ? "h-10 max-w-[200px]" : variant === "stacked" ? "h-16" : "h-9"

  return (
    <Link
      href="/"
      className={`footer-logo text-2xl hover:opacity-80 transition-opacity ${className ?? ""}`}
    >
      <BrandLogo alt={settings.brand_name} logo={logo} className={logoClass} />
    </Link>
  )
}
