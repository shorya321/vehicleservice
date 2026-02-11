import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({ name, resetUrl }: PasswordResetEmailProps) => {
  return (
    <EmailLayout
      preview="Reset your password - Vehicle Service"
      heading="Reset Your Password"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <Text style={emailStyles.text}>
        We received a request to reset your password for your Vehicle Service account.
      </Text>

      <Text style={emailStyles.text}>
        If you made this request, click the button below to reset your password:
      </Text>

      <Button href={resetUrl}>Reset Password</Button>

      <Text style={emailStyles.text}>
        Or copy and paste this link into your browser:
      </Text>

      <Text style={emailStyles.linkWithMargin}>{resetUrl}</Text>

      <Text style={emailStyles.text}>
        This password reset link will expire in 1 hour for security reasons.
      </Text>

      <Text style={warningText}>
        <strong>Important:</strong> If you didn&apos;t request a password reset, please ignore this
        email. Your password will remain unchanged. If you&apos;re concerned about your account
        security, please contact our support team immediately.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

// Template-specific warning style
const warningText = {
  color: '#e25950',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#fff5f5',
  borderLeft: '4px solid #e25950',
  borderRadius: '4px',
};

export default PasswordResetEmail;
