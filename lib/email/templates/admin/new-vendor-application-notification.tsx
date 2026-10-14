import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles } from '../../styles/constants';

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
      eyebrow="New application"
      tone="warning"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A customer has applied to become a vendor on the Infinia Transfers platform. Here are the
        details:
      </Text>

      <DetailsSection>
        <DetailRow label="Business">{companyName}</DetailRow>
        <DetailRow label="Applicant">{applicantName}</DetailRow>
        <DetailRow label="Email">{applicantEmail}</DetailRow>
        <DetailRow label="Phone">{businessPhone}</DetailRow>
        <DetailRow label="Submitted">{submittedDate}</DetailRow>
        <DetailRow label="Reference">{applicationReference}</DetailRow>
      </DetailsSection>

      <InfoBox type="warning">
        <Text style={boxStyles.warning.text}>
          <strong>Action required:</strong> The application is pending review. The applicant was told
          to expect a decision within 48 hours.
        </Text>
      </InfoBox>

      <Button href={applicationDetailsUrl}>Review Application</Button>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default NewVendorApplicationNotificationEmail;
