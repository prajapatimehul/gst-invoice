'use client';

import React, { useState } from 'react';
import { BusinessInfo } from '@/types/invoice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsIcon, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SettingsProps {
  businessInfo: BusinessInfo;
  onSave: (info: BusinessInfo) => void;
}

export const Settings: React.FC<SettingsProps> = ({ businessInfo, onSave }) => {
  const [open, setOpen] = useState(false);
  const [tempInfo, setTempInfo] = useState<BusinessInfo>(businessInfo);
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessInfo, string>>>({});

  const validateGSTIN = (gstin: string): boolean => {
    // Basic GSTIN validation (15 characters)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.toUpperCase());
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === '' || emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BusinessInfo, string>> = {};

    if (!tempInfo.name) newErrors.name = 'Business name is required';
    if (!tempInfo.gstin) {
      newErrors.gstin = 'GSTIN is required';
    } else if (!validateGSTIN(tempInfo.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }
    if (!tempInfo.lut) newErrors.lut = 'LUT number is required';
    if (!tempInfo.addressLine1) newErrors.addressLine1 = 'Address is required';
    if (!tempInfo.city) newErrors.city = 'City is required';
    if (!tempInfo.pincode) newErrors.pincode = 'Pincode is required';
    if (!tempInfo.state) newErrors.state = 'State is required';
    if (!tempInfo.stateCode) newErrors.stateCode = 'State code is required';
    if (!tempInfo.service) newErrors.service = 'Service description is required';
    if (!tempInfo.hsn) newErrors.hsn = 'HSN/SAC code is required';
    if (tempInfo.email && !validateEmail(tempInfo.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Ensure GSTIN is uppercase
      const updatedInfo = {
        ...tempInfo,
        gstin: tempInfo.gstin.toUpperCase(),
      };
      onSave(updatedInfo);
      setOpen(false);
      toast.success('Settings saved successfully');
    } else {
      toast.error('Please fix the errors in the form');
    }
  };

  const handleCancel = () => {
    setTempInfo(businessInfo);
    setErrors({});
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-gray-800 hover:bg-gray-700"
      >
        <SettingsIcon className="h-4 w-4" />
        Settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business Settings</DialogTitle>
            <DialogDescription>
              Configure your business details and invoice settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={tempInfo.name}
                    onChange={(e) => setTempInfo({ ...tempInfo, name: e.target.value })}
                    placeholder="EXAMPLE BUSINESS SERVICES PVT LTD"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={tempInfo.gstin}
                    onChange={(e) => setTempInfo({ ...tempInfo, gstin: e.target.value.toUpperCase() })}
                    placeholder="24AABCE1234F1Z5"
                    maxLength={15}
                    className={errors.gstin ? 'border-red-500' : ''}
                  />
                  {errors.gstin && <p className="text-xs text-red-500">{errors.gstin}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={tempInfo.panNumber || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="lut">LUT Number *</Label>
                  <Input
                    id="lut"
                    value={tempInfo.lut}
                    onChange={(e) => setTempInfo({ ...tempInfo, lut: e.target.value })}
                    placeholder="AD240101234567X"
                    className={errors.lut ? 'border-red-500' : ''}
                  />
                  {errors.lut && <p className="text-xs text-red-500">{errors.lut}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lutFrom">LUT Period From</Label>
                    <Input
                      id="lutFrom"
                      type="date"
                      value={tempInfo.lutPeriod?.from || ''}
                      onChange={(e) => setTempInfo({
                        ...tempInfo,
                        lutPeriod: { ...tempInfo.lutPeriod, from: e.target.value, to: tempInfo.lutPeriod?.to || '' }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lutTo">LUT Period To</Label>
                    <Input
                      id="lutTo"
                      type="date"
                      value={tempInfo.lutPeriod?.to || ''}
                      onChange={(e) => setTempInfo({
                        ...tempInfo,
                        lutPeriod: { ...tempInfo.lutPeriod, from: tempInfo.lutPeriod?.from || '', to: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={tempInfo.addressLine1 || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, addressLine1: e.target.value })}
                    placeholder="123, BUSINESS PARK"
                    className={errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {errors.addressLine1 && <p className="text-xs text-red-500">{errors.addressLine1}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={tempInfo.addressLine2 || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, addressLine2: e.target.value })}
                    placeholder="TECHNOLOGY HUB"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={tempInfo.city || ''}
                      onChange={(e) => setTempInfo({ ...tempInfo, city: e.target.value })}
                      placeholder="AHMEDABAD"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={tempInfo.pincode || ''}
                      onChange={(e) => setTempInfo({ ...tempInfo, pincode: e.target.value })}
                      placeholder="380001"
                      maxLength={6}
                      className={errors.pincode ? 'border-red-500' : ''}
                    />
                    {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={tempInfo.state}
                      onChange={(e) => setTempInfo({ ...tempInfo, state: e.target.value })}
                      placeholder="Gujarat"
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateCode">State Code *</Label>
                    <Input
                      id="stateCode"
                      value={tempInfo.stateCode}
                      onChange={(e) => setTempInfo({ ...tempInfo, stateCode: e.target.value })}
                      placeholder="24"
                      maxLength={2}
                      className={errors.stateCode ? 'border-red-500' : ''}
                    />
                    {errors.stateCode && <p className="text-xs text-red-500">{errors.stateCode}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={tempInfo.country || 'India'}
                    onChange={(e) => setTempInfo({ ...tempInfo, country: e.target.value })}
                    placeholder="India"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="invoice" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service Description *</Label>
                  <Input
                    id="service"
                    value={tempInfo.service}
                    onChange={(e) => setTempInfo({ ...tempInfo, service: e.target.value })}
                    placeholder="IT Consulting and Support Services"
                    className={errors.service ? 'border-red-500' : ''}
                  />
                  {errors.service && <p className="text-xs text-red-500">{errors.service}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsn">HSN/SAC Code *</Label>
                  <Input
                    id="hsn"
                    value={tempInfo.hsn}
                    onChange={(e) => setTempInfo({ ...tempInfo, hsn: e.target.value })}
                    placeholder="998313"
                    className={errors.hsn ? 'border-red-500' : ''}
                  />
                  {errors.hsn && <p className="text-xs text-red-500">{errors.hsn}</p>}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Starting Invoice Numbers</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gt-start">GT Series (Upwork Earnings)</Label>
                      <Input
                        id="gt-start"
                        type="number"
                        min="1"
                        value={tempInfo.startingInvoiceNumbers?.GT || 1}
                        onChange={(e) => setTempInfo({
                          ...tempInfo,
                          startingInvoiceNumbers: {
                            ...tempInfo.startingInvoiceNumbers,
                            GT: parseInt(e.target.value) || 1,
                            GRC: tempInfo.startingInvoiceNumbers?.GRC || 1,
                            DT: tempInfo.startingInvoiceNumbers?.DT || 1,
                            G: tempInfo.startingInvoiceNumbers?.G || 1,
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grc-start">GRC Series (Platform Fees)</Label>
                      <Input
                        id="grc-start"
                        type="number"
                        min="1"
                        value={tempInfo.startingInvoiceNumbers?.GRC || 1}
                        onChange={(e) => setTempInfo({
                          ...tempInfo,
                          startingInvoiceNumbers: {
                            ...tempInfo.startingInvoiceNumbers,
                            GT: tempInfo.startingInvoiceNumbers?.GT || 1,
                            GRC: parseInt(e.target.value) || 1,
                            DT: tempInfo.startingInvoiceNumbers?.DT || 1,
                            G: tempInfo.startingInvoiceNumbers?.G || 1,
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dt-start">DT Series (Direct Export)</Label>
                      <Input
                        id="dt-start"
                        type="number"
                        min="1"
                        value={tempInfo.startingInvoiceNumbers?.DT || 1}
                        onChange={(e) => setTempInfo({
                          ...tempInfo,
                          startingInvoiceNumbers: {
                            ...tempInfo.startingInvoiceNumbers,
                            GT: tempInfo.startingInvoiceNumbers?.GT || 1,
                            GRC: tempInfo.startingInvoiceNumbers?.GRC || 1,
                            DT: parseInt(e.target.value) || 1,
                            G: tempInfo.startingInvoiceNumbers?.G || 1,
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="g-start">G Series (General)</Label>
                      <Input
                        id="g-start"
                        type="number"
                        min="1"
                        value={tempInfo.startingInvoiceNumbers?.G || 1}
                        onChange={(e) => setTempInfo({
                          ...tempInfo,
                          startingInvoiceNumbers: {
                            ...tempInfo.startingInvoiceNumbers,
                            GT: tempInfo.startingInvoiceNumbers?.GT || 1,
                            GRC: tempInfo.startingInvoiceNumbers?.GRC || 1,
                            DT: tempInfo.startingInvoiceNumbers?.DT || 1,
                            G: parseInt(e.target.value) || 1,
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="exchangeRate">
                    Manual Exchange Rate (USD to INR)
                  </Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.01"
                    value={tempInfo.manualExchangeRate || ''}
                    onChange={(e) => setTempInfo({
                      ...tempInfo,
                      manualExchangeRate: parseFloat(e.target.value) || undefined
                    })}
                    placeholder="Leave empty for automatic rates"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to fetch exchange rates automatically for each invoice date
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tempInfo.email || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, email: e.target.value })}
                    placeholder="business@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={tempInfo.phone || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={tempInfo.website || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, website: e.target.value })}
                    placeholder="www.example.com"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="signatureText">Signature Text</Label>
                  <Input
                    id="signatureText"
                    value={tempInfo.signatureText || 'Authorised Signatory'}
                    onChange={(e) => setTempInfo({ ...tempInfo, signatureText: e.target.value })}
                    placeholder="Authorised Signatory"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerNote">Footer Note</Label>
                  <Textarea
                    id="footerNote"
                    value={tempInfo.footerNote || 'This is a Computer Generated Invoice'}
                    onChange={(e) => setTempInfo({ ...tempInfo, footerNote: e.target.value })}
                    placeholder="This is a Computer Generated Invoice"
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};