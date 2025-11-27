import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import InfoBox from '../../components/info-box';
import List from '../../components/list';
import { emailStyles } from '../../styles/constants';

interface BusinessWelcomePendingEmailProps {
  businessName: string;
  ownerName: string;
  subdomain: string;
  supportEmail?: string;
}

export const BusinessWelcomePendingEmail = ({
  businessName,
  ownerName,
  subdomain,
  supportEmail = 'support@vehicleservice.com',
}: BusinessWelcomePendingEmailProps) => {
  return (
    <EmailLayout
      preview="Welcome to Vehicle Service - Registration Received"
      heading="Registration Received!"
    >
      <Text style={emailStyles.text}>Hi {ownerName},</Text>

      <Text style={emailStyles.text}>
        Thank you for registering <strong>{businessName}</strong> with Vehicle Service!
      </Text>

      <InfoBox type="info">
        Your business account registration has been received and is currently under review by our
        team.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>What happens next?</strong>
      </Text>

      <List
        items={[
          'Our team will review your application within 1-2 business days',
          "You'll receive an email notification once your account is approved",
          'After approval, you can log in and start creating bookings',
        ]}
      />

      <Text style={emailStyles.text}>
        <strong>Your portal details:</strong>
      </Text>

      <Text style={{ ...emailStyles.text, marginLeft: '16px' }}>
        Subdomain: <strong>{subdomain}.vehicleservice.com</strong>
      </Text>

      <InfoBox type="warning" title="Important">
        Please do not attempt to log in until you receive the approval confirmation email. Pending
        accounts cannot access the portal.
      </InfoBox>

      <Text style={emailStyles.text}>
        If you have any questions about your application or need to provide additional information,
        please contact us at{' '}
        <a href={`mailto:${supportEmail}`} style={emailStyles.link}>
          {supportEmail}
        </a>
        .
      </Text>

      <Text style={emailStyles.text}>
        We look forward to having {businessName} on our platform!
        <br />
        <br />
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessWelcomePendingEmail;
