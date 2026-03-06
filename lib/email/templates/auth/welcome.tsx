import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface WelcomeEmailProps {
  name: string;
  verificationUrl: string;
}

export const WelcomeEmail = ({ name, verificationUrl }: WelcomeEmailProps) => {
  return (
    <EmailLayout
      preview="Welcome to Infinia Transfers - Verify your email"
      heading={`Welcome to Infinia Transfers, ${name}!`}
    >
      <Text style={emailStyles.text}>
        Thank you for creating an account with Infinia Transfers. We&apos;re excited to have you on
        board!
      </Text>

      <Text style={emailStyles.text}>
        To get started and access all features, please verify your email address by clicking
        the button below:
      </Text>

      <Button href={verificationUrl}>Verify Email Address</Button>

      <Text style={emailStyles.text}>
        Or copy and paste this link into your browser:
      </Text>

      <Text style={emailStyles.linkWithMargin}>{verificationUrl}</Text>

      <Text style={emailStyles.text}>
        This verification link will expire in 24 hours for security reasons.
      </Text>

      <Text style={emailStyles.text}>
        If you didn&apos;t create an account with Infinia Transfers, please ignore this email or
        contact our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default WelcomeEmail;
