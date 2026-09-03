'use client'

import { useReducedMotion } from 'motion/react'
import {
  BAND,
  CARD,
  CARD_LABEL,
  CardMotion,
  Field,
  SEGMENT_CAPTION,
  SEGMENT_VALUE,
} from '@/components/booking/itinerary-primitives'
import { formatBookingDate } from '@/lib/utils/timezone'
import {
  expiryState,
  formatCalendarDate,
  maskTail,
  type ApplicationStatus,
} from '@/lib/vendor-application/status'

export interface VendorApplicationDocuments {
  trade_license_number?: string | null
  trade_license_expiry?: string | null
  insurance_policy_number?: string | null
  insurance_expiry?: string | null
}

export interface VendorApplicationBanking {
  bank_name?: string | null
  account_holder_name?: string | null
  account_number?: string | null
  iban?: string | null
  swift_code?: string | null
}

export interface VendorApplicationRow {
  created_at: string
  updated_at: string
  business_name: string
  registration_number?: string | null
  business_email?: string | null
  business_phone?: string | null
  business_address?: string | null
  business_city?: string | null
  business_description?: string | null
  documents?: VendorApplicationDocuments | null
  banking_details?: VendorApplicationBanking | null
  rejection_reason?: string | null
  reviewed_at?: string | null
  admin_notes?: string | null
  reviewer?: { full_name?: string | null; email?: string | null } | null
}

/**
 * The dossier.
 *
 * Everything the applicant handed over, read back to them. The page previously showed four of the
 * fifteen fields it collects, while its own actions card offered to update "your documents" and
 * displayed none of them. Bank identifiers are masked to their last four.
 */
export function ApplicationDossier({
  application,
  status,
  className,
}: {
  application: VendorApplicationRow
  status: ApplicationStatus
  className?: string
}) {
  const reduceMotion = useReducedMotion() ?? false

  const documents = application.documents ?? {}
  const banking = application.banking_details ?? {}

  const location = [application.business_address, application.business_city].filter(Boolean).join(', ')
  const edited = application.updated_at > application.created_at

  const hasLicensing = Boolean(
    documents.trade_license_number ||
      documents.trade_license_expiry ||
      documents.insurance_policy_number ||
      documents.insurance_expiry
  )
  const maskedAccount = maskTail(banking.account_number)
  const maskedIban = maskTail(banking.iban)
  const hasSettlement = Boolean(
    banking.bank_name || banking.account_holder_name || maskedAccount || maskedIban || banking.swift_code
  )

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {status === 'rejected' && application.rejection_reason && (
        <DossierCard
          id="reason"
          heading="Why it was not approved"
          delay={0.1}
          reduceMotion={reduceMotion}
        >
          <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
            {application.rejection_reason}
          </p>
        </DossierCard>
      )}

      <DossierCard
        id="business"
        heading="Business"
        caption={edited ? `Edited ${formatBookingDate(application.updated_at)}` : undefined}
        delay={0.15}
        reduceMotion={reduceMotion}
      >
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <Field label="Legal name" value={application.business_name} />
          {application.registration_number && (
            <Field label="Registration number" value={application.registration_number} numeric />
          )}
          {application.business_email && <Field label="Email" value={application.business_email} />}
          {application.business_phone && <Field label="Phone" value={application.business_phone} numeric />}
          {location && <Field label="Location" value={location} />}
          {application.business_description && (
            <Field label="Description" value={application.business_description} className="sm:col-span-2" />
          )}
        </dl>
      </DossierCard>

      {hasLicensing && (
        <DossierCard id="licensing" heading="Licensing" delay={0.2} reduceMotion={reduceMotion}>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {documents.trade_license_number && (
              <Field label="Trade licence" value={documents.trade_license_number} numeric />
            )}
            <ExpiryField label="Licence expires" value={documents.trade_license_expiry} />
            {documents.insurance_policy_number && (
              <Field label="Insurance policy" value={documents.insurance_policy_number} numeric />
            )}
            <ExpiryField label="Policy expires" value={documents.insurance_expiry} />
          </dl>
        </DossierCard>
      )}

      {hasSettlement && (
        <DossierCard
          id="settlement"
          heading="Settlement"
          caption="Shown masked"
          delay={0.25}
          reduceMotion={reduceMotion}
        >
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {banking.bank_name && <Field label="Bank" value={banking.bank_name} />}
            {banking.account_holder_name && (
              <Field label="Account holder" value={banking.account_holder_name} />
            )}
            {maskedAccount && <Field label="Account number" value={maskedAccount} numeric />}
            {maskedIban && <Field label="IBAN" value={maskedIban} numeric />}
            {banking.swift_code && <Field label="SWIFT" value={banking.swift_code} numeric />}
          </dl>
        </DossierCard>
      )}

      {application.reviewed_at && (
        <DossierCard id="review" heading="Review" delay={0.3} reduceMotion={reduceMotion}>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Field label="Reviewed on" value={formatBookingDate(application.reviewed_at)} numeric />
            {application.reviewer && (
              <Field
                label="Reviewed by"
                value={application.reviewer.full_name || application.reviewer.email || 'Our team'}
              />
            )}
            {application.admin_notes && (
              <Field label="Notes" value={application.admin_notes} className="sm:col-span-2" />
            )}
          </dl>
        </DossierCard>
      )}
    </div>
  )
}

/** Card shell: a header band carrying the only heading, then one body band. No icons. */
function DossierCard({
  id,
  heading,
  caption,
  delay,
  reduceMotion,
  children,
}: {
  id: string
  heading: string
  caption?: string
  delay: number
  reduceMotion: boolean
  children: React.ReactNode
}) {
  return (
    <CardMotion
      reduceMotion={reduceMotion}
      delay={delay}
      aria-labelledby={`${id}-heading`}
      className={CARD}
    >
      <div
        className={`${BAND} flex items-baseline justify-between gap-4 border-b border-[rgba(var(--gold-rgb),0.1)]`}
      >
        <h2 id={`${id}-heading`} className={CARD_LABEL}>
          {heading}
        </h2>
        {caption && <span className="text-[0.75rem] text-[var(--text-muted)]">{caption}</span>}
      </div>
      <div className={BAND}>{children}</div>
    </CardMotion>
  )
}

/**
 * An expiry reads as a date first and a warning second. Colour is spent only once the document has
 * actually lapsed; inside sixty days it is a muted caption, and beyond that it says nothing.
 */
function ExpiryField({ label, value }: { label: string; value: string | null | undefined }) {
  const formatted = formatCalendarDate(value)
  if (!formatted) return null

  const state = expiryState(value)

  return (
    <div className="min-w-0">
      <dt className={CARD_LABEL}>{label}</dt>
      <dd className={`numeric ${SEGMENT_VALUE}`}>{formatted}</dd>
      {state.kind === 'lapsed' && (
        <dd className="mt-2">
          <span className="account-chip account-chip-alert">{state.label}</span>
        </dd>
      )}
      {state.kind === 'due' && <dd className={SEGMENT_CAPTION}>{state.label}</dd>}
    </div>
  )
}
