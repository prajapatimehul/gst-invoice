/**
 * TEMPLATE — Reverse-charge self-invoices for imported services.
 *
 * When you buy services from a supplier outside India (cloud subscriptions,
 * platform fees, online ads, SaaS), you must issue a self-invoice under
 * Section 31(3)(f) of the CGST Act. IGST at 18% is payable in cash under
 * reverse charge (Sr. No. 1 of Notification No. 10/2017 - Integrated Tax
 * (Rate)) and is then claimable as input tax credit.
 *
 * Conventions:
 *   - One self-invoice per supplier per month.
 *   - Its own number series, separate from your sales invoices.
 *   - Foreign values converted at the RBI reference rate on the self-invoice
 *     date (Rule 34); use the nearest preceding business day for weekends and
 *     holidays, and record that in `rateNote`.
 *   - Keep the supplier's own invoice in data/<quarter>/expense-bills/.
 *
 * ── How to use ────────────────────────────────────────────────────────────
 *   cp scripts/templates/rcm-self-invoice.template.ts scripts/generate-rcm-<quarter>.ts
 *
 * Then fill in BUSINESS, SUPPLIERS, and rcmData.
 *
 * Run with:
 *   npx tsx scripts/generate-rcm-<quarter>.ts
 * ──────────────────────────────────────────────────────────────────────────
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords, formatInvoiceDate } from '@/lib/utils';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION — replace every placeholder below
// ═══════════════════════════════════════════════════════════════════════════

const QUARTER = 'Q1 FY28';
const OUTPUT_DIR = 'output/apr-jun-2027';

/** IGST rate for imported services. 18% is standard. */
const IGST_RATE = 0.18;

const BUSINESS = {
  name: '<YOUR BUSINESS NAME>',
  proprietor: '<PROPRIETOR / AUTHORISED SIGNATORY NAME>',
  address1: '<ADDRESS LINE 1>',
  address2: '<CITY>, <STATE> - <PINCODE>',
  gstin: '<YOUR GSTIN>',
  state: '<STATE>, Code: <2-DIGIT STATE CODE>',
};

/** Foreign suppliers you buy services from. Address as on their invoice. */
const SUPPLIERS: Record<string, { name: string; address: string }> = {
  // anthropic: {
  //   name: 'Anthropic, PBC',
  //   address: '548 Market Street, PMB 90375, San Francisco, California 94104, United States',
  // },
};

interface RCMData {
  invoiceNumber: string;   // e.g. '<PREFIX>-RCM-01' — gapless within the FY
  invoiceDate: string;     // YYYY-MM-DD
  supplier: { name: string; address: string };
  description: string;     // what was bought, period, and the supplier's invoice number
  sac: string;             // SAC of the imported service
  foreignAmount?: number;  // omit for INR-native charges
  currency?: 'USD' | 'EUR';
  rate?: number;           // RBI reference rate on the invoice date
  rateNote?: string;       // explain any preceding-business-day substitution
  inrValue?: number;       // set directly for INR-native charges
}

/** One entry per supplier per month, in date order. */
const rcmData: RCMData[] = [
  // {
  //   invoiceNumber: 'EM-RCM-01',
  //   invoiceDate: '2027-04-30',
  //   supplier: SUPPLIERS.anthropic,
  //   description: 'Claude subscription, Apr 2027 (supplier invoice <NUMBER>)',
  //   sac: '998319',
  //   foreignAmount: 0.0,
  //   currency: 'USD',
  //   rate: 0.0,
  // },
];

// ═══════════════════════════════════════════════════════════════════════════
// Generation — no edits needed below this line
// ═══════════════════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;

function assertConfigured(): void {
  const unfilled = JSON.stringify(BUSINESS).match(/<[^>]+>/g);
  if (unfilled) {
    throw new Error(
      `BUSINESS still contains placeholders: ${[...new Set(unfilled)].join(', ')}\n` +
        'Fill these in from your CLAUDE.local.md before generating self-invoices.'
    );
  }
  if (rcmData.length === 0) {
    throw new Error('rcmData is empty — add at least one self-invoice.');
  }
}

function taxableValue(d: RCMData): number {
  if (d.inrValue !== undefined) return round2(d.inrValue);
  if (d.foreignAmount === undefined || d.rate === undefined) {
    throw new Error(
      `${d.invoiceNumber}: needs either inrValue, or both foreignAmount and the RBI rate ` +
        `for ${d.invoiceDate}.`
    );
  }
  return round2(d.foreignAmount * d.rate);
}

