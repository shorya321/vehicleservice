"use client"

import type { UseFormReturn } from "react-hook-form"
import type {
  VendorApplicationFormInput,
  VendorApplicationFormValues,
} from "../schema"
import { parse, format } from "date-fns"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormDatePicker } from "@/components/ui/form-date-picker"
import { bookingTodayAsCalendarDate } from "@/lib/utils/timezone"
import { SectionShell } from "./section-shell"
import { FIELD_HELP, FIELD_INPUT, FIELD_LABEL } from "../field-primitives"

type VendorForm = UseFormReturn<
  VendorApplicationFormInput,
  unknown,
  VendorApplicationFormValues
>

/** Both pickers already disable the past, so the helper text says the one thing the
 *  calendar cannot: which document the date comes off. "Must be a future date"
 *  appeared twice and restated a rule the control enforces. */
const expiryPickerProps = {
  disabled: (date: Date) => date < bookingTodayAsCalendarDate(),
  placeholder: "Select expiry date",
  className: FIELD_INPUT,
  captionLayout: "dropdown" as const,
  startMonth: new Date(),
  endMonth: new Date(new Date().getFullYear() + 10, 11),
}

export function VerificationDocumentsSection({ form }: { form: VendorForm }) {
  return (
    <SectionShell
      id="vendor-section-documents"
      title="Verification documents"
      note="Read by our review team only. Both must still be current on the day you apply."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="tradeLicenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Trade licence number</FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT}
                  placeholder="TL-123456789"
                  autoComplete="off"
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormDescription className={FIELD_HELP}>
                Found on your trade licence document.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tradeLicenseExpiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Trade licence expiry</FormLabel>
              <FormControl>
                <FormDatePicker
                  value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : undefined}
                  onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  {...expiryPickerProps}
                />
              </FormControl>
              <FormDescription className={FIELD_HELP}>
                As printed on the licence.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="insurancePolicyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Insurance policy number</FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT}
                  placeholder="INS-123456789"
                  autoComplete="off"
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormDescription className={FIELD_HELP}>
                As printed on your policy schedule.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="insuranceExpiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Insurance expiry</FormLabel>
              <FormControl>
                <FormDatePicker
                  value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : undefined}
                  onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  {...expiryPickerProps}
                />
              </FormControl>
              <FormDescription className={FIELD_HELP}>
                As printed on the policy.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </SectionShell>
  )
}
