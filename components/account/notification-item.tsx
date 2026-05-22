"use client"

import { useMemo } from "react"
import { Car, CreditCard, Bell, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"

interface NotificationItemProps {
  notification: {
    id: string
    title: string
    message: string
    category: string
    type: string
    is_read: boolean
    created_at: string
    metadata?: Record<string, any>
  }
  onMarkAsRead?: () => void
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  booking: Car,
  payment: CreditCard,
  system: Bell,
}

const TYPE_STYLES: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle, color: "text-[var(--status-completed-text)]" },
  warning: { icon: AlertTriangle, color: "text-[var(--status-pending-text)]" },
  error: { icon: XCircle, color: "text-[var(--error-text)]" },
  info: { icon: Info, color: "text-[var(--status-confirmed-text)]" },
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const CategoryIcon = CATEGORY_ICONS[notification.category] || Bell
  const typeStyle = TYPE_STYLES[notification.type] || TYPE_STYLES.info
  const TypeIcon = typeStyle.icon

  const timeAgo = useMemo(() => getTimeAgo(notification.created_at), [notification.created_at])

  return (
    <div
      role="article"
      className={`account-item-card ${
        !notification.is_read
          ? "border-[var(--border-accent)] bg-[var(--gold)]/5 animate-[glow-settle_600ms_var(--ease-luxury)]"
          : "opacity-75"
      }`}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          !notification.is_read ? "bg-[var(--gold)]/20" : "bg-[var(--charcoal)]"
        }`}>
          <CategoryIcon className={`w-6 h-6 ${!notification.is_read ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`${!notification.is_read ? "text-[0.9375rem] font-semibold text-[var(--text-primary)]" : "text-sm font-medium text-[var(--text-secondary)]"}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TypeIcon className={`w-4 h-4 ${typeStyle.color}`} />
              {!notification.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
              )}
            </div>
          </div>

          <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">{timeAgo}</span>

            {!notification.is_read && onMarkAsRead && (
              <button
                onClick={onMarkAsRead}
                className="text-xs text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={`Mark "${notification.title}" as read`}
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
