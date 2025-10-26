'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';
import { BusinessInfo } from '@/types/invoice';

const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'MEHULKUMAR SHANTIBHAI PRAJAPATI',
  gstin: 'XX-XXXXX-XXXX-X-XX',
  lut: 'ADXXXXXXXXXXXXXXXXX',
  service: 'IT Consulting and Support Services',
  hsn: '998313',
  state: 'Gujarat',
  stateCode: '24',
  startingInvoiceNumber: 1,
  manualExchangeRate: undefined, // Optional - leave empty for auto-fetch
};

interface FreelancerConfigProps {
  businessInfo: BusinessInfo;
  onSave: (info: BusinessInfo) => void;
}

export function FreelancerConfig({ businessInfo, onSave }: FreelancerConfigProps) {
  const [details, setDetails] = useState<BusinessInfo>(businessInfo);

  useEffect(() => {
    setDetails(businessInfo);
  }, [businessInfo]);

  const handleChange = (field: keyof BusinessInfo, value: string | number) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setDetails(DEFAULT_BUSINESS_INFO);
  };

  const handleSave = () => {
    onSave(details);
  };

  return (
    <Card className="border-amber-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-amber-50 border-b border-amber-200">
        <CardTitle className="text-2xl text-green-900">Freelancer Configuration</CardTitle>
        <CardDescription className="text-green-700">
          Configure your business details for invoice generation
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-green-900 font-semibold">
            Business Name
          </Label>
          <Input
            id="name"
            value={details.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="border-amber-300 focus:border-green-500 focus:ring-green-500"
            placeholder="Enter your business name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gstin" className="text-green-900 font-semibold">
              GSTIN
            </Label>
            <Input
              id="gstin"
              value={details.gstin}
              onChange={(e) => handleChange('gstin', e.target.value)}
              className="border-amber-300 focus:border-green-500 focus:ring-green-500"
              placeholder="Enter GSTIN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lut" className="text-green-900 font-semibold">
              LUT No
            </Label>
            <Input
              id="lut"
              value={details.lut}
              onChange={(e) => handleChange('lut', e.target.value)}
              className="border-amber-300 focus:border-green-500 focus:ring-green-500"
              placeholder="Enter LUT number"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service" className="text-green-900 font-semibold">
            Service Description
          </Label>
          <Input
            id="service"
            value={details.service}
            onChange={(e) => handleChange('service', e.target.value)}
            className="border-amber-300 focus:border-green-500 focus:ring-green-500"
            placeholder="Enter service description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hsn" className="text-green-900 font-semibold">
            HSN/SAC Code
          </Label>
          <Input
            id="hsn"
            value={details.hsn}
            onChange={(e) => handleChange('hsn', e.target.value)}
            className="border-amber-300 focus:border-green-500 focus:ring-green-500"
            placeholder="Enter HSN/SAC code"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state" className="text-green-900 font-semibold">
              State
            </Label>
            <Input
              id="state"
              value={details.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="border-amber-300 focus:border-green-500 focus:ring-green-500"
              placeholder="Enter state name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateCode" className="text-green-900 font-semibold">
              State Code
            </Label>
            <Input
              id="stateCode"
              value={details.stateCode}
              onChange={(e) => handleChange('stateCode', e.target.value)}
              className="border-amber-300 focus:border-green-500 focus:ring-green-500"
              placeholder="Enter state code"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startingInvoiceNumber" className="text-green-900 font-semibold">
              Starting Invoice Number
            </Label>
            <Input
              id="startingInvoiceNumber"
              type="number"
              min="1"
              value={details.startingInvoiceNumber}
              onChange={(e) => handleChange('startingInvoiceNumber', parseInt(e.target.value) || 1)}
              className="border-amber-300 focus:border-green-500 focus:ring-green-500"
              placeholder="Enter starting invoice number"
            />
            <p className="text-xs text-muted-foreground">
              The first invoice number for this batch (e.g., 1 for GT-01, 13 for GT-13)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualExchangeRate" className="text-green-900 font-semibold">
              Exchange Rate (Optional)
            </Label>
            <Input
              id="manualExchangeRate"
              type="number"
              step="0.0001"
              min="0"
              value={details.manualExchangeRate || ''}
              onChange={(e) => handleChange('manualExchangeRate', e.target.value ? parseFloat(e.target.value) : 0)}
              className="border-amber-300 focus:border-green-500 focus:ring-green-500"
              placeholder="Leave empty for per-date auto-fetch"
            />
            <p className="text-xs text-muted-foreground">
              <strong>Manual (Recommended):</strong> Uses one rate for all invoices.{' '}
              <strong>Auto:</strong> Fetches rate for month-end (uses ECB data, not RBI).{' '}
              <a
                href="https://www.rbi.org.in/scripts/referenceratearchive.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 underline"
              >
                RBI official rates →
              </a>
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-green-50 to-amber-50 border-t border-amber-200 flex justify-between">
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-amber-400 text-green-900 hover:bg-amber-100 hover:text-green-950"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </Button>
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
