'use client'

import { useReducedMotion } from 'motion/react'
import {
  CARD_LABEL,
  CardMotion,
  Field,
  SEGMENT_CAPTION,
  SEGMENT_VALUE,
} from '@/components/booking/itinerary-primitives'
import { cn } from '@/lib/utils'
import { formatBookingDate } from '@/lib/utils/timezone'
import {
  expiryState,
  formatCalendarDate,
  maskTail,
  type ApplicationStatus,
} from '@/lib/vendor-application/status'
import { STUB_BODY, STUB_PLATE, StubPerf } from './stub-plate'

/**
 * Business and Licensing read as reference data, not as an itinerary, so their values sit a step
 * below SEGMENT_VALUE's title role. Settlement and Review keep the shared size deliberately.
 *
 * `leading-snug` is restated because tailwind-merge treats a font-size utility as conflicting with
 * `leading-*` (text-sm carries its own line-height), so without it the size change would quietly
 * loosen the leading as well.
 */
const DOSSIER_VALUE = 'text-sm leading-snug'

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

/** One superseded decision, as archive_vendor_application_review() writes it. */
export interface VendorApplicationReviewEntry {
  status?: string | null
  rejection_reason?: string | null
  admin_notes?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  resubmitted_at?: string | null
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
  review_history?: VendorApplicationReviewEntry[] | null
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
  const history = [...(application.review_history ?? [])].reverse()
  const maskedAccount = maskTail(banking.account_number)
  const maskedIban = maskTail(banking.iban)
  const hasSettlement = Boolean(
    banking.bank_name || banking.account_holder_name || maskedAccount || maskedIban || banking.swift_code
  )

  // How many of each card's rows the applicant filled, counted the way the card renders them:
  // address and city are one Location row, and each licence or policy is a number and an expiry.
  const businessFilled = filledLabel([
    application.business_name,
    application.registration_number,
    application.business_email,
    application.business_phone,
    location,
    application.business_description,
  ])
  const licensingFilled = filledLabel([
    documents.trade_license_number,
    documents.trade_license_expiry,
    documents.insurance_policy_number,
    documents.insurance_expiry,
  ])

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
        caption={
          edited
            ? `Edited ${formatBookingDate(application.updated_at)}, ${businessFilled}`
            : businessFilled
        }
        delay={0.15}
        reduceMotion={reduceMotion}
      >
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <Field label="Legal name" value={application.business_name} valueClassName={DOSSIER_VALUE} />
          {application.registration_number && (
            <Field
              label="Registration number"
              value={application.registration_number}
              numeric
              valueClassName={DOSSIER_VALUE}
            />
          )}
          {application.business_email && (
            <Field label="Email" value={application.business_email} valueClassName={DOSSIER_VALUE} />
          )}
          {application.business_phone && (
            <Field label="Phone" value={application.business_phone} numeric valueClassName={DOSSIER_VALUE} />
          )}
          {location && <Field label="Location" value={location} valueClassName={DOSSIER_VALUE} />}
          {application.business_description && (
            <Field
              label="Description"
              value={application.business_description}
              className="sm:col-span-2"
              valueClassName={DOSSIER_VALUE}
            />
          )}
        </dl>
      </DossierCard>

      {hasLicensing && (
        <DossierCard
          id="licensing"
          heading="Licensing"
          caption={licensingFilled}
          delay={0.2}
          reduceMotion={reduceMotion}
        >
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {documents.trade_license_number && (
              <Field
                label="Trade licence"
                value={documents.trade_license_number}
                numeric
                valueClassName={DOSSIER_VALUE}
              />
            )}
            <ExpiryField label="Licence expires" value={documents.trade_license_expiry} />
            {documents.insurance_policy_number && (
              <Field
                label="Insurance policy"
                value={documents.insurance_policy_number}
                numeric
                valueClassName={DOSSIER_VALUE}
              />
            )}
            <ExpiryField label="Policy expires" value={documents.insurance_expiry} />
          </dl>
        </DossierCard>
      )}

      {/* Bank details are skippable at application, and the page used to drop the whole
          section when they were skipped, so the one gap the applicant still has to fill
          was the one thing it never mentioned. */}
      {!hasSettlement && (
        <DossierCard
          id="settlement"
          heading="Settlement"
          chip="Not added"
          delay={0.25}
          reduceMotion={reduceMotion}
        >
          <p className="max-w-[52ch] text-sm leading-relaxed text-[var(--text-secondary)]">
            {status === 'approved'
              ? 'Bank details were skipped at application. Add them from your vendor dashboard before your first payout.'
              : 'Bank details were skipped at application. Add them from your vendor dashboard once you are approved, before your first payout.'}
          </p>
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

      {/* A resubmission clears the live decision, so without this the feedback the applicant
          is answering would vanish the moment they answered it. Newest first. */}
      {history.length > 0 && (
        <DossierCard
          id="history"
          heading={history.length === 1 ? 'Previous decision' : 'Previous decisions'}
          delay={0.25}
          reduceMotion={reduceMotion}
        >
          <ol className="m-0 list-none space-y-5 p-0">
            {history.map((entry, index) => (
              <li key={entry.resubmitted_at ?? entry.reviewed_at ?? index}>
                <p className={SEGMENT_CAPTION}>
                  {entry.reviewed_at ? formatBookingDate(entry.reviewed_at) : 'Not approved'}
                </p>
                {entry.rejection_reason && (
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                    {entry.rejection_reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
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

/** "5 of 6 fields": filled rows over the rows the card can show. */
function filledLabel(values: ReadonlyArray<string | null | undefined>): string {
  const filled = values.filter((value) => Boolean(value?.trim())).length
  return `${filled} of ${values.length} fields`
}

/**
 * Card shell, on the checkout stub: the cap carries the only heading and an optional caption or
 * chip, the tear, then one body band. No icons.
 */
function DossierCard({
  id,
  heading,
  caption,
  chip,
  delay,
  reduceMotion,
  children,
}: {
  id: string
  heading: string
  caption?: string
  chip?: string
  delay: number
  reduceMotion: boolean
  children: React.ReactNode
}) {
  return (
    <CardMotion
      reduceMotion={reduceMotion}
      delay={delay}
      aria-labelledby={`${id}-heading`}
      className={STUB_PLATE}
    >
      <div className="checkout-stub-cap">
        <h2 id={`${id}-heading`} className="checkout-stub-ref">
          {heading}
        </h2>
        {chip ? (
          <span className="account-chip self-center">{chip}</span>
        ) : (
          caption && <span className="checkout-stub-ref">{caption}</span>
        )}
      </div>
      <StubPerf />
      <div className={STUB_BODY}>{children}</div>
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
      <dd className={cn('numeric', SEGMENT_VALUE, DOSSIER_VALUE)}>{formatted}</dd>
      {state.kind === 'lapsed' && (
        <dd className="mt-2">
          <span className="account-chip account-chip-alert">{state.label}</span>
        </dd>
      )}
      {state.kind === 'due' && <dd className={SEGMENT_CAPTION}>{state.label}</dd>}
    </div>
  )
}
