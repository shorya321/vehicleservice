"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, PanelLeftClose, PanelLeftOpen, X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { activeParentNames, type PortalNavCounts, type PortalNavGroup } from "@/lib/portal-sidebar/nav"
import type { PortalLogo } from "@/lib/site-settings/logo"
import { PortalNavItem } from "./portal-nav-item"

export interface PortalSidebarBrand {
  href: string
  subtitle: string
  icon: LucideIcon
}

interface PortalSidebarProps {
  groups: readonly PortalNavGroup[]
  brand: PortalSidebarBrand
  /** Wordmark shown in the brand row when expanded. Without it, the icon and name show. */
  logo?: PortalLogo
  rail: boolean
  canRail: boolean
  onToggleRail: () => void
  counts?: PortalNavCounts
  /** Mobile drawer close button (vendor). Hidden from the lg breakpoint up. */
  onClose?: () => void
}

const NO_COUNTS: PortalNavCounts = {}
const BRAND_NAME = "Infinia Transfers"

/** Both theme files render; CSS shows the one matching the admin theme class. */
function PortalSidebarLogo({ logo, subtitle }: { logo: PortalLogo; subtitle: string }) {
  return (
    <span className="psb-brand__logo-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin upload of unknown size, sized by CSS */}
      <img src={logo.light} alt="" className="psb-brand__logo psb-brand__logo--light" />
      {/* eslint-disable-next-line @next/next/no-img-element -- admin upload of unknown size, sized by CSS */}
      <img src={logo.dark} alt="" className="psb-brand__logo psb-brand__logo--dark" />
      <span className="psb-brand__sub">{subtitle}</span>
    </span>
  )
}

/** The admin and vendor sidebar: brand row, grouped navigation, footer. */
export function PortalSidebar({
  groups,
  brand,
  logo,
  rail,
  canRail,
  onToggleRail,
  counts = NO_COUNTS,
  onClose,
}: PortalSidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(() => activeParentNames(groups, pathname))
  // Re-open the parent of the current page on every navigation. Adjusting
  // state during render (not in an effect) is React's pattern for this.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setExpanded(activeParentNames(groups, pathname))
  }

  // Keep the current page's link visible in a long, scrolled nav.
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" })
  }, [pathname, rail])

  const toggle = (name: string) =>
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  const BrandIcon = brand.icon
  const RailIcon = rail ? PanelLeftOpen : PanelLeftClose

  return (
    <div className={cn("portal-sidebar psb", rail && "psb--rail")}>
      <div className="psb-brand">
        <Link href={brand.href} className="psb-brand__link" aria-label={`${BRAND_NAME} ${brand.subtitle} home`}>
          {logo && !rail ? (
            <PortalSidebarLogo logo={logo} subtitle={brand.subtitle} />
          ) : logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin upload of unknown size, sized by CSS
            <img src={logo.mark} alt="" className="psb-brand__railmark" />
          ) : (
            <>
              <span className="psb-brand__mark" aria-hidden="true">
                <BrandIcon className="h-[17px] w-[17px]" />
              </span>
              {rail ? null : (
                <span className="psb-brand__text">
                  <span className="psb-brand__name">{BRAND_NAME}</span>
                  <span className="psb-brand__sub">{brand.subtitle}</span>
                </span>
              )}
            </>
          )}
        </Link>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="psb-brand__close inline-flex lg:hidden">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav ref={navRef} aria-label="Main navigation" className="psb-nav">
        {groups.map((group) => (
          <div key={group.label} className="psb-group">
            {rail ? null : <p className="psb-group__label">{group.label}</p>}
            {group.items.map((item) => (
              <PortalNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                rail={rail}
                expanded={expanded.includes(item.name)}
                counts={counts}
                onToggle={toggle}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="psb-foot">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="psb-foot__row"
          aria-label={rail ? "View site (opens in a new tab)" : undefined}
          title={rail ? "View site" : undefined}
        >
          <ExternalLink className="psb-row__icon" aria-hidden="true" />
          {rail ? null : <span className="psb-row__label">View site</span>}
        </a>
        {canRail ? (
          <button
            type="button"
            onClick={onToggleRail}
            className="psb-foot__row"
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            title={rail ? "Expand sidebar" : undefined}
          >
            <RailIcon className="psb-row__icon" aria-hidden="true" />
            {rail ? null : <span className="psb-row__label">Collapse</span>}
          </button>
        ) : null}
      </div>
    </div>
  )
}
