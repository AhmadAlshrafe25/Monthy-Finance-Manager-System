import { CurrencyConfig, ExpenseEntry, IncomeEntry, MonthData } from '../types/finance';

export function formatMoney(amount: number, currency: CurrencyConfig, showSign = false): string {
  const isNeg = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  if (isNeg) return `-${currency.symbol}${formatted}`;
  if (showSign && amount > 0) return `+${currency.symbol}${formatted}`;
  return `${currency.symbol}${formatted}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  return getTodayISO().slice(0, 7);
}

export function getDefaultDateForMonth(monthKey: string): string {
  const today = getTodayISO();
  if (today.startsWith(monthKey)) return today;
  return `${monthKey}-01`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function escapeCsvCell(value: string | number | boolean | undefined): string {
  const str = value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function monthToCsv(month: MonthData): string {
  const rows: string[] = [];
  rows.push(['RecordType', 'Date', 'Title', 'BucketOrIncomeType', 'CategoryOrAllocation', 'Amount', 'Status', 'Recurring', 'Notes'].join(','));

  month.incomes.forEach((inc: IncomeEntry) => {
    rows.push(
      [
        'INCOME',
        inc.date,
        inc.title,
        inc.type,
        inc.allocationMode,
        inc.amount.toFixed(2),
        'received',
        inc.recurring ? 'yes' : 'no',
        inc.notes || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  });

  month.expenses.forEach((exp: ExpenseEntry) => {
    rows.push(
      [
        'EXPENSE',
        exp.date,
        exp.title,
        exp.bucket,
        exp.category,
        (-exp.amount).toFixed(2),
        exp.status,
        exp.recurring ? 'yes' : 'no',
        exp.notes || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  });

  return rows.join('\n');
}
