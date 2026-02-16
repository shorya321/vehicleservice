import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';

interface ContactConfirmationEmailProps {
  name: string;
  subject: string;
  message: string;
}

export const ContactConfirmationEmail = ({
  name,
  subject,
  message,
}: ContactConfirmationEmailProps) => {
  return (
    <EmailLayout
      preview="Thank you for contacting Infinia Transfers"
      heading="We've Received Your Message"
    >
      <Text style={emailStyles.text}>Dear {name},</Text>

      <Text style={emailStyles.text}>
        Thank you for reaching out to Infinia Transfers. We have received your
        message and our team will get back to you shortly.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Subject:</strong> {subject}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Message:</strong> {message}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        We typically respond within 24 hours during business days. If your
        matter is urgent, please don&apos;t hesitate to call us directly.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default ContactConfirmationEmail;
