'use client';

/**
 * Notifications Content Component
 * Display and manage business notifications
 *
 * Design System: Luxury Admin Panel Design
 * SCOPE: Business module ONLY
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BellRing, BellOff, Inbox, Settings2, CheckCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  getNotificationStatsAction,
} from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/business/layout';
import { BusinessNotificationItem } from '@/components/business/notifications/notification-item';

const ITEMS_PER_PAGE = 8;

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    booking: 0,
    payment: 0,
    system: 0,
  });

  // Fetch notifications with pagination support
  const fetchNotifications = async (
    category?: NotificationCategory,
    pageNum = 1,
    append = false
  ) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await getNotificationsAction(category, pageNum, ITEMS_PER_PAGE);

      if (result.data) {
        const newNotifications = result.data.notifications;

        if (append) {
          setNotifications((prev) => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        // Determine if there are more notifications to load
        setHasMore(newNotifications.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const result = await getNotificationStatsAction();
      if (result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category as NotificationCategory | 'all');
    setPage(1); // Reset to page 1
    setHasMore(true); // Reset hasMore
    if (category === 'all') {
      fetchNotifications(undefined, 1, false);
    } else {
      fetchNotifications(category as NotificationCategory, 1, false);
    }
  };

  // Load more notifications
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(
      activeCategory === 'all' ? undefined : (activeCategory as NotificationCategory),
      nextPage,
      true // append mode
    );
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      fetchStats();
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const category = activeCategory === 'all' ? undefined : (activeCategory as NotificationCategory);
    const result = await markAllAsReadAction(category);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      fetchStats();
      toast.success('All notifications marked as read');
    }
  };

  // Tab configuration
  const tabs = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'booking', label: 'Bookings', count: stats.booking },
    { value: 'payment', label: 'Payments', count: stats.payment },
    { value: 'system', label: 'System', count: stats.system },
  ];

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight font-display flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">
            Stay updated with your bookings and account activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/business/settings/notifications"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-foreground/80 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            <Settings2 className="h-4 w-4 text-primary" />
            Preferences
          </Link>
          {stats.unread > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary font-medium hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Notifications */}
        <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Total Notifications
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight text-primary">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">All notifications</p>
          </div>
        </div>

        {/* Unread */}
        <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Unread
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                <BellRing className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight text-red-500">{stats.unread}</span>
              {stats.unread > 0 && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-red-500 bg-red-500/10">
                  Needs attention
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Awaiting your review</p>
          </div>
        </div>

        {/* Read */}
        <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Read
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <BellOff className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight text-emerald-500">{stats.read}</span>
            </div>
            <p className="text-sm text-muted-foreground">Already reviewed</p>
          </div>
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm">
        {/* Tabs Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleCategoryChange(tab.value)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  activeCategory === tab.value
                    ? 'text-primary bg-card shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className="ml-1 text-xs opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          /* Loading State with Skeletons */
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="flex gap-2">
                    <div className="skeleton h-5 w-20 rounded-full" />
                    <div className="skeleton h-5 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bell className="h-5 w-5 animate-pulse text-primary" />
                <span className="text-sm">Loading notifications...</span>
              </div>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You're all caught up! New notifications about your bookings and account will appear here.
            </p>
            <Link
              href="/business/dashboard"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          /* Notifications List */
          <>
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <BusinessNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {/* End of List Message */}
            {!hasMore && notifications.length > 0 && (
              <div className="p-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">You've reached the end</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
