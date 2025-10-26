'use client';

import React from 'react';
import { InvoiceType, TransactionCategory } from '@/types/invoice';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export interface InvoiceTypeConfig {
  type: InvoiceType;
  categories: TransactionCategory[];
}

interface InvoiceTypeSelectorProps {
  selectedType: InvoiceType;
  onTypeChange: (config: InvoiceTypeConfig) => void;
}

const invoiceTypeDescriptions: Record<InvoiceType, {
  label: string;
  description: string;
  categories: TransactionCategory[];
  taxInfo: string;
}> = {
  [InvoiceType.GT]: {
    label: 'GT - Upwork Client Earnings',
    description: 'For earnings from Upwork clients (Hourly, Fixed-price, Milestone, Bonus)',
    categories: [TransactionCategory.CLIENT_EARNING],
    taxInfo: '0% IGST (Export under LUT)',
  },
  [InvoiceType.GRC]: {
    label: 'GRC - Upwork Platform Fees',
    description: 'For Upwork platform charges (Connects, Subscription, Membership)',
    categories: [TransactionCategory.PLATFORM_FEE],
    taxInfo: '18% IGST (Reverse Charge Mechanism)',
  },
  [InvoiceType.DT]: {
    label: 'DT - Direct Export Clients',
    description: 'For direct clients outside India',
    categories: [],
    taxInfo: '0% IGST (Export under LUT)',
  },
  [InvoiceType.G]: {
    label: 'G - General Direct Clients',
    description: 'For direct clients (both domestic and export)',
    categories: [],
    taxInfo: 'Export: 0% | Domestic: 18% IGST',
  },
};

export const InvoiceTypeSelector: React.FC<InvoiceTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const handleTypeChange = (value: InvoiceType) => {
    const config = invoiceTypeDescriptions[value];
    onTypeChange({
      type: value,
      categories: config.categories,
    });
  };

  const currentConfig = invoiceTypeDescriptions[selectedType];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invoice-type">Invoice Type</Label>
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger id="invoice-type" className="w-full">
            <SelectValue placeholder="Select invoice type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Upwork Invoices</SelectLabel>
              <SelectItem value={InvoiceType.GT}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">GT</span>
                  <span>- Upwork Client Earnings</span>
                </div>
              </SelectItem>
              <SelectItem value={InvoiceType.GRC}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">GRC</span>
                  <span>- Upwork Platform Fees (RCM)</span>
                </div>
              </SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Direct Client Invoices</SelectLabel>
              <SelectItem value={InvoiceType.DT}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">DT</span>
                  <span>- Direct Export Clients</span>
                </div>
              </SelectItem>
              <SelectItem value={InvoiceType.G}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">G</span>
                  <span>- General Direct Clients</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-gray-700">
          <div className="space-y-1">
            <p className="font-medium">{currentConfig.description}</p>
            <p className="text-xs">Tax: {currentConfig.taxInfo}</p>
            {currentConfig.categories.length > 0 && (
              <p className="text-xs">
                Transaction Types: {
                  currentConfig.categories.includes(TransactionCategory.CLIENT_EARNING)
                    ? 'Hourly, Fixed-price, Milestone, Bonus'
                    : 'Connects, Subscription, Service Fees'
                }
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {(selectedType === InvoiceType.DT || selectedType === InvoiceType.G) && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <InfoIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-gray-700">
            <p className="font-medium">Manual Entry Required</p>
            <p className="text-xs">
              Direct client invoices require manual entry. CSV upload is only for Upwork transactions.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};