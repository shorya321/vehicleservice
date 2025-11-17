import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface SpendingLimitReachedEmailProps {
  businessName: string;
  limitType: 'transaction' | 'daily' | 'monthly';
  limitAmount: number;
  currentSpend: number;
  currency: string;
  rejectedTransactionAmount?: number;
  resetDate?: string;
  walletUrl: string;
  supportUrl: string;
}

export const SpendingLimitReachedEmail = ({
  businessName,
  limitType,
  limitAmount,
  currentSpend,
  currency,
  rejectedTransactionAmount,
  resetDate,
  walletUrl,
  supportUrl,
}: SpendingLimitReachedEmailProps) => {
  const limitTypeText = limitType === 'transaction' ? 'per-transaction' : limitType;

  return (
    <EmailLayout
      preview={`${limitTypeText} spending limit reached`}
      heading="Spending Limit Reached"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox variant="warning">
        <Text style={emailStyles.text}>
          <strong>Your {limitTypeText} spending limit has been reached!</strong>
          {rejectedTransactionAmount && (
            <>
              <br />
              A transaction of {formatCurrency(rejectedTransactionAmount, currency)} was declined.
            </>
          )}
        </Text>
      </InfoBox>

      <Text style={emailStyles.text}>
        {rejectedTransactionAmount
          ? `A transaction was declined because it would exceed your ${limitTypeText} spending limit.`
          : `You have reached your ${limitTypeText} spending limit.`}
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Limit Type:</strong> {limitTypeText.charAt(0).toUpperCase() + limitTypeText.slice(1)} Limit
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Limit Amount:</strong> {formatCurrency(limitAmount, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Current Spend:</strong> {formatCurrency(currentSpend, currency)}
        </Text>
        {rejectedTransactionAmount && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={{...emailStyles.detailRow, color: '#ef4444'}}>
              <strong>Rejected Transaction:</strong> {formatCurrency(rejectedTransactionAmount, currency)}
            </Text>
          </>
        )}
        {resetDate && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.detailRow}>
              <strong>Limit Resets:</strong> {resetDate}
            </Text>
          </>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>What you can do:</strong>
      </Text>

      <ul style={emailStyles.list}>
        {limitType !== 'transaction' && resetDate && (
          <li style={emailStyles.listItem}>
            Wait until {resetDate} when your {limitTypeText} limit resets
          </li>
        )}
        <li style={emailStyles.listItem}>
          Contact support to request a temporary limit increase
        </li>
        <li style={emailStyles.listItem}>
          Review and adjust your spending limit settings
        </li>
        {limitType === 'transaction' && (
          <li style={emailStyles.listItem}>
            Split the transaction into smaller amounts if possible
          </li>
        )}
      </ul>

      <Text style={emailStyles.text}>
        <a href={walletUrl} style={emailStyles.link}>
          View Wallet Dashboard →
        </a>
        {' | '}
        <a href={supportUrl} style={emailStyles.link}>
          Contact Support →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        Spending limits are in place to help you manage your budget and prevent unexpected charges.
        If you need assistance or would like to adjust your limits, please contact our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default SpendingLimitReachedEmail;
