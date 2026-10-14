import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';
import InfoBox from '../../components/info-box';
import List from '../../components/list';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import SectionLabel from '../../components/section-label';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({ name, resetUrl }: PasswordResetEmailProps) => {
  return (
    <EmailLayout
      preview="Reset your password - Infinia Transfers"
      heading="Reset Your Password"
      eyebrow="Password reset"
    >
      <Text style={emailStyles.text}>Hi {name},</Text>

      <InfoBox type="info" title="Password Reset Requested">
        We received a request to reset the password for your Infinia Transfers account.
        Follow the steps below to set a new password.
      </InfoBox>

      <SectionLabel>How to reset your password:</SectionLabel>

      <List
        ordered
        items={[
          'Click the reset button below',
          'Set your new password',
          'Log back in with your new credentials',
        ]}
      />

      <Button href={resetUrl}>Reset Password</Button>

      <DetailsSection>
        <DetailRow label="Link expires">1 hour from the time of this email</DetailRow>
        <DetailRow label="Reset URL">
          <a href={resetUrl} style={{ ...emailStyles.link, wordBreak: 'break-all' }}>
            {resetUrl}
          </a>
        </DetailRow>
      </DetailsSection>

      <InfoBox type="warning" title="Security Notice">
        If you didn&apos;t request a password reset, please ignore this email. Your password
        will remain unchanged. If you&apos;re concerned about your account security, please
        contact our support team immediately.
      </InfoBox>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default PasswordResetEmail;
