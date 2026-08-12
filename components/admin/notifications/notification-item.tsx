'use client';

import { Notification } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import { Bell, CalendarCheck, FileText, Star, User, Wallet, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  /** Optional so existing call sites that do not offer delete keep working unchanged. */
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const categoryConfig: Record<string, { icon: typeof Bell; bgColor: string; iconColor: string }> = {
  booking: { icon: CalendarCheck, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  user: { icon: User, bgColor: 'bg-sky-500/10', iconColor: 'text-sky-500' },
  vendor_application: { icon: FileText, bgColor: 'bg-violet-500/10', iconColor: 'text-violet-500' },
  review: { icon: Star, bgColor: 'bg-amber-500/10', iconColor: 'text-amber-500' },
  payment: { icon: Wallet, bgColor: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  system: { icon: Bell, bgColor: 'bg-muted', iconColor: 'text-muted-foreground' },
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const config = categoryConfig[notification.category] || categoryConfig.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    // A div, not a button. The row used to be one, which left nowhere valid to put
    // the delete control: a button cannot be nested inside another button. The row
    // action is now an inner button and delete is its sibling.
    <div
      className={cn(
        'group relative flex items-start gap-3',
        'hover:bg-muted/50 transition-colors'
      )}
    >
      <button
        onClick={handleClick}
        className={cn(
          'flex flex-1 min-w-0 items-start gap-3 p-4 text-left',
          notification.link && 'cursor-pointer',
          compact && 'p-3',
          onDelete && 'pr-10'
        )}
      >
      {/* Colored icon container */}
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
        config.bgColor,
        compact && 'h-8 w-8'
      )}>
        <Icon className={cn('h-5 w-5', config.iconColor, compact && 'h-4 w-4')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium text-foreground',
          !notification.is_read && 'font-semibold',
          compact && 'text-sm truncate'
        )}>
          {notification.title}
        </p>
        <p className={cn('text-xs text-muted-foreground mt-0.5', compact && 'truncate')}>
          {notification.message}
        </p>
        {notification.timeAgo && (
          <p className="text-xs text-primary mt-1">
            {notification.timeAgo}
          </p>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
      )}
      </button>

      {/* Delete. Always visible on touch, revealed on hover or keyboard focus on
          pointer devices, so it does not compete with the row content. */}
      {onDelete && (
        <button
          type="button"
          aria-label="Delete notification"
          onClick={() => onDelete(notification.id)}
          className={cn(
            'absolute right-2 top-3 flex-shrink-0 rounded-md p-1.5',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            'transition-colors',
            'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100',
            compact && 'top-2'
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
