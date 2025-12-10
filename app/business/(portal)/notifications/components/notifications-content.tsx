'use client';

/**
 * Notifications Content Component
 * Display and manage business notifications
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useEffect, useState } from 'react';
import { Bell, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationItem } from '@/components/admin/notifications/notification-item';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  getNotificationStatsAction,
} from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader, PageContainer } from '@/components/business/layout';

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    booking: 0,
    payment: 0,
    system: 0,
  });

  // Fetch notifications
  const fetchNotifications = async (category?: NotificationCategory) => {
    try {
      setLoading(true);
      const result = await getNotificationsAction(category);
      if (result.data) {
        setNotifications(result.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
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
    if (category === 'all') {
      fetchNotifications();
    } else {
      fetchNotifications(category as NotificationCategory);
    }
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

  const filteredNotifications = notifications;

  return (
    <PageContainer>
      {/* Page Header with action button */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notifications"
          description="Stay updated with your bookings and account activities"
        />
        {stats.unread > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Notifications - Gold accent */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Total Notifications
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        {/* Unread - Red accent */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Unread
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.unread}
            </div>
          </CardContent>
        </Card>

        {/* Read - Green accent */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Read
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.read}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
            <TabsList className="bg-muted border border-border">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground"
              >
                All {stats.total > 0 && `(${stats.total})`}
              </TabsTrigger>
              <TabsTrigger
                value="booking"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground"
              >
                Bookings {stats.booking > 0 && `(${stats.booking})`}
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground"
              >
                Payments {stats.payment > 0 && `(${stats.payment})`}
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground"
              >
                System {stats.system > 0 && `(${stats.system})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">No notifications found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
