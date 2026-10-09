'use client';

/**
 * Pick which offered vehicle a trip is booked with, inside the convert dialog.
 *
 * Rendered only for a trip that offers alternatives. Each choice shows what the customer was
 * quoted (sell) next to what the wallet will be charged now (fresh cost), so the business can
 * see a loss before confirming.
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/business/wallet-operations';
import type { QuotationRepriceChoice } from '@/lib/business/quotations/types';

interface VehicleChoiceProps {
  itemId: string;
  choices: QuotationRepriceChoice[];
  value: string;
  disabled: boolean;
  onChange: (vehicleTypeId: string) => void;
}

export function VehicleChoice({ itemId, choices, value, disabled, onChange }: VehicleChoiceProps) {
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Vehicle the customer chose
      </div>
      <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="gap-2">
        {choices.map((choice) => {
          const id = `choice-${itemId}-${choice.vehicleTypeId}`;
          return (
            <div key={choice.vehicleTypeId} className="flex items-start gap-2">
              <RadioGroupItem value={choice.vehicleTypeId} id={id} className="mt-0.5" />
              <Label htmlFor={id} className="flex flex-1 flex-wrap justify-between gap-x-3 font-normal">
                <span>
                  {choice.name}
                  {choice.quoted && <span className="text-muted-foreground"> (quoted)</span>}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  sells {formatCurrency(choice.sellAed, 'AED')}
                  {choice.netAedFresh !== null &&
                    ` · cost ${formatCurrency(choice.netAedFresh, 'AED')}`}
                </span>
                {choice.error && (
                  <span className="w-full text-xs text-destructive">{choice.error}</span>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
