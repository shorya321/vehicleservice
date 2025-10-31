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
