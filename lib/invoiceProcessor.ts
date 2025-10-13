import { UpworkTransaction, MonthlyInvoiceData, Invoice } from '@/types/invoice';
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

// Generate invoice numbers with continuous yearly numbering
// Exchange rate fetching:
// - Manual mode: Uses single rate from settings for all invoices
// - Auto mode: Fetches rate for LAST DAY OF EACH MONTH (for GST compliance)
export async function generateInvoiceNumbers(
  monthlyData: MonthlyInvoiceData[],
  manualExchangeRate: number | undefined,
  startingNumber: number = 1,
  defaultLocation: string = 'United States'
): Promise<Invoice[]> {
  const invoices: Invoice[] = [];
  let currentNumber = startingNumber;

  // If manual rate provided, use it for all invoices
  if (manualExchangeRate && manualExchangeRate > 0) {
    console.log(`📌 Using manual exchange rate for all invoices: ₹${manualExchangeRate}`);

    monthlyData.forEach((data) => {
      const invoiceDate = new Date(data.invoiceDate);
      const quarter = getGSTQuarter(invoiceDate);

      const invoiceNumber = `GT-${String(currentNumber).padStart(2, '0')}`;
      const inrAmount = Math.round(data.grossAmount * manualExchangeRate * 100) / 100;

      invoices.push({
        invoiceNumber,
        invoiceDate: formatInvoiceDate(invoiceDate),
        client: data.client, // Already has company name from Agency field
        location: defaultLocation,
        usdAmount: data.grossAmount,
        exchangeRate: manualExchangeRate,
        inrAmount,
        amountInWords: numberToIndianWords(inrAmount), // Pass full amount with decimals for paise
        quarter,
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
    const invoiceNumber = `GT-${String(currentNumber).padStart(2, '0')}`;
    const inrAmount = Math.round(data.grossAmount * exchangeRate * 100) / 100;

    invoices.push({
      invoiceNumber,
      invoiceDate: formatInvoiceDate(invoiceDate),
      client: data.client, // Already has company name from Agency field
      location: defaultLocation,
      usdAmount: data.grossAmount,
      exchangeRate,
      inrAmount,
      amountInWords: numberToIndianWords(inrAmount), // Pass full amount with decimals for paise
      quarter,
    });

    currentNumber++;
  });

  console.log(`✅ Generated ${invoices.length} invoices with per-date exchange rates`);
  return invoices;
}

// Calculate gross amount from transaction details
export function calculateGrossAmount(transaction: UpworkTransaction): number {
  // The amount in the CSV for Hourly/Fixed-price types is already the gross amount
  return transaction.amount;
}
