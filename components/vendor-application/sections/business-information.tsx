"use client"

import type { UseFormReturn } from "react-hook-form"
import type {
  VendorApplicationFormInput,
  VendorApplicationFormValues,
} from "../schema"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { countries } from "@/lib/constants/countries"
import { SectionShell } from "./section-shell"
import {
  FIELD_BASE,
  FIELD_HELP,
  FIELD_INPUT,
  FIELD_LABEL,
  OptionalTag,
} from "../field-primitives"

type VendorForm = UseFormReturn<
  VendorApplicationFormInput,
  unknown,
  VendorApplicationFormValues
>

export function BusinessInformationSection({ form }: { form: VendorForm }) {
  return (
    <SectionShell
      id="vendor-section-business"
      title="Business information"
      note="Core details about your company."
    >
      <FormField
        control={form.control}
        name="businessName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>Business name</FormLabel>
            <FormControl>
              <Input
                className={FIELD_INPUT}
                placeholder="ABC Car Rentals"
                autoComplete="organization"
                aria-required="true"
                {...field}
              />
            </FormControl>
            <FormDescription className={FIELD_HELP}>
              Your registered business name or trading name.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="registrationNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>Business registration number</FormLabel>
            <FormControl>
              <Input
                className={FIELD_INPUT}
                placeholder="123456789"
                inputMode="numeric"
                autoComplete="off"
                aria-required="true"
                {...field}
              />
            </FormControl>
            <FormDescription className={FIELD_HELP}>
              The company or commercial registration number issued by your licensing authority.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="businessEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Business email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className={FIELD_INPUT}
                  placeholder="contact@business.com"
                  inputMode="email"
                  autoComplete="email"
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Business phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  className={FIELD_INPUT}
                  placeholder="+971 50 123 4567"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-required="true"
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
        name="businessAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>Business address</FormLabel>
            <FormControl>
              <Input
                className={FIELD_INPUT}
                placeholder="123 Main Street, Building A"
                autoComplete="street-address"
                aria-required="true"
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
          name="businessCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>City</FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT}
                  placeholder="Dubai"
                  autoComplete="address-level2"
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessCountryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL}>Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={`h-[52px] ${FIELD_BASE}`}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl>
                {/* The menu was left unstyled, so it painted on shadcn's `bg-popover`
                    rather than the surface every other menu in the product uses. */}
                <SelectContent className="bg-[var(--dropdown-surface)] border-[var(--graphite)] rounded-[4px]">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="businessDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={FIELD_LABEL}>
              Business description
              <OptionalTag />
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell us about your fleet, the vehicles you run, and how long you have been operating."
                className={`${FIELD_BASE} min-h-[100px] resize-none py-3.5 focus-visible:ring-offset-0`}
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
