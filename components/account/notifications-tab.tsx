"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Mail, CreditCard, Settings, CheckCheck, ChevronDown, Loader2 } from "lucide-react"
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

interface NotificationsTabProps {
  userId: string
}

const CATEGORY_TABS = [
  { value: "all", label: "All", icon: Bell },
  { value: "booking", label: "Booking", icon: Mail },
  { value: "payment", label: "Payment", icon: CreditCard },
]

export function NotificationsTab({ userId }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [category, setCategory] = useState<NotificationCategory>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page
    if (reset) setPage(1)
    setIsLoading(true)

    const [notifResult, statsResult] = await Promise.all([
      getNotifications({ category, page: currentPage, limit: 20 }),
      getNotificationStats(),
    ])

    if (reset) {
      setNotifications(notifResult.data || [])
    } else {
      setNotifications((prev) => [...prev, ...(notifResult.data || [])])
    }

    setTotalPages(notifResult.totalPages || 1)
    setHasMore(currentPage < (notifResult.totalPages || 1))
    if (statsResult.data) setStats(statsResult.data)
    setIsLoading(false)
  }, [category, page])

  useEffect(() => {
    fetchData(true)
  }, [category])

  useEffect(() => {
    if (page > 1) fetchData()
  }, [page])

  // Real-time subscription
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
          const newNotification = payload.new as any
          if (
            category === "all" ||
            newNotification.category === category
          ) {
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
      setStats((prev) => ({
        ...prev,
        unread: 0,
        read: prev.total,
      }))
      toast.success("All notifications marked as read")
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} color="gold" />
        <StatCard label="Unread" value={stats.unread} color="blue" />
        <StatCard label="Read" value={stats.read} color="green" />
      </div>

      {/* Category Tabs */}
      <div className="account-tabs-card">
        <div className="flex gap-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value as NotificationCategory)}
              className={`account-tab flex-1 justify-center ${category === tab.value ? "active" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mark All as Read */}
      {stats.unread > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="text-sm text-[var(--gold)] hover:text-[var(--gold-light)] flex items-center gap-1.5"
          >
            {isMarkingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <div className="luxury-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="luxury-card p-12 text-center">
          <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No notifications</h3>
          <p className="text-sm text-[var(--text-muted)]">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread Section */}
          {unreadNotifications.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--gold)] uppercase tracking-wider mb-3">
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

          {/* Read Section */}
          {readNotifications.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Earlier
              </h3>
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

          {/* Load More */}
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
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    gold: "text-[var(--gold)]",
    blue: "text-blue-400",
    green: "text-green-400",
  }
  return (
    <div className="luxury-card p-4 text-center">
      <p className={`text-2xl font-semibold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
    </div>
  )
}
