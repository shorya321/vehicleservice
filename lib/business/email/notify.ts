/**
 * One call per booking event, fanning out to everyone on the business side.
 *
 * The alternative was the pattern already in the codebase: an owner send and a passenger
 * send written next to each other at every call site, with nothing checking that both are
 * there. That pattern has failed twice, and both failures are recorded in the comments
 * left behind - bulk cancellation once sent only the passenger copy, and assigning a
 * vendor once notified the vendor and the driver and left the business hearing nothing.
 * Adding a third audience to a pattern with that record triples the surface.
 *
 * So the fan-out is here, once per event, and a call site cannot forget half of it.
 *
 * Deliberately NOT a generic sendToBusinessSide(template, props) helper. The transport
 * guard in tests/email/platform-only.test.ts reads the routing decision out of the source
 * of each exported sender; a generic passthrough would move that decision somewhere the
 * guard cannot attribute to an event, and the whole creator audience would go unchecked.
 * Each function below therefore calls two named, individually guarded senders.
 *
 * Nothing here throws. A booking that succeeded must not be reported as failed because a
 * mail server was unreachable, and one bad staff address must not cost the owner their
 * copy.
 */

import {
  sendBusinessBookingConfirmationEmail,
  sendBusinessCreatorBookingConfirmationEmail,
  sendBusinessBookingCancellationEmail,
  sendBusinessCreatorBookingCancellationEmail,
  sendBusinessBookingStatusUpdateEmail,
  sendBusinessCreatorBookingStatusUpdateEmail,
  sendBusinessDriverAssignedEmail,
  sendBusinessCreatorDriverAssignedEmail,
  sendBusinessVendorRejectedEmail,
  sendBusinessCreatorVendorRejectedEmail,
  sendBusinessBookingDatetimeChangedEmail,
  sendBusinessCreatorDatetimeChangedEmail,
  type BusinessBookingConfirmationEmailData,
  type BusinessBookingCancellationEmailData,
} from './services/business-emails';
import { creatorWantsStatus } from './recipients';
import type { BusinessSideRecipients } from './recipients';
import type { EmailResult } from './platform';
import type {
  BusinessBookingStatusUpdateEmailData,
  BusinessDriverAssignedEmailData,
  BusinessVendorAssignmentEmailData,
  BusinessBookingDatetimeChangedEmailData,
} from './types';

/**
 * Both sends, reported separately.
 *
 * `creator: null` means no second copy was owed - the owner booked it, they acted on it
 * themselves, or they share the owner's mailbox. It does not mean a send failed; a failed
 * send is an EmailResult with success false.
 */
export interface BusinessSideNotifyResult {
  owner: EmailResult | null;
  creator: EmailResult | null;
}

/** The address is decided by the recipients, so callers never pass one. */
type Unaddressed<T> = Omit<T, 'email' | 'bookedBy'>;

/**
 * Run one send without letting it escape.
 *
 * Logged rather than swallowed silently: a staff member not receiving mail is invisible
 * from the outside, and this line is the only place it becomes visible.
 */
async function attempt(
  label: string,
  send: () => Promise<EmailResult>
): Promise<EmailResult | null> {
  try {
    return await send();
  } catch (error: unknown) {
    console.error(`Failed to send ${label}:`, error);
    return null;
  }
}

/** A new booking, to the owner and to whoever created it. */
export async function notifyBusinessBookingCreated(
  recipients: BusinessSideRecipients,
  data: Unaddressed<BusinessBookingConfirmationEmailData>
): Promise<BusinessSideNotifyResult> {
  const { newBalance, ...shared } = data;

  const [owner, creator] = await Promise.all([
    recipients.owner
      ? attempt('business booking confirmation', () =>
          sendBusinessBookingConfirmationEmail({
            ...shared,
            newBalance,
            email: recipients.owner!.email,
            bookedBy: recipients.bookedBy ?? undefined,
          })
        )
      : Promise.resolve(null),
    recipients.creator
      ? attempt('staff booking confirmation', () =>
          // newBalance is not merely omitted here, it is absent from the parameter type:
          // the tenant's running balance is owner-only.
          sendBusinessCreatorBookingConfirmationEmail({
            ...shared,
            email: recipients.creator!.email,
          })
        )
      : Promise.resolve(null),
  ]);

  return { owner, creator };
}

