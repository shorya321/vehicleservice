"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Bell, Mail, CreditCard, CheckCheck, ChevronDown, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationCategory,
} from "@/app/account/notification-actions"
import { NotificationItem } from "./notification-item"
import { toast } from "sonner"
import { ContentSection } from "./content-section"
import { InlineStats } from "./inline-stats"
import { ListSkeleton } from "./list-skeleton"
import { EmptyState } from "./empty-state"
import type { NotificationListItem } from "./types"

interface NotificationsTabProps {
  userId: string
}

const CATEGORY_TABS = [
  { value: "all", label: "All", icon: Bell },
  { value: "booking", label: "Booking", icon: Mail },
  { value: "payment", label: "Payment", icon: CreditCard },
]

export function NotificationsTab({ userId }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<NotificationListItem[]>([])
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [category, setCategory] = useState<NotificationCategory>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    setIsLoading(true)

    const [notifResult, statsResult] = await Promise.all([
      getNotifications({ category, page: targetPage, limit: 20 }),
      getNotificationStats(),
    ])

    const items = (notifResult.data || []) as NotificationListItem[]
    if (append) {
      setNotifications((prev) => [...prev, ...items])
    } else {
      setNotifications(items)
    }

    setHasMore(targetPage < (notifResult.totalPages || 1))
    if (statsResult.data) setStats(statsResult.data)
    setIsLoading(false)
  }, [category])

  useEffect(() => {
    setPage(1)
    fetchPage(1, false)
  }, [category, fetchPage])

  useEffect(() => {
    if (page > 1) fetchPage(page, true)
  }, [page, fetchPage])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationListItem
          if (category === "all" || newNotification.category === category) {
            setNotifications((prev) => [newNotification, ...prev])
            setStats((prev) => ({
              ...prev,
              total: prev.total + 1,
              unread: prev.unread + 1,
            }))
            toast.info("New notification received")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, category])

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id)
    if (!result.error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      }))
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    const result = await markAllNotificationsAsRead(category)
    setIsMarkingAll(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setStats((prev) => ({ ...prev, unread: 0, read: prev.total }))
      toast.success("All notifications marked as read")
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  const inlineStats = useMemo(() => [
    { label: "total", value: stats.total },
    { label: "unread", value: stats.unread, color: "var(--status-confirmed-text)" },
  ], [stats.total, stats.unread])

  const markAllAction = stats.unread > 0 ? (
    <button
      onClick={handleMarkAllAsRead}
      disabled={isMarkingAll}
      className="text-sm text-[var(--gold-text)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
    >
      {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
      Mark all as read
    </button>
  ) : undefined

  return (
    <ContentSection
      title="Notifications"
      eyebrow="Updates"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <InlineStats stats={inlineStats} />
          {markAllAction}
        </div>
      }
    >
      {/* Category pills */}
      <div
        className="flex gap-2 mb-6"
        role="tablist"
        aria-label="Notification categories"
        onKeyDown={(e) => {
          const buttons = Array.from(e.currentTarget.querySelectorAll('[role="tab"]')) as HTMLElement[]
          const currentIndex = buttons.findIndex((b) => b === document.activeElement)
          let nextIndex = -1
          if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length
          else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
          else if (e.key === "Home") nextIndex = 0
          else if (e.key === "End") nextIndex = buttons.length - 1
          if (nextIndex >= 0) { e.preventDefault(); buttons[nextIndex].focus() }
        }}
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = category === tab.value
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setCategory(tab.value as NotificationCategory)}
              className={`account-pill ${isActive ? "active" : ""}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading && notifications.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="New updates will appear here as they happen"
        />
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <div>
              <h3 className="account-label mb-3 text-[var(--gold-text)]">
                Unread ({unreadNotifications.length})
              </h3>
              <div className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div>
              <h3 className="account-label mb-3">Earlier</h3>
              <div className="space-y-2">
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            </div>
          )}

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </ContentSection>
  )
}
