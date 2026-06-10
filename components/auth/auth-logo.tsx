import Link from "next/link"
import Image from "next/image"
import type { SiteSettingsConfig } from "@/lib/site-settings/types"
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/types"

interface AuthLogoProps {
  className?: string
  siteSettings?: SiteSettingsConfig
}

export function AuthLogo({ className, siteSettings }: AuthLogoProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS

  return (
    <Link
      href="/"
      className={`footer-logo text-2xl hover:opacity-80 transition-opacity ${className ?? ""}`}
    >
      {settings.header_logo_url ? (
        <Image
          src={settings.header_logo_url}
          alt={settings.brand_name}
          width={180}
          height={48}
          className="h-10 w-auto object-contain"
        />
      ) : (
        <>{settings.brand_name.includes(' ') ? (
          <>{settings.brand_name.split(' ').slice(0, -1).join(' ')} <span>{settings.brand_name.split(' ').pop()}</span></>
        ) : settings.brand_name}</>
      )}
    </Link>
  )
}
