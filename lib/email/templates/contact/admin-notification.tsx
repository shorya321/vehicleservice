import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface ContactAdminNotificationEmailProps {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  submissionUrl: string;
}

export const ContactAdminNotificationEmail = ({
  name,
  email,
  phone,
  subject,
  message,
  submissionUrl,
}: ContactAdminNotificationEmailProps) => {
  return (
    <EmailLayout
      preview={`New Contact Submission from ${name}`}
      heading="New Contact Form Submission"
      eyebrow="New enquiry"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new contact form submission has been received. Here are the details:
      </Text>

      <DetailsSection>
        <DetailRow label="Name">{name}</DetailRow>
        <DetailRow label="Email">{email}</DetailRow>
        {phone && <DetailRow label="Phone">{phone}</DetailRow>}
        <DetailRow label="Subject">{subject}</DetailRow>
      </DetailsSection>

      <InfoBox type="message" title="Message">
        {message}
      </InfoBox>

      <Button href={submissionUrl}>View in Admin Panel</Button>

      <Text style={emailStyles.text}>
        This is an automated notification. Please respond to the customer
        promptly.
      </Text>
    </EmailLayout>
  );
};

export default ContactAdminNotificationEmail;
