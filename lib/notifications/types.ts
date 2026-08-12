import { Database } from '@/lib/supabase/types';

// Database types
export type NotificationCategory = Database['public']['Enums']['notification_category'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Extended notification type with formatted data
export interface Notification extends NotificationRow {
  timeAgo?: string;
}

// Notification filter options
export interface NotificationFilters {
  category?: NotificationCategory;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}

// Notification response
export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

/**
 * What an admin purge would remove, as returned by count_notification_purge.
 *
 * Lives here rather than beside the server action because a 'use server' file may
 * only export async functions; a type export there breaks the app at runtime on an
 * unrelated route and tsc does not catch it.
 *
 * `oldest` and `newest` are null when the selection matches no rows.
 *
 * The two survivor counts are deliberately separate. `others_total` ignores the cutoff
 * and means "owned by anyone but the caller", which is the set the admin notifications
 * page never shows. `remaining_total` is everything this selection misses, which on a
 * dated cutoff also includes the caller's own newer rows, so it must never be described
 * as belonging to other users.
 */
export interface NotificationPurgePreview {
  total: number;
  unread: number;
  users: number;
  oldest: string | null;
  newest: string | null;
  remaining_total: number;
  others_total: number;
  others_users: number;
}

// Category icon mapping
export const categoryIcons = {
  booking: 'ShoppingCart',
  user: 'User',
  vendor_application: 'FileText',
  review: 'Star',
  payment: 'CreditCard',
  system: 'Bell',
} as const;

// Category labels
export const categoryLabels: Record<NotificationCategory, string> = {
  booking: 'Bookings',
  user: 'Users',
  vendor_application: 'Vendor Applications',
  review: 'Reviews',
  payment: 'Payments',
  system: 'System',
};

// Notification types mapping
export const notificationTypeLabels: Record<string, string> = {
  // Admin notifications
  booking_created: 'New Booking',
  booking_updated: 'Booking Updated',
  assignment_rejected: 'Assignment Rejected',
  user_registered: 'New User',
  application_submitted: 'New Application',
  review_submitted: 'New Review',
  payment_failed: 'Payment Failed',

  // Vendor notifications
  booking_assigned: 'Booking Assigned',
  booking_status_changed: 'Booking Status Changed',
  application_status_changed: 'Application Status Changed',
  payment_received: 'Payment Received',
  assignment_cancelled: 'Assignment Cancelled',

  // Customer notifications
  driver_assigned: 'Driver Assigned',
  vehicle_assigned: 'Vehicle Assigned',
  booking_cancelled: 'Booking Cancelled',
  payment_success: 'Payment Successful',
  refund_processed: 'Refund Processed',
};
