import { UpworkTransaction, MonthlyInvoiceData, Invoice, InvoiceType, TransactionCategory, BusinessInfo } from '@/types/invoice';
import { getGSTQuarter, formatInvoiceDate, numberToIndianWords } from './utils';
import { getExchangeRatesForDates, formatDateForAPI } from './exchangeRateMulti';

// Group transactions by client and month
export function groupByClientAndMonth(
  transactions: UpworkTransaction[]
): MonthlyInvoiceData[] {
  const grouped = new Map<string, MonthlyInvoiceData>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = `${transaction.accountName}-${monthYear}`;

    if (!grouped.has(key)) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

      // Calculate last day of the month for invoice date (for exchange rate lookup)
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0); // Day 0 of next month = last day of current month

      grouped.set(key, {
        client: transaction.accountName,
        month: monthNames[month],
        year: year,
        grossAmount: 0,
        transactions: [],
        invoiceDate: lastDayOfMonth.toISOString().split('T')[0], // YYYY-MM-DD format
      });
    }

    const group = grouped.get(key)!;
    group.grossAmount += transaction.amount;
    group.transactions.push(transaction);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const dateA = new Date(a.invoiceDate);
    const dateB = new Date(b.invoiceDate);
    return dateA.getTime() - dateB.getTime();
  });
}

// Group platform fee transactions for GRC invoices
export function groupPlatformFees(transactions: UpworkTransaction[]): MonthlyInvoiceData[] {
  const grouped = new Map<string, MonthlyInvoiceData>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = `Upwork-Fees-${monthYear}`;

    if (!grouped.has(key)) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0);

      grouped.set(key, {
        client: 'Upwork Global Inc.',
        month: monthNames[month],
        year: year,
        grossAmount: 0,
        transactions: [],
        invoiceDate: lastDayOfMonth.toISOString().split('T')[0],
      });
    }

    const group = grouped.get(key)!;
    group.grossAmount += transaction.amount;
    group.transactions.push(transaction);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const dateA = new Date(a.invoiceDate);
    const dateB = new Date(b.invoiceDate);
    return dateA.getTime() - dateB.getTime();
  });
}

