import { CurrencyConfig, FinanceStore } from '../types/finance';

// Built-in accurate exchange rates relative to 1 USD (offline-ready & user-editable)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  JOD: 0.709,
  SAR: 3.75,
  AED: 3.6725,
  EUR: 0.92,
  GBP: 0.79,
  EGP: 49.0,
  KWD: 0.307,
};

export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function getConversionRate(
  fromCode: string,
  toCode: string,
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (fromCode === toCode) return 1;
  const fromRate = rates[fromCode] ?? DEFAULT_EXCHANGE_RATES[fromCode] ?? 1;
  const toRate = rates[toCode] ?? DEFAULT_EXCHANGE_RATES[toCode] ?? 1;
  if (fromRate <= 0 || toRate <= 0) return 1;
  return toRate / fromRate;
}

export function convertMoney(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES,
  targetDecimals = 2
): number {
  if (fromCode === toCode || amount === 0) return amount;
  const rate = getConversionRate(fromCode, toCode, rates);
  return roundToDecimals(amount * rate, targetDecimals);
}

/**
 * Converts every income, salary cut, and expense amount across ALL months in the store
 * from the current currency to the target currency.
 */
export function convertStoreCurrency(
  store: FinanceStore,
  targetCurrency: CurrencyConfig
): FinanceStore {
  const fromCode = store.settings.currency.code;
  const toCode = targetCurrency.code;
  const rates = store.settings.exchangeRates || DEFAULT_EXCHANGE_RATES;

  if (fromCode === toCode) {
    return {
      ...store,
      settings: { ...store.settings, currency: targetCurrency },
    };
  }

  const convertedMonths: FinanceStore['months'] = {};
  for (const [monthKey, month] of Object.entries(store.months)) {
    convertedMonths[monthKey] = {
      ...month,
      incomes: month.incomes.map((inc) => ({
        ...inc,
        amount: convertMoney(inc.amount, fromCode, toCode, rates, targetCurrency.decimals),
      })),
      expenses: month.expenses.map((exp) => ({
        ...exp,
        amount: convertMoney(exp.amount, fromCode, toCode, rates, targetCurrency.decimals),
      })),
    };
  }

  return {
    ...store,
    settings: {
      ...store.settings,
      currency: targetCurrency,
    },
    months: convertedMonths,
  };
}

/**
 * Optionally fetches fresh live exchange rates from open.er-api.com (no API key required).
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number> | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.rates) return null;

    const updated: Record<string, number> = { ...DEFAULT_EXCHANGE_RATES };
    for (const code of Object.keys(DEFAULT_EXCHANGE_RATES)) {
      if (typeof json.rates[code] === 'number' && json.rates[code] > 0) {
        updated[code] = roundToDecimals(json.rates[code], 4);
      }
    }
    return updated;
  } catch {
    return null;
  }
}
