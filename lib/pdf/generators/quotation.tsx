/**
 * Quotation PDF Generator
 *
 * The customer-facing document for a business quotation covering one or more trips.
 *
 * Two rules govern this file:
 *
 * 1. It receives PRE-FORMATTED strings and never re-derives an amount. The same discipline
 *    documented in booking-invoice.tsx. Currency conversion, rounding and date formatting all
 *    happen in lib/business/quotations/pdf-payload.ts.
 *
 * 2. QuotationPdfData has NO net-cost, markup or margin fields. They are absent rather than
 *    optional, so passing one is a compile error. That is the structural guarantee that the
 *    business's internal cost can never leak onto a document they hand a customer.
 */

import { usePdfcnTheme } from '@/components/pdf/theme-provider';
import { KeepTogether } from '@/components/pdf/keep-together/keep-together';
import type { KeyValueEntry } from '@/components/pdf/key-value/key-value';
import { Image, Text, View } from '@/lib/pdf-primitives';
import { PdfDocument } from '../document/pdf-document';
import { DocumentHeader } from '../document/document-header';
import { MetaGrid, NotesBlock, SectionLabel, TotalsBox } from '../document/blocks';
import { pdfTheme } from '../document/theme';
import { toDataUri } from '../utils/image';

/** In-memory image for the PDF engine. Declared locally so lib/pdf stays independent. */
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
  /** Photo of the quoted vehicle. Absent when the type has none or it could not be loaded. */
  vehicleImage?: QuotationPdfLogo;
  guests: string;
  /** Addons NAMED without prices. Itemising invites line-by-line haggling. */
  addons?: string;
  notes?: string;
  amount: string;
  /**
   * Every vehicle the customer may choose for this trip, the quoted one first, each with its
   * own SELL price. Absent on a trip that offers no alternatives.
   */
  vehicleOptions?: Array<{
    vehicle: string;
    amount: string;
    quoted: boolean;
    image?: QuotationPdfLogo;
  }>;
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
  /** Shown under the total only when some trip offers alternative vehicles. */
  vehicleOptionsNote?: string;

  terms?: string;
  notes?: string;
  generatedDate: string;
}


const PHOTO_WIDTH = 92;
const OPTION_PHOTO_WIDTH = 34;

function TripCard({ item }: { item: QuotationPdfLineItem }) {
  const theme = usePdfcnTheme();
  const detail = { fontSize: 9, color: theme.colors.mutedForeground, marginBottom: 2 };
  return (
    <KeepTogether
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 4,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <SectionLabel style={{ marginBottom: 0 }}>{item.label}</SectionLabel>
        <Text style={{ fontSize: 12, fontWeight: 700, color: theme.colors.accent }}>
          {item.amount}
        </Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{item.route}</Text>
      <View style={{ flexDirection: 'row' }}>
        {/* Photo column only when there is a photo, so such a trip reads as before. */}
        {item.vehicleImage && (
          <View
            style={{
              width: PHOTO_WIDTH + 6,
              padding: 3,
              marginRight: 12,
              backgroundColor: theme.colors.muted,
              borderRadius: 3,
            }}
          >
            <Image src={toDataUri(item.vehicleImage)} alt={item.vehicle} width={PHOTO_WIDTH} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 2 }}>
            Vehicle: {item.vehicle}
          </Text>
          <Text style={detail}>{item.when}</Text>
          <Text style={detail}>{item.guests}</Text>
          {item.addons && <Text style={detail}>Includes: {item.addons}</Text>}
          {item.notes && <Text style={detail}>{item.notes}</Text>}
        </View>
      </View>
      {item.vehicleOptions && item.vehicleOptions.length > 0 && (
        <View
          style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}
        >
          <SectionLabel>Vehicle options</SectionLabel>
          {item.vehicleOptions.map((option, index) => (
            <View
              key={`${index}-${option.vehicle}`}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {option.image && (
                  <View style={{ marginRight: 6 }}>
                    <Image src={toDataUri(option.image)} alt={option.vehicle} width={OPTION_PHOTO_WIDTH} />
                  </View>
                )}
                <Text style={{ fontSize: 9 }}>
                  {option.vehicle}
                  {option.quoted ? ' (quoted)' : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 9, fontWeight: 700 }}>{option.amount}</Text>
            </View>
          ))}
        </View>
      )}
    </KeepTogether>
  );
}

export const QuotationPDF = (data: QuotationPdfData) => {
  const totals: KeyValueEntry[] = [
    { key: 'Subtotal', value: data.subtotalDisplay },
    ...(data.discountDisplay ? [{ key: 'Discount', value: data.discountDisplay }] : []),
  ];

  return (
    <PdfDocument
      theme={pdfTheme(data.accentColor)}
      title={`Quotation ${data.quotationNumber}`}
      footerText={`Quotation ${data.quotationNumber} | ${data.brandName} | Generated ${data.generatedDate}`}
    >
      {/* Logo when we have a drawable one, otherwise a typographic wordmark.
          resolveBrandLogo() returns null for SVG/webp, which the engine cannot draw. */}
      <DocumentHeader
        issuerName={data.brandName}
        logo={data.logo ? toDataUri(data.logo) : undefined}
        contactLines={[data.companyEmail, data.companyPhone, data.companyAddress]}
        title="QUOTATION"
        reference={data.quotationNumber}
        metaLines={[data.validUntil ? `Valid until ${data.validUntil}` : undefined]}
      />

      <MetaGrid
        items={[
          { label: 'Number', value: data.quotationNumber },
          { label: 'Issued', value: data.issuedDate },
          ...(data.updatedDate ? [{ label: 'Updated', value: data.updatedDate }] : []),
          ...(data.validUntil ? [{ label: 'Valid until', value: data.validUntil }] : []),
          ...(data.preparedBy ? [{ label: 'Prepared by', value: data.preparedBy }] : []),
        ]}
        party={{
          label: 'Prepared for',
          lines: [data.customerName, data.customerCompany, data.customerEmail, data.customerPhone],
        }}
      />

      <SectionLabel>Itinerary</SectionLabel>
      {data.lineItems.map((item, index) => (
        <TripCard key={`${index}-${item.label}`} item={item} />
      ))}

      <TotalsBox
        rows={totals}
        total={{ label: 'Total', value: data.totalDisplay }}
        note={data.vehicleOptionsNote}
      />

      {data.notes && <NotesBlock title="Notes">{data.notes}</NotesBlock>}
      {data.terms && <NotesBlock title="Terms & Conditions">{data.terms}</NotesBlock>}
    </PdfDocument>
  );
};

export default QuotationPDF;
