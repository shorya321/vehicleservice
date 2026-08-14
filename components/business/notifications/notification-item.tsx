'use client';

/**
 * Business Portal Notification Item Component
 *
 * Design System: Luxury Admin Panel Design
 * SCOPE: Business module ONLY
 *
 * Features category-specific colors, gold accent for unread,
 * and matching the luxury design system.
 */

import { Notification, NotificationCategory } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import {
  Bell,
  CreditCard,
  FileText,
  ShoppingCart,
  Star,
  User,
  Wallet,
  CalendarCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BusinessNotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  /** Optional so existing call sites that do not offer delete keep working unchanged. */
  onDelete?: (id: string) => void;
  compact?: boolean;
}

// Category icons mapping
const categoryIcons: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  booking: ShoppingCart,
  user: User,
  vendor_application: FileText,
  review: Star,
  payment: CreditCard,
  system: Bell,
};

// Category display labels
const categoryLabels: Record<NotificationCategory, string> = {
  booking: 'Booking',
  user: 'User',
  vendor_application: 'Application',
  review: 'Review',
  payment: 'Payment',
  system: 'System',
};

// Category badge icons (smaller, for badges)
const categoryBadgeIcons: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  booking: CalendarCheck,
  user: User,
  vendor_application: FileText,
  review: Star,
  payment: Wallet,
  system: Bell,
};

// These rows are clickable, so their chips follow the tenant accent rather than a
// per-category hue. The category is still carried by the icon and the badge text,
// which is what a reader actually goes by.
const CATEGORY_BADGE = 'bg-primary/10 text-primary border-primary/30';

// Only the read status changes the styling now: an unread row gets the accent, a
// read one goes muted.
const getCategoryStyles = (isRead: boolean | null) =>
  isRead
    ? {
        iconContainer: 'bg-muted',
        iconColor: 'text-muted-foreground',
        badge: CATEGORY_BADGE,
      }
    : {
        iconContainer: 'bg-primary/10',
        iconColor: 'text-primary',
        badge: CATEGORY_BADGE,
      };

export function BusinessNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: BusinessNotificationItemProps) {
  const router = useRouter();
  const Icon = categoryIcons[notification.category] || Bell;
  const BadgeIcon = categoryBadgeIcons[notification.category] || Bell;
  const categoryLabel = categoryLabels[notification.category] || 'Notification';
  const styles = getCategoryStyles(notification.is_read);

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to link if provided
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Compact mode for dropdown/sidebar usage
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer',
          notification.link && 'hover:bg-primary/5',
          !notification.is_read && 'bg-primary/5'
        )}
      >
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full',
            styles.iconContainer
          )}
        >
          <Icon className={cn('h-4 w-4', styles.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'text-sm text-foreground truncate',
              !notification.is_read ? 'font-semibold' : 'font-medium'
            )}
          >
            {notification.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
          {notification.timeAgo && (
            <span className="text-xs text-muted-foreground mt-1 block">{notification.timeAgo}</span>
          )}
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
        )}
        {onDelete && (
          <button
            type="button"
            aria-label="Delete notification"
            onClick={(event) => {
              // The row itself navigates on click, so the delete must not bubble.
              event.stopPropagation();
              onDelete(notification.id);
            }}
            className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Full notification item for main page
  return (
    <div
      onClick={handleClick}
      className={cn(
        'notification-item relative flex items-start gap-4 p-4 cursor-pointer',
        !notification.is_read && 'notification-unread'
      )}
    >
      {/* Icon Container */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            styles.iconContainer
          )}
        >
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={cn(
                'text-sm text-foreground',
                !notification.is_read ? 'font-semibold' : 'font-medium'
              )}
            >
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {notification.timeAgo && (
              <span
                className={cn(
                  'text-xs',
                  !notification.is_read ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {notification.timeAgo}
              </span>
            )}
            {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full" />}
            {onDelete && (
              <button
                type="button"
                aria-label="Delete notification"
                onClick={(event) => {
                  // The row itself navigates on click, so the delete must not bubble.
                  event.stopPropagation();
                  onDelete(notification.id);
                }}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Badge Row */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border',
              styles.badge
            )}
          >
            <BadgeIcon className="h-3 w-3" />
            {categoryLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
