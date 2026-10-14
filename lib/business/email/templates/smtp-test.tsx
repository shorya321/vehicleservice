import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import DetailRow from '../components/detail-row';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

interface SmtpTestEmailProps {
  recipientName: string;
  smtpHost: string;
  smtpPort: number;
  fromEmail: string;
  sentAt: string;
}

/**
 * Sent by the "send test email" button in business email settings.
 *
 * Deliberately restates the connection details: an owner who receives this needs to
 * confirm not just that mail arrives, but that it arrived over the server they expect.
 */
export const SmtpTestEmail = ({
  recipientName,
  smtpHost,
  smtpPort,
  fromEmail,
  sentAt,
}: SmtpTestEmailProps) => {
  const brand = getBusinessBrand();

  return (
    <EmailLayout
      preview="Your email settings are working"
      heading="Your email settings are working"
      eyebrow="Test email"
      tone="success"
    >
      <Text style={emailStyles.text}>Hi {recipientName},</Text>

      <Text style={emailStyles.text}>
        This is a test message from your {brand.name} portal. Receiving it confirms that your
        mail server accepted the connection, authenticated us, and delivered the message.
      </Text>

      <DetailsSection>
        <DetailRow label="Server">
          {smtpHost}:{smtpPort}
        </DetailRow>
        <DetailRow label="Sent from">{fromEmail}</DetailRow>
        <DetailRow label="Sent at">{sentAt}</DetailRow>
      </DetailsSection>

      <Text style={emailStyles.text}>
        Check that this message did not land in spam. If it did, your sending domain most
        likely still needs its SPF and DKIM records published.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {brand.name} Team
      </Text>
    </EmailLayout>
  );
};

export default SmtpTestEmail;
