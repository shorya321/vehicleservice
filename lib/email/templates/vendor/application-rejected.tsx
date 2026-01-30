import { Section, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface VendorApplicationRejectedEmailProps {
  name: string;
  applicationReference: string;
  rejectionReason: string;
  reapplyUrl?: string;
}

export const VendorApplicationRejectedEmail = ({
  name,
  applicationReference,
  rejectionReason,
  reapplyUrl,
}: VendorApplicationRejectedEmailProps) => {
  return (
    <EmailLayout
      preview="Vendor Application Update - Vehicle Service"
      heading="Application Status Update"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <Text style={emailStyles.text}>
        Thank you for your interest in becoming a vendor partner with Vehicle Service. We&apos;ve
        completed our review of your application (Reference: {applicationReference}).
      </Text>

      <Section style={rejectionBox}>
        <Text style={rejectionText}>
          After careful consideration, we&apos;re unable to approve your vendor application at this time.
        </Text>
      </Section>

      <Text style={emailStyles.text}>
        <strong>Reason for decision:</strong>
      </Text>

      <Section style={reasonBox}>
        <Text style={reasonText}>{rejectionReason}</Text>
      </Section>

      <Text style={emailStyles.text}>
        We understand this may be disappointing. This decision doesn&apos;t necessarily reflect on the
        quality of your services but may be due to factors such as service area coverage, fleet
        requirements, or current vendor capacity in your region.
      </Text>

      {reapplyUrl && (
        <>
          <Text style={emailStyles.text}>
            <strong>Can you reapply?</strong>
          </Text>

          <Text style={emailStyles.text}>
            Yes! If you believe you can address the concerns mentioned above, you&apos;re welcome to
            submit a new application after 30 days. Please ensure that your resubmission addresses
            the feedback provided.
          </Text>

          <Button href={reapplyUrl}>Submit New Application</Button>
        </>
      )}

      <Text style={emailStyles.text}>
        If you have questions about this decision or would like more detailed feedback, please don&apos;t
        hesitate to contact our vendor support team. We&apos;re here to help and provide guidance.
      </Text>

      <Text style={emailStyles.text}>
        We appreciate your interest in partnering with Vehicle Service and wish you all the best in
        your business endeavors.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

// Template-specific rejection box styles
const rejectionBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const rejectionText = {
  color: '#991b1b',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  fontWeight: '500',
};

const reasonBox = {
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
  borderLeft: '4px solid #ef4444',
  borderRadius: '4px',
  padding: '16px',
  margin: '16px 0',
};

const reasonText = {
  color: '#2d3748',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic',
};

export default VendorApplicationRejectedEmail;
