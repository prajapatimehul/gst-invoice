'use client';

import React, { useState } from 'react';
import { FileText, Sparkles, Settings } from 'lucide-react';
import { FileUpload } from '@/components/features/FileUpload';
import { InvoiceSummary } from '@/components/features/InvoiceSummary';
import { FreelancerConfig } from '@/components/features/FreelancerConfig';
import { parseUpworkCSV } from '@/lib/csvParser';
import { groupByClientAndMonth, generateInvoiceNumbers } from '@/lib/invoiceProcessor';
import { Invoice, BusinessInfo } from '@/types/invoice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'MEHULKUMAR SHANTIBHAI PRAJAPATI',
    gstin: 'XX-XXXXX-XXXX-X-XX',
    lut: 'ADXXXXXXXXXXXXXXXXX',
    service: 'IT Consulting and Support Services',
    hsn: '998313',
    state: 'Gujarat',
    stateCode: '24',
    startingInvoiceNumber: 1,
    manualExchangeRate: undefined,
  });

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Parse CSV
      const transactions = await parseUpworkCSV(file);

      // Group by client and month
      const monthlyData = groupByClientAndMonth(transactions);

      // Generate invoices with per-date exchange rates
      // If manualExchangeRate is set, it will be used for all invoices
      // Otherwise, fetches rate for each invoice date automatically
      const generatedInvoices = await generateInvoiceNumbers(
        monthlyData,
        businessInfo.manualExchangeRate,
        businessInfo.startingInvoiceNumber
      );

      setInvoices(generatedInvoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
      console.error('Error processing file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInvoices([]);
    setError(null);
  };

  return (
    <main className="min-h-screen">
      <div className="notion-page">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-amber-500 p-3 shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h1 className="notion-title">GST Invoice Generator</h1>
            </div>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="lg"
              className="gap-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </div>
          <p className="notion-subtitle flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Generate GST-compliant export invoices with per-invoice-date exchange rates
          </p>
        </div>

        {/* Features Info */}
        {invoices.length === 0 && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-white/50 border">
              <div className="text-2xl mb-2">📤</div>
              <h3 className="font-semibold mb-1">Upload CSV</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop or browse your Upwork transaction report
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/50 border">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold mb-1">Per-Date Exchange Rates</h3>
              <p className="text-sm text-muted-foreground">
                Each invoice uses the correct rate for its date (GST compliant)
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/50 border">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-semibold mb-1">Download PDFs</h3>
              <p className="text-sm text-muted-foreground">
                Get GST-compliant invoices ready for your CA
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 animate-fade-in">
            <h3 className="font-semibold mb-1">Error</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main Content */}
        {invoices.length === 0 ? (
          <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
        ) : (
          <InvoiceSummary invoices={invoices} onReset={handleReset} businessInfo={businessInfo} />
        )}

        {/* Settings Modal */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-green-900">Business Settings</DialogTitle>
            </DialogHeader>
            <FreelancerConfig
              businessInfo={businessInfo}
              onSave={(newInfo) => {
                setBusinessInfo(newInfo);
                setShowSettings(false);
              }}
            />
          </DialogContent>
        </Dialog>

      </div>
    </main>
  );
}
