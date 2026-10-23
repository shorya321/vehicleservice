'use client';

import * as React from 'react';
import { Bell, CalendarCheck, FileText, Star, User, Wallet, X } from 'lucide-react';
import type { Notification, NotificationCategory } from '@/lib/notifications/types';
import { categoryMeta, notificationTime } from '@/lib/notifications/panel';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  booking: CalendarCheck,
  user: User,
  vendor_application: FileText,
  review: Star,
  payment: Wallet,
  system: Bell,
};

interface NotificationPanelRowProps {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onDelete: (id: string) => void;
}

/**
 * One row of the header panel. A div holding two sibling buttons, because the
 * delete control cannot be nested inside the row's own button.
 */
export function NotificationPanelRow({ notification, onOpen, onDelete }: NotificationPanelRowProps) {
  const unread = !notification.is_read;
  const meta = categoryMeta(notification.category);
  const Icon = CATEGORY_ICONS[notification.category] ?? Bell;
  const time = notificationTime(notification);

  return (
    <li className={cn('notif-row', unread && 'notif-row--unread')}>
      <button type="button" className="notif-row__main" onClick={() => onOpen(notification)}>
        {unread && (
          <>
            <span className="notif-row__dot" aria-hidden="true" />
            <span className="sr-only">Unread. </span>
          </>
        )}
        <span className={cn('notif-tone', `notif-tone--${meta.tone}`)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <span className="notif-row__body">
          <span className="notif-row__title">{notification.title}</span>
          <span className="notif-row__msg">{notification.message}</span>
          <span className="notif-row__meta">
            <span className="notif-row__cat">{meta.label}</span>
            {time && (
              <>
                <span className="notif-row__sep" aria-hidden="true" />
                <span>{time}</span>
              </>
            )}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="notif-row__delete"
        aria-label="Delete notification"
        onClick={() => onDelete(notification.id)}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
