// Invoice Type Enum
export enum InvoiceType {
  GT = 'GT', // Upwork client earnings (Export 0% tax)
  GRC = 'GRC', // Upwork platform fees (Reverse Charge 18% tax)
  DT = 'DT', // Direct export clients (0% tax)
  G = 'G', // Direct clients (Export 0% / Domestic 18% tax)
}

// Transaction Category for filtering
export enum TransactionCategory {
  CLIENT_EARNING = 'CLIENT_EARNING', // Hourly, Fixed-price, Milestone, Bonus
  PLATFORM_FEE = 'PLATFORM_FEE', // Connects, Subscription, Service Fee
  OTHER = 'OTHER', // Refunds, adjustments, etc.
}

export interface UpworkTransaction {
  date: string;
  transactionId: string;
  transactionType: string;
  transactionSummary: string;
  accountName: string;
  amount: number;
  freelancer: string;
  category?: TransactionCategory; // Added for categorization
}

export interface MonthlyInvoiceData {
  client: string;
  month: string;
  year: number;
  grossAmount: number;
  transactions: UpworkTransaction[];
  invoiceDate: string;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  client: string;
  location: string;
  usdAmount?: number; // Optional for INR-only invoices
  exchangeRate?: number; // Optional for INR-only invoices
  inrAmount: number;
  amountInWords: string;
  quarter: string;
  invoiceType: InvoiceType;
  taxRate: number; // 0% for export, 18% for domestic/RCM
  taxAmount: number;
  totalAmount: number;
  isReverseCharge?: boolean; // For GRC invoices
  clientGSTIN?: string; // For domestic clients
  clientAddress?: string; // Full client address
  description?: string; // Service description
  currency: 'USD' | 'INR'; // Invoice currency
}

export interface BusinessInfo {
  // Basic Information
  name: string;
  gstin: string;
  lut: string;
  lutPeriod: {
    from: string;
    to: string;
  };

  // Address Details
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  state: string;
  stateCode: string;
  country: string;

  // Service Details
  service: string;
  hsn: string;

  // Invoice Configuration
  startingInvoiceNumbers: {
    GT: number;
    GRC: number;
    DT: number;
    G: number;
  };

  // Exchange Rate
  manualExchangeRate?: number; // Optional manual USD to INR exchange rate

  // Additional Details
  email?: string;
  phone?: string;
  website?: string;
  panNumber?: string;

  // Footer/Signature
  signatureText?: string; // e.g., "Authorised Signatory"
  footerNote?: string; // e.g., "This is a Computer Generated Invoice"
}
