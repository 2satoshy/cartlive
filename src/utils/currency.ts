import { Currency } from '../types';

export interface CurrencyConfig {
  code: Currency;
  name: string;
  symbol: string;
  rateFromUSD: number;
  flag: string;
}

export const CURRENCY_MAP: Record<Currency, CurrencyConfig> = {
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateFromUSD: 0.77, flag: '🇬🇧' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateFromUSD: 1.00, flag: '🇺🇸' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateFromUSD: 1.52, flag: '🇦🇺' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rateFromUSD: 1.68, flag: '🇳🇿' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateFromUSD: 0.92, flag: '🇪🇺' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr.', rateFromUSD: 0.88, flag: '🇨🇭' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', rateFromUSD: 18.50, flag: '🇿🇦' },
  ZWG: { code: 'ZWG', name: 'Zimbabwe Gold (ZiG)', symbol: 'ZWG', rateFromUSD: 26.80, flag: '🇿🇼' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateFromUSD: 7.25, flag: '🇨🇳' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateFromUSD: 3.67, flag: '🇦🇪' },
};

export const ALL_CURRENCIES: CurrencyConfig[] = Object.values(CURRENCY_MAP);

export function convertFromUSD(priceUSD: number, currency: Currency): number {
  const config = CURRENCY_MAP[currency] || CURRENCY_MAP.GBP;
  return priceUSD * config.rateFromUSD;
}

export function formatPrice(priceUSD: number, currency: Currency): string {
  const config = CURRENCY_MAP[currency] || CURRENCY_MAP.GBP;
  const converted = convertFromUSD(priceUSD, currency);
  
  if (config.symbol === 'ZWG' || config.symbol === 'AED') {
    return `${config.symbol} ${converted.toFixed(2)}`;
  }
  return `${config.symbol}${converted.toFixed(2)}`;
}
