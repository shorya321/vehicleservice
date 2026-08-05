import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import InfoBox from '../../components/info-box';
import List from '../../components/list';
import { emailStyles } from '../../styles/constants';

interface BusinessAccountApprovedEmailProps {
  businessName: string;
  ownerName: string;
  loginUrl: string;
}

export const BusinessAccountApprovedEmail = ({
  businessName,
  ownerName,
  loginUrl,
}: BusinessAccountApprovedEmailProps) => {
  return (
    <EmailLayout
      preview="Your business account is approved"
      heading="Welcome to Infinia Transfers!"
    >
      <Text style={emailStyles.text}>Hi {ownerName},</Text>

      <InfoBox type="success">
        Your business account <strong>{businessName}</strong> has been approved and is now active!
      </InfoBox>

      <Text style={emailStyles.text}>
        Your business is now on the platform. You can start managing bookings.
      </Text>

      <Text style={emailStyles.text}>
        <strong>What you can do now:</strong>
      </Text>

      <List
        items={[
          'Access your business dashboard',
          'Create and manage bookings for your customers',
          'Top up your wallet to pay for bookings',
          'Track your booking history and analytics',
          'Manage your business profile and settings',
        ]}
      />

      <Button href={loginUrl}>Access Your Dashboard</Button>

      <InfoBox type="info" title="Getting Started:">
        <ol style={emailStyles.list}>
          <li style={emailStyles.listItem}>Log in to your dashboard</li>
          <li style={emailStyles.listItem}>Add funds to your wallet</li>
          <li style={emailStyles.listItem}>Complete your business profile</li>
          <li style={emailStyles.listItem}>Start creating bookings!</li>
        </ol>
      </InfoBox>

      <Text style={emailStyles.text}>
        Contact support if you need help.
      </Text>

      <Text style={emailStyles.text}>
        Welcome aboard!
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessAccountApprovedEmail;
