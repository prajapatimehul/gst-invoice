import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessInfo, InvoiceType } from '@/types/invoice';

// Define colors for consistency
const colors = {
  primary: '#1f2937',
  secondary: '#6b7280',
  border: '#e5e7eb',
  headerBg: '#f3f4f6',
  danger: '#dc2626',
};

export function generateInvoicePDF(invoice: Invoice, businessInfo: BusinessInfo): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPos = margin;

  // Helper function to add section headers
  const addSectionHeader = (text: string, y: number): number => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary);
    doc.text(text, margin, y);
    return y + 8;
  };

  // Invoice Title based on type
  const getInvoiceTitle = (): string => {
    if (invoice.isReverseCharge) {
      return 'TAX INVOICE\n(Reverse Charge Mechanism)';
    }
    if (invoice.taxRate === 0) {
      return 'TAX INVOICE\n(SUPPLY MEANT FOR EXPORT UNDER BOND OR LUT WITHOUT PAYMENT OF IGST)';
    }
    return 'TAX INVOICE';
  };

  // Add title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  const title = getInvoiceTitle();
  const titleLines = title.split('\n');
  titleLines.forEach((line, index) => {
    doc.text(line, pageWidth / 2, yPos + (index * 5), { align: 'center' });
  });
  yPos += titleLines.length * 5 + 10;

  // Supplier Information (Business Info)
  yPos = addSectionHeader('SUPPLIER', yPos);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo.name, margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const address: string[] = [
    businessInfo.addressLine1,
    businessInfo.addressLine2,
    `${businessInfo.city} - ${businessInfo.pincode}`,
    `${businessInfo.state}, ${businessInfo.country || 'India'}`,
  ].filter((line): line is string => Boolean(line));

  address.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  doc.text(`GSTIN: ${businessInfo.gstin}`, margin, yPos);
  yPos += 4;
  doc.text(`State: ${businessInfo.state}, Code: ${businessInfo.stateCode}`, margin, yPos);
  yPos += 4;

  if (invoice.taxRate === 0 && businessInfo.lut) {
    doc.text(`LUT/Bond No.: ${businessInfo.lut}`, margin, yPos);
    yPos += 4;
    if (businessInfo.lutPeriod?.from && businessInfo.lutPeriod?.to) {
      doc.text(`From: ${businessInfo.lutPeriod.from} To: ${businessInfo.lutPeriod.to}`, margin, yPos);
      yPos += 4;
    }
  }

  if (businessInfo.email) {
    doc.text(`Email: ${businessInfo.email}`, margin, yPos);
    yPos += 4;
  }
  if (businessInfo.phone) {
    doc.text(`Phone: ${businessInfo.phone}`, margin, yPos);
    yPos += 4;
  }

  // Invoice Details (Right side)
  const rightX = pageWidth - margin - 80;
  let rightY = 45;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No.', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, rightX + 35, rightY);
  rightY += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceDate, rightX + 35, rightY);
  rightY += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Currency', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.currency, rightX + 35, rightY);
  rightY += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('HSN/SAC', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(businessInfo.hsn, rightX + 35, rightY);

  yPos += 10;

  // Recipient/Client Information
  yPos = addSectionHeader(invoice.isReverseCharge ? 'RECIPIENT (IMPORTER)' : 'BUYER', yPos);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.client, margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (invoice.clientAddress) {
    const clientAddressLines = invoice.clientAddress.split('\n');
    clientAddressLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 4;
    });
  } else {
    doc.text(invoice.location, margin, yPos);
    yPos += 4;
  }

  if (invoice.clientGSTIN) {
    doc.text(`GSTIN: ${invoice.clientGSTIN}`, margin, yPos);
    yPos += 4;
  }

  yPos += 10;

  // Service Details Table
  const tableStartY = yPos;

  // For reverse charge invoices, show transaction details
  if (invoice.invoiceType === InvoiceType.GRC) {
    autoTable(doc, {
      startY: tableStartY,
      head: [[
        'S.No.',
        'Description',
        'Transaction ID',
        'Amount ($)',
        'Exchange Rate',
        'Amount (₹)'
      ]],
      body: [
        [
          '1',
          invoice.description || 'Platform Services',
          '-',
          invoice.usdAmount?.toFixed(2) || '-',
          invoice.exchangeRate?.toFixed(2) || '-',
          invoice.inrAmount.toFixed(2)
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [31, 41, 55],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
    });
  } else {
    // Regular invoice table
    const headers = invoice.currency === 'USD'
      ? [['Particulars', 'HSN/SAC', 'Amount ($)', 'Exchange Rate', 'Taxable Value (₹)']]
      : [['Particulars', 'HSN/SAC', 'Taxable Value (₹)']];

    const bodyRow = invoice.currency === 'USD'
      ? [
          invoice.description || businessInfo.service,
          businessInfo.hsn,
          invoice.usdAmount?.toFixed(2) || '-',
          invoice.exchangeRate?.toFixed(2) || '-',
          invoice.inrAmount.toFixed(2)
        ]
      : [
          invoice.description || businessInfo.service,
          businessInfo.hsn,
          invoice.inrAmount.toFixed(2)
        ];

    autoTable(doc, {
      startY: tableStartY,
      head: headers,
      body: [[...bodyRow]],
      theme: 'grid',
      headStyles: {
        fillColor: [31, 41, 55],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
    });
  }

  // Get the end position of the first table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Tax Details Table
  if (invoice.taxRate > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Tax Type', 'Rate', 'Amount (₹)']],
      body: [
        [
          invoice.isReverseCharge ? 'IGST (RCM)' : 'IGST',
          `${invoice.taxRate}%`,
          invoice.taxAmount.toFixed(2)
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [31, 41, 55],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const summaryX = pageWidth - margin - 80;
  doc.text('Total Taxable Value:', summaryX, yPos);
  doc.text(`₹ ${invoice.inrAmount.toFixed(2)}`, summaryX + 60, yPos, { align: 'right' });
  yPos += 6;

  if (invoice.taxAmount > 0) {
    doc.text(invoice.isReverseCharge ? 'IGST Payable (RCM):' : 'IGST:', summaryX, yPos);
    doc.text(`₹ ${invoice.taxAmount.toFixed(2)}`, summaryX + 60, yPos, { align: 'right' });
    yPos += 6;
  }

  doc.setFillColor(colors.headerBg);
  doc.rect(summaryX - 5, yPos - 5, 85, 8, 'F');
  doc.text('Grand Total:', summaryX, yPos);
  doc.text(`₹ ${invoice.totalAmount.toFixed(2)}`, summaryX + 60, yPos, { align: 'right' });
  yPos += 10;

  // Amount in words
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Amount in words:', margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.amountInWords, margin + 35, yPos);
  yPos += 8;

  // Tax amount in words for domestic invoices
  if (invoice.taxAmount > 0 && !invoice.isReverseCharge) {
    doc.setFont('helvetica', 'normal');
    doc.text('Tax Amount in words:', margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text('NIL', margin + 40, yPos);
    yPos += 8;
  }

  // Notes section for reverse charge
  if (invoice.isReverseCharge) {
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(colors.secondary);
    const note = 'This is a self-invoice issued by the recipient under Section 31(3)(f) of the CGST Act, 2017 read with Rule 46 of the CGST Rules, 2017, for import of services from a person located outside India. Tax on this supply is payable by the recipient under the Reverse Charge Mechanism as per Section 5(3) of the IGST Act, 2017.';
    const noteLines = doc.splitTextToSize(note, pageWidth - 2 * margin);
    noteLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 4;
    });
  }

  // Signature section
  yPos = pageHeight - 40;
  doc.setTextColor(colors.primary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`for ${businessInfo.name}`, pageWidth - margin - 60, yPos);
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo.signatureText || 'Authorised Signatory', pageWidth - margin - 60, yPos);

  // Footer
  if (businessInfo.footerNote) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(colors.secondary);
    doc.text(businessInfo.footerNote, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, businessInfo: BusinessInfo): void {
  try {
    const pdf = generateInvoicePDF(invoice, businessInfo);
    const filename = `${invoice.invoiceNumber}_${invoice.client.replace(/[^a-z0-9]/gi, '_')}_${invoice.invoiceDate}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function downloadAllInvoices(invoices: Invoice[], businessInfo: BusinessInfo): void {
  try {
    invoices.forEach((invoice, index) => {
      setTimeout(() => {
        downloadInvoicePDF(invoice, businessInfo);
      }, index * 500); // Stagger downloads to avoid browser blocking
    });
  } catch (error) {
    console.error('Error downloading invoices:', error);
    throw new Error(`Failed to download invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}