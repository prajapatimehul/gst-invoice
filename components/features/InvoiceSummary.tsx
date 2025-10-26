'use client';

import React, { useState } from 'react';
import { Download, FileText, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Invoice, BusinessInfo } from '@/types/invoice';
import { downloadInvoicePDF, downloadAllInvoices } from '@/lib/pdfGeneratorAdvanced';
import { InvoicePreview } from './InvoicePreview';

interface InvoiceSummaryProps {
  invoices: Invoice[];
  onReset: () => void;
  businessInfo: BusinessInfo;
}

export function InvoiceSummary({ invoices, onReset, businessInfo }: InvoiceSummaryProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const totalUSD = invoices.reduce((sum, inv) => sum + (inv.usdAmount || 0), 0);
  const totalINR = invoices.reduce((sum, inv) => sum + inv.inrAmount, 0);

  const handleDownloadAll = () => {
    downloadAllInvoices(invoices, businessInfo);
  };

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{invoices.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Amount (USD)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-900">${totalUSD.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Amount (INR)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-900">₹{totalINR.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleDownloadAll} size="lg" className="flex-1 sm:flex-none">
          <Download className="h-5 w-5 mr-2" />
          Download All PDFs
        </Button>
        <Button onClick={onReset} variant="outline" size="lg">
          Upload New CSV
        </Button>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Invoices</CardTitle>
          <CardDescription>
            Click on any invoice to preview before downloading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.invoiceNumber}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleInvoiceClick(invoice)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                    <p className="text-sm text-muted-foreground">{invoice.client}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {invoice.invoiceDate}
                  </div>
                  <div className="text-right">
                    {invoice.usdAmount && (
                      <p className="font-semibold">${invoice.usdAmount.toFixed(2)}</p>
                    )}
                    <p className="text-sm text-muted-foreground">₹{invoice.inrAmount.toFixed(2)}</p>
                    {invoice.exchangeRate && (
                      <p className="text-xs text-muted-foreground">@ ₹{invoice.exchangeRate.toFixed(4)}</p>
                    )}
                  </div>
                </div>
                <Download className="h-5 w-5 ml-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      <InvoicePreview
        invoice={selectedInvoice}
        open={showPreview}
        onClose={handleClosePreview}
        businessInfo={businessInfo}
      />
    </div>
  );
}
