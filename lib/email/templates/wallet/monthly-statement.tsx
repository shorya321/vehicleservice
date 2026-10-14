import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import SectionLabel from '../../components/section-label';
import { emailStyles, statusColors } from '../../styles/constants';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { getCurrentBrand } from '../../brand/brand';

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
      eyebrow="Monthly statement"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <Text style={emailStyles.text}>
        Here&apos;s your wallet statement for <strong>{statementMonth} {statementYear}</strong>.
      </Text>

      <DetailsSection>
        <DetailRow label="Statement Period">
          {statementMonth} {statementYear}
        </DetailRow>
        <DetailRow label="Opening Balance">{formatCurrency(openingBalance, currency)}</DetailRow>
        <DetailRow label="Total Credits">
          <span style={{ color: statusColors.confirmed }}>
            +{formatCurrency(totalCredits, currency)}
          </span>
        </DetailRow>
        <DetailRow label="Total Debits">
          <span style={{ color: statusColors.cancelled }}>
            -{formatCurrency(totalDebits, currency)}
          </span>
        </DetailRow>
        <DetailRow label="Net Change" emphasis>
          <span style={{ color: isPositiveChange ? statusColors.confirmed : statusColors.cancelled }}>
            {isPositiveChange ? '+' : ''}
            {formatCurrency(netChange, currency)}
          </span>
        </DetailRow>
        <Hr style={emailStyles.hr} />
        <DetailRow label="Closing Balance" emphasis>
          {formatCurrency(closingBalance, currency)}
        </DetailRow>
        <DetailRow label="Total Transactions">{transactionCount}</DetailRow>
      </DetailsSection>

      <SectionLabel>Summary:</SectionLabel>

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
          <SectionLabel>Download Full Statement:</SectionLabel>

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
        The {getCurrentBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default MonthlyStatementEmail;
