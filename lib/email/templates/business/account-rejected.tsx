import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

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
  supportEmail = 'support@vehicleservice.com',
}: BusinessAccountRejectedEmailProps) => {
  return (
    <EmailLayout
      preview="Business Account Application Update"
      heading="Application Status Update"
    >
      <Text style={emailStyles.text}>Hi {ownerName},</Text>

      <Text style={emailStyles.text}>
        Thank you for your interest in joining Vehicle Service with your business{' '}
        <strong>{businessName}</strong>.
      </Text>

      <InfoBox type="warning">
        Unfortunately, we are unable to approve your business account application at this time.
      </InfoBox>

      {reason && (
        <>
          <Text style={emailStyles.text}>
            <strong>Reason:</strong>
          </Text>
          <Text style={{ ...emailStyles.text, marginLeft: '16px', fontStyle: 'italic' }}>
            {reason}
          </Text>
        </>
      )}

      <Text style={emailStyles.text}>
        <strong>What can you do?</strong>
      </Text>

      <Text style={emailStyles.text}>
        If you believe this decision was made in error or if you have additional information
        that might help us reconsider your application, please don&apos;t hesitate to contact our
        support team.
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
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessAccountRejectedEmail;
