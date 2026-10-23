"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  countLabel,
  isItemActive,
  matchesPath,
  submenuHasCount,
  type PortalNavCounts,
  type PortalNavItem,
} from "@/lib/portal-sidebar/nav"

interface PortalNavItemProps {
  item: PortalNavItem
  pathname: string
  rail: boolean
  expanded: boolean
  counts: PortalNavCounts
  onToggle: (name: string) => void
}

/**
 * One sidebar row. A submenu parent is a toggle button with its children
 * indented on a guide line; in the collapsed rail it becomes a plain link to
 * its own page, as before, since there is no room to open it.
 */
export function PortalNavItem({ item, pathname, rail, expanded, counts, onToggle }: PortalNavItemProps) {
  const Icon = item.icon
  const active = isItemActive(pathname, item)
  const hasSubmenu = Boolean(item.submenu?.length)
  const childCount = hasSubmenu && submenuHasCount(item, counts)
  const ownCount = hasSubmenu ? null : countLabel(counts[item.href])
  const railDot = rail && (childCount || ownCount !== null)

  if (hasSubmenu && !rail) {
    const open = expanded
    return (
      <div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onToggle(item.name)}
          className={cn("psb-row", active && "psb-row--parent-on")}
        >
          <Icon className="psb-row__icon" aria-hidden="true" />
          <span className="psb-row__label">{item.name}</span>
          {childCount && !open ? <span className="psb-row__dot" aria-hidden="true" /> : null}
          <ChevronDown className={cn("psb-row__chev", open && "psb-row__chev--up")} aria-hidden="true" />
        </button>
        {open ? (
          <div className="psb-subs">
            {item.submenu?.map((sub) => {
              const subActive = matchesPath(pathname, sub.href)
              const subCount = countLabel(counts[sub.href])
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  aria-current={subActive ? "page" : undefined}
                  className={cn("psb-sub", subActive && "psb-sub--on")}
                >
                  <span className="psb-row__label">{sub.name}</span>
                  {subCount ? <span className="psb-count">{subCount}</span> : null}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      aria-current={active && !hasSubmenu ? "page" : undefined}
      aria-label={rail ? item.name : undefined}
      title={rail ? item.name : undefined}
      className={cn("psb-row", active && "psb-row--on")}
    >
      <Icon className="psb-row__icon" aria-hidden="true" />
      {rail ? null : <span className="psb-row__label">{item.name}</span>}
      {!rail && ownCount ? <span className="psb-count">{ownCount}</span> : null}
      {railDot ? <span className="psb-row__rail-dot" aria-hidden="true" /> : null}
    </Link>
  )
}
