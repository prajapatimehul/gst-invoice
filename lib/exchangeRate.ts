// Fetch exchange rate for a given date
// Using a free API with fallback to manual rate
export async function getExchangeRate(date: Date): Promise<number> {
  try {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    // Try fetching from a free exchange rate API
    // Note: This is a placeholder. You can use APIs like exchangerate-api.com (free tier)
    // or frankfurter.app which are truly free
    const response = await fetch(
      `https://api.frankfurter.app/${dateStr}?from=USD&to=INR`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates.INR) {
        return data.rates.INR;
      }
    }

    // Fallback to latest rate if historical rate not available
    const latestResponse = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=INR'
    );

    if (latestResponse.ok) {
      const data = await latestResponse.json();
      if (data.rates && data.rates.INR) {
        return data.rates.INR;
      }
    }

    // Default fallback rate
    return 83.0;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Default fallback rate
    return 83.0;
  }
}

// Get current exchange rate
export async function getCurrentExchangeRate(): Promise<number> {
  return getExchangeRate(new Date());
}
