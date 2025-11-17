import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface LowBalanceAlertEmailProps {
  businessName: string;
  currentBalance: number;
  threshold: number;
  currency: string;
  walletUrl: string;
}

export const LowBalanceAlertEmail = ({
  businessName,
  currentBalance,
  threshold,
  currency,
  walletUrl,
}: LowBalanceAlertEmailProps) => {
  return (
    <EmailLayout
      preview={`Low Balance Alert - ${formatCurrency(currentBalance, currency)} remaining`}
      heading="Low Balance Alert"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox variant="warning">
        <Text style={emailStyles.text}>
          <strong>Your wallet balance is running low!</strong>
          <br />
          Current balance: <strong>{formatCurrency(currentBalance, currency)}</strong>
          <br />
          Alert threshold: {formatCurrency(threshold, currency)}
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        To avoid service interruptions, please add funds to your wallet as soon as possible.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Current Balance:</strong> {formatCurrency(currentBalance, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Alert Threshold:</strong> {formatCurrency(threshold, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Recommended Action:</strong> Add funds to wallet
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        You can add funds to your wallet by visiting your wallet dashboard. We recommend maintaining a
        balance above your threshold to ensure uninterrupted service.
      </Text>

      <Text style={emailStyles.text}>
        <a href={walletUrl} style={emailStyles.link}>
          View Wallet Dashboard →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions or need assistance, please contact our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default LowBalanceAlertEmail;
