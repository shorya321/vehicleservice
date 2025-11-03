/**
 * Booking Details Component
 * Display comprehensive booking information
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface BookingDetailsProps {
  booking: any;
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    assigned: { label: 'Assigned', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'default' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
    refunded: { label: 'Refunded', variant: 'outline' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Status and Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getStatusBadge(booking.booking_status)}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(booking.created_at).toLocaleString()}</p>
            </div>
            {booking.cancelled_at && (
              <div>
                <p className="text-muted-foreground">Cancelled</p>
                <p className="font-medium">{new Date(booking.cancelled_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle>Route Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Pickup</p>
            <p className="font-medium">{booking.from_locations.name}</p>
            <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(booking.pickup_datetime).toLocaleString()}
            </p>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-primary mb-1">Dropoff</p>
            <p className="font-medium">{booking.to_locations.name}</p>
            <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle and Passengers */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{booking.vehicle_types.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.vehicle_types.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passengers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Count:</span>{' '}
                <span className="font-medium">{booking.passenger_count}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Luggage:</span>{' '}
                <span className="font-medium">{booking.luggage_count}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Name:</span>{' '}
            <span className="font-medium">{booking.customer_name}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Email:</span>{' '}
            <span className="font-medium">{booking.customer_email}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Phone:</span>{' '}
            <span className="font-medium">{booking.customer_phone}</span>
          </div>
          {booking.reference_number && (
            <div>
              <span className="text-sm text-muted-foreground">Reference:</span>{' '}
              <span className="font-medium">{booking.reference_number}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Price:</span>
            <span>{formatCurrency(booking.base_price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amenities:</span>
            <span>{formatCurrency(booking.amenities_price)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t font-semibold">
            <span>Total Paid:</span>
            <span className="text-primary">{formatCurrency(booking.total_price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wallet Deduction:</span>
            <span>{formatCurrency(booking.wallet_deduction_amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {booking.customer_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{booking.customer_notes}</p>
          </CardContent>
        </Card>
      )}

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
  );
}
