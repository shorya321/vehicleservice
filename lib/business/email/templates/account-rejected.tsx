import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import InfoBox from '../components/info-box';
import DetailsSection from '../components/details-section';
import DetailRow from '../components/detail-row';
import SectionLabel from '../components/section-label';
import { emailStyles } from '../styles/constants';

interface BusinessAccountRejectedEmailProps {
  businessName: string;
  ownerName: string;
  reason?: string;
  supportEmail?: string;
}

export const BusinessAccountRejectedEmail = ({
  businessName,
  ownerName,
  reason,
  supportEmail = 'support@infiniatransfers.com',
}: BusinessAccountRejectedEmailProps) => {
  return (
    <EmailLayout
      preview="Business Account Application Update"
      heading="Application Status Update"
      eyebrow="Application declined"
      tone="danger"
    >
      <Text style={emailStyles.text}>Hi {ownerName},</Text>

      <Text style={emailStyles.text}>
        Thank you for your interest in joining Infinia Transfers with your business{' '}
        <strong>{businessName}</strong>.
      </Text>

      <InfoBox type="warning">
        Unfortunately, we are unable to approve your business account application at this time.
      </InfoBox>

      {reason && (
        <DetailsSection>
          <DetailRow label="Reason">{reason}</DetailRow>
        </DetailsSection>
      )}

      <SectionLabel>What can you do?</SectionLabel>

      <Text style={emailStyles.text}>
        Contact support if you think this decision was made in error, or if you have information that would change it.
      </Text>

      <Text style={emailStyles.text}>
        You may also submit a new application after addressing the concerns mentioned above.
      </Text>

      <InfoBox type="info" title="Need Help?">
        Contact us at{' '}
        <a href={`mailto:${supportEmail}`} style={emailStyles.link}>
          {supportEmail}
        </a>{' '}
        if you have any questions or would like to discuss your application.
      </InfoBox>

      <Text style={emailStyles.text}>
        We appreciate your understanding.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessAccountRejectedEmail;
