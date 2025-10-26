import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessInfo } from '@/types/invoice';
import { BUSINESS_INFO } from './utils';

export function generateInvoicePDF(invoice: Invoice, businessInfo?: BusinessInfo): jsPDF {
  // Use provided businessInfo or fall back to default
  const business = businessInfo || BUSINESS_INFO;
  const doc = new jsPDF();

  // Set font
  doc.setFont('helvetica');

  // Header - Export Declaration
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPPLY MEANT FOR EXPORT ON PAYMENT OF INTEGRATED TAX', 105, 15, { align: 'center' });

  // Title
  doc.setFontSize(16);
  doc.text('Tax Invoice', 105, 25, { align: 'center' });

  // Invoice details box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 35);
  doc.text(`Date: ${invoice.invoiceDate}`, 150, 35);

  // Seller details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sold By:', 20, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(business.name, 20, 52);
  doc.text(`GSTIN: ${business.gstin}`, 20, 58);
  doc.text(`State: ${business.state} (${business.stateCode})`, 20, 64);
  doc.text(`LUT No: ${business.lut}`, 20, 70);

  // Buyer details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.client, 120, 52);
  doc.text(invoice.location, 120, 58);

  // Line separator
  doc.line(20, 80, 190, 80);

  // Service details table
  autoTable(doc, {
    startY: 85,
    head: [['Description', 'HSN/SAC', 'Qty', 'Rate (USD)', 'Amount (USD)']],
    body: [
      [
        business.service,
        business.hsn,
        '1',
        invoice.usdAmount ? `$${invoice.usdAmount.toFixed(2)}` : '-',
        invoice.usdAmount ? `$${invoice.usdAmount.toFixed(2)}` : '-'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 }
    }
  });

  // Tax details
  const currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [['Tax Type', 'Rate', 'Amount']],
    body: [
      ['IGST', '0%', '$0.00'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  // Totals
  const taxTableY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Total (USD):', 130, taxTableY);
  doc.text(invoice.usdAmount ? `$${invoice.usdAmount.toFixed(2)}` : '-', 170, taxTableY);

  if (invoice.exchangeRate) {
    doc.text('Exchange Rate:', 130, taxTableY + 7);
    doc.text(`₹${invoice.exchangeRate.toFixed(2)}`, 170, taxTableY + 7);
  }

  doc.text('Total (INR):', 130, taxTableY + 14);
  doc.text(`₹${invoice.inrAmount.toFixed(2)}`, 170, taxTableY + 14);

  // Amount in words
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words (INR):', 20, taxTableY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.amountInWords} Rupees Only`, 20, taxTableY + 32);

  // Footer
  const footerY = 260;
  doc.line(20, footerY, 190, footerY);
  doc.setFontSize(9);
  doc.text('This is a computer generated invoice', 20, footerY + 7);
  doc.setFont('helvetica', 'bold');
  doc.text('For ' + business.name, 140, footerY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory', 145, footerY + 22);

  return doc;
}

// Generate and download single PDF
export function downloadInvoicePDF(invoice: Invoice, businessInfo?: BusinessInfo): void {
  const doc = generateInvoicePDF(invoice, businessInfo);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// Generate and download all PDFs as a zip (requires additional library)
export function downloadAllInvoices(invoices: Invoice[], businessInfo?: BusinessInfo): void {
  invoices.forEach((invoice) => {
    setTimeout(() => {
      downloadInvoicePDF(invoice, businessInfo);
    }, 100); // Small delay between downloads to prevent browser blocking
  });
}
