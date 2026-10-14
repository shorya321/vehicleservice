import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles } from '../../styles/constants';

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
      eyebrow="Our reply"
    >
      <Text style={emailStyles.text}>Dear {name},</Text>

      <Text style={emailStyles.text}>
        Thank you for contacting Infinia Transfers. Here is our response to
        your inquiry:
      </Text>

      <InfoBox type="message">
        <Text style={{ ...boxStyles.message.text, whiteSpace: 'pre-wrap' as const }}>{replyMessage}</Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        Reply to this email or contact us directly if you have more questions.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default ContactReplyEmail;
