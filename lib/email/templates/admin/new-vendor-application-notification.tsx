import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface NewVendorApplicationNotificationEmailProps {
  applicationReference: string;
  applicantName: string;
  applicantEmail: string;
  businessPhone: string;
  companyName: string;
  submittedDate: string;
  applicationDetailsUrl: string;
}

export const NewVendorApplicationNotificationEmail = ({
  applicationReference,
  applicantName,
  applicantEmail,
  businessPhone,
  companyName,
  submittedDate,
  applicationDetailsUrl,
}: NewVendorApplicationNotificationEmailProps) => {
  return (
    <EmailLayout
      preview="New Vendor Application - Infinia Transfers"
      heading="New Vendor Application"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A customer has applied to become a vendor on the Infinia Transfers platform. Here are the
        details:
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Business:</strong> {companyName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Applicant:</strong> {applicantName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Email:</strong> {applicantEmail}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Phone:</strong> {businessPhone}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Submitted:</strong> {submittedDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Reference:</strong> {applicationReference}
        </Text>
      </DetailsSection>

      <Text style={infoBoxStyle}>
        <strong>Action required:</strong> The application is pending review. The applicant was told
        to expect a decision within 48 hours.
      </Text>

      <Button href={applicationDetailsUrl}>Review Application</Button>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

// Template-specific info box style
const infoBoxStyle = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
};

export default NewVendorApplicationNotificationEmail;
