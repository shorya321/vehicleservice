import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface MonthlyStatementEmailProps {
  businessName: string;
  statementMonth: string;
  statementYear: number;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  currency: string;
  pdfUrl?: string;
  walletUrl: string;
}

export const MonthlyStatementEmail = ({
  businessName,
  statementMonth,
  statementYear,
  openingBalance,
  closingBalance,
  totalCredits,
  totalDebits,
  transactionCount,
  currency,
  pdfUrl,
  walletUrl,
}: MonthlyStatementEmailProps) => {
  const netChange = closingBalance - openingBalance;
  const isPositiveChange = netChange >= 0;

  return (
    <EmailLayout
      preview={`Monthly Wallet Statement - ${statementMonth} ${statementYear}`}
      heading="Monthly Wallet Statement"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <Text style={emailStyles.text}>
        Here's your wallet statement for <strong>{statementMonth} {statementYear}</strong>.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Statement Period:</strong> {statementMonth} {statementYear}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Opening Balance:</strong> {formatCurrency(openingBalance, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={{...emailStyles.detailRow, color: '#10b981'}}>
          <strong>Total Credits:</strong> +{formatCurrency(totalCredits, currency)}
        </Text>
        <Text style={{...emailStyles.detailRow, color: '#ef4444'}}>
          <strong>Total Debits:</strong> -{formatCurrency(totalDebits, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={{
          ...emailStyles.detailRow,
          color: isPositiveChange ? '#10b981' : '#ef4444',
          fontWeight: 'bold'
        }}>
          <strong>Net Change:</strong> {isPositiveChange ? '+' : ''}{formatCurrency(netChange, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={{...emailStyles.totalRow, fontSize: '18px'}}>
          <strong>Closing Balance:</strong> {formatCurrency(closingBalance, currency)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Total Transactions:</strong> {transactionCount}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Summary:</strong>
      </Text>

      <ul style={emailStyles.list}>
        <li style={emailStyles.listItem}>
          You started the month with {formatCurrency(openingBalance, currency)}
        </li>
        <li style={emailStyles.listItem}>
          You added {formatCurrency(totalCredits, currency)} in credits
        </li>
        <li style={emailStyles.listItem}>
          You spent {formatCurrency(totalDebits, currency)} in debits
        </li>
        <li style={emailStyles.listItem}>
          You ended the month with {formatCurrency(closingBalance, currency)}
        </li>
        <li style={emailStyles.listItem}>
          You had {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
        </li>
      </ul>

      {pdfUrl && (
        <>
          <Text style={emailStyles.text}>
            <strong>Download Full Statement:</strong>
          </Text>

          <Text style={emailStyles.text}>
            <a href={pdfUrl} style={emailStyles.link}>
              Download PDF Statement →
            </a>
          </Text>

          <Text style={emailStyles.text}>
            Your detailed statement PDF includes all transactions, descriptions, and reference numbers
            for the period.
          </Text>
        </>
      )}

      <Text style={emailStyles.text}>
        <a href={walletUrl} style={emailStyles.link}>
          View Wallet Dashboard →
        </a>
      </Text>

      <Text style={emailStyles.text}>
        You can view your complete transaction history, download past statements, and manage your
        wallet settings from your dashboard.
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions about your statement or notice any discrepancies, please contact
        our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default MonthlyStatementEmail;
