import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface AutoRechargeFailedEmailProps {
  businessName: string;
  attemptedAmount: number;
  currency: string;
  currentBalance: number;
  paymentMethod: string;
  failureReason: string;
  attemptDate: string;
  nextRetryDate?: string;
  walletUrl: string;
}

export const AutoRechargeFailedEmail = ({
  businessName,
  attemptedAmount,
  currency,
  currentBalance,
  paymentMethod,
  failureReason,
  attemptDate,
  nextRetryDate,
  walletUrl,
}: AutoRechargeFailedEmailProps) => {
  return (
    <EmailLayout
      preview="Auto-recharge failed - Action required"
      heading="Auto-Recharge Failed"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox variant="error">
        <Text style={emailStyles.text}>
          <strong>Your auto-recharge attempt failed!</strong>
          <br />
          Please update your payment method or add funds manually.
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        We attempted to automatically recharge your wallet but the payment failed.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Attempted Amount:</strong> {formatCurrency(attemptedAmount, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Current Balance:</strong> {formatCurrency(currentBalance, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Payment Method:</strong> {paymentMethod}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={{...emailStyles.detailRow, color: '#ef4444'}}>
          <strong>Failure Reason:</strong> {failureReason}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Attempt Date:</strong> {attemptDate}
        </Text>
        {nextRetryDate && (
          <Text style={emailStyles.detailRow}>
            <strong>Next Retry:</strong> {nextRetryDate}
          </Text>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Recommended Actions:</strong>
      </Text>

      <ul style={emailStyles.list}>
        <li style={emailStyles.listItem}>
          Check that your payment method has sufficient funds
        </li>
        <li style={emailStyles.listItem}>
          Verify that your payment method details are up to date
        </li>
        <li style={emailStyles.listItem}>
          Manually add funds to your wallet
        </li>
        <li style={emailStyles.listItem}>
          Update or add a new payment method
        </li>
      </ul>

      <Text style={emailStyles.text}>
        <a href={walletUrl} style={emailStyles.link}>
          Manage Wallet & Payment Methods →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        {nextRetryDate
          ? `We will automatically retry the recharge on ${nextRetryDate}. However, we recommend taking immediate action to avoid service interruptions.`
          : 'Auto-recharge has been disabled after multiple failed attempts. Please update your payment method and re-enable auto-recharge.'}
      </Text>

      <Text style={emailStyles.text}>
        If you need assistance, please contact our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default AutoRechargeFailedEmail;
