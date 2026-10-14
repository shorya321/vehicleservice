import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import StatBlock from '../../components/stat-block';
import { emailStyles, statusColors } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { getCurrentBrand } from '../../brand/brand';

interface TransactionCompletedEmailProps {
  businessName: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  previousBalance: number;
  newBalance: number;
  transactionDate: string;
  transactionId: string;
  walletUrl: string;
}

export const TransactionCompletedEmail = ({
  businessName,
  transactionType,
  amount,
  currency,
  description,
  previousBalance,
  newBalance,
  transactionDate,
  transactionId,
  walletUrl,
}: TransactionCompletedEmailProps) => {
  const isCredit = transactionType === 'credit';

  return (
    <EmailLayout
      preview={`Transaction ${isCredit ? 'Credit' : 'Debit'} - ${formatCurrency(Math.abs(amount), currency)}`}
      heading="Transaction Completed"
      eyebrow="Transaction completed"
      tone="success"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <Text style={emailStyles.text}>
        A transaction has been {isCredit ? 'credited to' : 'debited from'} your wallet.
      </Text>

      <StatBlock
        label="Amount"
        value={
          <span style={{ color: isCredit ? statusColors.confirmed : statusColors.cancelled }}>
            {isCredit ? '+' : '-'}
            {formatCurrency(Math.abs(amount), currency)}
          </span>
        }
      />

      <DetailsSection>
        <DetailRow label="Transaction Type">{isCredit ? 'Credit' : 'Debit'}</DetailRow>
        <DetailRow label="Description">{description}</DetailRow>
        <DetailRow label="Previous Balance">{formatCurrency(previousBalance, currency)}</DetailRow>
        <DetailRow label="New Balance" emphasis>
          {formatCurrency(newBalance, currency)}
        </DetailRow>
        <DetailRow label="Transaction Date">{transactionDate}</DetailRow>
        <DetailRow label="Transaction ID">{transactionId}</DetailRow>
      </DetailsSection>

      <Text style={emailStyles.text}>
        <a href={walletUrl} style={emailStyles.link}>
          View Transaction History →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions about this transaction, please contact our support team with the
        transaction ID above.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getCurrentBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default TransactionCompletedEmail;
