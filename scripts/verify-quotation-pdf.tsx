/**
 * Renders the quotation PDF for real, outside jest (@react-pdf/renderer is ESM-only and the
 * repo's jest transform is CJS). Catches the failures typechecking cannot: unsupported style
 * properties, malformed colours, page-break behaviour.
 */

import { writeFileSync } from 'fs';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  QuotationPDF,
  type QuotationPdfData,
} from '../lib/pdf/generators/quotation';

const OUT = '/private/tmp/claude-501/-Volumes-shorya-apps-vehicleservice/97901133-14f2-4619-a1a0-c39cd9bbccdb/scratchpad';

const base = (over: Partial<QuotationPdfData> = {}): QuotationPdfData => ({
  quotationNumber: 'QUO07260001',
  issuedDate: '22 Jul 2026',
  validUntil: '05 Aug 2026',
  brandName: 'Acme Travel',
  companyEmail: 'ops@acmetravel.test',
  companyPhone: '+971 50 000 0000',
  companyAddress: 'Business Bay, Dubai, UAE',
  logo: null,
  accentColor: '#BA955E',
  customerName: 'Ahmed Khan',
  customerCompany: 'Khan Tours LLC',
  customerEmail: 'ahmed@khantours.test',
  customerPhone: '+971 50 111 1111',
  preparedBy: 'Vikram Singh',
  lineItems: [
    {
      label: 'Trip 1 of 3',
      route: 'DXB Terminal 3 » Dubai Marina',
      when: 'Thu 12 Mar 2026, 14:30',
      vehicle: 'Luxury Sedan',
      guests: '2 adults, 1 child',
      addons: 'Meet & Greet, Extra luggage',
      amount: '1,020.00 AED',
    },
    {
      label: 'Trip 2 of 3',
      route: 'Dubai Marina » Burj Al Arab',
      when: 'Fri 13 Mar 2026, 09:00',
      vehicle: 'Luxury Van',
      guests: '4 adults',
      amount: '920.00 AED',
    },
    {
      label: 'Trip 3 of 3',
      route: 'Burj Al Arab » DXB Terminal 3',
      when: '—',
      vehicle: 'Luxury Sedan',
      guests: '2 adults',
      notes: 'Return leg — date to be confirmed',
      amount: '880.00 AED',
    },
  ],
  subtotalDisplay: '2,820.00 AED',
  totalDisplay: '2,820.00 AED',
  terms:
    'Payment due within 14 days of acceptance. Cancellations within 24 hours of pickup are chargeable at 50%. Prices are held subject to availability at the time of booking.',
  notes: 'All vehicles include complimentary bottled water and Wi-Fi.',
  generatedDate: '22 Jul 2026',
  ...over,
});

const isPdf = (b: Buffer) => b.subarray(0, 5).toString() === '%PDF-';

/** Rough page count via the PDF page-object markers. */
const pageCount = (b: Buffer) => (b.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

async function check(name: string, data: QuotationPdfData, write = false) {
  try {
    const buf = await renderToBuffer(QuotationPDF(data) as never);
    const ok = isPdf(buf);
    if (write) writeFileSync(`${OUT}/${name}.pdf`, buf);
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(28)} ${String(buf.length).padStart(7)} bytes  ${pageCount(buf)} page(s)`
    );
    return ok;
  } catch (err) {
    console.log(`FAIL  ${name.padEnd(28)} threw: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  const results: boolean[] = [];

  results.push(await check('multi-trip', base(), true));
  results.push(await check('with-discount', base({ discountDisplay: '-200.00 AED', totalDisplay: '2,620.00 AED' }), true));
  results.push(await check('revised', base({ updatedDate: '24 Jul 2026' })));
  results.push(await check('minimal', base({
    validUntil: undefined, customerCompany: undefined, customerEmail: undefined,
    customerPhone: undefined, preparedBy: undefined, terms: undefined, notes: undefined,
    lineItems: [base().lineItems[0]], subtotalDisplay: '1,020.00 AED', totalDisplay: '1,020.00 AED',
  })));

  // 20 is the DB item cap — exercises the wrap={false} page-break path.
  const many = Array.from({ length: 20 }, (_, i) => ({
    label: `Trip ${i + 1} of 20`,
    route: `Origin Location ${i + 1} » Destination Location ${i + 1}`,
    when: 'Thu 12 Mar 2026, 14:30',
    vehicle: 'Luxury Sedan',
    guests: '2 adults, 1 child',
    addons: 'Meet & Greet, Extra luggage, Child seat',
    amount: '1,020.00 AED',
  }));
  results.push(await check('twenty-trips', base({ lineItems: many }), true));

  // A pale accent must not make the document unreadable, and an odd one must not throw.
  results.push(await check('pale-accent', base({ accentColor: '#EEEEEE' })));

  // Long unbroken strings are the classic layout-overflow trap.
  results.push(await check('long-strings', base({
    lineItems: [{ ...base().lineItems[0], route: `${'A'.repeat(120)} » ${'B'.repeat(120)}` }],
  })));

  results.push(await check('kwd-3-decimals', base({
    subtotalDisplay: '234.906 KWD', totalDisplay: '234.906 KWD',
    lineItems: [{ ...base().lineItems[0], amount: '84.966 KWD' }],
  })));

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} render checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
