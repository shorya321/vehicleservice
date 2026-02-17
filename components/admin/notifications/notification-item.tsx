'use client';

import { Notification } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import { Bell, CalendarCheck, FileText, Star, User, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
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
    <button
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-4 w-full text-left',
        'hover:bg-muted/50 transition-colors',
        notification.link && 'cursor-pointer',
        compact && 'p-3'
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
          !notification.is_read && 'font-semibold'
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
  );
}
