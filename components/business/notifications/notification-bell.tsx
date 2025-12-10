'use client';

import { Bell } from 'lucide-react';
import {
  LuxuryButton,
  LuxuryDropdownMenu,
  LuxuryDropdownMenuContent,
  LuxuryDropdownMenuTrigger,
} from '@/components/business/ui';
import { useBusinessNotifications } from '@/lib/hooks/use-business-notifications';
import { BusinessNotificationItem } from './notification-item';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function BusinessNotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useBusinessNotifications(5);
  const router = useRouter();

  return (
    <LuxuryDropdownMenu>
      <LuxuryDropdownMenuTrigger asChild>
        <LuxuryButton
          variant="ghost"
          size="icon"
          className={cn(
            'relative',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-primary/10'
          )}
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </LuxuryButton>
      </LuxuryDropdownMenuTrigger>

      <LuxuryDropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <LuxuryButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="h-7 text-xs text-primary hover:text-primary"
              >
                Mark all read
              </LuxuryButton>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div key={notification.id} className="px-2 py-1">
                  <BusinessNotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    compact
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <LuxuryButton
              variant="ghost"
              className="w-full justify-center text-sm text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => router.push('/business/notifications')}
            >
              View all notifications
            </LuxuryButton>
          </div>
        )}
      </LuxuryDropdownMenuContent>
    </LuxuryDropdownMenu>
  );
}
