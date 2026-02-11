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
      preview="Congratulations! Your Vendor Application Approved"
      heading="Welcome to Vehicle Service!"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <InfoBox type="success">
        🎉 <strong>Congratulations!</strong> Your vendor application has been approved!
      </InfoBox>

      <Text style={emailStyles.text}>
        We&apos;re excited to have you join our network of trusted vehicle service providers. Your
        application (Reference: {applicationReference}) has been carefully reviewed and approved.
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
        If you have any questions or need assistance getting started, our vendor support team is
        here to help. Don&apos;t hesitate to reach out!
      </Text>

      <Text style={emailStyles.text}>
        We look forward to a successful partnership!
        <br />
        <br />
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default VendorApplicationApprovedEmail;
