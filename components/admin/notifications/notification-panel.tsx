'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bell, BellRing, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Notification } from '@/lib/notifications/types';
import {
  badgeLabel,
  emptyCopy,
  filterNotifications,
  groupNotifications,
  type NotificationTab,
} from '@/lib/notifications/panel';
import { bookingToday } from '@/lib/utils/timezone';
import { cn } from '@/lib/utils';
import { NotificationPanelRow } from './notification-panel-row';

export interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  /** The portal's full notifications page. */
  viewAllHref: string;
  /** Empty-state line, worded for the portal. */
  idleMessage: string;
}

/**
 * Header bell and its panel, shared by the admin and vendor portals. Each bell
 * passes its own hook's results in, so the two portals differ only in data.
 *
 * A Popover rather than a DropdownMenu: the panel holds tabs and per-row
 * buttons, and a menu swallows Tab and only lets arrow keys reach menu items.
 */
export function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  viewAllHref,
  idleMessage,
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>('all');
  const router = useRouter();

  const visible = filterNotifications(notifications, tab);
  const groups = groupNotifications(visible, bookingToday());
  const empty = emptyCopy(tab, unreadCount, idleMessage);
  const hasUnread = unreadCount > 0;

  const handleOpen = (notification: Notification): void => {
    if (!notification.is_read) void markAsRead(notification.id);
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  // No count on All: the hook only loads a page of rows, so its length is not
  // the total. The unread count comes from the server and is exact.
  const tabs: { id: NotificationTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="notif-trigger"
          aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {hasUnread && <span className="notif-trigger__badge" aria-hidden="true">{badgeLabel(unreadCount)}</span>}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        collisionPadding={16}
        className="notif-panel w-[calc(100vw-2rem)] sm:w-[400px] p-0 dropdown-animate"
        aria-label="Notifications"
      >
        <div className="notif-panel__head">
          <div className="notif-panel__title-row">
            <h2 className="notif-panel__title">Notifications</h2>
            {hasUnread && <span className="notif-panel__chip">{unreadCount} new</span>}
            {hasUnread && (
              <button type="button" className="notif-panel__mark-all" onClick={() => void markAllAsRead()}>
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-panel__tabs" role="tablist" aria-label="Filter notifications">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className="notif-panel__tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.count !== undefined && <span className="notif-panel__tab-count">{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="notif-panel__scroll">
          {loading ? (
            <PanelSkeleton />
          ) : visible.length === 0 ? (
            <div className="notif-panel__empty">
              <span className="notif-panel__empty-icon" aria-hidden="true">
                <BellRing className="h-5 w-5" />
              </span>
              <p className="notif-panel__empty-title">{empty.title}</p>
              <p className="notif-panel__empty-body">{empty.body}</p>
            </div>
          ) : (
            <>
              <PanelGroup label="Today" items={groups.today} onOpen={handleOpen} onDelete={deleteNotification} />
              <PanelGroup label="Earlier" items={groups.earlier} onOpen={handleOpen} onDelete={deleteNotification} />
            </>
          )}
        </div>

        <Link href={viewAllHref} className="notif-panel__footer" onClick={() => setOpen(false)}>
          View all notifications
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}

interface PanelGroupProps {
  label: string;
  items: Notification[];
  onOpen: (notification: Notification) => void;
  onDelete: (id: string) => Promise<void>;
}

function PanelGroup({ label, items, onOpen, onDelete }: PanelGroupProps) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label}>
      <p className="notif-panel__group">{label}</p>
      <ul className="notif-panel__list">
        {items.map((n) => (
          <NotificationPanelRow key={n.id} notification={n} onOpen={onOpen} onDelete={(id) => void onDelete(id)} />
        ))}
      </ul>
    </section>
  );
}

function PanelSkeleton() {
  return (
    <div aria-busy="true" className="notif-panel__skeleton">
      <span className="sr-only">Loading notifications</span>
      {['w-3/5', 'w-2/5', 'w-1/2'].map((width) => (
        <div key={width} className="flex gap-3 px-5 py-3.5" aria-hidden="true">
          <div className="notif-skel h-9 w-9 shrink-0 rounded-[9px]" />
          <div className="flex flex-1 flex-col gap-2 pt-0.5">
            <div className={cn('notif-skel h-2.5', width)} />
            <div className="notif-skel h-2 w-4/5" />
            <div className="notif-skel h-2 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
