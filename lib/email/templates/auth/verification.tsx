import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export const VerificationEmail = ({ name, verificationUrl }: VerificationEmailProps) => {
  return (
    <EmailLayout
      preview="Verify your email address"
      heading="Verify Your Email Address"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <Text style={emailStyles.text}>
        We need to verify your email address to complete your account setup and ensure the
        security of your account.
      </Text>

      <Text style={emailStyles.text}>
        Please click the button below to verify your email address:
      </Text>

      <Button href={verificationUrl}>Verify Email Address</Button>

      <Text style={emailStyles.text}>
        Or copy and paste this link into your browser:
      </Text>

      <Text style={emailStyles.linkWithMargin}>{verificationUrl}</Text>

      <Text style={emailStyles.text}>
        This verification link will expire in 24 hours.
      </Text>

      <Text style={emailStyles.text}>
        If you didn&apos;t request this verification, please ignore this email or contact our
        support team if you have concerns.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default VerificationEmail;
