"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useWatch, type Control } from "react-hook-form"
import type { VendorApplicationFormInput, VendorApplicationFormValues } from "./schema"

/**
 * How much of each form section is filled in, for the apply page's rail.
 *
 * The rail and the form are siblings under a server component, so the count travels
 * through context rather than props. The form reports; the rail reads. Outside the
 * provider the reporter is a no-op, which is why the edit form can share sections
 * without carrying any of this.
 */
export interface SectionProgress {
  filled: number
  total: number
}

export interface ApplicationProgress {
  business: SectionProgress
  documents: SectionProgress
  banking: SectionProgress
}

type FieldName = keyof VendorApplicationFormInput

const SECTION_FIELDS: Record<keyof ApplicationProgress, ReadonlyArray<FieldName>> = {
  business: [
    "businessName",
    "registrationNumber",
    "businessEmail",
    "businessPhone",
    "businessAddress",
    "businessCity",
    "businessCountryCode",
    "businessDescription",
  ],
  documents: ["tradeLicenseNumber", "tradeLicenseExpiry", "insurancePolicyNumber", "insuranceExpiry"],
  banking: ["bankName", "accountHolderName", "accountNumber", "swiftCode", "iban"],
}

function isFilled(value: unknown): boolean {
  if (typeof value === "string") return value.trim() !== ""
  return value !== null && value !== undefined
}

function measure(values: Partial<Record<FieldName, unknown>>): ApplicationProgress {
  const count = (fields: ReadonlyArray<FieldName>): SectionProgress => ({
    filled: fields.filter((field) => isFilled(values[field])).length,
    total: fields.length,
  })
  return {
    business: count(SECTION_FIELDS.business),
    documents: count(SECTION_FIELDS.documents),
    banking: count(SECTION_FIELDS.banking),
  }
}

const ProgressValue = createContext<ApplicationProgress | null>(null)
const ProgressSetter = createContext<((progress: ApplicationProgress) => void) | null>(null)

export function ApplicationProgressProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [progress, setProgress] = useState<ApplicationProgress | null>(null)
  return (
    <ProgressSetter.Provider value={setProgress}>
      <ProgressValue.Provider value={progress}>{children}</ProgressValue.Provider>
    </ProgressSetter.Provider>
  )
}

/** Null until the form has mounted, or when rendered outside the provider. */
export function useApplicationProgress(): ApplicationProgress | null {
  return useContext(ProgressValue)
}

/**
 * Its own component so that watching every field re-renders this null leaf on each
 * keystroke, not the whole form.
 */
export function ApplicationProgressReporter({
  control,
}: {
  control: Control<VendorApplicationFormInput, unknown, VendorApplicationFormValues>
}): null {
  const setProgress = useContext(ProgressSetter)
  const values = useWatch({ control })
  const { business, documents, banking } = measure(values as Partial<Record<FieldName, unknown>>)

  // Keyed on the three counts, so a keystroke that does not change a count pushes nothing.
  useEffect(() => {
    setProgress?.({
      business: { filled: business.filled, total: business.total },
      documents: { filled: documents.filled, total: documents.total },
      banking: { filled: banking.filled, total: banking.total },
    })
  }, [
    setProgress,
    business.filled,
    business.total,
    documents.filled,
    documents.total,
    banking.filled,
    banking.total,
  ])

  return null
}
