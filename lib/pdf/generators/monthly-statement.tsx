/**
 * Monthly Statement PDF Generator
 * Generates comprehensive monthly wallet statements
 */

import { formatCurrency } from '@/lib/utils/currency-converter';
import { Text, View } from '@/lib/pdf-primitives';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/pdf/table/table';
import { pdfColors } from '../colors';
import { PdfDocument } from '../document/pdf-document';
import { DocumentHeader } from '../document/document-header';
import { DetailPanel, NotesBlock, SectionLabel, TotalsBox } from '../document/blocks';
import { pdfTheme } from '../document/theme';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
}

interface MonthlyStatementData {
  // Business Information
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;

  // Statement Period
  statementMonth: string;
  statementYear: number;
  startDate: string;
  endDate: string;

  // Summary
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  currency: string;

  // Transactions
  transactions: Transaction[];

  // Metadata
  statementId: string;
  generatedDate: string;
  /** The business's brand colour (theme_config). Falls back to the platform gold. */
  accentColor?: string;
}

const COLUMNS = { date: '15%', id: '13%', description: '34%', amount: '19%', balance: '19%' };

export const MonthlyStatementPDF = (data: MonthlyStatementData) => {
  const netChange = data.closingBalance - data.openingBalance;
  const isPositiveChange = netChange >= 0;
  const money = (amount: number) => formatCurrency(amount, data.currency);

  return (
    <PdfDocument
      theme={pdfTheme(data.accentColor ?? pdfColors.gold)}
      title={`Monthly Wallet Statement ${data.statementMonth} ${data.statementYear}`}
      footerText={`Generated on ${data.generatedDate} | Vehicle Service`}
    >
      <DocumentHeader
        issuerName={data.businessName}
        contactLines={[data.businessEmail, data.businessPhone, data.businessAddress]}
        title="WALLET STATEMENT"
        reference={data.statementId.substring(0, 12).toUpperCase()}
        metaLines={[`Monthly Wallet Statement`, `${data.statementMonth} ${data.statementYear}`]}
      />

      <SectionLabel>Financial Summary</SectionLabel>
      <TotalsBox
        aside={
          <DetailPanel
            title="Statement Period"
            items={[
              { label: 'Statement ID', value: data.statementId.substring(0, 12).toUpperCase() },
              { label: 'Period', value: `${data.startDate} to ${data.endDate}` },
              { label: 'Total Transactions', value: String(data.transactionCount) },
            ]}
          />
        }
        rows={[
          { key: 'Opening Balance', value: money(data.openingBalance) },
          { key: 'Total Credits (+)', value: `+${money(data.totalCredits)}`, valueStyle: { color: pdfColors.success } },
          { key: 'Total Debits (-)', value: `-${money(data.totalDebits)}`, valueStyle: { color: pdfColors.error } },
          {
            key: 'Net Change',
            value: `${isPositiveChange ? '+' : ''}${money(netChange)}`,
            valueStyle: { color: isPositiveChange ? pdfColors.success : pdfColors.error },
          },
        ]}
        total={{ label: 'Closing Balance', value: money(data.closingBalance) }}
      />

      <SectionLabel>Transaction History</SectionLabel>
      {data.transactions.length === 0 ? (
        <View style={{ backgroundColor: pdfColors.background, borderRadius: 4, padding: 12, marginBottom: 18 }}>
          <Text style={{ fontSize: 9, color: pdfColors.textLight, textAlign: 'center' }}>
            No transactions during this period
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 18 }}>
          <Table variant="primary-header">
            <TableHeader>
              <TableRow header>
                <TableCell width={COLUMNS.date}>Date</TableCell>
                <TableCell width={COLUMNS.id}>ID</TableCell>
                <TableCell width={COLUMNS.description}>Description</TableCell>
                <TableCell width={COLUMNS.amount} align="right">Amount</TableCell>
                <TableCell width={COLUMNS.balance} align="right">Balance</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((transaction) => {
                const isCredit = transaction.type === 'credit';
                return (
                  <TableRow key={transaction.id}>
                    <TableCell width={COLUMNS.date}>{transaction.date}</TableCell>
                    <TableCell width={COLUMNS.id}>{transaction.id.substring(0, 8)}</TableCell>
                    <TableCell width={COLUMNS.description}>{transaction.description}</TableCell>
                    <TableCell
                      width={COLUMNS.amount}
                      align="right"
                      style={{ color: isCredit ? pdfColors.success : pdfColors.error }}
                    >
                      {`${isCredit ? '+' : '-'}${money(Math.abs(transaction.amount))}`}
                    </TableCell>
                    <TableCell width={COLUMNS.balance} align="right">
                      {money(transaction.balance)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </View>
      )}

      <NotesBlock title="Important Information">
        {'\u2022'} This statement provides a summary of your wallet activity for the specified period.
        {'\n'}
        {'\u2022'} All amounts are displayed in {data.currency}.
        {'\n'}
        {'\u2022'} Please review this statement carefully and report any discrepancies within 30 days.
        {'\n'}
        {'\u2022'} For detailed transaction information or questions, please contact our support team.
        {'\n'}
        {'\u2022'} Keep this statement for your records.
      </NotesBlock>
    </PdfDocument>
  );
};
