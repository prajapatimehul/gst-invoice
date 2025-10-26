'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { FileUpload } from '@/components/features/FileUpload';
import { InvoiceSummary } from '@/components/features/InvoiceSummary';
import { Settings } from '@/components/features/Settings';
import { InvoiceTypeSelector, InvoiceTypeConfig } from '@/components/features/InvoiceTypeSelector';
import { parseUpworkCSV, ParseOptions } from '@/lib/csvParser';
import { groupByClientAndMonth, generateInvoiceNumbers, groupPlatformFees } from '@/lib/invoiceProcessor';
import { downloadAllInvoices } from '@/lib/pdfGeneratorAdvanced';
import { Invoice, BusinessInfo, InvoiceType, TransactionCategory } from '@/types/invoice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster, toast } from 'sonner';

const DEFAULT_BUSINESS_INFO: BusinessInfo = {
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

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(DEFAULT_BUSINESS_INFO);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceTypeConfig>({
    type: InvoiceType.GT,
    categories: [TransactionCategory.CLIENT_EARNING],
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('businessSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setBusinessInfo(parsed);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const handleSaveSettings = (info: BusinessInfo) => {
    try {
      localStorage.setItem('businessSettings', JSON.stringify(info));
      setBusinessInfo(info);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      toast.error('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if direct client invoice types are selected
      if (selectedInvoiceType.type === InvoiceType.DT || selectedInvoiceType.type === InvoiceType.G) {
        throw new Error('Direct client invoices require manual entry. CSV upload is only for Upwork transactions.');
      }

      // Parse CSV with selected options
      const parseOptions: ParseOptions = {
        invoiceType: selectedInvoiceType.type,
        includeCategories: selectedInvoiceType.categories,
      };

      const transactions = await parseUpworkCSV(file, parseOptions);

      if (!transactions || transactions.length === 0) {
        throw new Error('No valid transactions found in the CSV file');
      }

      // Group transactions based on invoice type
      let monthlyData;
      if (selectedInvoiceType.type === InvoiceType.GRC) {
        // Group platform fees by month
        monthlyData = groupPlatformFees(transactions);
      } else {
        // Group client earnings by client and month
        monthlyData = groupByClientAndMonth(transactions);
      }

      if (!monthlyData || monthlyData.length === 0) {
        throw new Error('No invoices could be generated from the transactions');
      }

      // Generate invoices
      const generatedInvoices = await generateInvoiceNumbers(
        monthlyData,
        businessInfo,
        selectedInvoiceType.type
      );

      if (!generatedInvoices || generatedInvoices.length === 0) {
        throw new Error('Failed to generate invoices');
      }

      setInvoices(generatedInvoices);
      setSuccess(`Successfully generated ${generatedInvoices.length} ${selectedInvoiceType.type} invoice(s)`);

      // Show toast notification
      toast.success(`Generated ${generatedInvoices.length} invoice(s)`, {
        description: `Invoice series: ${selectedInvoiceType.type}`,
      });

      // Update starting invoice number for next batch
      const lastInvoiceNumber = businessInfo.startingInvoiceNumbers[selectedInvoiceType.type] + generatedInvoices.length;
      const updatedBusinessInfo = {
        ...businessInfo,
        startingInvoiceNumbers: {
          ...businessInfo.startingInvoiceNumbers,
          [selectedInvoiceType.type]: lastInvoiceNumber,
        },
      };
      handleSaveSettings(updatedBusinessInfo);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process CSV file';
      console.error('Error processing file:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      setInvoices([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInvoices([]);
    setError(null);
    setSuccess(null);
    toast.info('Cleared all invoices');
  };

  const handleDownloadAll = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to download');
      return;
    }

    try {
      downloadAllInvoices(invoices, businessInfo);
      toast.success(`Downloading ${invoices.length} invoice(s)`, {
        description: 'Check your downloads folder',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download invoices';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
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
              <div className="flex gap-2">
                {invoices.length > 0 && (
                  <Button
                    onClick={handleDownloadAll}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4" />
                    Download All ({invoices.length})
                  </Button>
                )}
                <Settings businessInfo={businessInfo} onSave={handleSaveSettings} />
              </div>
            </div>
            <p className="notion-subtitle flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Generate multiple types of GST-compliant invoices with automatic exchange rates
            </p>
          </div>

          {/* Invoice Type Selection */}
          <div className="mb-8 p-6 rounded-lg bg-white/50 border">
            <InvoiceTypeSelector
              selectedType={selectedInvoiceType.type}
              onTypeChange={setSelectedInvoiceType}
            />
          </div>

          {/* Features Info */}
          {invoices.length === 0 && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-white/50 border">
                <div className="text-2xl mb-2">📤</div>
                <h3 className="font-semibold mb-1">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Process Upwork transactions for {selectedInvoiceType.type} invoices
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
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          {(selectedInvoiceType.type === InvoiceType.DT || selectedInvoiceType.type === InvoiceType.G) ? (
            <div className="p-8 rounded-lg bg-white/50 border text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Manual Entry Required
              </h3>
              <p className="text-sm text-gray-500">
                Direct client invoices require manual entry. This feature is coming soon.
              </p>
            </div>
          ) : (
            <>
              {invoices.length === 0 ? (
                <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              ) : (
                <InvoiceSummary
                  invoices={invoices}
                  onReset={handleReset}
                  businessInfo={businessInfo}
                />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
