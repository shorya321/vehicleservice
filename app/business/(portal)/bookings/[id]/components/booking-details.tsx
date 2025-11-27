/**
 * Booking Details Component
 * Display comprehensive booking information
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface BookingDetailsProps {
  booking: any;
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
    pending: { label: 'Pending', variant: 'outline' as const, icon: Clock },
    confirmed: { label: 'Confirmed', variant: 'default' as const, icon: CheckCircle },
    assigned: { label: 'Assigned', variant: 'default' as const, icon: CheckCircle },
    in_progress: { label: 'In Progress', variant: 'default' as const, icon: Clock },
    completed: { label: 'Completed', variant: 'secondary' as const, icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
    refunded: { label: 'Refunded', variant: 'outline' as const, icon: XCircle },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: Clock };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
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
        {/* Route Details */}
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[var(--business-success)] mt-0.5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Pickup Location</p>
                <p className="font-medium">{booking.from_locations.name}</p>
                <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[var(--business-error)] mt-0.5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Dropoff Location</p>
                <p className="font-medium">{booking.to_locations.name}</p>
                <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pickup Date & Time</p>
                <p className="font-medium">
                  {format(new Date(booking.pickup_datetime), 'PPP')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(booking.pickup_datetime), 'p')}
                </p>
              </div>
            </div>

            {booking.customer_notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Special Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{booking.customer_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicle & Passengers */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Passengers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold">
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
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Up to {booking.vehicle_types.passenger_capacity || 0} passengers
                  </span>
                  <span className="flex items-center gap-1">
                    <Luggage className="h-3 w-3" />
                    {booking.vehicle_types.luggage_capacity || 0} luggage
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="font-medium">{booking.passenger_count} Passengers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Luggage className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Luggage</p>
                  <p className="font-medium">{booking.luggage_count || 0} Pieces</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.customer_name}</span>
            </div>
            {booking.customer_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.customer_email}</span>
              </div>
            )}
            {booking.customer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.customer_phone}</span>
              </div>
            )}
            {booking.reference_number && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono font-medium">{booking.reference_number}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Provider Information */}
        {booking.booking_assignments && booking.booking_assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Service Provider Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(booking.booking_assignments[0].status === 'accepted' || booking.booking_assignments[0].status === 'completed') ? (
                <>
                  {/* Vendor Information */}
                  {booking.booking_assignments[0].vendor && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Service Provider</p>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{booking.booking_assignments[0].vendor.business_name}</p>
                          {booking.booking_assignments[0].vendor.business_phone && (
                            <p className="text-sm text-muted-foreground">
                              Contact: {booking.booking_assignments[0].vendor.business_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Driver Information */}
                  {booking.booking_assignments[0].driver && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Assigned Driver</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {booking.booking_assignments[0].driver.first_name} {booking.booking_assignments[0].driver.last_name}
                          </p>
                          {booking.booking_assignments[0].driver.phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={`tel:${booking.booking_assignments[0].driver.phone}`}
                                className="text-sm text-blue-600 hover:underline"
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
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Vehicle Details</p>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
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
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">Assignment Timeline</p>
                    <div className="space-y-1.5 text-sm">
                      {booking.booking_assignments[0].assigned_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="font-medium">{format(new Date(booking.booking_assignments[0].assigned_at), 'PPp')}</span>
                        </div>
                      )}
                      {booking.booking_assignments[0].accepted_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-[var(--business-success)]" />
                          <span className="text-muted-foreground">Accepted:</span>
                          <span className="font-medium">{format(new Date(booking.booking_assignments[0].accepted_at), 'PPp')}</span>
                        </div>
                      )}
                      {booking.booking_assignments[0].completed_at && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-[var(--business-info)]" />
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="font-medium text-[var(--business-info)]">{format(new Date(booking.booking_assignments[0].completed_at), 'PPp')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : booking.booking_assignments[0].status === 'pending' ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--business-warning)]/10 mb-3">
                    <Clock className="h-6 w-6 text-[var(--business-warning)]" />
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
        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(booking.booking_status)}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(booking.created_at), 'PPp')}</p>
                </div>
              </div>
              {booking.cancelled_at && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">Cancelled</p>
                    <p className="font-medium">{format(new Date(booking.cancelled_at), 'PPp')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-medium">{formatCurrency(booking.base_price)}</span>
            </div>
            {booking.amenities_price > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amenities</span>
                <span className="font-medium">{formatCurrency(booking.amenities_price)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(booking.total_price)}</span>
            </div>
            {booking.wallet_deduction_amount > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet Deduction</span>
                  <span className="font-medium">{formatCurrency(booking.wallet_deduction_amount)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Reason */}
        {booking.cancellation_reason && (
          <Card>
            <CardHeader>
              <CardTitle>Cancellation Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{booking.cancellation_reason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
