import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessInfo as ImportedBusinessInfo } from '@/types/invoice';

// Extended Business info for PDF generation
interface PDFBusinessInfo {
  name: string;
  address1: string;
  address2: string;
  address3: string;
  gstin: string;
  state: string;
  stateCode: string;
  lut: string;
  service: string;
  hsn: string;
}

// Convert BusinessInfo to PDFBusinessInfo
function convertBusinessInfo(info: ImportedBusinessInfo): PDFBusinessInfo {
  const addressParts = [
    info.addressLine1 || '123, BUSINESS PARK',
    info.addressLine2 || 'TECHNOLOGY HUB',
  ].filter(Boolean);

  const cityPincode = `${info.city || 'AHMEDABAD'} - ${info.pincode || '380001'}`;

  return {
    name: info.name,
    address1: addressParts[0] || '',
    address2: addressParts[1] || '',
    address3: cityPincode,
    gstin: info.gstin,
    state: info.state,
    stateCode: info.stateCode,
    lut: info.lut,
    service: info.service || 'IT Consulting and Support Services',
    hsn: info.hsn || '998313'
  };
}

export function generateInvoicePDFExact(invoice: Invoice, businessInfo?: ImportedBusinessInfo): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Use provided business info or defaults
  const defaultInfo: ImportedBusinessInfo = {
    name: 'EXAMPLE BUSINESS SERVICES PVT LTD',
    gstin: '24AABCE1234F1Z5',
    lut: 'AD240101234567X',
    lutPeriod: {
      from: '2024-04-01',
      to: '2025-03-31',
    },
    addressLine1: '123, BUSINESS PARK',
    addressLine2: 'TECHNOLOGY HUB',
    city: 'AHMEDABAD',
    pincode: '380001',
    state: 'Gujarat',
    stateCode: '24',
    country: 'India',
    service: 'IT Consulting and Support Services',
    hsn: '998313',
    startingInvoiceNumbers: {
      GT: 1,
      GRC: 1,
      DT: 1,
      G: 1,
    },
    signatureText: 'Authorised Signatory',
    footerNote: 'This is a Computer Generated Invoice',
  };

  const info = convertBusinessInfo(businessInfo || defaultInfo);
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 10;

  // === TOP HEADER ===
  // Title - Tax Invoice
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Invoice', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  // Export declaration subtitle
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const subtitle = '(SUPPLY MEANT FOR EXPORT/SUPPLY TO SEZ UNIT OR SEZ DEVELOPER FOR AUTHORISED OPERATIONS UNDER BOND OR LETTER';
  const subtitle2 = 'OF UNDERTAKING WITHOUT PAYMENT OF IGST)';
  doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;
  doc.text(subtitle2, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  // === SELLER / ISSUER and INVOICE METADATA TABLE ===
  autoTable(doc, {
    startY: yPos,
    body: [
      [
        {
          content: info.name,
          styles: { fontSize: 9, fontStyle: 'bold' }
        },
        { content: 'Invoice No.', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Dated', styles: { fontSize: 8, fontStyle: 'bold' } }
      ],
      [
        { content: info.address1, styles: { fontSize: 8 } },
        { content: invoice.invoiceNumber, styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: invoice.invoiceDate, styles: { fontSize: 8, fontStyle: 'bold' } }
      ],
      [
        { content: info.address2, styles: { fontSize: 8 } },
        { content: 'Delivery Note', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Mode/Terms of Payment', styles: { fontSize: 8 } }
      ],
      [
        { content: info.address3, styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } }
      ],
      [
        { content: `GSTIN/UIN: ${info.gstin}`, styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'LUT No :', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Other References', styles: { fontSize: 8 } }
      ],
      [
        { content: `State Name : ${info.state}, Code : ${info.stateCode}`, styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: info.lut, styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: '', styles: { fontSize: 8 } }
      ]
    ],
    theme: 'grid',
    styles: { lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 }
    }
  });

  // === CONSIGNEE / BUYER SECTION ===
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    body: [
      [
        { content: 'Consignee (Ship to)', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: "Buyer's Order No.", styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Dated', styles: { fontSize: 8 } }
      ],
      [
        { content: invoice.client, styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: '', styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } }
      ],
      [
        { content: invoice.location, styles: { fontSize: 8 } },
        { content: 'Dispatch Doc No.', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Delivery Note Date', styles: { fontSize: 8 } }
      ],
      [
        { content: 'Buyer (Bill to)', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: '', styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } }
      ],
      [
        { content: invoice.client, styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Dispatched through', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'Destination', styles: { fontSize: 8 } }
      ],
      [
        { content: invoice.location, styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } },
        { content: '', styles: { fontSize: 8 } }
      ],
      [
        { content: '', styles: { fontSize: 8 } },
        { content: 'Country:', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: 'United States', styles: { fontSize: 8, fontStyle: 'bold' } }
      ],
      [
        { content: '', styles: { fontSize: 8 } },
        { content: 'Terms of Delivery', styles: { fontSize: 8, fontStyle: 'bold' } },
        { content: '', styles: { fontSize: 8 } }
      ]
    ],
    theme: 'grid',
    styles: { lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 }
    }
  });

  // === SERVICE DETAILS TABLE ===
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    head: [[
      { content: 'Sl\nNo.', styles: { halign: 'center', fontSize: 8 } },
      { content: 'Particulars', styles: { halign: 'center', fontSize: 8 } },
      { content: 'HSN/SAC', styles: { halign: 'center', fontSize: 8 } },
      { content: 'Quantity', styles: { halign: 'center', fontSize: 8 } },
      { content: 'Rate', styles: { halign: 'center', fontSize: 8 } },
      { content: 'per', styles: { halign: 'center', fontSize: 8 } },
      { content: 'Amount', styles: { halign: 'center', fontSize: 8 } }
    ]],
    body: [
      [
        { content: '1', styles: { halign: 'center' } },
        { content: info.service, styles: { fontStyle: 'bold' } },
        { content: info.hsn, styles: { halign: 'center' } },
        '',
        '',
        '',
        { content: invoice.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
      ],
      [
        { content: '', colSpan: 6, styles: { minCellHeight: 50 } },
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        '',
        '',
        '',
        '',
        '',
        { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
        { content: invoice.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
    styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 70 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 12 },
      6: { cellWidth: 42 }
    }
  });

  // === AMOUNT IN WORDS ===
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    body: [[
      {
        content: `Amount Chargeable (in words)\nINR ${invoice.amountInWords} Only`,
        styles: { fontSize: 8, fontStyle: 'bold' }
      },
      {
        content: 'E. & O.E',
        styles: { fontSize: 7, halign: 'right' }
      }
    ]],
    theme: 'grid',
    styles: { lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 148 },
      1: { cellWidth: 42 }
    }
  });

  // === TAX SUMMARY TABLE ===
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    head: [
      [
        { content: 'HSN/SAC', rowSpan: 2, styles: { halign: 'center', fontSize: 8, valign: 'middle' } },
        { content: 'Taxable\nValue', rowSpan: 2, styles: { halign: 'center', fontSize: 8, valign: 'middle' } },
        { content: 'IGST', colSpan: 2, styles: { halign: 'center', fontSize: 8 } },
        { content: 'Total\nTax Amount', rowSpan: 2, styles: { halign: 'center', fontSize: 8, valign: 'middle' } }
      ],
      [
        { content: 'Rate', styles: { halign: 'center', fontSize: 7 } },
        { content: 'Amount', styles: { halign: 'center', fontSize: 7 } }
      ]
    ],
    body: [
      [
        { content: info.hsn, styles: { halign: 'center' } },
        { content: invoice.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right' } },
        { content: '0%', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: '', styles: { halign: 'center' } },
        { content: '', styles: { halign: 'center' } }
      ],
      [
        { content: 'Total', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: invoice.inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '', styles: { halign: 'center' } },
        { content: '', styles: { halign: 'center' } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
    styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 60 }
    }
  });

  // === TAX AMOUNT IN WORDS AND SIGNATURE ===
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    body: [
      [
        {
          content: 'Tax Amount (in words) :',
          styles: { fontSize: 8, fontStyle: 'bold' }
        },
        {
          content: 'NIL',
          colSpan: 2,
          styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' }
        }
      ],
      [
        {
          content: 'Remarks:',
          styles: { fontSize: 8, fontStyle: 'bold' }
        },
        {
          content: `for ${info.name}`,
          colSpan: 2,
          styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' }
        }
      ],
      [
        {
          content: 'USD',
          styles: { fontSize: 8 }
        },
        {
          content: 'Rate',
          styles: { fontSize: 8 }
        },
        {
          content: '',
          styles: { fontSize: 8 }
        }
      ],
      [
        {
          content: invoice.usdAmount ? invoice.usdAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
          styles: { fontSize: 8, fontStyle: 'bold' }
        },
        {
          content: invoice.exchangeRate ? invoice.exchangeRate.toFixed(2) : '-',
          styles: { fontSize: 8, fontStyle: 'bold' }
        },
        {
          content: 'Authorised Signatory',
          styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' }
        }
      ]
    ],
    theme: 'grid',
    styles: { lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 100 }
    }
  });

  // === FOOTER ===
  yPos = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a Computer Generated Invoice', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

// Export as main function name for compatibility
export const generateInvoicePDF = generateInvoicePDFExact;

// Generate and download single PDF
export function downloadInvoicePDF(invoice: Invoice, businessInfo?: ImportedBusinessInfo): void {
  const doc = generateInvoicePDFExact(invoice, businessInfo);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// Download all invoices
export function downloadAllInvoices(invoices: Invoice[], businessInfo?: ImportedBusinessInfo): void {
  invoices.forEach((invoice, index) => {
    setTimeout(() => {
      downloadInvoicePDF(invoice, businessInfo);
    }, index * 100); // Small delay between downloads
  });
}
