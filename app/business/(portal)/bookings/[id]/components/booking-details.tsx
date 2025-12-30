/**
 * Booking Details Component
 * Display comprehensive booking information with premium UI
 *
 * Design System: Premium Admin Panel with Gold Accent
 * SCOPE: Business module ONLY
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Car,
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Route,
  Activity,
  Receipt,
  Hash,
  UserCheck,
  Check,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface BookingDetailsProps {
  booking: any;
}

// Status configuration with colors and icons
const statusStyleConfig: Record<string, { label: string; className: string; bgClass: string; icon: typeof Clock }> = {
  pending: {
    label: 'Pending',
    className: 'bg-primary/10 text-primary border-primary/30',
    bgClass: 'from-primary/10 via-primary/5 to-transparent border-primary/20',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    bgClass: 'from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/20',
    icon: CheckCircle,
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    bgClass: 'from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/20',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    bgClass: 'from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    bgClass: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    bgClass: 'from-red-500/10 via-red-500/5 to-transparent border-red-500/20',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-muted text-muted-foreground border-border',
    bgClass: 'from-muted/50 via-muted/25 to-transparent border-border',
    icon: XCircle,
  },
};

function getStatusConfig(status: string) {
  return statusStyleConfig[status] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
    bgClass: 'from-muted/50 via-muted/25 to-transparent border-border',
    icon: Clock,
  };
}

function getStatusBadge(status: string) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1.5 rounded-full px-3 py-1 border text-xs font-medium', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Get customer initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Calculate days until pickup
function getDaysUntilPickup(pickupDate: string): { label: string; value: number } {
  const days = differenceInDays(new Date(pickupDate), new Date());
  if (days < 0) return { label: 'Passed', value: days };
  if (days === 0) return { label: 'Today', value: 0 };
  if (days === 1) return { label: '1 day', value: 1 };
  return { label: `${days} days`, value: days };
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  const statusConfig = getStatusConfig(booking.booking_status);
  const StatusIcon = statusConfig.icon;
  const daysUntil = getDaysUntilPickup(booking.pickup_datetime);
  const assignment = booking.booking_assignments?.[0];
  const hasAcceptedAssignment = assignment?.status === 'accepted' || assignment?.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Status Summary Bar */}
      <div className={cn(
        'rounded-xl bg-gradient-to-r p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border',
        statusConfig.bgClass
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center',
            booking.booking_status === 'cancelled' || booking.booking_status === 'refunded'
              ? 'bg-red-500/20'
              : booking.booking_status === 'completed'
              ? 'bg-emerald-500/20'
              : booking.booking_status === 'in_progress'
              ? 'bg-violet-500/20'
              : booking.booking_status === 'pending'
              ? 'bg-primary/20'
              : 'bg-sky-500/20'
          )}>
            <StatusIcon className={cn(
              'h-6 w-6',
              booking.booking_status === 'cancelled' || booking.booking_status === 'refunded'
                ? 'text-red-500'
                : booking.booking_status === 'completed'
                ? 'text-emerald-500'
                : booking.booking_status === 'in_progress'
                ? 'text-violet-500'
                : booking.booking_status === 'pending'
                ? 'text-primary'
                : 'text-sky-500'
            )} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              {getStatusBadge(booking.booking_status)}
              <span className="text-sm font-mono text-muted-foreground">{booking.booking_number}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Booked on {format(new Date(booking.created_at), 'MMM d, yyyy')} at {format(new Date(booking.created_at), 'h:mm a')}
            </p>
          </div>
        </div>
        {daysUntil.value >= 0 && booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Pickup in</span>
            <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {daysUntil.label}
            </span>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Details Card */}
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                Route Details
              </h2>
            </div>
            <div className="p-5">
              {/* Route Visual */}
              <div className="relative pl-8 space-y-6">
                {/* Route Line */}
                <div className="route-line" />

                {/* Pickup */}
                <div className="relative">
                  <div className="absolute -left-8 top-0 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Pickup Location
                    </p>
                    <p className="font-semibold text-foreground text-lg">{booking.from_locations.name}</p>
                    {booking.pickup_address && (
                      <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
                    )}
                  </div>
                </div>

                {/* Dropoff */}
                <div className="relative">
                  <div className="absolute -left-8 top-0 h-4 w-4 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400">
                      Dropoff Location
                    </p>
                    <p className="font-semibold text-foreground text-lg">{booking.to_locations.name}</p>
                    {booking.dropoff_address && (
                      <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-5" />

              {/* Date & Time */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pickup Date & Time
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {format(new Date(booking.pickup_datetime), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-primary font-medium">
                    {format(new Date(booking.pickup_datetime), 'h:mm a')}
                  </p>
                </div>
              </div>

              {/* Special Instructions */}
              {booking.customer_notes && (
                <div className="mt-5 p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Special Instructions
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{booking.customer_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle & Passengers Card */}
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Vehicle & Passengers
              </h2>
            </div>
            <div className="p-5">
              {/* Vehicle Info */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <Car className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {booking.vehicle_types.vehicle_categories?.name && (
                      <>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {booking.vehicle_types.vehicle_categories.name}
                        </span>
                        <span className="text-xs text-muted-foreground">Category</span>
                      </>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-foreground mt-1">{booking.vehicle_types.name}</p>
                  {booking.vehicle_types.description && (
                    <p className="text-sm text-muted-foreground">{booking.vehicle_types.description}</p>
                  )}
                </div>
              </div>

              {/* Vehicle Capacity */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max Passengers</p>
                    <p className="font-semibold text-foreground">{booking.vehicle_types.passenger_capacity || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max Luggage</p>
                    <p className="font-semibold text-foreground">{booking.vehicle_types.luggage_capacity || 0}</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-5" />

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passengers</p>
                    <p className="font-semibold text-foreground">{booking.passenger_count} Passengers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Luggage</p>
                    <p className="font-semibold text-foreground">{booking.luggage_count || 0} Pieces</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer Information
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold text-lg">
                  {getInitials(booking.customer_name)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">{booking.customer_name}</p>
                  <p className="text-sm text-muted-foreground">Guest</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {booking.customer_email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${booking.customer_email}`}
                        className="text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {booking.customer_email}
                      </a>
                    </div>
                  </div>
                )}
                {booking.customer_phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${booking.customer_phone}`}
                        className="text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {booking.customer_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Number */}
              {booking.reference_number && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Hash className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Reference Number</p>
                    <p className="text-sm font-mono font-medium text-primary">{booking.reference_number}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver Details Card (Conditional - shown when assigned) */}
          {booking.booking_assignments && booking.booking_assignments.length > 0 && (
            <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Driver Details
                </h2>
              </div>
              <div className="p-5">
                {hasAcceptedAssignment ? (
                  <>
                    {/* Driver Info */}
                    {assignment.driver && (
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
                          {getInitials(`${assignment.driver.first_name} ${assignment.driver.last_name}`)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-lg">
                              {assignment.driver.first_name} {assignment.driver.last_name}
                            </p>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                              {assignment.status === 'completed' ? 'Completed' : 'Accepted'}
                            </Badge>
                          </div>
                          {assignment.driver.phone && (
                            <a
                              href={`tel:${assignment.driver.phone}`}
                              className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {assignment.driver.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vehicle Details */}
                    {assignment.vehicle && (
                      <>
                        <div className="h-px bg-border my-5" />
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Vehicle Details
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                              <Car className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {assignment.vehicle.make} {assignment.vehicle.model} ({assignment.vehicle.year})
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Registration: <span className="font-mono">{assignment.vehicle.registration_number}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Assignment Timeline */}
                    <div className="h-px bg-border my-5" />
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Assignment Timeline
                      </p>
                      <div className="space-y-2">
                        {assignment.assigned_at && (
                          <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Assigned:</span>
                            <span className="font-medium text-foreground">
                              {format(new Date(assignment.assigned_at), 'MMM d, yyyy')} at {format(new Date(assignment.assigned_at), 'h:mm a')}
                            </span>
                          </div>
                        )}
                        {assignment.accepted_at && (
                          <div className="flex items-center gap-3 text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-muted-foreground">Accepted:</span>
                            <span className="font-medium text-foreground">
                              {format(new Date(assignment.accepted_at), 'MMM d, yyyy')} at {format(new Date(assignment.accepted_at), 'h:mm a')}
                            </span>
                          </div>
                        )}
                        {assignment.completed_at && (
                          <div className="flex items-center gap-3 text-sm">
                            <CheckCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="font-medium text-sky-600 dark:text-sky-400">
                              {format(new Date(assignment.completed_at), 'MMM d, yyyy')} at {format(new Date(assignment.completed_at), 'h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : assignment.status === 'pending' ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Service provider assignment in progress
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Assignment status: {assignment.status}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Booking Status Card */}
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Booking Status
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(booking.booking_status)}
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(booking.created_at), 'MMM d, yyyy')} at {format(new Date(booking.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
                {booking.booking_status === 'confirmed' && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmed</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(booking.updated_at), 'MMM d, yyyy')} at {format(new Date(booking.updated_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                {booking.cancelled_at && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cancelled</p>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {format(new Date(booking.cancelled_at), 'MMM d, yyyy')} at {format(new Date(booking.cancelled_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Pricing
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-medium text-foreground">{formatCurrency(booking.base_price)}</span>
              </div>
              {booking.amenities_price > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amenities</span>
                  <span className="font-medium text-foreground">{formatCurrency(booking.amenities_price)}</span>
                </div>
              )}

              <div className="h-px bg-border my-2" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(booking.total_price)}
                </span>
              </div>

              {booking.wallet_deduction_amount > 0 && (
                <>
                  <div className="h-px bg-border my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wallet Deduction</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(booking.wallet_deduction_amount)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Paid via Wallet
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cancellation Reason Card */}
          {booking.cancellation_reason && (
            <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Cancellation Reason
                </h2>
              </div>
              <div className="p-5">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{booking.cancellation_reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
