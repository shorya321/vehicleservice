/**
 * Booking Invoice PDF Generator
 * Generates customer-facing PDF invoices for confirmed B2C transfer bookings.
 *
 * All currency conversion and formatting is done by the caller — this component
 * receives pre-formatted strings so the document never re-derives an amount.
 */

import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../styles/constants';
// The customer copy — never lib/business/, which the business module owns and is free to diverge.
import { formatGuestSummary } from '@/components/home/hero/guest-breakdown';

/**
 * Local overrides only — the shared pdfStyles are spaced for the multi-page wallet
 * statements and push this invoice onto a second page. Kept local so the business
 * wallet PDFs are unaffected.
 */
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: pdfColors.text,
    backgroundColor: pdfColors.white,
  },
  section: {
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: pdfColors.background,
    padding: 10,
    borderRadius: 4,
  },
  infoBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  column: {
    width: '48%',
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottom: `1 solid ${pdfColors.border}`,
  },
  summaryBox: {
    backgroundColor: pdfColors.background,
    padding: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  notes: {
    fontSize: 8,
    color: pdfColors.textLight,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `2 solid ${pdfColors.border}`,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: pdfColors.primary,
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 8,
    color: pdfColors.textLight,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: pdfColors.primary,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 9,
    color: pdfColors.textLight,
    textAlign: 'right',
    marginTop: 2,
  },
});

export interface BookingInvoiceLineItem {
  label: string;
  quantity: number | null;
  amount: string;
}

export interface BookingInvoiceData {
  // Reference — trip number is the only reference shown to the customer
  invoiceNumber: string;
  issuedDate: string;
  paymentMethod?: string;

  // Company (issuer)
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;

  // Customer (bill to)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  // Trip
  pickupAddress: string;
  dropoffAddress: string;
  pickupDatetime?: string;
  vehicleTypeName?: string;
  passengerCount: number;
  // Optional: bookings that predate the guest breakdown fall back to the plain total.
  adults?: number;
  children?: number;
  infants?: number;
  luggageCount?: number;

  // Charges
  lineItems: BookingInvoiceLineItem[];
  totalDisplay: string;
  totalAed: string;
  showAedNote: boolean;

  generatedDate: string;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoBoxRow}>
    <Text style={pdfStyles.infoBoxLabel}>{label}</Text>
    <Text style={pdfStyles.infoBoxValue}>{value}</Text>
  </View>
);

export const BookingInvoicePDF = (data: BookingInvoiceData) => {
  // Mirrors the confirmation email: name the party when we know it, else the plain total.
  const passengerLabel =
    data.adults != null
      ? formatGuestSummary({
          adults: data.adults,
          children: data.children ?? 0,
          infants: data.infants ?? 0,
        })
      : String(data.passengerCount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Own compact header rather than the shared PdfHeader, which is sized for the
            business wallet statements and pushes this invoice onto a second page */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{data.companyName}</Text>
            {data.companyEmail && <Text style={styles.companyInfo}>{data.companyEmail}</Text>}
            {data.companyPhone && <Text style={styles.companyInfo}>{data.companyPhone}</Text>}
            {data.companyAddress && <Text style={styles.companyInfo}>{data.companyAddress}</Text>}
          </View>
          <View>
            <Text style={styles.headerTitle}>INVOICE</Text>
            <Text style={styles.headerSubtitle}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Invoice + customer, side by side */}
        <View style={[styles.section, styles.columns]}>
          <View style={styles.column}>
            <Text style={pdfStyles.sectionTitle}>Invoice Details</Text>
            <View style={styles.infoBox}>
              <InfoRow label="Invoice Number" value={data.invoiceNumber} />
              <InfoRow label="Invoice Date" value={data.issuedDate} />
              <InfoRow label="Payment Status" value="Paid" />
              {data.paymentMethod && <InfoRow label="Payment Method" value={data.paymentMethod} />}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={pdfStyles.sectionTitle}>Billed To</Text>
            <View style={styles.infoBox}>
              <InfoRow label="Name" value={data.customerName} />
              {data.customerEmail && <InfoRow label="Email" value={data.customerEmail} />}
              {data.customerPhone && <InfoRow label="Phone" value={data.customerPhone} />}
            </View>
          </View>
        </View>

        {/* Trip */}
        <View style={styles.section}>
          <Text style={pdfStyles.sectionTitle}>Trip Details</Text>
          <View style={styles.infoBox}>
            <InfoRow label="From" value={data.pickupAddress} />
            <InfoRow label="To" value={data.dropoffAddress} />
            {data.pickupDatetime && <InfoRow label="Pickup" value={data.pickupDatetime} />}
            {data.vehicleTypeName && <InfoRow label="Vehicle" value={data.vehicleTypeName} />}
            {/* Luggage gets its own row: formatGuestSummary already uses "·" before infants, so
                appending "· N luggage" would give one separator two meanings. */}
            <InfoRow label="Passengers" value={passengerLabel} />
            {data.luggageCount != null && (
              <InfoRow label="Luggage" value={String(data.luggageCount)} />
            )}
          </View>
        </View>

        {/* Charges — wrap={false} keeps the table from splitting across pages */}
        <View style={styles.section} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>Charges</Text>
          <View style={styles.table}>
            <View style={pdfStyles.tableHeader}>
              <View style={{ width: '55%' }}>
                <Text style={pdfStyles.tableCellHeader}>Description</Text>
              </View>
              <View style={{ width: '15%' }}>
                <Text style={[pdfStyles.tableCellHeader, pdfStyles.textCenter]}>Qty</Text>
              </View>
              <View style={{ width: '30%' }}>
                <Text style={[pdfStyles.tableCellHeader, pdfStyles.textRight]}>Amount</Text>
              </View>
            </View>

            {data.lineItems.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={{ width: '55%' }}>
                  <Text style={pdfStyles.tableCell}>{item.label}</Text>
                </View>
                <View style={{ width: '15%' }}>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textCenter]}>
                    {item.quantity != null ? String(item.quantity) : '1'}
                  </Text>
                </View>
                <View style={{ width: '30%' }}>
                  <Text style={[pdfStyles.tableCell, pdfStyles.textRight]}>{item.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.summaryBox} wrap={false}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Total Paid</Text>
            <Text style={pdfStyles.totalValue}>{data.totalDisplay}</Text>
          </View>
          {data.showAedNote && (
            <Text style={{ fontSize: 8, color: pdfColors.textLight, marginTop: 6, textAlign: 'right' }}>
              Charged in AED ({data.totalAed}). Converted amounts are indicative and use the exchange
              rate at the time this invoice was generated.
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={[styles.section, { marginTop: 16 }]} wrap={false}>
          <Text style={[pdfStyles.sectionTitle, { fontSize: 10 }]}>Notes</Text>
          <Text style={styles.notes}>
            This invoice confirms payment has been received in full for the transfer detailed above.
            {'\n'}
            For any questions about this invoice, please contact our support team quoting invoice
            number {data.invoiceNumber}.
          </Text>
        </View>

        {/* Own footer rather than the shared PdfFooter, which is branded for the business wallet PDFs */}
        <View style={pdfStyles.footer} fixed>
          <Text>
            Generated on {data.generatedDate} | {data.companyName} | Page{' '}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  );
};

export default BookingInvoicePDF;
