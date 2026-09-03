"use client"

import type { UseFormReturn } from "react-hook-form"
import type {
  VendorApplicationFormInput,
  VendorApplicationFormValues,
} from "../schema"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SectionShell } from "./section-shell"
import { FIELD_INPUT, FIELD_LABEL, OptionalTag } from "../field-primitives"

type VendorForm = UseFormReturn<
  VendorApplicationFormInput,
  unknown,
  VendorApplicationFormValues
>

export function BankingDetailsSection({ form }: { form: VendorForm }) {
  return (
    <SectionShell
      id="vendor-section-banking"
      title="Banking details"
      /* This section is skippable, and the page never said so in its first clause.
         Five fields that can be left empty looked like five fields that could not. */
      note="Skip this section if you would rather. You can add payout details later from your vendor dashboard, and nothing is paid out until you do."
    >
      <FormField
        control={form.control}
        name="bankName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>
              Bank name
              <OptionalTag />
            </FormLabel>
            <FormControl>
              <Input
                className={FIELD_INPUT}
                placeholder="Emirates NBD"
                autoComplete="off"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="accountHolderName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>
              Account holder name
              <OptionalTag />
            </FormLabel>
            <FormControl>
              <Input
                className={FIELD_INPUT}
                placeholder="ABC Car Rentals LLC"
                autoComplete="off"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>
                Account number
                <OptionalTag />
              </FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT}
                  placeholder="1234567890"
                  inputMode="numeric"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="swiftCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>
                SWIFT code
                <OptionalTag />
              </FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT}
                  placeholder="EBILAEAD"
                  autoComplete="off"
                  autoCapitalize="characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="iban"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>
              IBAN
              <OptionalTag />
            </FormLabel>
            <FormControl>
              <Input
                className={FIELD_INPUT}
                placeholder="AE07 0331 2345 6789 0123 456"
                autoComplete="off"
                autoCapitalize="characters"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionShell>
  )
}
