'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice, BusinessInfo, InvoiceType } from '@/types/invoice';
import { generateInvoicePDF as generateExactPDF, downloadInvoicePDF as downloadExactPDF } from '@/lib/pdfGeneratorExact';
import { generateInvoicePDF as generateAdvancedPDF, downloadInvoicePDF as downloadAdvancedPDF } from '@/lib/pdfGeneratorAdvanced';

interface InvoicePreviewProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  businessInfo: BusinessInfo;
}

export function InvoicePreview({ invoice, open, onClose, businessInfo }: InvoicePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invoice && open) {
      setLoading(true);
      // Generate PDF and create blob URL for preview
      try {
        // Use exact PDF generator for GT-series (Upwork) invoices, advanced for others
        const pdf = invoice.invoiceType === InvoiceType.GT
          ? generateExactPDF(invoice, businessInfo)
          : generateAdvancedPDF(invoice, businessInfo);
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating PDF preview:', error);
      } finally {
        setLoading(false);
      }
    }

    // Cleanup blob URL when dialog closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [invoice, open, businessInfo]);

  if (!invoice) return null;

  const handleDownload = () => {
    // Use exact PDF generator for GT-series (Upwork) invoices, advanced for others
    if (invoice.invoiceType === InvoiceType.GT) {
      downloadExactPDF(invoice, businessInfo);
    } else {
      downloadAdvancedPDF(invoice, businessInfo);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
            Invoice Preview - {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-100 p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-3 text-gray-600">Generating PDF preview...</span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded border-0"
              title="Invoice PDF Preview"
              style={{ minHeight: '600px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Failed to generate PDF preview
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700 gap-2"
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