function generatePdf(d: RCMData): { doc: jsPDF; taxable: number; igst: number; total: number } {
  const taxable = taxableValue(d);
  const igst = round2(taxable * IGST_RATE);
  const total = round2(taxable + igst);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 14;

  // ── Title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SELF-INVOICE (REVERSE CHARGE)', W / 2, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'Issued under Section 31(3)(f) of the CGST Act, 2017 for services received from a supplier located outside India.',
    W / 2,
    23,
    { align: 'center' }
  );
  doc.text(
    'Tax payable by the recipient under reverse charge - Sr. No. 1, Notification No. 10/2017 - Integrated Tax (Rate).',
    W / 2,
    27,
    { align: 'center' }
  );

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.line(M, 31, W - M, 31);

  // ── Recipient (you) ──
  let y = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Recipient (liable to pay tax under RCM):', M, y);
  y += 5;
  doc.setFontSize(9.5);
  doc.text(BUSINESS.name, M, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const line of [BUSINESS.proprietor, BUSINESS.address1, BUSINESS.address2]) {
    doc.text(line, M, y);
    y += 4.2;
  }
  doc.text(`GSTIN: ${BUSINESS.gstin}`, M, y);
  y += 4.2;
  doc.text(`State: ${BUSINESS.state}`, M, y);

  // ── Invoice meta (right) ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let ry = 38;
  for (const line of [
    `Self-Invoice No: ${d.invoiceNumber}`,
    `Date: ${formatInvoiceDate(new Date(d.invoiceDate))}`,
    `Place of Supply: ${BUSINESS.state}`,
  ]) {
    doc.text(line, W - M, ry, { align: 'right' });
    ry += 5;
  }

  // ── Supplier ──
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Supplier of service (outside India):', M, y);
  y += 5;
  doc.setFontSize(9.5);
  doc.text(d.supplier.name, M, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const line of doc.splitTextToSize(d.supplier.address, W - 2 * M) as string[]) {
    doc.text(line, M, y);
    y += 4.2;
  }

  // ── Line item ──
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Description of service', 'SAC', 'Taxable Value (INR)']],
    body: [
      [
        doc.splitTextToSize(d.description, 105).join('\n'),
        d.sac,
        { content: fmt(taxable), styles: { halign: 'right' } },
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [235, 238, 243], textColor: [31, 41, 55], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { textColor: [31, 41, 55], fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 108 }, 1: { cellWidth: 22 }, 2: { cellWidth: 52, halign: 'right' } },
  });

  let ty = (doc as any).lastAutoTable.finalY + 8;

  // ── Conversion note ──
  if (d.foreignAmount !== undefined && d.rate !== undefined) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Value in foreign currency: ${d.currency ?? 'USD'} ${fmt(d.foreignAmount)} converted at ` +
        `RBI reference rate ${d.rate.toFixed(4)} (Rule 34).`,
      M,
      ty
    );
    ty += 4.2;
    if (d.rateNote) {
      doc.text(d.rateNote, M, ty);
      ty += 4.2;
    }
    ty += 3;
  }

  // ── Totals ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const labelX = W - M - 50;
  for (const [label, value] of [
    ['Taxable Value', taxable],
    [`IGST @ ${(IGST_RATE * 100).toFixed(0)}% (payable under RCM)`, igst],
  ] as Array<[string, number]>) {
    doc.text(label, labelX, ty, { align: 'right' });
    doc.text(fmt(value), W - M, ty, { align: 'right' });
    ty += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Total', labelX, ty, { align: 'right' });
  doc.text(`INR ${fmt(total)}`, W - M, ty, { align: 'right' });
  ty += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const words = doc.splitTextToSize(
    `Amount in words: ${numberToIndianWords(total)} Rupees Only`,
    W - 2 * M
  ) as string[];
  for (const line of words) {
    doc.text(line, M, ty);
    ty += 4.2;
  }
  ty += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Tax payable on reverse charge basis: YES', M, ty);
  ty += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('IGST above is payable in cash and is claimable as input tax credit.', M, ty);

  // ── Signature ──
  const sy = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8.5);
  doc.text(`For ${BUSINESS.name}`, W - M, sy, { align: 'right' });
  doc.text('Authorised Signatory', W - M, sy + 14, { align: 'right' });

  return { doc, taxable, igst, total };
}

function main(): void {
  assertConfigured();

  const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  const summary = ['Self-Invoice No,Date,Supplier,SAC,Taxable INR,IGST INR,Total INR'];
  let totalTaxable = 0;
  let totalIgst = 0;
  const seen = new Set<string>();

  console.log('='.repeat(64));
  console.log(`RCM self-invoices — ${QUARTER}`);
  console.log('='.repeat(64));

  for (const d of rcmData) {
    if (seen.has(d.invoiceNumber)) {
      throw new Error(`Duplicate self-invoice number: ${d.invoiceNumber}`);
    }
    seen.add(d.invoiceNumber);

    const { doc, taxable, igst, total } = generatePdf(d);
    fs.writeFileSync(
      path.join(outputDir, `${d.invoiceNumber}.pdf`),
      Buffer.from(doc.output('arraybuffer'))
    );

    console.log(`\n${d.invoiceNumber} | ${d.invoiceDate} | ${d.supplier.name}`);
    console.log(`  Taxable ${fmt(taxable)} + IGST ${fmt(igst)} = INR ${fmt(total)}`);

    totalTaxable += taxable;
    totalIgst += igst;
    summary.push(
      [
        d.invoiceNumber,
        d.invoiceDate,
        `"${d.supplier.name}"`,
        d.sac,
        taxable.toFixed(2),
        igst.toFixed(2),
        total.toFixed(2),
      ].join(',')
    );
  }

  fs.writeFileSync(path.join(outputDir, 'rcm-summary.csv'), summary.join('\n') + '\n');

  console.log('\n' + '='.repeat(64));
  console.log(`Self-invoices:  ${rcmData.length}`);
  console.log(`Total taxable:  INR ${fmt(round2(totalTaxable))}`);
  console.log(`IGST under RCM: INR ${fmt(round2(totalIgst))}  (pay in cash, claim as ITC)`);
  console.log(`Output:         ${outputDir}`);
  console.log('\nRemember to update the next RCM number in CLAUDE.local.md.');
}

main();
