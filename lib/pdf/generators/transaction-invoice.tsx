/**
 * Transaction Invoice PDF Generator
 * Generates PDF invoices for wallet transactions
 */

import { formatCurrency } from '@/lib/utils/currency-converter';
import { View } from '@/lib/pdf-primitives';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/pdf/table/table';
import { pdfColors } from '../colors';
import { PdfDocument } from '../document/pdf-document';
import { DocumentHeader } from '../document/document-header';
import { DetailPanel, NotesBlock, SectionLabel, TotalsBox } from '../document/blocks';
import { pdfTheme } from '../document/theme';

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
  tripNumber?: string;

  // Metadata
  generatedDate: string;
  /** The business's brand colour (theme_config). Falls back to the platform gold. */
  accentColor?: string;
}

export const TransactionInvoicePDF = (data: TransactionInvoiceData) => {
  const isCredit = data.transactionType === 'credit';
  const amountColor = isCredit ? pdfColors.success : pdfColors.error;
  const invoiceCode = data.transactionId.substring(0, 8).toUpperCase();
  const signedAmount = `${isCredit ? '+' : '-'}${formatCurrency(Math.abs(data.amount), data.currency)}`;

  return (
    <PdfDocument
      theme={pdfTheme(data.accentColor ?? pdfColors.gold)}
      title={`Transaction Invoice ${invoiceCode}`}
      footerText={`Generated on ${data.generatedDate} | Vehicle Service`}
    >
      <DocumentHeader
        issuerName={data.businessName}
        contactLines={[data.businessEmail, data.businessPhone, data.businessAddress]}
        title="TRANSACTION INVOICE"
        reference={invoiceCode}
      />

      <DetailPanel
        title="Transaction Summary"
        items={[
          { label: 'Transaction ID', value: data.transactionId },
          { label: 'Date & Time', value: data.transactionDate },
          { label: 'Transaction Type', value: isCredit ? 'Credit (Funds Added)' : 'Debit (Funds Used)' },
          ...(data.paymentMethod ? [{ label: 'Payment Method', value: data.paymentMethod }] : []),
          ...(data.tripNumber ? [{ label: 'Trip Number', value: data.tripNumber }] : []),
          ...(data.bookingReference ? [{ label: 'Booking Reference', value: data.bookingReference }] : []),
        ]}
      />

      <View wrap={false}>
        <SectionLabel>Transaction Details</SectionLabel>
        <Table variant="primary-header">
          <TableHeader>
            <TableRow header>
              <TableCell width="60%">Description</TableCell>
              <TableCell width="40%" align="right">Amount</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell width="60%">{data.description}</TableCell>
              <TableCell width="40%" align="right" style={{ color: amountColor, fontWeight: 700 }}>
                {signedAmount}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </View>

      <TotalsBox
        rows={[
          { key: 'Previous Balance', value: formatCurrency(data.previousBalance, data.currency) },
          {
            key: isCredit ? 'Amount Added' : 'Amount Deducted',
            value: signedAmount,
            valueStyle: { color: amountColor },
          },
        ]}
        total={{ label: 'New Balance', value: formatCurrency(data.newBalance, data.currency) }}
      />

      <NotesBlock title="Notes">
        This invoice is for informational purposes and serves as a record of your wallet transaction.
        {'\n'}
        For questions or concerns about this transaction, please contact our support team with the
        transaction ID provided above.
        {'\n\n'}
        Thank you for using Vehicle Service.
      </NotesBlock>
    </PdfDocument>
  );
};
