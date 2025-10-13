import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get GST quarter from date
export function getGSTQuarter(date: Date): string {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  if (month >= 3 && month <= 5) {
    return `Q1-${year}`; // Apr-Jun
  } else if (month >= 6 && month <= 8) {
    return `Q2-${year}`; // Jul-Sep
  } else if (month >= 9 && month <= 11) {
    return `Q3-${year}`; // Oct-Dec
  } else {
    // Jan-Mar belongs to previous fiscal year
    return `Q4-${year - 1}`;
  }
}

// Convert number to Indian words with paise support
export function numberToIndianWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';

    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');

    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
  }

  // Split into rupees and paise
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const remainder = rupees % 1000;

  let result = '';

  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanThousand(remainder);

  result = result.trim();

  // Add paise if present
  if (paise > 0) {
    const paiseWords = paise < 20 && paise > 9
      ? teens[paise - 10]
      : (paise >= 20 ? tens[Math.floor(paise / 10)] : '') + (paise % 10 !== 0 ? (paise >= 20 ? ' ' : '') + ones[paise % 10] : '');
    result += ' and ' + paiseWords + ' Paise';
  }

  return result;
}

// Format date to DD-MMM-YY (matching Excel invoice format)
export function formatInvoiceDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
  return `${day}-${month}-${year}`;
}

// Business information constant
export const BUSINESS_INFO = {
  name: 'MEHULKUMAR SHANTIBHAI PRAJAPATI',
  gstin: 'XX-XXXXX-XXXX-X-XX',
  lut: 'ADXXXXXXXXXXXXXXXXX',
  service: 'IT Consulting and Support Services',
  hsn: '998313',
  state: 'Gujarat',
  stateCode: '24',
};
