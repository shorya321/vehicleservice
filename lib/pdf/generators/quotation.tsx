/**
 * Quotation PDF Generator
 *
 * The customer-facing document for a business quotation covering one or more trips.
 *
 * Two rules govern this file:
 *
 * 1. It receives PRE-FORMATTED strings and never re-derives an amount — the same discipline
 *    documented in booking-invoice.tsx. Currency conversion, rounding and date formatting all
 *    happen in lib/business/quotations/pdf-payload.ts.
 *
 * 2. QuotationPdfData has NO net-cost, markup or margin fields. They are absent rather than
 *    optional, so passing one is a compile error. That is the structural guarantee that the
 *    business's internal cost can never leak onto a document they hand a customer.
 */

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, pdfColors } from '../styles/constants';

/**
 * Local styles rather than the shared PdfHeader/PdfFooter: those are spaced for the
 * multi-page wallet statements and push a one-page document onto a second page.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
  },
  headerRule: { height: 2, marginBottom: 16 },
  logo: { height: 38, maxWidth: 160, objectFit: 'contain', marginBottom: 4 },
  brandName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  companyInfo: { fontSize: 8, color: pdfColors.textLight, marginBottom: 1 },
  docTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  docMeta: { fontSize: 9, color: pdfColors.textLight, textAlign: 'right', marginTop: 2 },

  section: { marginBottom: 12 },
  columns: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  column: { width: '48%' },
  infoBox: { backgroundColor: pdfColors.background, padding: 10, borderRadius: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },

  tripBlock: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: pdfColors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  tripHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripLabel: { fontSize: 8, color: pdfColors.textLight, textTransform: 'uppercase' },
  tripAmount: { fontSize: 12, fontWeight: 'bold' },
  tripRoute: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  tripDetail: { fontSize: 9, color: pdfColors.textLight, marginBottom: 2 },

  summaryBox: {
    backgroundColor: pdfColors.background,
    padding: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 10, color: pdfColors.textLight },
  summaryValue: { fontSize: 10 },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: pdfColors.border,
  },
  grandLabel: { fontSize: 12, fontWeight: 'bold' },
  grandValue: { fontSize: 14, fontWeight: 'bold' },

  bodyText: { fontSize: 8, color: pdfColors.textLight, lineHeight: 1.4 },
  continued: { fontSize: 8, color: pdfColors.textLight, marginBottom: 6 },
});

/** In-memory image for @react-pdf. Declared locally so lib/pdf stays independent. */
export interface QuotationPdfLogo {
  data: Buffer;
  format: 'png' | 'jpg';
}

/**
 * One trip as it appears to the customer.
 * `amount` is the SELL price, already converted and formatted. There is no cost field here
 * by design.
 */
export interface QuotationPdfLineItem {
  /** "Trip 1 of 3" */
  label: string;
  /** "DXB Terminal 3 -> Dubai Marina" */
  route: string;
  /** "Thu 12 Mar 2026 - 14:30", or a dash when the trip is undated. */
  when: string;
  vehicle: string;
  guests: string;
  /** Addons NAMED without prices — itemising invites line-by-line haggling. */
  addons?: string;
  notes?: string;
  amount: string;
}

export interface QuotationPdfData {
  quotationNumber: string;
  issuedDate: string;
  validUntil?: string;
  /** Present when the quotation has been revised, so the customer knows which copy is current. */
  updatedDate?: string;

  brandName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  logo?: QuotationPdfLogo | null;
  accentColor: string;

  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  preparedBy?: string;

  lineItems: QuotationPdfLineItem[];

  subtotalDisplay: string;
  discountDisplay?: string;
  totalDisplay: string;

  terms?: string;
  notes?: string;
  generatedDate: string;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={pdfStyles.infoBoxLabel}>{label}</Text>
    <Text style={pdfStyles.infoBoxValue}>{value}</Text>
  </View>
);

