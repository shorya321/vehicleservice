import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import InfoBox from '../../components/info-box';
import SectionLabel from '../../components/section-label';
import { emailStyles } from '../../styles/constants';

interface VendorApplicationRejectedEmailProps {
  name: string;
  applicationReference: string;
  rejectionReason: string;
  /** The applicant's own edit page. They answer this decision on the row they already have. */
  resubmitUrl?: string;
}

export const VendorApplicationRejectedEmail = ({
  name,
  applicationReference,
  rejectionReason,
  resubmitUrl,
}: VendorApplicationRejectedEmailProps) => {
  return (
    <EmailLayout
      preview="Vendor Application Update - Infinia Transfers"
      heading="Application Status Update"
      eyebrow="Application update"
      tone="danger"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <Text style={emailStyles.text}>
        We&apos;ve completed our review of your application (Reference: {applicationReference}).
      </Text>

      <InfoBox type="error">We can&apos;t approve your vendor application.</InfoBox>

      <SectionLabel>Reason for decision</SectionLabel>

      <InfoBox type="message">{rejectionReason}</InfoBox>

      <Text style={emailStyles.text}>
        This is usually about service area coverage, fleet requirements or vendor capacity in your region rather than the quality of your service.
      </Text>

      {resubmitUrl && (
        <>
          <SectionLabel>Can you resubmit?</SectionLabel>

          <Text style={emailStyles.text}>
            Yes, and there is no waiting period. Update your application to address the feedback
            above and send it back to us. You keep the same reference.
          </Text>

          <Button href={resubmitUrl}>Update and Resubmit</Button>
        </>
      )}

      <Text style={emailStyles.text}>
        If you have questions about this decision or would like more detailed feedback, please don&apos;t
        hesitate to contact our vendor support team. We&apos;re here to help and provide guidance.
      </Text>

      <Text style={emailStyles.text}>
        Thanks for your interest in working with us.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default VendorApplicationRejectedEmail;
