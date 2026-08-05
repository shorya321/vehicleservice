'use client';

/**
 * Customer contact details, editable after the quotation exists.
 *
 * Why this exists: the create form marks email and phone "(optional)" on purpose. An
 * offline quote often starts from a phone call with nothing but a name. But
 * business_bookings.customer_email and customer_phone are NOT NULL, so
 * missingConversionContact blocks conversion without them. Before this card there was no
 * screen anywhere that could set those two columns after creation, which made a
 * name-only quotation permanently unconvertible: the only escape was to delete it and lose
 * the quotation number along with every priced trip.
 *
 * Uncontrolled-style plain inputs rather than react-hook-form, matching the rest of the
 * builder. The builder owns the state and submits the whole header in one go.
 */

import { User } from 'lucide-react';
import { PortalSectionCard } from '@/app/business/(portal)/components/ui/section-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONTACT_PHONE_RE } from '@/lib/business/quotations/status';

/** The four header columns this card owns. Deliberately no wider. See QuotationBuilder. */
export interface QuotationCustomerDraft {
  customer_name: string;
  customer_company: string;
  customer_email: string;
  customer_phone: string;
}

interface CustomerDetailsCardProps {
  value: QuotationCustomerDraft;
  onChange: (next: QuotationCustomerDraft) => void;
  /** Mirrors canEditHeader. A converting or converted quotation is frozen. */
  disabled?: boolean;
}

const CONVERSION_HINT = 'Required to convert this quotation into bookings.';

export function CustomerDetailsCard({ value, onChange, disabled }: CustomerDetailsCardProps) {
  const set = (patch: Partial<QuotationCustomerDraft>) => onChange({ ...value, ...patch });

  const nameTooShort = value.customer_name.trim().length < 2;
  // Same two conditions missingConversionContact applies, split per field so each input can
  // carry its own hint. The regex itself is shared, so this cannot drift from the gate.
  const emailBlocking = value.customer_email.trim() === '';
  const phoneBlocking = !CONTACT_PHONE_RE.test(value.customer_phone.trim());

  return (
    <PortalSectionCard title="Customer" icon={User} bodyClassName="p-5">
      {/* items-start so a two-line hint under one field cannot stretch its neighbour. */}
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quotation-customer-name">Customer name</Label>
          <Input
            id="quotation-customer-name"
            placeholder="Ahmed Khan"
            value={value.customer_name}
            onChange={(e) => set({ customer_name: e.target.value })}
            disabled={disabled}
          />
          {nameTooShort && (
            <p className="text-xs text-destructive">Customer name required</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quotation-customer-company">Company (optional)</Label>
          <Input
            id="quotation-customer-company"
            placeholder="Khan Tours"
            value={value.customer_company}
            onChange={(e) => set({ customer_company: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quotation-customer-email">Email</Label>
          <Input
            id="quotation-customer-email"
            type="email"
            placeholder="ahmed@example.com"
            value={value.customer_email}
            onChange={(e) => set({ customer_email: e.target.value })}
            disabled={disabled}
          />
          <p
            className={
              emailBlocking
                ? 'text-xs text-amber-600 dark:text-amber-400'
                : 'text-xs text-muted-foreground'
            }
          >
            {CONVERSION_HINT}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quotation-customer-phone">Phone</Label>
          <Input
            id="quotation-customer-phone"
            placeholder="+971501234567"
            value={value.customer_phone}
            onChange={(e) => set({ customer_phone: e.target.value })}
            disabled={disabled}
          />
          <p
            className={
              phoneBlocking
                ? 'text-xs text-amber-600 dark:text-amber-400'
                : 'text-xs text-muted-foreground'
            }
          >
            {phoneBlocking
              ? `${CONVERSION_HINT} Use the international format, e.g. +971501234567.`
              : CONVERSION_HINT}
          </p>
        </div>
      </div>
    </PortalSectionCard>
  );
}
