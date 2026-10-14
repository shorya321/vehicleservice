import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import List from '../../components/list';
import SectionLabel from '../../components/section-label';
import { boxStyles, emailStyles } from '../../styles/constants';

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
      preview="Vendor Application Received - Infinia Transfers"
      heading="Application Received"
      eyebrow="Application received"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <Text style={emailStyles.text}>
        We&apos;ve received your vendor application.
      </Text>

      <DetailsSection>
        <DetailRow label="Application Reference">{applicationReference}</DetailRow>
        <DetailRow label="Submitted Date">{submittedDate}</DetailRow>
      </DetailsSection>

      <SectionLabel>What happens next?</SectionLabel>

      <Text style={emailStyles.text}>
        Review takes 3-5 business days. We&apos;ll assess your:
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
        You&apos;ll receive an email notification once we&apos;ve completed our review. If we need any
        additional information, we&apos;ll reach out to you directly.
      </Text>

      <InfoBox type="info">
        <Text style={boxStyles.info.text}>
          <strong>Important:</strong> Please keep your application reference number (
          {applicationReference}) for your records.
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        Contact vendor support if you have questions in the meantime.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default VendorApplicationReceivedEmail;
