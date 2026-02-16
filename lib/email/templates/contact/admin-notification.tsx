import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
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
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new contact form submission has been received. Here are the details:
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Name:</strong> {name}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Email:</strong> {email}
        </Text>
        {phone && (
          <Text style={emailStyles.detailRow}>
            <strong>Phone:</strong> {phone}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Subject:</strong> {subject}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Message:</strong> {message}
        </Text>
      </DetailsSection>

      <Button href={submissionUrl}>View in Admin Panel</Button>

      <Text style={emailStyles.text}>
        This is an automated notification. Please respond to the customer
        promptly.
      </Text>
    </EmailLayout>
  );
};

export default ContactAdminNotificationEmail;
