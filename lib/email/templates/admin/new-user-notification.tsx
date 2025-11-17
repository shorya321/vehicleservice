import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface NewUserNotificationEmailProps {
  userName: string;
  userEmail: string;
  userPhone: string;
  registrationDate: string;
  userDetailsUrl: string;
}

export const NewUserNotificationEmail = ({
  userName,
  userEmail,
  userPhone,
  registrationDate,
  userDetailsUrl,
}: NewUserNotificationEmailProps) => {
  return (
    <EmailLayout
      preview="New User Registration - Vehicle Service"
      heading="New User Registered"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new user has registered on the Vehicle Service platform. Here are the details:
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Name:</strong> {userName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Email:</strong> {userEmail}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Phone:</strong> {userPhone}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Registration Date:</strong> {registrationDate}
        </Text>
      </DetailsSection>

      <Text style={infoBoxStyle}>
        <strong>Note:</strong> The user needs to verify their email address before they can access the platform.
      </Text>

      <Button href={userDetailsUrl}>View User Details</Button>

      <Text style={emailStyles.text}>
        This is an automated notification. No action is required unless you need to review the user account.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Vehicle Service System
      </Text>
    </EmailLayout>
  );
};

// Template-specific info box style
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

export default NewUserNotificationEmail;
