/**
 * TEMPLATE — Zero-rated export invoices under LUT.
 *
 * Produces one PDF per invoice plus an `invoice-summary.csv`, using the same
 * PDF layout as the web app (`lib/pdfGeneratorExact.ts`).
 *
 * Use this for foreign clients and platform earnings (Upwork, Fiverr, direct
 * wires) where no IGST is charged because the supply is zero-rated under a
 * Letter of Undertaking.
 *
 * ── How to use ────────────────────────────────────────────────────────────
 *   cp scripts/templates/export-invoices.template.ts scripts/generate-<quarter>.ts
 *
 * Then, in your copy:
 *   1. Fill in BUSINESS from your CLAUDE.local.md.
 *   2. Set QUARTER and OUTPUT_DIR.
 *   3. Put the RBI reference rate for every invoice date into RBI_RATES.
 *   4. List one entry per invoice in `invoiceData`, in date order.
 *
 * Run with:
 *   npx tsx scripts/generate-<quarter>.ts
 * ──────────────────────────────────────────────────────────────────────────
 */

import { Invoice, InvoiceType, BusinessInfo } from '@/types/invoice';
import { generateInvoicePDFExact } from '@/lib/pdfGeneratorExact';
import { numberToIndianWords, formatInvoiceDate } from '@/lib/utils';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION — replace every placeholder below
// ═══════════════════════════════════════════════════════════════════════════

const QUARTER = 'Q1 FY28';                    // printed on the invoice record
const OUTPUT_DIR = 'output/apr-jun-2027';     // relative to the repo root

const BUSINESS: BusinessInfo = {
  name: '<YOUR BUSINESS NAME>',
  gstin: '<YOUR GSTIN>',
  lut: '<YOUR LUT ARN>',                      // must be valid for every date below
  lutPeriod: { from: '<YYYY-04-01>', to: '<YYYY-03-31>' },
  addressLine1: '<ADDRESS LINE 1>',
  addressLine2: '<ADDRESS LINE 2>',
  city: '<CITY>',
  pincode: '<PINCODE>',
  state: '<STATE>',
  stateCode: '<2-DIGIT STATE CODE>',
  country: 'India',
  service: 'IT Consulting and Support Services',
  hsn: '998313',
  startingInvoiceNumbers: { GT: 1, GRC: 1, DT: 1, G: 1 },
  signatureText: 'Authorised Signatory',
  footerNote: 'This is a Computer Generated Invoice',
};

/**
 * RBI reference rates, keyed by invoice date (YYYY-MM-DD).
 *
 * Look these up at https://www.rbi.org.in/scripts/referenceratearchive.aspx and
 * cache them in data/<quarter>/rbi-rates-<quarter>.json.
 *
 * RBI publishes on business days only. For an invoice dated on a weekend or
 * holiday, use the nearest PRECEDING business day's rate and record that in the
 * invoice's `note` so your accountant can see why.
 */
const RBI_RATES: Record<string, { USD?: number; EUR?: number }> = {
  // '2027-04-15': { USD: 00.0000 },
  // '2027-05-30': { USD: 00.0000, EUR: 00.0000 },
};

interface InvoiceData {
  invoiceNumber: string;   // continue the series from CLAUDE.local.md — never reuse
  invoiceDate: string;     // YYYY-MM-DD; also the exchange-rate lookup key
  client: string;
  location: string;        // full address as it should print on the invoice
  country: string;
  currency: 'USD' | 'EUR';
  grossAmount: number;     // GROSS, before platform fees or withholding
  note: string;            // payment reference, rate substitution, source doc
}

/** One entry per invoice, in date order. Numbers must be gapless. */
const invoiceData: InvoiceData[] = [
  // {
  //   invoiceNumber: 'EM-01',
  //   invoiceDate: '2027-04-15',
  //   client: '<CLIENT LEGAL NAME>',
  //   location: '<CLIENT ADDRESS>',
  //   country: '<COUNTRY>',
  //   currency: 'USD',
  //   grossAmount: 0.0,
  //   note: '<bank reference / source document>',
  // },
];

