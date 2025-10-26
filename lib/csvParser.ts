import Papa from 'papaparse';
import { UpworkTransaction, TransactionCategory, InvoiceType } from '@/types/invoice';

// Define transaction type mappings
const CLIENT_EARNING_TYPES = ['Hourly', 'Fixed-price', 'Milestone', 'Bonus'];
const PLATFORM_FEE_TYPES = ['Connects', 'Subscription', 'Membership', 'Service Fee'];
const SKIP_TYPES = ['Withdrawal', 'VAT', 'WHT', 'Processing Fee'];
const ADJUSTMENT_TYPES = ['Refund', 'Adjustment'];

export function categorizeTransaction(transactionType: string): TransactionCategory {
  if (CLIENT_EARNING_TYPES.includes(transactionType)) {
    return TransactionCategory.CLIENT_EARNING;
  }
  if (PLATFORM_FEE_TYPES.includes(transactionType)) {
    return TransactionCategory.PLATFORM_FEE;
  }
  return TransactionCategory.OTHER;
}

export interface ParseOptions {
  invoiceType: InvoiceType;
  includeCategories: TransactionCategory[];
}

export function parseUpworkCSV(
  file: File,
  options: ParseOptions = {
    invoiceType: InvoiceType.GT,
    includeCategories: [TransactionCategory.CLIENT_EARNING]
  }
): Promise<UpworkTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: UpworkTransaction[] = [];

          results.data.forEach((row: any) => {
            const type = row['Transaction Type'];
            const summary = row['Transaction Summary'] || '';

            // Skip withdrawal and tax-related transactions
            if (SKIP_TYPES.includes(type)) {
              return;
            }

            // Parse amount
            const amountStr = row['Amount $'] || row['Amount'];
            const amount = parseFloat(amountStr);

            // Skip zero or negative amounts for earnings
            if (options.invoiceType === InvoiceType.GT && amount <= 0) {
              return;
            }

            // Categorize transaction
            const category = categorizeTransaction(type);

            // Filter based on selected categories
            if (!options.includeCategories.includes(category)) {
              return;
            }

            // For platform fees (GRC invoices), look for specific patterns
            if (options.invoiceType === InvoiceType.GRC) {
              const isPlatformFee =
                type === 'Connects' ||
                summary.includes('Connects') ||
                type === 'Subscription' ||
                summary.includes('membership') ||
                summary.includes('Freelancer Plus');

              if (!isPlatformFee) {
                return;
              }
            }

            transactions.push({
              date: row['Date'],
              transactionId: row['Transaction ID'] || row['ID'] || '',
              transactionType: type,
              transactionSummary: summary,
              accountName: row['Agency'] || row['Team'] || row['Account Name'] || 'Unknown',
              amount: Math.abs(amount), // Always use positive amounts
              freelancer: row['Freelancer'] || '',
              category: category,
            });
          });

          if (transactions.length === 0) {
            reject(new Error(`No valid ${options.invoiceType} transactions found in CSV`));
            return;
          }

          resolve(transactions);
        } catch (error) {
          reject(new Error('Error parsing CSV: ' + (error as Error).message));
        }
      },
      error: (error) => {
        reject(new Error('CSV parsing failed: ' + error.message));
      },
    });
  });
}
