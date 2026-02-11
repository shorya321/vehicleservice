'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AnimatedCard } from '@/components/ui/animated-card';
import { NotificationItem } from '@/components/admin/notifications/notification-item';
import { NotificationCategory, categoryLabels } from '@/lib/notifications/types';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  getNotificationStatsAction,
} from '../actions';
import { Notification } from '@/lib/notifications/types';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  Building2,
  Star,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const categories: (NotificationCategory | 'all')[] = [
  'all',
  'booking',
  'user',
  'vendor_application',
  'review',
  'payment',
];

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  booking: number;
  user: number;
  vendor_application: number;
  review: number;
  payment: number;
}

export function NotificationsContent() {
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    booking: 0,
    user: 0,
    vendor_application: 0,
    review: 0,
    payment: 0,
  });

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

  // Fetch notifications
  const fetchNotifications = async (category?: NotificationCategory, pageNum: number = 1) => {
    setLoading(true);
    try {
      const result = await getNotificationsAction(category, pageNum, 20);
      if (result.data) {
        if (pageNum === 1) {
          setNotifications(result.data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...result.data!.notifications]);
        }
        setUnreadCount(result.data.unreadCount);
        setHasMore(result.data.notifications.length === 20);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
    fetchNotifications(activeTab === 'all' ? undefined : activeTab);
  }, [activeTab]);

  // Realtime subscription for new notifications
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          // Refresh notifications and stats when new notification arrives
          fetchNotifications(activeTab === 'all' ? undefined : activeTab, 1);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsReadAction(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // Refresh stats
      fetchStats();
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const category = activeTab === 'all' ? undefined : activeTab;
    const result = await markAllAsReadAction(category);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      // Refresh stats
      fetchStats();
    }
  };

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(activeTab === 'all' ? undefined : activeTab, nextPage);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as NotificationCategory | 'all');
    setPage(1);
    setHasMore(true);
  };

  // Filter unread/read
  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Notifications', href: '/admin/notifications' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-luxury-lightGray">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <AnimatedCard delay={0.1}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-luxury-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.total}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.unread}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.read}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.booking}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.5}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.user}</div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnimatedCard delay={0.6}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendor Applications</CardTitle>
              <Building2 className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.vendor_application}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.7}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.review}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.8}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-luxury-pearl">{stats.payment}</div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Notifications Table */}
      <AnimatedCard delay={0.9}>
        <Card>
          <CardHeader>
            <CardTitle>Notification Center</CardTitle>
            <CardDescription className="text-luxury-lightGray">
              View and manage all notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.slice(1).map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {categoryLabels[category as NotificationCategory]}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {loading && page === 1 ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-luxury-pearl">No notifications</h3>
                    <p className="text-sm text-luxury-lightGray">
                      {activeTab === 'all'
                        ? "You don't have any notifications yet"
                        : `No ${categoryLabels[activeTab as NotificationCategory].toLowerCase()} notifications`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Unread Section */}
                    {unreadNotifications.length > 0 && (
                      <div>
                        <h2 className="text-sm font-semibold text-luxury-lightGray mb-3">
                          UNREAD ({unreadNotifications.length})
                        </h2>
                        <div className="space-y-2">
                          {unreadNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={handleMarkAsRead}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Read Section */}
                    {readNotifications.length > 0 && (
                      <div>
                        <h2 className="text-sm font-semibold text-luxury-lightGray mb-3">
                          READ ({readNotifications.length})
                        </h2>
                        <div className="space-y-2">
                          {readNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={handleMarkAsRead}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Load More */}
                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={handleLoadMore}
                          variant="outline"
                          disabled={loading}
                        >
                          {loading ? 'Loading...' : 'Load more'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
}
