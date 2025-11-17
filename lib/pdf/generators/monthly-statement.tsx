/**
 * Monthly Statement PDF Generator
 * Generates comprehensive monthly wallet statements
 */

import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../styles/constants';
import { PdfHeader } from '../components/pdf-header';
import { PdfFooter } from '../components/pdf-footer';
import { formatCurrency } from '@/lib/utils/currency-converter';

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
}

export const MonthlyStatementPDF = (data: MonthlyStatementData) => {
  const netChange = data.closingBalance - data.openingBalance;
  const isPositiveChange = netChange >= 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <PdfHeader
          title="Monthly Wallet Statement"
          subtitle={`${data.statementMonth} ${data.statementYear}`}
          businessName={data.businessName}
          businessEmail={data.businessEmail}
          businessPhone={data.businessPhone}
          businessAddress={data.businessAddress}
        />

        {/* Statement Period */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Statement Period</Text>
          <View style={pdfStyles.infoBox}>
            <View style={pdfStyles.infoBoxRow}>
              <Text style={pdfStyles.infoBoxLabel}>Statement ID</Text>
              <Text style={pdfStyles.infoBoxValue}>{data.statementId.substring(0, 12).toUpperCase()}</Text>
            </View>
            <View style={pdfStyles.infoBoxRow}>
              <Text style={pdfStyles.infoBoxLabel}>Period</Text>
              <Text style={pdfStyles.infoBoxValue}>
                {data.startDate} to {data.endDate}
              </Text>
            </View>
            <View style={pdfStyles.infoBoxRow}>
              <Text style={pdfStyles.infoBoxLabel}>Total Transactions</Text>
              <Text style={pdfStyles.infoBoxValue}>{data.transactionCount}</Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Financial Summary</Text>
          <View style={pdfStyles.summaryBox}>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Opening Balance</Text>
              <Text style={pdfStyles.summaryValue}>
                {formatCurrency(data.openingBalance, data.currency)}
              </Text>
            </View>

            <View style={[pdfStyles.summaryRow, { marginTop: 10, paddingTop: 10, borderTop: `1 solid ${pdfColors.border}` }]}>
              <Text style={pdfStyles.summaryLabel}>Total Credits (+)</Text>
              <Text style={[pdfStyles.summaryValue, { color: pdfColors.success }]}>
                +{formatCurrency(data.totalCredits, data.currency)}
              </Text>
            </View>

            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Total Debits (-)</Text>
              <Text style={[pdfStyles.summaryValue, { color: pdfColors.error }]}>
                -{formatCurrency(data.totalDebits, data.currency)}
              </Text>
            </View>

            <View style={[pdfStyles.summaryRow, { marginTop: 5 }]}>
              <Text style={pdfStyles.summaryLabel}>Net Change</Text>
              <Text style={[pdfStyles.summaryValue, { color: isPositiveChange ? pdfColors.success : pdfColors.error }]}>
                {isPositiveChange ? '+' : ''}{formatCurrency(netChange, data.currency)}
              </Text>
            </View>

            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>Closing Balance</Text>
              <Text style={pdfStyles.totalValue}>
                {formatCurrency(data.closingBalance, data.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Transaction History</Text>

          {data.transactions.length === 0 ? (
            <View style={pdfStyles.infoBox}>
              <Text style={{ fontSize: 9, color: pdfColors.textLight, textAlign: 'center' }}>
                No transactions during this period
              </Text>
            </View>
          ) : (
            <View style={pdfStyles.table}>
              {/* Table Header */}
              <View style={pdfStyles.tableHeader}>
                <View style={{ width: '15%' }}>
                  <Text style={pdfStyles.tableCellHeader}>Date</Text>
                </View>
                <View style={{ width: '15%' }}>
                  <Text style={pdfStyles.tableCellHeader}>ID</Text>
                </View>
                <View style={{ width: '35%' }}>
                  <Text style={pdfStyles.tableCellHeader}>Description</Text>
                </View>
                <View style={{ width: '15%' }}>
                  <Text style={[pdfStyles.tableCellHeader, pdfStyles.textRight]}>Amount</Text>
                </View>
                <View style={{ width: '20%' }}>
                  <Text style={[pdfStyles.tableCellHeader, pdfStyles.textRight]}>Balance</Text>
                </View>
              </View>

              {/* Table Rows */}
              {data.transactions.map((transaction, index) => {
                const isCredit = transaction.type === 'credit';
                const amountColor = isCredit ? pdfColors.success : pdfColors.error;

                return (
                  <View key={transaction.id} style={pdfStyles.tableRow}>
                    <View style={{ width: '15%' }}>
                      <Text style={pdfStyles.tableCell}>{transaction.date}</Text>
                    </View>
                    <View style={{ width: '15%' }}>
                      <Text style={pdfStyles.tableCell}>
                        {transaction.id.substring(0, 8)}
                      </Text>
                    </View>
                    <View style={{ width: '35%' }}>
                      <Text style={pdfStyles.tableCell}>{transaction.description}</Text>
                    </View>
                    <View style={{ width: '15%' }}>
                      <Text style={[pdfStyles.tableCell, pdfStyles.textRight, { color: amountColor }]}>
                        {isCredit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), data.currency)}
                      </Text>
                    </View>
                    <View style={{ width: '20%' }}>
                      <Text style={[pdfStyles.tableCell, pdfStyles.textRight]}>
                        {formatCurrency(transaction.balance, data.currency)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={[pdfStyles.section, { marginTop: 20 }]}>
          <Text style={[pdfStyles.sectionTitle, { fontSize: 10 }]}>Important Information</Text>
          <Text style={{ fontSize: 8, color: pdfColors.textLight, lineHeight: 1.5 }}>
            • This statement provides a summary of your wallet activity for the specified period.
            {'\n'}
            • All amounts are displayed in {data.currency}.
            {'\n'}
            • Please review this statement carefully and report any discrepancies within 30 days.
            {'\n'}
            • For detailed transaction information or questions, please contact our support team.
            {'\n'}
            • Keep this statement for your records.
          </Text>
        </View>

        {/* Footer */}
        <PdfFooter generatedDate={data.generatedDate} />
      </Page>
    </Document>
  );
};