/** A cancellation, to the owner and to whoever created the booking. */
export async function notifyBusinessBookingCancelled(
  recipients: BusinessSideRecipients,
  data: Unaddressed<BusinessBookingCancellationEmailData>
): Promise<BusinessSideNotifyResult> {
  const { newBalance, walletUrl, ...shared } = data;

  const [owner, creator] = await Promise.all([
    recipients.owner
      ? attempt('business booking cancellation', () =>
          sendBusinessBookingCancellationEmail({
            ...shared,
            newBalance,
            walletUrl,
            email: recipients.owner!.email,
            bookedBy: recipients.bookedBy ?? undefined,
          })
        )
      : Promise.resolve(null),
    recipients.creator
      ? attempt('staff booking cancellation', () =>
          sendBusinessCreatorBookingCancellationEmail({
            ...shared,
            email: recipients.creator!.email,
          })
        )
      : Promise.resolve(null),
  ]);

  return { owner, creator };
}

/**
 * A status change, to the owner always and to the creator only when it is one they were
 * scoped to.
 *
 * The gate is here rather than at the call sites because the underlying owner sender
 * carries every status in the system, completion included. Without it, wiring the creator
 * into that one sender would quietly subscribe staff to statuses they were deliberately
 * excluded from.
 */
export async function notifyBusinessBookingStatus(
  recipients: BusinessSideRecipients,
  data: Unaddressed<BusinessBookingStatusUpdateEmailData>
): Promise<BusinessSideNotifyResult> {
  const [owner, creator] = await Promise.all([
    recipients.owner
      ? attempt('business status update', () =>
          sendBusinessBookingStatusUpdateEmail({
            ...data,
            email: recipients.owner!.email,
            bookedBy: recipients.bookedBy ?? undefined,
          })
        )
      : Promise.resolve(null),
    recipients.creator && creatorWantsStatus(data.newStatus)
      ? attempt('staff status update', () =>
          sendBusinessCreatorBookingStatusUpdateEmail({
            ...data,
            email: recipients.creator!.email,
          })
        )
      : Promise.resolve(null),
  ]);

  return { owner, creator };
}

/**
 * A driver, to the owner and to whoever created the booking.
 *
 * The highest-value one in this file: the driver's name and number is what the guest
 * phones to ask for, and the staff member who booked it is who answers.
 *
 * This sender addresses through `businessEmail` rather than `email`, an inconsistency
 * inherited from the existing data type and left alone here.
 */
export async function notifyBusinessDriverAssigned(
  recipients: BusinessSideRecipients,
  data: Omit<BusinessDriverAssignedEmailData, 'businessEmail' | 'bookedBy'>
): Promise<BusinessSideNotifyResult> {
  const [owner, creator] = await Promise.all([
    recipients.owner
      ? attempt('business driver assigned', () =>
          sendBusinessDriverAssignedEmail({
            ...data,
            businessEmail: recipients.owner!.email,
            bookedBy: recipients.bookedBy ?? undefined,
          })
        )
      : Promise.resolve(null),
    recipients.creator
      ? attempt('staff driver assigned', () =>
          sendBusinessCreatorDriverAssignedEmail({
            ...data,
            businessEmail: recipients.creator!.email,
          })
        )
      : Promise.resolve(null),
  ]);

  return { owner, creator };
}

/** A lost transport partner, to the owner and to whoever created the booking. */
export async function notifyBusinessVendorRejected(
  recipients: BusinessSideRecipients,
  data: Unaddressed<BusinessVendorAssignmentEmailData>
): Promise<BusinessSideNotifyResult> {
  const [owner, creator] = await Promise.all([
    recipients.owner
      ? attempt('business vendor rejected', () =>
          sendBusinessVendorRejectedEmail({
            ...data,
            email: recipients.owner!.email,
            bookedBy: recipients.bookedBy ?? undefined,
          })
        )
      : Promise.resolve(null),
    recipients.creator
      ? attempt('staff vendor rejected', () =>
          sendBusinessCreatorVendorRejectedEmail({
            ...data,
            email: recipients.creator!.email,
          })
        )
      : Promise.resolve(null),
  ]);

  return { owner, creator };
}

/**
 * A moved pickup time, to the owner and to whoever created the booking.
 *
 * Both halves are new. Rescheduling notified the vendor and the passenger and said
 * nothing to the business at all, so the account that owns the trip - and the person who
 * has to answer the guest's next phone call - could be the last to know.
 */
export async function notifyBusinessBookingRescheduled(
  recipients: BusinessSideRecipients,
  data: Unaddressed<BusinessBookingDatetimeChangedEmailData>
): Promise<BusinessSideNotifyResult> {
  const [owner, creator] = await Promise.all([
    recipients.owner
      ? attempt('business pickup time changed', () =>
          sendBusinessBookingDatetimeChangedEmail({
            ...data,
            email: recipients.owner!.email,
            bookedBy: recipients.bookedBy ?? undefined,
          })
        )
      : Promise.resolve(null),
    recipients.creator
      ? attempt('staff pickup time changed', () =>
          sendBusinessCreatorDatetimeChangedEmail({
            ...data,
            email: recipients.creator!.email,
          })
        )
      : Promise.resolve(null),
  ]);

  return { owner, creator };
}
