import Papa from 'papaparse';
import { UpworkTransaction } from '@/types/invoice';

export function parseUpworkCSV(file: File): Promise<UpworkTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: UpworkTransaction[] = [];

          results.data.forEach((row: any) => {
            const type = row['Transaction Type'];

            // Only process Hourly and Fixed-price transactions
            if (type === 'Hourly' || type === 'Fixed-price') {
              const amount = parseFloat(row['Amount $']);

              if (amount > 0) {
                transactions.push({
                  date: row['Date'],
                  transactionId: row['Transaction ID'],
                  transactionType: type,
                  transactionSummary: row['Transaction Summary'],
                  accountName: row['Agency'] || row['Team'] || row['Account Name'] || 'Unknown', // Agency → Team → Account Name fallback
                  amount: amount,
                  freelancer: row['Freelancer'] || '',
                });
              }
            }
          });

          if (transactions.length === 0) {
            reject(new Error('No valid Upwork transactions found in CSV'));
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
