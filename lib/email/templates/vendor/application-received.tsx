import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import List from '../../components/list';
import { emailStyles } from '../../styles/constants';

interface VendorApplicationReceivedEmailProps {
  name: string;
  applicationReference: string;
  submittedDate: string;
}

export const VendorApplicationReceivedEmail = ({
  name,
  applicationReference,
  submittedDate,
}: VendorApplicationReceivedEmailProps) => {
  return (
    <EmailLayout
      preview="Vendor Application Received - Vehicle Service"
      heading="Application Received"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <Text style={emailStyles.text}>
        Thank you for submitting your vendor application to Vehicle Service! We've successfully
        received your application and wanted to confirm receipt.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Application Reference:</strong> {applicationReference}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Submitted Date:</strong> {submittedDate}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>What happens next?</strong>
      </Text>

      <Text style={emailStyles.text}>
        Our team will carefully review your application, which typically takes 3-5 business days.
        We'll assess your:
      </Text>

      <List
        items={[
          'Company information and credentials',
          'Vehicle fleet details',
          'Service area coverage',
          'Compliance with our quality standards',
        ]}
      />

      <Text style={emailStyles.text}>
        You'll receive an email notification once we've completed our review. If we need any
        additional information, we'll reach out to you directly.
      </Text>

      <Text style={infoBoxStyle}>
        <strong>Important:</strong> Please keep your application reference number (
        {applicationReference}) for your records.
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions in the meantime, feel free to contact our vendor support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

// Template-specific info box style (slightly different padding than standard)
const infoBoxStyle = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
};

export default VendorApplicationReceivedEmail;
