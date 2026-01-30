import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface AutoRechargeSuccessEmailProps {
  businessName: string;
  rechargeAmount: number;
  currency: string;
  previousBalance: number;
  newBalance: number;
  paymentMethod: string;
  rechargeDate: string;
  rechargeId: string;
  walletUrl: string;
}

export const AutoRechargeSuccessEmail = ({
  businessName,
  rechargeAmount,
  currency,
  previousBalance,
  newBalance,
  paymentMethod,
  rechargeDate,
  rechargeId,
  walletUrl,
}: AutoRechargeSuccessEmailProps) => {
  return (
    <EmailLayout
      preview={`Auto-recharge successful - ${formatCurrency(rechargeAmount, currency)} added`}
      heading="Auto-Recharge Successful"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox variant="success">
        <Text style={emailStyles.text}>
          <strong>Your wallet has been automatically recharged!</strong>
          <br />
          Amount added: <strong>{formatCurrency(rechargeAmount, currency)}</strong>
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        Your auto-recharge was triggered and completed successfully.
      </Text>

      <DetailsSection>
        <Text style={{...emailStyles.detailRow, color: '#10b981', fontWeight: 'bold'}}>
          <strong>Recharge Amount:</strong> +{formatCurrency(rechargeAmount, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Previous Balance:</strong> {formatCurrency(previousBalance, currency)}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>New Balance:</strong> {formatCurrency(newBalance, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Payment Method:</strong> {paymentMethod}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Recharge Date:</strong> {rechargeDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Recharge ID:</strong> {rechargeId}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        Your wallet has been credited and you can continue using our services without interruption.
      </Text>

      <Text style={emailStyles.text}>
        <a href={walletUrl} style={emailStyles.link}>
          View Wallet Dashboard →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        If you&apos;d like to modify your auto-recharge settings, you can do so from your wallet dashboard.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default AutoRechargeSuccessEmail;
