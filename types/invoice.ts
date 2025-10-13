export interface UpworkTransaction {
  date: string;
  transactionId: string;
  transactionType: string;
  transactionSummary: string;
  accountName: string;
  amount: number;
  freelancer: string;
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
  usdAmount: number;
  exchangeRate: number;
  inrAmount: number;
  amountInWords: string;
  quarter: string;
}

export interface BusinessInfo {
  name: string;
  gstin: string;
  lut: string;
  service: string;
  hsn: string;
  state: string;
  stateCode: string;
  startingInvoiceNumber: number;
  manualExchangeRate?: number; // Optional manual USD to INR exchange rate
}
