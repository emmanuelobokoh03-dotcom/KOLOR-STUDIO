// Currency Settings Types
export interface CurrencySettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'BEFORE' | 'AFTER';
  numberFormat: '1,000.00' | '1.000,00' | '1 000,00';
}

// Available currencies for dropdown
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

// Number format options
export const NUMBER_FORMAT_OPTIONS = [
  { value: '1,000.00', label: '1,000.00 (US/UK)', example: '2,500.00' },
  { value: '1.000,00', label: '1.000,00 (European)', example: '2.500,00' },
  { value: '1 000,00', label: '1 000,00 (Space separator)', example: '2 500,00' },
];

// Default currency settings
export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  currency: 'USD',
  currencySymbol: '$',
  currencyPosition: 'BEFORE',
  numberFormat: '1,000.00',
};

/**
 * Format a number according to the specified number format pattern
 */
function formatNumber(amount: number, format: string): string {
  const [intPart, decPart] = amount.toFixed(2).split('.');
  
  switch (format) {
    case '1.000,00': {
      // European format: 1.000,00
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedInt},${decPart}`;
    }
    case '1 000,00': {
      // Space separator: 1 000,00
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${formattedInt},${decPart}`;
    }
    case '1,000.00':
    default: {
      // US/UK format: 1,000.00
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${formattedInt}.${decPart}`;
    }
  }
}

/**
 * Format a currency amount according to user settings
 * @param amount - The numeric amount to format
 * @param settings - Currency settings (symbol, position, format)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | undefined | null, 
  settings?: Partial<CurrencySettings>
): string {
  if (amount === undefined || amount === null) {
    return '—';
  }

  const {
    currencySymbol = '$',
    currencyPosition = 'BEFORE',
    numberFormat = '1,000.00',
  } = settings || {};

  const formattedNumber = formatNumber(amount, numberFormat);

  if (currencyPosition === 'AFTER') {
    return `${formattedNumber}${currencySymbol}`;
  }
  
  return `${currencySymbol}${formattedNumber}`;
}

/**
 * Get display label for a currency code
 */
export function getCurrencyLabel(code: string): string {
  const currency = AVAILABLE_CURRENCIES.find(c => c.code === code);
  return currency ? `${currency.code} - ${currency.symbol} (${currency.name})` : code;
}

/**
 * Get currency symbol for a code
 */
export function getCurrencySymbol(code: string): string {
  const currency = AVAILABLE_CURRENCIES.find(c => c.code === code);
  return currency?.symbol || code;
}

/**
 * Merge quote-specific currency settings with user defaults
 */
export function getMergedCurrencySettings(
  userSettings: Partial<CurrencySettings> | undefined,
  quoteSettings: Partial<CurrencySettings> | undefined
): CurrencySettings {
  return {
    currency: quoteSettings?.currency || userSettings?.currency || DEFAULT_CURRENCY_SETTINGS.currency,
    currencySymbol: quoteSettings?.currencySymbol || userSettings?.currencySymbol || DEFAULT_CURRENCY_SETTINGS.currencySymbol,
    currencyPosition: (quoteSettings?.currencyPosition || userSettings?.currencyPosition || DEFAULT_CURRENCY_SETTINGS.currencyPosition) as 'BEFORE' | 'AFTER',
    numberFormat: (quoteSettings?.numberFormat || userSettings?.numberFormat || DEFAULT_CURRENCY_SETTINGS.numberFormat) as '1,000.00' | '1.000,00' | '1 000,00',
  };
}
