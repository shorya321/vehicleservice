import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import InfoBox from '../../components/info-box';
import List from '../../components/list';
import { emailStyles, boxStyles } from '../../styles/constants';

interface VendorApplicationApprovedEmailProps {
  name: string;
  applicationReference: string;
  loginUrl: string;
  dashboardUrl: string;
}

export const VendorApplicationApprovedEmail = ({
  name,
  applicationReference,
  loginUrl,
  dashboardUrl,
}: VendorApplicationApprovedEmailProps) => {
  return (
    <EmailLayout
      preview="Your vendor application is approved"
      heading="Welcome to Infinia Transfers!"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <InfoBox type="success">
        <strong>Your vendor application has been approved.</strong>
      </InfoBox>

      <Text style={emailStyles.text}>
        Your application (Reference: {applicationReference}) is approved. You&apos;re now part of our vendor network.
      </Text>

      <Text style={emailStyles.text}>
        <strong>Getting Started:</strong>
      </Text>

      <Text style={emailStyles.text}>
        You can now access your vendor dashboard to:
      </Text>

      <List
        items={[
          'Add and manage your vehicle fleet',
          'View and respond to booking requests',
          'Track your earnings and analytics',
          'Update your availability and service areas',
          'Manage your profile and company information',
        ]}
      />

      <Button href={dashboardUrl}>Access Your Vendor Dashboard</Button>

      <Text style={emailStyles.text}>
        Or log in at:{' '}
        <a href={loginUrl} style={emailStyles.link}>
          {loginUrl}
        </a>
      </Text>

      <InfoBox type="info" title="Next Steps:">
        <ol style={emailStyles.list}>
          <li style={emailStyles.listItem}>Complete your vendor profile</li>
          <li style={emailStyles.listItem}>Add your vehicles to the platform</li>
          <li style={emailStyles.listItem}>Set your availability and pricing</li>
          <li style={emailStyles.listItem}>Start receiving booking requests!</li>
        </ol>
      </InfoBox>

      <Text style={emailStyles.text}>
        Vendor support can help you get started. Contact them any time.
      </Text>

      <Text style={emailStyles.text}>
        Welcome aboard.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default VendorApplicationApprovedEmail;
