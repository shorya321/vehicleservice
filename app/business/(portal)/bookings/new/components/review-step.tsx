'use client';

/**
 * Review Step Component
 * Final review and confirmation before booking
 *
 * Design: shadcn/ui theme-aware components
 */

import { AlertCircle, CheckCircle2, Loader2, Route, Car, Users, User, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="p-5 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Route</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 mt-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">From:</span>
              <p className="font-medium text-foreground">
                {fromLocation?.name} - {formData.pickup_address}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 mt-2 rounded-full bg-rose-500 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">To:</span>
              <p className="font-medium text-foreground">
                {toLocation?.name} - {formData.dropoff_address}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 mt-2 rounded-full bg-sky-500 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Pickup:</span>
              <p className="font-medium text-foreground">
                {new Date(formData.pickup_datetime).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle & Passengers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-5 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Vehicle</h3>
          </div>
          <p className="text-lg font-semibold text-foreground">{vehicleType?.name}</p>
          <p className="text-sm text-muted-foreground">{vehicleType?.description}</p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <Users className="h-5 w-5 text-sky-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Passengers</h3>
          </div>
          <div className="text-sm space-y-1">
            <p className="text-foreground">{formData.passenger_count} passenger(s)</p>
            <p className="text-foreground">{formData.luggage_count} luggage</p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-5 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <User className="h-5 w-5 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Customer Information</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>
            <p className="font-medium text-foreground">{formData.customer_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>
            <p className="font-medium text-foreground">{formData.customer_email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>
            <p className="font-medium text-foreground">{formData.customer_phone}</p>
          </div>
          {formData.reference_number && (
            <div>
              <span className="text-muted-foreground">Reference:</span>
              <p className="font-medium text-foreground">{formData.reference_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="p-5 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Receipt className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Pricing</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Price:</span>
            <span className="text-foreground font-medium">{formatCurrency(formData.base_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amenities:</span>
            <span className="text-foreground font-medium">{formatCurrency(formData.amenities_price)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border text-lg font-bold">
            <span className="text-foreground">Total:</span>
            <span className="text-primary">{formatCurrency(formData.total_price)}</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance Check */}
      {hasBalance ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">Sufficient Balance</h4>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                Current balance: <span className="font-semibold">{formatCurrency(walletBalance)}</span>
              </p>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                After booking: <span className="font-semibold">{formatCurrency(remainingBalance)}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h4 className="font-semibold text-rose-600 dark:text-rose-400">Insufficient Balance</h4>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                Current balance: <span className="font-semibold">{formatCurrency(walletBalance)}</span>
              </p>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                Required: <span className="font-semibold">{formatCurrency(formData.total_price)}</span>
              </p>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                Shortfall: <span className="font-semibold">{formatCurrency(formData.total_price - walletBalance)}</span>
              </p>
            </div>
          </div>
        </div>
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
