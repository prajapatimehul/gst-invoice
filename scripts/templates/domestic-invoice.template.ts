/**
 * TEMPLATE — Domestic taxable invoice (Indian customer).
 *
 * Charges CGST + SGST when the customer is in your own state, or IGST when the
 * customer is in a different state. The split is derived automatically from the
 * two state codes, so you cannot get it backwards by hand.
 *
 * Layout is a modern invoice: seller block top-left, TAX INVOICE top-right,
 * bill-to, item table with the tax breakdown, total bar, bank details, footer.
 *
 * ── How to use ────────────────────────────────────────────────────────────
 *   cp scripts/templates/domestic-invoice.template.ts scripts/generate-<invoice>.ts
 *
 * Then fill in SELLER, BANK, BUYER, and INVOICE below.
 *
 * Run with:
 *   npx tsx scripts/generate-<invoice>.ts
 * ──────────────────────────────────────────────────────────────────────────
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords } from '@/lib/utils';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION — replace every placeholder below
// ═══════════════════════════════════════════════════════════════════════════

const OUTPUT_DIR = 'output/apr-jun-2027';

const SELLER = {
  name: '<YOUR BUSINESS NAME>',
  addressLines: ['<ADDRESS LINE 1>', '<ADDRESS LINE 2>', '<CITY>, <STATE> <PINCODE>'],
  website: '<https://your-site.example>',
  gstin: '<YOUR GSTIN>',
  pan: '<YOUR PAN>',
  stateCode: '<2-DIGIT STATE CODE>',
  email: '<you@example.com>',
  phone: '<+91 00000 00000>',
};

const BANK = {
  accountName: '<ACCOUNT HOLDER NAME>',
  accountNumber: '<ACCOUNT NUMBER>',
  ifsc: '<IFSC CODE>',
  bankName: '<BANK NAME>',
};

const BUYER = {
  name: '<CUSTOMER LEGAL NAME>',
  addressLines: ['<CUSTOMER ADDRESS LINE 1>', '<CITY>, <STATE>, India - <PINCODE>'],
  gstin: '<CUSTOMER GSTIN>',   // required for B2B; the customer needs it to claim ITC
  state: '<CUSTOMER STATE>',
  stateCode: '<2-DIGIT STATE CODE>',
};

const INVOICE = {
  number: '<PREFIX>L-01',       // domestic series — separate from the export series
  date: '<YYYY-MM-DD>',
  dueDate: '<YYYY-MM-DD>',
  paymentTerms: 'Due on receipt',
  description: 'IT Consulting and Support Services',
  sac: '998313',
  quantity: 1,
  /** Taxable value in INR, before GST. */
  taxableValue: 0,
  /** Combined GST rate. 18% is standard for IT/consulting services. */
  gstRate: 0.18,
};

// ═══════════════════════════════════════════════════════════════════════════
// Generation — no edits needed below this line
// ═══════════════════════════════════════════════════════════════════════════

const NAVY: [number, number, number] = [22, 41, 76];
const DARK: [number, number, number] = [31, 41, 55];
const GREY: [number, number, number] = [130, 139, 152];
const LIGHT: [number, number, number] = [241, 244, 249];

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;

function assertConfigured(): void {
  const unfilled = JSON.stringify({ SELLER, BANK, BUYER, INVOICE }).match(/<[^>]+>/g);
  if (unfilled) {
    throw new Error(
      `Still contains placeholders: ${[...new Set(unfilled)].join(', ')}\n` +
        'Fill these in from your CLAUDE.local.md before generating the invoice.'
    );
  }
  if (INVOICE.taxableValue <= 0) {
    throw new Error('INVOICE.taxableValue must be greater than zero.');
  }
}