// ═══════════════════════════════════════════════════════════════════════════
// Generation — no edits needed below this line
// ═══════════════════════════════════════════════════════════════════════════

function assertConfigured(): void {
  const unfilled = JSON.stringify(BUSINESS).match(/<[^>]+>/g);
  if (unfilled) {
    throw new Error(
      `BUSINESS still contains placeholders: ${[...new Set(unfilled)].join(', ')}\n` +
        'Fill these in from your CLAUDE.local.md before generating invoices.'
    );
  }
  if (invoiceData.length === 0) {
    throw new Error('invoiceData is empty — add at least one invoice.');
  }
}

function buildInvoice(data: InvoiceData): Invoice {
  const rate = RBI_RATES[data.invoiceDate]?.[data.currency];
  if (!rate) {
    throw new Error(
      `No RBI ${data.currency} rate for ${data.invoiceDate} (invoice ${data.invoiceNumber}). ` +
        'Add it to RBI_RATES, using the nearest preceding business day if that date is a holiday.'
    );
  }

  const inrAmount = Math.round(data.grossAmount * rate * 100) / 100;

  return {
    invoiceNumber: data.invoiceNumber,
    invoiceDate: formatInvoiceDate(new Date(data.invoiceDate)),
    client: data.client,
    location: data.location,
    country: data.country,
    usdAmount: data.grossAmount, // foreign-currency amount; label comes from `currency`
    exchangeRate: rate,
    inrAmount,
    amountInWords: numberToIndianWords(inrAmount) + ' Rupees Only',
    quarter: QUARTER,
    invoiceType: InvoiceType.EM,
    taxRate: 0,        // zero-rated export under LUT
    taxAmount: 0,
    totalAmount: inrAmount,
    isReverseCharge: false,
    currency: data.currency,
    description: BUSINESS.service,
  };
}

function main(): void {
  assertConfigured();

  const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  const summary = ['Invoice No,Date,Client,Country,Currency,Gross,RBI Rate,INR,Note'];
  const totals: Record<string, number> = { USD: 0, EUR: 0, INR: 0 };
  const seen = new Set<string>();

  console.log('='.repeat(64));
  console.log(`Export invoices — ${QUARTER}`);
  console.log('='.repeat(64));

  for (const data of invoiceData) {
    if (seen.has(data.invoiceNumber)) {
      throw new Error(`Duplicate invoice number: ${data.invoiceNumber}`);
    }
    seen.add(data.invoiceNumber);

    const invoice = buildInvoice(data);
    const doc = generateInvoicePDFExact(invoice, BUSINESS);
    fs.writeFileSync(
      path.join(outputDir, `${invoice.invoiceNumber}.pdf`),
      Buffer.from(doc.output('arraybuffer'))
    );

    console.log(`\n${invoice.invoiceNumber} | ${invoice.invoiceDate} | ${invoice.client}`);
    console.log(
      `  ${data.currency} ${data.grossAmount.toFixed(2)} @ ${invoice.exchangeRate?.toFixed(4)}` +
        ` = INR ${invoice.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    );
    console.log(`  ${data.note}`);

    totals[data.currency] += data.grossAmount;
    totals.INR += invoice.inrAmount;
    summary.push(
      [
        invoice.invoiceNumber,
        invoice.invoiceDate,
        `"${invoice.client}"`,
        data.country,
        data.currency,
        data.grossAmount.toFixed(2),
        invoice.exchangeRate?.toFixed(4),
        invoice.inrAmount.toFixed(2),
        `"${data.note}"`,
      ].join(',')
    );
  }

  fs.writeFileSync(path.join(outputDir, 'invoice-summary.csv'), summary.join('\n') + '\n');

  console.log('\n' + '='.repeat(64));
  console.log(`Invoices:  ${invoiceData.length}`);
  for (const ccy of ['USD', 'EUR']) {
    if (totals[ccy]) console.log(`Total ${ccy}: ${totals[ccy].toFixed(2)}`);
  }
  console.log(`Total INR: ${totals.INR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  console.log(`Output:    ${outputDir}`);
  console.log('\nRemember to update the next invoice number in CLAUDE.local.md.');
}

main();