export const QuotationPDF = (data: QuotationPdfData) => {
  const accent = data.accentColor;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — logo when we have a drawable one, otherwise a typographic wordmark.
            resolveBrandLogo() returns null for SVG/webp, which @react-pdf cannot draw. */}
        <View style={styles.header}>
          <View>
            {data.logo ? (
              // @react-pdf's Image is a PDF primitive, not an HTML <img> — no alt prop exists.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.logo} src={data.logo} />
            ) : (
              <Text style={[styles.brandName, { color: accent }]}>{data.brandName}</Text>
            )}
            {data.companyEmail && <Text style={styles.companyInfo}>{data.companyEmail}</Text>}
            {data.companyPhone && <Text style={styles.companyInfo}>{data.companyPhone}</Text>}
            {data.companyAddress && (
              <Text style={styles.companyInfo}>{data.companyAddress}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.docTitle, { color: accent }]}>QUOTATION</Text>
            <Text style={styles.docMeta}>#{data.quotationNumber}</Text>
            {data.validUntil && (
              <Text style={styles.docMeta}>Valid until {data.validUntil}</Text>
            )}
          </View>
        </View>
        <View style={[styles.headerRule, { backgroundColor: accent }]} />

        {/* Customer and quotation meta, side by side */}
        <View style={[styles.section, styles.columns]}>
          <View style={styles.column}>
            <Text style={pdfStyles.sectionTitle}>Prepared For</Text>
            <View style={styles.infoBox}>
              <InfoRow label="Name" value={data.customerName} />
              {data.customerCompany && (
                <InfoRow label="Company" value={data.customerCompany} />
              )}
              {data.customerEmail && <InfoRow label="Email" value={data.customerEmail} />}
              {data.customerPhone && <InfoRow label="Phone" value={data.customerPhone} />}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={pdfStyles.sectionTitle}>Quotation Details</Text>
            <View style={styles.infoBox}>
              <InfoRow label="Number" value={data.quotationNumber} />
              <InfoRow label="Issued" value={data.issuedDate} />
              {data.updatedDate && <InfoRow label="Updated" value={data.updatedDate} />}
              {data.validUntil && <InfoRow label="Valid Until" value={data.validUntil} />}
              {data.preparedBy && <InfoRow label="Prepared By" value={data.preparedBy} />}
            </View>
          </View>
        </View>

        {/* Itinerary. Each trip is wrap={false} so a single trip never splits across pages. */}
        <View style={styles.section}>
          <Text style={pdfStyles.sectionTitle}>Itinerary</Text>
          {data.lineItems.map((item, index) => (
            <View style={styles.tripBlock} key={index} wrap={false}>
              <View style={styles.tripHead}>
                <Text style={styles.tripLabel}>{item.label}</Text>
                <Text style={[styles.tripAmount, { color: accent }]}>{item.amount}</Text>
              </View>
              <Text style={styles.tripRoute}>{item.route}</Text>
              <Text style={styles.tripDetail}>
                {item.when} · {item.vehicle}
              </Text>
              <Text style={styles.tripDetail}>{item.guests}</Text>
              {item.addons && <Text style={styles.tripDetail}>Includes: {item.addons}</Text>}
              {item.notes && <Text style={styles.tripDetail}>{item.notes}</Text>}
            </View>
          ))}
        </View>

        {/* Totals — wrap={false} because a grand total orphaned from its subtotal is the
            worst possible outcome on a document being negotiated over. */}
        <View style={styles.summaryBox} wrap={false}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{data.subtotalDisplay}</Text>
          </View>
          {data.discountDisplay && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>{data.discountDisplay}</Text>
            </View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={[styles.grandValue, { color: accent }]}>{data.totalDisplay}</Text>
          </View>
        </View>

        {(data.terms || data.notes) && (
          <View style={[styles.section, { marginTop: 16 }]} wrap={false}>
            {data.notes && (
              <>
                <Text style={[pdfStyles.sectionTitle, { fontSize: 10 }]}>Notes</Text>
                <Text style={styles.bodyText}>{data.notes}</Text>
              </>
            )}
            {data.terms && (
              <>
                <Text
                  style={[
                    pdfStyles.sectionTitle,
                    { fontSize: 10, marginTop: data.notes ? 10 : 0 },
                  ]}
                >
                  Terms &amp; Conditions
                </Text>
                <Text style={styles.bodyText}>{data.terms}</Text>
              </>
            )}
          </View>
        )}

        <View style={pdfStyles.footer} fixed>
          <Text>
            Quotation {data.quotationNumber} | {data.brandName} | Generated{' '}
            {data.generatedDate} | Page{' '}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
};

export default QuotationPDF;
