'use client';

/**
 * Business Portal Notification Item Component
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 *
 * Note: This is a business-specific version with proper text colors
 * for both dark and light modes.
 */

import { Notification } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import { Bell, CreditCard, FileText, ShoppingCart, Star, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BusinessNotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  compact?: boolean;
}

const categoryIcons = {
  booking: ShoppingCart,
  user: User,
  vendor_application: FileText,
  review: Star,
  payment: CreditCard,
  system: Bell,
};

export function BusinessNotificationItem({
  notification,
  onMarkAsRead,
  compact = false,
}: BusinessNotificationItemProps) {
  const router = useRouter();
  const Icon = categoryIcons[notification.category];

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

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        notification.link && 'cursor-pointer hover:bg-primary/5',
        !notification.is_read && 'bg-primary/5 border-primary/20',
        notification.is_read && 'bg-background border-border',
        compact && 'p-2'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 rounded-full p-2',
          !notification.is_read
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className={cn('h-4 w-4', compact && 'h-3 w-3')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium text-foreground',
              !notification.is_read && 'font-semibold'
            )}
          >
            {notification.title}
          </h4>
          {!compact && notification.timeAgo && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {notification.timeAgo}
            </span>
          )}
        </div>
        <p className={cn('text-sm text-muted-foreground mt-0.5', compact && 'text-xs truncate')}>
          {notification.message}
        </p>
        {compact && notification.timeAgo && (
          <span className="text-xs text-muted-foreground mt-1 block">
            {notification.timeAgo}
          </span>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
      )}
    </div>
  );
}
