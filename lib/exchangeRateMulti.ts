/**
 * Multi-Date Exchange Rate Fetcher
 * Fetches USD to INR rates for the LAST DAY OF EACH MONTH
 *
 * ⚠️ IMPORTANT: This uses European Central Bank (ECB) data, NOT RBI rates!
 *
 * Priority:
 * 1. Manual rate from settings (RECOMMENDED for GST - use RBI official rates)
 * 2. Frankfurter.app API (European Central Bank data - approximate only)
 * 3. Fallback to ₹84.00 if API fails
 *
 * For official GST/RBI compliance, always use Manual mode with rates from:
 * https://www.rbi.org.in/scripts/referenceratearchive.aspx
 *
 * Date used: Last day of the month (e.g., Jul 31, Aug 31, Sep 30)
 */

interface RateCache {
  [date: string]: number;
}

// In-memory cache for rates
const rateCache: RateCache = {};

/**
 * Fetch USD to INR exchange rate for a specific date
 * @param date - Date string in YYYY-MM-DD format
 * @returns Exchange rate
 */
export async function getExchangeRateForDate(date: string): Promise<number> {
  // Check cache first
  if (rateCache[date]) {
    console.log(`📌 Using cached rate for ${date}: ₹${rateCache[date]}`);
    return rateCache[date];
  }

  try {
    // Try frankfurter.app API (has historical data)
    const url = `https://api.frankfurter.app/${date}?from=USD&to=INR`;
    console.log(`🌐 Fetching rate for ${date} from frankfurter.app...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.rates && data.rates.INR) {
      const rate = data.rates.INR;
      rateCache[date] = rate;
      console.log(`✅ Fetched rate for ${date}: ₹${rate}`);
      return rate;
    } else {
      throw new Error('INR rate not found in response');
    }
  } catch (error) {
    console.warn(`⚠️ Failed to fetch rate for ${date}:`, error);

    // Fallback to latest rate
    console.log('⏳ Falling back to latest available rate...');
    return getCurrentExchangeRate();
  }
}

/**
 * Get current/latest USD to INR exchange rate
 * @returns Latest exchange rate
 */
export async function getCurrentExchangeRate(): Promise<number> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data = await response.json();
    return data.rates.INR;
  } catch (error) {
    console.error('Error fetching current exchange rate:', error);
    // Fallback to approximate rate if API fails
    console.warn('⚠️ Using fallback rate: ₹84.00');
    return 84.0;
  }
}

/**
 * Fetch exchange rates for multiple dates
 * @param dates - Array of date strings in YYYY-MM-DD format
 * @returns Map of date -> rate
 */
export async function getExchangeRatesForDates(dates: string[]): Promise<Map<string, number>> {
  const uniqueDates = [...new Set(dates)]; // Remove duplicates
  const rateMap = new Map<string, number>();

  console.log(`📅 Fetching rates for ${uniqueDates.length} unique date(s)...`);

  // Fetch rates in parallel
  const promises = uniqueDates.map(async (date) => {
    const rate = await getExchangeRateForDate(date);
    return { date, rate };
  });

  const results = await Promise.all(promises);

  // Build map
  results.forEach(({ date, rate }) => {
    rateMap.set(date, rate);
  });

  return rateMap;
}

/**
 * Format date from various formats to YYYY-MM-DD
 * @param dateStr - Date string in various formats
 * @returns Date in YYYY-MM-DD format
 */
export function formatDateForAPI(dateStr: string): string {
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Clear the rate cache
 */
export function clearRateCache(): void {
  Object.keys(rateCache).forEach(key => delete rateCache[key]);
  console.log('🗑️ Rate cache cleared');
}
