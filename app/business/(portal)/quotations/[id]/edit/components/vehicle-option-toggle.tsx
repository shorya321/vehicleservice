'use client';

/**
 * "Also offer" control under a vehicle row in the trip editor.
 *
 * A sibling of the row's select button, never nested inside it: a checkbox inside a <button>
 * is invalid HTML and its click would also pick the vehicle as the main one.
 */

import { Checkbox } from '@/components/business/ui/checkbox';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface VehicleOptionToggleProps {
  vehicleId: string;
  vehicleName: string;
  checked: boolean;
  /** False once the trip already offers the maximum number of alternatives. */
  canAdd: boolean;
  /** Sell price in AED, shown in the quotation currency at the locked rate. */
  sellAed: number;
  currency: string;
  exchangeRate: number;
  onToggle: () => void;
}

export function VehicleOptionToggle({
  vehicleId,
  vehicleName,
  checked,
  canAdd,
  sellAed,
  currency,
  exchangeRate,
  onToggle,
}: VehicleOptionToggleProps) {
  const id = `offer-${vehicleId}`;
  const disabled = !checked && !canAdd;

  return (
    <div className="flex items-center justify-between gap-3 px-3 pb-1 text-xs">
      <label
        htmlFor={id}
        className={
          disabled
            ? 'flex cursor-not-allowed items-center gap-2 text-muted-foreground/60'
            : 'flex cursor-pointer items-center gap-2 text-muted-foreground'
        }
      >
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onToggle}
          aria-label={`Also offer ${vehicleName} to the customer`}
        />
        Also offer to the customer
      </label>
      {checked && (
        <span className="tabular-nums text-foreground">
          sells {formatCurrency(sellAed * exchangeRate, currency)}
        </span>
      )}
    </div>
  );
}
