/**
 * Booking Details Component
 * Display comprehensive booking information
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Luggage,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface BookingDetailsProps {
  booking: any;
}

// Status configuration
const statusStyleConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: {
    label: 'Pending',
    className: 'bg-primary/10 text-primary border-primary/30',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    icon: CheckCircle,
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-muted text-muted-foreground border-border',
    icon: XCircle,
  },
};

function getStatusBadge(status: string) {
  const config = statusStyleConfig[status] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1 rounded-full px-3 py-1 border', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        {/* Route Details Card */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Route Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Pickup Location</p>
                <p className="font-medium text-foreground">{booking.from_locations.name}</p>
                <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Dropoff Location</p>
                <p className="font-medium text-foreground">{booking.to_locations.name}</p>
                <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pickup Date & Time</p>
                <p className="font-medium text-foreground">
                  {format(new Date(booking.pickup_datetime), 'PPP')}
                </p>
                <p className="text-sm text-primary">
                  {format(new Date(booking.pickup_datetime), 'p')}
                </p>
              </div>
            </div>

            {booking.customer_notes && (
              <>
                <Separator className="bg-border" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Special Instructions</p>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{booking.customer_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicle & Passengers Card */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vehicle & Passengers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-sky-500/10">
                <Car className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {booking.vehicle_types.vehicle_categories?.name && (
                      <span className="text-primary">{booking.vehicle_types.vehicle_categories.name} - </span>
                    )}
                    {booking.vehicle_types.name}
                  </p>
                  {booking.vehicle_types.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.vehicle_types.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    Up to {booking.vehicle_types.passenger_capacity || 0} passengers
                  </span>
                  <span className="flex items-center gap-1">
                    <Luggage className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    {booking.vehicle_types.luggage_capacity || 0} luggage
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="font-medium text-foreground">{booking.passenger_count} Passengers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Luggage className="h-4 w-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Luggage</p>
                  <p className="font-medium text-foreground">{booking.luggage_count || 0} Pieces</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information Card */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="font-medium text-foreground">{booking.customer_name}</span>
            </div>
            {booking.customer_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{booking.customer_email}</span>
              </div>
            )}
            {booking.customer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{booking.customer_phone}</span>
              </div>
            )}
            {booking.reference_number && (
              <>
                <Separator className="bg-border" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono font-medium text-primary">{booking.reference_number}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Provider Information Card */}
        {booking.booking_assignments && booking.booking_assignments.length > 0 && (
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Driver Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(booking.booking_assignments[0].status === 'accepted' || booking.booking_assignments[0].status === 'completed') ? (
                <>
                  {/* Driver Information */}
                  {booking.booking_assignments[0].driver && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Assigned Driver</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">
                            {booking.booking_assignments[0].driver.first_name} {booking.booking_assignments[0].driver.last_name}
                          </p>
                          {booking.booking_assignments[0].driver.phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={`tel:${booking.booking_assignments[0].driver.phone}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {booking.booking_assignments[0].driver.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Details */}
                  {booking.booking_assignments[0].vehicle && (
                    <>
                      <Separator className="bg-border" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Vehicle Details</p>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          <div>
                            <p className="font-medium text-foreground">
                              {booking.booking_assignments[0].vehicle.make} {booking.booking_assignments[0].vehicle.model} ({booking.booking_assignments[0].vehicle.year})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Registration: {booking.booking_assignments[0].vehicle.registration_number}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Assignment Timeline */}
                  <Separator className="bg-border" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">Assignment Timeline</p>
                    <div className="space-y-1.5 text-sm">
                      {booking.booking_assignments[0].assigned_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="font-medium text-foreground">{format(new Date(booking.booking_assignments[0].assigned_at), 'PPp')}</span>
                        </div>
                      )}
                      {booking.booking_assignments[0].accepted_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-muted-foreground">Accepted:</span>
                          <span className="font-medium text-foreground">{format(new Date(booking.booking_assignments[0].accepted_at), 'PPp')}</span>
                        </div>
                      )}
                      {booking.booking_assignments[0].completed_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="font-medium text-sky-600 dark:text-sky-400">{format(new Date(booking.booking_assignments[0].completed_at), 'PPp')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : booking.booking_assignments[0].status === 'pending' ? (
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
                  Assignment status: {booking.booking_assignments[0].status}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar - Right Side */}
      <div className="space-y-6">
        {/* Booking Status Card */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Booking Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(booking.booking_status)}
            </div>

            <Separator className="bg-border" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">{format(new Date(booking.created_at), 'PPp')}</p>
                </div>
              </div>
              {booking.cancelled_at && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">Cancelled</p>
                    <p className="font-medium text-red-600 dark:text-red-400">{format(new Date(booking.cancelled_at), 'PPp')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-medium text-foreground">{formatCurrency(booking.base_price)}</span>
            </div>
            {booking.amenities_price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amenities</span>
                <span className="font-medium text-foreground">{formatCurrency(booking.amenities_price)}</span>
              </div>
            )}
            <Separator className="bg-border" />
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total Amount</span>
              <span className="font-bold text-xl text-primary">
                {formatCurrency(booking.total_price)}
              </span>
            </div>
            {booking.wallet_deduction_amount > 0 && (
              <>
                <Separator className="bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet Deduction</span>
                  <span className="font-medium text-foreground">{formatCurrency(booking.wallet_deduction_amount)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Reason Card */}
        {booking.cancellation_reason && (
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cancellation Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{booking.cancellation_reason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
