'use client';

/**
 * Review Step Component
 * Final review and confirmation before booking
 *
 * Design: shadcn/ui theme-aware components
 */

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency, hasSufficientBalance } from '@/lib/business/wallet-operations';
import { BookingFormData } from './booking-wizard';
import { VehicleTypeResult, ZoneInfo } from '../actions';

interface Location {
  id: string;
  name: string;
  city: string;
}

interface ReviewStepProps {
  formData: BookingFormData;
  walletBalance: number;
  locations: Location[];
  vehicleTypes: VehicleTypeResult[];
  zoneInfo?: ZoneInfo;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({
  formData,
  walletBalance,
  locations,
  vehicleTypes,
  zoneInfo,
  onBack,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const fromLocation = locations.find((l) => l.id === formData.from_location_id);
  const toLocation = locations.find((l) => l.id === formData.to_location_id);
  const vehicleType = vehicleTypes.find((v) => v.id === formData.vehicle_type_id);

  const hasBalance = hasSufficientBalance(walletBalance, formData.total_price);
  const remainingBalance = walletBalance - formData.total_price;

  return (
    <div className="space-y-6">
      {/* Route Summary */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3 text-foreground">Route</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-business-label">From:</span>{' '}
            <span className="font-medium text-foreground">
              {fromLocation?.name} - {formData.pickup_address}
            </span>
          </div>
          <div>
            <span className="text-business-label">To:</span>{' '}
            <span className="font-medium text-foreground">
              {toLocation?.name} - {formData.dropoff_address}
            </span>
          </div>
          <div>
            <span className="text-business-label">Pickup:</span>{' '}
            <span className="font-medium text-foreground">
              {new Date(formData.pickup_datetime).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle & Passengers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3 text-foreground">Vehicle</h3>
          <p className="text-sm font-medium text-foreground">{vehicleType?.name}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3 text-foreground">Passengers</h3>
          <div className="text-sm space-y-1">
            <p className="text-foreground">{formData.passenger_count} passenger(s)</p>
            <p className="text-foreground">{formData.luggage_count} luggage</p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3 text-foreground">Customer Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-business-label">Name:</span>{' '}
            <span className="font-medium text-foreground">{formData.customer_name}</span>
          </div>
          <div>
            <span className="text-business-label">Email:</span>{' '}
            <span className="font-medium text-foreground">{formData.customer_email}</span>
          </div>
          <div>
            <span className="text-business-label">Phone:</span>{' '}
            <span className="font-medium text-foreground">{formData.customer_phone}</span>
          </div>
          {formData.reference_number && (
            <div>
              <span className="text-business-label">Reference:</span>{' '}
              <span className="font-medium text-foreground">{formData.reference_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3 text-foreground">Pricing</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-business-label">Base Price:</span>
            <span className="text-foreground">{formatCurrency(formData.base_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-business-label">Amenities:</span>
            <span className="text-foreground">{formatCurrency(formData.amenities_price)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t font-semibold text-base">
            <span className="text-foreground">Total:</span>
            <span className="text-primary">{formatCurrency(formData.total_price)}</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance Check */}
      {hasBalance ? (
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">Sufficient Balance</AlertTitle>
          <AlertDescription className="text-green-600/80 dark:text-green-400/80">
            Current balance: {formatCurrency(walletBalance)}
            <br />
            After booking: {formatCurrency(remainingBalance)}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Current balance: {formatCurrency(walletBalance)}
            <br />
            Required: {formatCurrency(formData.total_price)}
            <br />
            Shortfall: {formatCurrency(formData.total_price - walletBalance)}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={!hasBalance || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Booking...
            </>
          ) : (
            'Confirm & Create Booking'
          )}
        </Button>
      </div>
    </div>
  );
}
