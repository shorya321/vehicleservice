import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import StatBlock from '../../components/stat-block';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { getCurrentBrand } from '../../brand/brand';

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
      eyebrow="Wallet alert"
      tone="warning"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type="warning">
        <Text style={boxStyles.warning.text}>
          <strong>Your wallet balance is running low.</strong>
          <br />
          Current balance: <strong>{formatCurrency(currentBalance, currency)}</strong>
          <br />
          Alert threshold: {formatCurrency(threshold, currency)}
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        To avoid service interruptions, please add funds to your wallet as soon as possible.
      </Text>

      <StatBlock label="Current Balance" value={formatCurrency(currentBalance, currency)} />

      <DetailsSection>
        <DetailRow label="Alert Threshold">{formatCurrency(threshold, currency)}</DetailRow>
        <DetailRow label="Recommended Action">Add funds to wallet</DetailRow>
      </DetailsSection>

      <Text style={emailStyles.text}>
        Add funds from your wallet dashboard. Keeping the balance above your threshold avoids interrupted service.
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
        The {getCurrentBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default LowBalanceAlertEmail;