// Generate invoice numbers with continuous yearly numbering
export async function generateInvoiceNumbers(
  monthlyData: MonthlyInvoiceData[],
  businessInfo: BusinessInfo,
  invoiceType: InvoiceType,
  defaultLocation: string = 'United States'
): Promise<Invoice[]> {
  const invoices: Invoice[] = [];
  let currentNumber = businessInfo.startingInvoiceNumbers[invoiceType];

  // Determine tax rate based on invoice type
  const getTaxRate = (type: InvoiceType, location: string): number => {
    switch (type) {
      case InvoiceType.GT:
      case InvoiceType.DT:
        return 0; // Export - 0% tax
      case InvoiceType.GRC:
        return 18; // Reverse charge - 18% tax
      case InvoiceType.G:
        // Check if domestic or export
        return location.toLowerCase().includes('india') ? 18 : 0;
      default:
        return 0;
    }
  };

  // If manual rate provided, use it for all invoices
  if (businessInfo.manualExchangeRate && businessInfo.manualExchangeRate > 0) {
    console.log(`📌 Using manual exchange rate for all invoices: ₹${businessInfo.manualExchangeRate}`);

    monthlyData.forEach((data) => {
      const invoiceDate = new Date(data.invoiceDate);
      const quarter = getGSTQuarter(invoiceDate);
      const invoiceNumber = `${invoiceType}-${String(currentNumber).padStart(2, '0')}`;
      const exchangeRate = businessInfo.manualExchangeRate!;
      const inrAmount = Math.round(data.grossAmount * exchangeRate * 100) / 100;
      const taxRate = getTaxRate(invoiceType, data.client === 'Upwork Global Inc.' ? 'USA' : defaultLocation);
      const taxAmount = Math.round(inrAmount * taxRate / 100 * 100) / 100;
      const totalAmount = invoiceType === InvoiceType.GRC ? inrAmount + taxAmount : inrAmount;

      invoices.push({
        invoiceNumber,
        invoiceDate: formatInvoiceDate(invoiceDate),
        client: data.client + (invoiceType === InvoiceType.GT ? ' - Upwork' : ''),
        location: data.client === 'Upwork Global Inc.' ? '530 Lytton Avenue, Suite 301 Palo Alto CA 94301 USA' : defaultLocation,
        usdAmount: data.grossAmount,
        exchangeRate,
        inrAmount,
        amountInWords: numberToIndianWords(totalAmount),
        quarter,
        invoiceType,
        taxRate,
        taxAmount,
        totalAmount,
        isReverseCharge: invoiceType === InvoiceType.GRC,
        currency: 'USD',
        description: getServiceDescription(invoiceType, data),
      });

      currentNumber++;
    });

    return invoices;
  }

  // AUTO MODE: Fetch rates per invoice date
  console.log('🌐 Fetching exchange rates for each invoice date...');

  // Extract unique invoice dates
  const invoiceDates = monthlyData.map((data) => formatDateForAPI(data.invoiceDate));

  // Fetch rates for all dates
  const rateMap = await getExchangeRatesForDates(invoiceDates);

  // Generate invoices with per-date rates
  monthlyData.forEach((data) => {
    const invoiceDate = new Date(data.invoiceDate);
    const dateKey = formatDateForAPI(data.invoiceDate);
    const exchangeRate = rateMap.get(dateKey) || 84.0; // Fallback rate

    const quarter = getGSTQuarter(invoiceDate);
    const invoiceNumber = `${invoiceType}-${String(currentNumber).padStart(2, '0')}`;
    const inrAmount = Math.round(data.grossAmount * exchangeRate * 100) / 100;
    const taxRate = getTaxRate(invoiceType, data.client === 'Upwork Global Inc.' ? 'USA' : defaultLocation);
    const taxAmount = Math.round(inrAmount * taxRate / 100 * 100) / 100;
    const totalAmount = invoiceType === InvoiceType.GRC ? inrAmount + taxAmount : inrAmount;

    invoices.push({
      invoiceNumber,
      invoiceDate: formatInvoiceDate(invoiceDate),
      client: data.client + (invoiceType === InvoiceType.GT ? ' - Upwork' : ''),
      location: data.client === 'Upwork Global Inc.' ? '530 Lytton Avenue, Suite 301 Palo Alto CA 94301 USA' : defaultLocation,
      usdAmount: data.grossAmount,
      exchangeRate,
      inrAmount,
      amountInWords: numberToIndianWords(totalAmount),
      quarter,
      invoiceType,
      taxRate,
      taxAmount,
      totalAmount,
      isReverseCharge: invoiceType === InvoiceType.GRC,
      currency: 'USD',
      description: getServiceDescription(invoiceType, data),
    });

    currentNumber++;
  });

  console.log(`✅ Generated ${invoices.length} ${invoiceType} invoices with per-date exchange rates`);
  return invoices;
}

// Get service description based on invoice type
function getServiceDescription(invoiceType: InvoiceType, data: MonthlyInvoiceData): string {
  switch (invoiceType) {
    case InvoiceType.GT:
    case InvoiceType.DT:
    case InvoiceType.G:
      return 'IT Consulting and Support Services';
    case InvoiceType.GRC:
      // Build description from transactions
      const descriptions = data.transactions.map(t => {
        if (t.transactionSummary.includes('Connects')) return 'Connects Fee';
        if (t.transactionSummary.includes('membership') || t.transactionSummary.includes('Freelancer Plus')) {
          return 'Freelancer Plus Membership';
        }
        return t.transactionSummary;
      });
      return [...new Set(descriptions)].join(', ');
    default:
      return 'Professional Services';
  }
}

// Calculate gross amount from transaction details
export function calculateGrossAmount(transaction: UpworkTransaction): number {
  // The amount in the CSV for Hourly/Fixed-price types is already the gross amount
  return transaction.amount;
}