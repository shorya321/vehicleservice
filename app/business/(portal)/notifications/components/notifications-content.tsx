'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationItem } from '@/components/admin/notifications/notification-item';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  getNotificationStatsAction,
} from '../actions';
import { toast } from 'sonner';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your bookings and account activities
          </p>
        </div>
        {stats.unread > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <Bell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.read}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
            <TabsList>
              <TabsTrigger value="all">
                All {stats.total > 0 && `(${stats.total})`}
              </TabsTrigger>
              <TabsTrigger value="booking">
                Bookings {stats.booking > 0 && `(${stats.booking})`}
              </TabsTrigger>
              <TabsTrigger value="payment">
                Payments {stats.payment > 0 && `(${stats.payment})`}
              </TabsTrigger>
              <TabsTrigger value="system">
                System {stats.system > 0 && `(${stats.system})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 animate-pulse" />
                <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No notifications found</p>
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
    </div>
  );
}