function main(): void {
  assertConfigured();

  // Intra-state supply (same state code) attracts CGST + SGST at half the rate
  // each. Inter-state supply attracts the full rate as IGST.
  const intraState = SELLER.stateCode === BUYER.stateCode;
  const taxable = round2(INVOICE.taxableValue);
  const cgst = intraState ? round2(taxable * (INVOICE.gstRate / 2)) : 0;
  const sgst = intraState ? round2(taxable * (INVOICE.gstRate / 2)) : 0;
  const igst = intraState ? 0 : round2(taxable * INVOICE.gstRate);
  const total = round2(taxable + cgst + sgst + igst);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 14;

  // ── Seller block (left) ──
  let y = 20;
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(SELLER.name, M, y);
  y += 6;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const line of [...SELLER.addressLines, SELLER.website]) {
    doc.text(line, M, y);
    y += 4.5;
  }
  y += 1.5;
  doc.text(`GSTIN: ${SELLER.gstin}`, M, y);
  y += 5;
  doc.text(`PAN: ${SELLER.pan}`, M, y);

  // ── TAX INVOICE header (right) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('TAX INVOICE', W - M, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  let ry = 30;
  for (const line of [
    `Invoice #: ${INVOICE.number}`,
    `Invoice Date: ${INVOICE.date}`,
    `Due Date: ${INVOICE.dueDate}`,
    `Payment terms: ${INVOICE.paymentTerms}`,
  ]) {
    doc.text(line, W - M, ry, { align: 'right' });
    ry += 5;
  }

  // ── Divider ──
  y = 62;
  doc.setDrawColor(225, 228, 234);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);

  // ── Bill to ──
  y += 9;
  doc.setTextColor(...GREY);
  doc.setFontSize(9);
  doc.text('Bill to:', M, y);
  y += 5.5;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(BUYER.name, M, y);
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const line of BUYER.addressLines) {
    doc.text(line, M, y);
    y += 4.5;
  }
  y += 1;
  doc.text(`GSTIN: ${BUYER.gstin}`, M, y);
  y += 5;
  doc.text(`Place of supply: ${BUYER.state} (${BUYER.stateCode})`, M, y);

  // ── Item table ──
  y += 7;
  const taxLines = intraState
    ? [
        `+ CGST (${((INVOICE.gstRate / 2) * 100).toFixed(0)}%):  ${fmt(cgst)}`,
        `+ SGST (${((INVOICE.gstRate / 2) * 100).toFixed(0)}%):  ${fmt(sgst)}`,
      ]
    : [`+ IGST (${(INVOICE.gstRate * 100).toFixed(0)}%):  ${fmt(igst)}`];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Items', 'SAC/HSN', 'Qty', 'Rate(INR)', 'Amount(INR)']],
    body: [
      [
        '1.',
        { content: INVOICE.description, styles: { fontStyle: 'bold' } },
        INVOICE.sac,
        String(INVOICE.quantity),
        { content: fmt(taxable / INVOICE.quantity), styles: { halign: 'right' } },
        { content: fmt(taxable), styles: { halign: 'right', minCellHeight: 17 } },
      ],
    ],
    theme: 'plain',
    headStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold', fontSize: 9, cellPadding: 3 },
    bodyStyles: { textColor: DARK, fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 58 },
      2: { cellWidth: 24 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 36, halign: 'right' },
      5: { cellWidth: 40, halign: 'right' },
    },
    didParseCell: (d) => {
      if (d.section === 'head' && d.column.index >= 4) d.cell.styles.halign = 'right';
      if (d.section === 'head' && d.column.index === 3) d.cell.styles.halign = 'center';
    },
    didDrawCell: (d) => {
      if (d.section === 'body' && d.column.index === 5) {
        const rx = d.cell.x + d.cell.width - 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GREY);
        taxLines.forEach((line, i) => doc.text(line, rx, d.cell.y + 9.5 + i * 4, { align: 'right' }));
        doc.setTextColor(...DARK);
        doc.setFontSize(9);
      }
    },
  });

  const ty = (doc as any).lastAutoTable.finalY;
  doc.setDrawColor(225, 228, 234);
  doc.line(M, ty + 1, W - M, ty + 1);

  // ── Summary (right) ──
  let sy = ty + 12;
  const labelX = W - M - 46;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const rows: Array<[string, number]> = [['Sub total (without tax)', taxable]];
  if (intraState) {
    rows.push(['CGST', cgst], ['SGST', sgst]);
  } else {
    rows.push(['IGST', igst]);
  }
  for (const [label, value] of rows) {
    doc.text(label, labelX, sy, { align: 'right' });
    doc.text(fmt(value), W - M, sy, { align: 'right' });
    sy += 7;
  }
  sy -= 2;

  // ── Total in words (left) ──
  doc.setTextColor(...GREY);
  doc.setFontSize(9);
  doc.text('Total in words', M, sy - 5);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const words = doc.splitTextToSize(numberToIndianWords(total) + ' Rupees Only', 90) as string[];
  words.forEach((line, i) => doc.text(line, M, sy + 2 + i * 6));

  // ── Total bar ──
  doc.setFillColor(...NAVY);
  doc.rect(labelX - 22, sy - 1, W - M - (labelX - 22), 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text('Total', labelX - 8, sy + 5);
  doc.text(`INR ${fmt(total)}`, W - M - 2, sy + 5, { align: 'right' });

  // ── Bank details ──
  let by = sy + 30;
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Bank details:', M, by);
  by += 4;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, by, 130, 26, 1.5, 1.5, 'F');
  doc.setTextColor(...DARK);
  let bl = by + 6;
  for (const [label, value] of [
    ['Account holder name:', BANK.accountName],
    ['Account number:', BANK.accountNumber],
    ['IFSC code:', BANK.ifsc],
    ['Bank name:', BANK.bankName],
  ]) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, M + 5, bl);
    const lw = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    doc.text(value, M + 5 + lw + 2, bl);
    bl += 5.5;
  }

  // ── Footer ──
  const fy = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(225, 228, 234);
  doc.line(M, fy - 5, W - M, fy - 5);
  doc.setTextColor(...GREY);
  doc.setFontSize(8.5);
  doc.text(`${SELLER.phone}     ${SELLER.email}     ${SELLER.website}`, M, fy);
  doc.text('Page 1/1', W - M, fy, { align: 'right' });

  const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const out = path.join(outputDir, `${INVOICE.number}.pdf`);
  fs.writeFileSync(out, Buffer.from(doc.output('arraybuffer')));

  console.log(`Saved ${out}`);
  console.log(
    intraState
      ? `Taxable ${fmt(taxable)} + CGST ${fmt(cgst)} + SGST ${fmt(sgst)} = INR ${fmt(total)}`
      : `Taxable ${fmt(taxable)} + IGST ${fmt(igst)} = INR ${fmt(total)}`
  );
  console.log('\nRemember to update the next domestic invoice number in CLAUDE.local.md.');
}

main();
