/**
 * Booking Invoice PDF Generator
 * Generates customer-facing PDF invoices for confirmed B2C transfer bookings.
 *
 * All currency conversion and formatting is done by the caller. This component
 * receives pre-formatted strings so the document never re-derives an amount.
 */

// The customer copy, never lib/business/, which the business module owns and is free to diverge.
import { formatGuestSummary } from '@/components/home/hero/guest-breakdown';
import { View } from '@/lib/pdf-primitives';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/pdf/table/table';
import { PdfDocument } from '../document/pdf-document';
import { DocumentHeader } from '../document/document-header';
import { DetailPanel, MetaGrid, NotesBlock, SectionLabel, TotalsBox, type MetaItem } from '../document/blocks';
import { platformPdfTheme } from '../document/theme';

export interface BookingInvoiceLineItem {
  label: string;
  quantity: number | null;
  /** Price for one unit. Printed so that quantity x unitAmount = amount reads true. */
  unitAmount: string;
  /** Line total for the whole quantity, never a unit price. */
  amount: string;
}

export interface BookingInvoiceData {
  // Reference. Trip number is the only reference shown to the customer
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
  /** Hourly hire, e.g. "Half day, 5 hours, 100 km included, as directed". Replaces "To". */
  hireDetails?: string;
  /** Round trip / multi-city: every journey. Replaces From, To and Pickup. */
  journeys?: Array<{ label: string; route: string; when: string }>;
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

  const tripItems: MetaItem[] =
    data.journeys && data.journeys.length > 0
      ? data.journeys.map((journey) => ({ label: journey.label, value: `${journey.route}, ${journey.when}` }))
      : [
          { label: 'From', value: data.pickupAddress },
          data.hireDetails
            ? { label: 'Hire', value: data.hireDetails }
            : { label: 'To', value: data.dropoffAddress },
          ...(data.pickupDatetime ? [{ label: 'Pickup', value: data.pickupDatetime }] : []),
        ];

  return (
    <PdfDocument
      theme={platformPdfTheme}
      title={`Invoice ${data.invoiceNumber}`}
      footerText={`Generated on ${data.generatedDate} | ${data.companyName}`}
    >
      <DocumentHeader
        issuerName={data.companyName}
        contactLines={[data.companyEmail, data.companyPhone, data.companyAddress]}
        title="INVOICE"
        reference={data.invoiceNumber}
      />

      <MetaGrid
        items={[
          { label: 'Invoice Number', value: data.invoiceNumber },
          { label: 'Invoice Date', value: data.issuedDate },
          { label: 'Payment Status', value: 'Paid' },
          ...(data.paymentMethod ? [{ label: 'Payment Method', value: data.paymentMethod }] : []),
        ]}
        party={{ label: 'Billed To', lines: [data.customerName, data.customerEmail, data.customerPhone] }}
      />

      <DetailPanel
        title="Trip Details"
        items={[
          ...tripItems,
          ...(data.vehicleTypeName ? [{ label: 'Vehicle', value: data.vehicleTypeName }] : []),
          // Luggage gets its own row: formatGuestSummary already uses "·" before infants, so
          // appending "· N luggage" would give one separator two meanings.
          { label: 'Passengers', value: passengerLabel },
          ...(data.luggageCount != null && data.luggageCount > 0
            ? [{ label: 'Luggage', value: String(data.luggageCount) }]
            : []),
        ]}
      />

      {/* Not kept together: a multi-journey trip has many lines, and holding them as one block
          pushed the whole table to page 2 and left page 1 half empty. */}
      <View>
        <SectionLabel>Charges</SectionLabel>
        <Table variant="primary-header">
          <TableHeader>
            <TableRow header>
              <TableCell width="43%">Description</TableCell>
              <TableCell width="11%" align="center">Qty</TableCell>
              <TableCell width="21%" align="right">Unit Price</TableCell>
              <TableCell width="25%" align="right">Amount</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lineItems.map((item, index) => (
              <TableRow key={`${index}-${item.label}`}>
                <TableCell width="43%">{item.label}</TableCell>
                <TableCell width="11%" align="center">
                  {item.quantity != null ? String(item.quantity) : '1'}
                </TableCell>
                <TableCell width="21%" align="right">{item.unitAmount}</TableCell>
                <TableCell width="25%" align="right">{item.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </View>

      <TotalsBox
        rows={[]}
        total={{ label: 'Total Paid', value: data.totalDisplay }}
        note={
          data.showAedNote
            ? `Charged in AED (${data.totalAed}). Converted amounts are indicative, rounded per line, and use the exchange rate at the time this invoice was generated.`
            : undefined
        }
      />

      <NotesBlock title="Notes">
        This invoice confirms payment has been received in full for the transfer detailed above.
        {'\n'}
        For any questions about this invoice, please contact our support team quoting invoice
        number {data.invoiceNumber}.
      </NotesBlock>
    </PdfDocument>
  );
};

export default BookingInvoicePDF;
