import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

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
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <Text style={emailStyles.text}>
        A transaction has been {isCredit ? 'credited to' : 'debited from'} your wallet.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Transaction Type:</strong> {isCredit ? 'Credit' : 'Debit'}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={{...emailStyles.detailRow, color: isCredit ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>
          <strong>Amount:</strong> {isCredit ? '+' : '-'}{formatCurrency(Math.abs(amount), currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Description:</strong> {description}
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
          <strong>Transaction Date:</strong> {transactionDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Transaction ID:</strong> {transactionId}
        </Text>
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
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default TransactionCompletedEmail;
