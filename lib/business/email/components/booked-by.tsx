import { Text } from '@react-email/components';
import * as React from 'react';
import { emailStyles } from '../styles/constants';

interface BookedByProps {
  /** Pre-formatted, e.g. "Booked by Priya Sharma (staff)". Built by ../recipients.ts. */
  bookedBy?: string;
}

/**
 * Names the team member who created a booking, on the owner's copy of an email.
 *
 * An account with staff on it produces booking mail the owner did not trigger. Without a
 * line saying who did, the owner has to open the portal to answer "who booked this?", and
 * the email stops being self-contained.
 *
 * Optional rather than required, unlike the wallet balance next door in
 * booking-confirmation.tsx. The asymmetry is deliberate: a missing balance is a
 * regression, whereas a missing attribution line is the correct rendering for a booking
 * the owner made themselves. Optional models "absent" honestly here and would model it
 * dishonestly there.
 *
 * Presentational only. Nothing under components/ may import platform.ts - see the
 * boundary assertion in tests/email/platform-only.test.ts.
 */
export const BookedBy = ({ bookedBy }: BookedByProps) => {
  if (!bookedBy) return null;

  return <Text style={{ ...emailStyles.muted, fontSize: '13px' }}>{bookedBy}</Text>;
};

export default BookedBy;
