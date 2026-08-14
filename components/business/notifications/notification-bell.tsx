'use client';

/**
 * Business Portal Notification Bell Component
 * Matches the HTML design with colored icon backgrounds and rich styling
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { Bell, CalendarCheck, CheckCircle2, Wallet, CreditCard, FileText, Star, User, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/business/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBusinessNotifications } from '@/lib/hooks/use-business-notifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Notification } from '@/lib/notifications/types';

// Icon per notification category. The chip colour follows the tenant accent for
// every category rather than a fixed per-category hue - the icon carries the
// category. `system` stays muted because it is the deliberately quiet one.
const categoryConfig: Record<string, { icon: typeof Bell; bgColor: string; iconColor: string }> = {
  booking: { icon: CalendarCheck, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  user: { icon: User, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  vendor_application: { icon: FileText, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  review: { icon: Star, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  payment: { icon: Wallet, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  system: { icon: Bell, bgColor: 'bg-muted', iconColor: 'text-muted-foreground' },
};

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const config = categoryConfig[notification.category] || categoryConfig.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    // A div, not a button. The row used to be one, which left nowhere valid to put
    // the delete control: a button cannot be nested inside another button.
    <div className="group relative flex items-start gap-3 hover:bg-muted/50 transition-colors">
      <button
        onClick={handleClick}
        className={cn(
          'flex flex-1 min-w-0 items-start gap-3 p-4 text-left',
          notification.link && 'cursor-pointer',
          onDelete && 'pr-10'
        )}
      >
      {/* Colored icon container */}
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
        config.bgColor
      )}>
        <Icon className={cn('h-5 w-5', config.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium text-foreground',
          !notification.is_read && 'font-semibold'
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-primary mt-1">
          {notification.timeAgo}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
      )}
      </button>

      {onDelete && (
        <button
          type="button"
          aria-label="Delete notification"
          onClick={() => onDelete(notification.id)}
          className={cn(
            'absolute right-2 top-3 flex-shrink-0 rounded-md p-1.5',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            'transition-colors',
            'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function BusinessNotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useBusinessNotifications(5);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-9 w-9',
            'text-muted-foreground hover:text-primary',
            'hover:bg-primary/10'
          )}
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl bg-popover border border-border shadow-lg p-0 dropdown-animate"
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 whitespace-nowrap flex-shrink-0 normal-case tracking-normal"
              >
                Mark all read
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
              : 'No new notifications'}
          </p>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Link
              href="/business/notifications"
              className="block text-center text-sm text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
