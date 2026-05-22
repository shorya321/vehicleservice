"use client"

import { useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { NAV_ITEMS, type TabId } from "./account-nav"
import { calculateCompletion } from "./types"

interface AccountMobileHeaderProps {
  user: {
    full_name: string | null
    email: string
    avatar_url: string | null
    phone: string | null
    date_of_birth: string | null
    address_street: string | null
    address_city: string | null
    address_country: string | null
  }
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  unreadNotifications: number
}

export function AccountMobileHeader({ user, activeTab, onTabChange, unreadNotifications }: AccountMobileHeaderProps) {
  const completion = calculateCompletion(user)
  const pillContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = pillContainerRef.current
    if (!container) return
    const activeButton = container.querySelector('[aria-selected="true"]') as HTMLElement
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeTab])

  const handlePillKeyDown = useCallback((e: React.KeyboardEvent) => {
    const container = pillContainerRef.current
    if (!container) return
    const buttons = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLElement[]
    const currentIndex = buttons.findIndex((b) => b === document.activeElement)

    let nextIndex = -1
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length
    else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
    else if (e.key === "Home") nextIndex = 0
    else if (e.key === "End") nextIndex = buttons.length - 1

    if (nextIndex >= 0) {
      e.preventDefault()
      buttons[nextIndex].focus()
    }
  }, [])

  return (
    <div className="lg:hidden">
      {/* Compact Profile Row */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-11 h-11 rounded-full bg-[var(--charcoal)] flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name || "User"}
              width={44}
              height={44}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-sm font-medium text-[var(--gold-text)]">
              {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-[1.125rem] font-medium text-[var(--text-primary)] truncate flex-1">
          {user.full_name || "Welcome"}
        </p>
        <span className="text-xs font-medium text-[var(--gold-text)] tabular-nums flex-shrink-0">{completion}%</span>
      </div>

      {/* Pill Navigation */}
      <div className="account-pill-bar" role="tablist" aria-label="Account sections" onKeyDown={handlePillKeyDown}>
        <div ref={pillContainerRef} className="flex gap-1.5 min-w-max px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(item.id)}
                className={`account-pill ${isActive ? "active" : ""}`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === "notifications" && unreadNotifications > 0 && (
                  <span className="account-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
