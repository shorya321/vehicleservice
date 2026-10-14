import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import SectionLabel from '../../components/section-label';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles, statusColors } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { getCurrentBrand } from '../../brand/brand';

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
      eyebrow="Spending limit"
      tone="warning"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type="warning">
        <Text style={boxStyles.warning.text}>
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
        <DetailRow label="Limit Type">
          {limitTypeText.charAt(0).toUpperCase() + limitTypeText.slice(1)} Limit
        </DetailRow>
        <DetailRow label="Limit Amount">{formatCurrency(limitAmount, currency)}</DetailRow>
        <DetailRow label="Current Spend">{formatCurrency(currentSpend, currency)}</DetailRow>
        {rejectedTransactionAmount && (
          <DetailRow label="Rejected Transaction">
            <span style={{ color: statusColors.cancelled }}>
              {formatCurrency(rejectedTransactionAmount, currency)}
            </span>
          </DetailRow>
        )}
        {resetDate && <DetailRow label="Limit Resets">{resetDate}</DetailRow>}
      </DetailsSection>

      <SectionLabel>What you can do:</SectionLabel>

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
        The {getCurrentBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default SpendingLimitReachedEmail;
