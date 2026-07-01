import { Text } from '@react-email/components';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface NewBusinessRegistrationAdminNotificationEmailProps {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  contactPersonName: string;
  subdomain: string;
  registrationDate: string;
  businessDetailsUrl: string;
}

export const NewBusinessRegistrationAdminNotificationEmail = ({
  businessName,
  businessEmail,
  businessPhone,
  contactPersonName,
  subdomain,
  registrationDate,
  businessDetailsUrl,
}: NewBusinessRegistrationAdminNotificationEmailProps) => {
  return (
    <EmailLayout
      preview="New Business Registration - Action Required"
      heading="New Business Registration"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new business has registered on the Infinia Transfers platform and is awaiting your
        approval.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Business Name:</strong> {businessName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Contact Person:</strong> {contactPersonName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Email:</strong> {businessEmail}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Phone:</strong> {businessPhone}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Subdomain:</strong> {subdomain}.infiniatransfers.com
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Registration Date:</strong> {registrationDate}
        </Text>
      </DetailsSection>

      <InfoBox type="warning" title="Action Required">
        This business account is pending approval. Please review the registration details and
        approve or reject the application.
      </InfoBox>

      <Button href={businessDetailsUrl}>Review Business Application</Button>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default NewBusinessRegistrationAdminNotificationEmail;
