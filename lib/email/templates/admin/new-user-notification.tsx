import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles } from '../../styles/constants';

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
      preview="New User Registration - Infinia Transfers"
      heading="New User Registered"
      eyebrow="New user"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new user has registered on the Infinia Transfers platform. Here are the details:
      </Text>

      <DetailsSection>
        <DetailRow label="Name">{userName}</DetailRow>
        <DetailRow label="Email">{userEmail}</DetailRow>
        <DetailRow label="Phone">{userPhone}</DetailRow>
        <DetailRow label="Registration Date">{registrationDate}</DetailRow>
      </DetailsSection>

      <InfoBox type="info">
        <Text style={boxStyles.info.text}>
          <strong>Note:</strong> The user needs to verify their email address before they can access the platform.
        </Text>
      </InfoBox>

      <Button href={userDetailsUrl}>View User Details</Button>

      <Text style={emailStyles.text}>
        This is an automated notification. No action is required unless you need to review the user account.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default NewUserNotificationEmail;
