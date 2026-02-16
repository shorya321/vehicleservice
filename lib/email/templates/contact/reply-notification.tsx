import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import { emailStyles } from '../../styles/constants';

interface ContactReplyEmailProps {
  name: string;
  replyMessage: string;
}

export const ContactReplyEmail = ({
  name,
  replyMessage,
}: ContactReplyEmailProps) => {
  return (
    <EmailLayout
      preview="Reply from Infinia Transfers"
      heading="Response to Your Inquiry"
    >
      <Text style={emailStyles.text}>Dear {name},</Text>

      <Text style={emailStyles.text}>
        Thank you for contacting Infinia Transfers. Here is our response to
        your inquiry:
      </Text>

      <Text style={messageStyle}>{replyMessage}</Text>

      <Text style={emailStyles.text}>
        If you have any further questions, please don&apos;t hesitate to reply
        to this email or contact us directly.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

const messageStyle = {
  color: '#2d3748',
  fontSize: '15px',
  lineHeight: '24px',
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  whiteSpace: 'pre-wrap' as const,
};

export default ContactReplyEmail;
