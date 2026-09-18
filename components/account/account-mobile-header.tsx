"use client"

import { useRef, useEffect, useCallback } from "react"
import { NAV_ITEMS, type TabId } from "./account-nav"

interface AccountMobileHeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  unreadNotifications: number
}

/**
 * The tab bar, on a phone.
 *
 * This used to open with a compact profile row — avatar, email and a "Finish setup" link. All
 * three now sit in the page header directly above it, which on a phone put the email on screen
 * twice and offered "Finish setup" twice in a row. The avatar here was never the upload control
 * either; that lives in the desktop rail. So the row went, and the pills start at the top.
 */
export function AccountMobileHeader({ activeTab, onTabChange, unreadNotifications }: AccountMobileHeaderProps) {
  const pillContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = pillContainerRef.current
    if (!container) return
    const activeButton = container.querySelector('[aria-selected="true"]') as HTMLElement
    if (!activeButton) return
    const scrollLeft = activeButton.offsetLeft - container.offsetWidth / 2 + activeButton.offsetWidth / 2
    container.scrollTo({ left: scrollLeft, behavior: "smooth" })
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
    <div className="lg:hidden min-w-0">
      {/* Pill Navigation */}
      <div ref={pillContainerRef} className="account-pill-bar" role="tablist" aria-label="Account sections" onKeyDown={handlePillKeyDown}>
        <div className="flex gap-1.5 min-w-max px-4">
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
