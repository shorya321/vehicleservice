/**
 * Transaction Invoice PDF Generator
 * Generates PDF invoices for wallet transactions
 */

import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../styles/constants';
import { PdfHeader } from '../components/pdf-header';
import { PdfFooter } from '../components/pdf-footer';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';

interface TransactionInvoiceData {
  // Business Information
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;

  // Transaction Details
  transactionId: string;
  transactionDate: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  paymentMethod?: string;

  // Balance Information
  previousBalance: number;
  newBalance: number;

  // Booking Reference (if applicable)
  bookingReference?: string;

  // Metadata
  generatedDate: string;
}

export const TransactionInvoicePDF = (data: TransactionInvoiceData) => {
  const isCredit = data.transactionType === 'credit';
  const amountColor = isCredit ? pdfColors.success : pdfColors.error;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <PdfHeader
          title="Transaction Invoice"
          subtitle={`Invoice #${data.transactionId.substring(0, 8).toUpperCase()}`}
          businessName={data.businessName}
          businessEmail={data.businessEmail}
          businessPhone={data.businessPhone}
          businessAddress={data.businessAddress}
        />

        {/* Transaction Summary */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Transaction Summary</Text>
          <View style={pdfStyles.infoBox}>
            <View style={pdfStyles.infoBoxRow}>
              <Text style={pdfStyles.infoBoxLabel}>Transaction ID</Text>
              <Text style={pdfStyles.infoBoxValue}>{data.transactionId}</Text>
            </View>
            <View style={pdfStyles.infoBoxRow}>
              <Text style={pdfStyles.infoBoxLabel}>Date & Time</Text>
              <Text style={pdfStyles.infoBoxValue}>{data.transactionDate}</Text>
            </View>
            <View style={pdfStyles.infoBoxRow}>
              <Text style={pdfStyles.infoBoxLabel}>Transaction Type</Text>
              <Text style={pdfStyles.infoBoxValue}>
                {isCredit ? 'Credit (Funds Added)' : 'Debit (Funds Used)'}
              </Text>
            </View>
            {data.paymentMethod && (
              <View style={pdfStyles.infoBoxRow}>
                <Text style={pdfStyles.infoBoxLabel}>Payment Method</Text>
                <Text style={pdfStyles.infoBoxValue}>{data.paymentMethod}</Text>
              </View>
            )}
            {data.bookingReference && (
              <View style={pdfStyles.infoBoxRow}>
                <Text style={pdfStyles.infoBoxLabel}>Booking Reference</Text>
                <Text style={pdfStyles.infoBoxValue}>{data.bookingReference}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Transaction Details */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Transaction Details</Text>
          <View style={pdfStyles.table}>
            {/* Table Header */}
            <View style={pdfStyles.tableHeader}>
              <View style={{ width: '60%' }}>
                <Text style={pdfStyles.tableCellHeader}>Description</Text>
              </View>
              <View style={{ width: '40%' }}>
                <Text style={[pdfStyles.tableCellHeader, pdfStyles.textRight]}>Amount</Text>
              </View>
            </View>

            {/* Table Row */}
            <View style={pdfStyles.tableRow}>
              <View style={{ width: '60%' }}>
                <Text style={pdfStyles.tableCell}>{data.description}</Text>
              </View>
              <View style={{ width: '40%' }}>
                <Text style={[pdfStyles.tableCell, pdfStyles.textRight, { color: amountColor, fontWeight: 'bold' }]}>
                  {isCredit ? '+' : '-'}{formatCurrency(Math.abs(data.amount), data.currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Balance Summary */}
        <View style={pdfStyles.summaryBox}>
          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryLabel}>Previous Balance</Text>
            <Text style={pdfStyles.summaryValue}>
              {formatCurrency(data.previousBalance, data.currency)}
            </Text>
          </View>

          <View style={pdfStyles.summaryRow}>
            <Text style={pdfStyles.summaryLabel}>
              {isCredit ? 'Amount Added' : 'Amount Deducted'}
            </Text>
            <Text style={[pdfStyles.summaryValue, { color: amountColor }]}>
              {isCredit ? '+' : '-'}{formatCurrency(Math.abs(data.amount), data.currency)}
            </Text>
          </View>

          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>New Balance</Text>
            <Text style={pdfStyles.totalValue}>
              {formatCurrency(data.newBalance, data.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={[pdfStyles.section, { marginTop: 30 }]}>
          <Text style={[pdfStyles.sectionTitle, { fontSize: 10 }]}>Notes</Text>
          <Text style={{ fontSize: 9, color: pdfColors.textLight, lineHeight: 1.5 }}>
            This invoice is for informational purposes and serves as a record of your wallet transaction.
            {'\n'}
            For questions or concerns about this transaction, please contact our support team with the
            transaction ID provided above.
            {'\n\n'}
            Thank you for using Vehicle Service.
          </Text>
        </View>

        {/* Footer */}
        <PdfFooter generatedDate={data.generatedDate} />
      </Page>
    </Document>
  );
};
