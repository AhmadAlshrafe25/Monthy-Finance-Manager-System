export type BucketType = 'mandatory' | 'fun' | 'savings';

export type IncomeType = 'salary' | 'extra' | 'freelance' | 'bonus' | 'other';

export type AllocationMode = 'split' | BucketType;

export type ExpenseStatus = 'paid' | 'scheduled';

export interface BucketSplit {
  mandatory: number; // percentage 0..100
  fun: number;       // percentage 0..100
  savings: number;   // percentage 0..100
}

export interface IncomeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: IncomeType;
  amount: number;
  allocationMode: AllocationMode;
  recurring: boolean;
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  bucket: BucketType;
  category: string;
  amount: number;
  status: ExpenseStatus;
  recurring?: boolean;
  notes?: string;
}

export interface MonthData {
  monthKey: string; // YYYY-MM
  split: BucketSplit;
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
}

export interface AppSettings {
  currency: CurrencyConfig;
  defaultSplit: BucketSplit;
  categories: Record<BucketType, string[]>;
  isSampleData?: boolean;
}

export interface FinanceStore {
  version: number;
  activeMonth: string; // YYYY-MM
  settings: AppSettings;
  months: Record<string, MonthData>;
}

export interface BucketMetrics {
  bucket: BucketType;
  splitPercent: number;
  allocated: number;
  spent: number;
  paidSpent: number;
  scheduledSpent: number;
  remaining: number;
  utilizationPct: number;
  isOverBudget: boolean;
  transactionCount: number;
}

export interface CategorySummary {
  category: string;
  bucket: BucketType;
  total: number;
  count: number;
  average: number;
  pctOfBucket: number;
  pctOfIncome: number;
}

export interface DailyPoint {
  day: number;
  date: string;
  dailySpent: number;
  cumulativeSpent: number;
  remainingBudget: number;
  mandatoryCum: number;
  funCum: number;
  savingsCum: number;
}

export interface MonthSummary {
  monthKey: string;
  totalIncome: number;
  salaryIncome: number;
  extraIncome: number;
  totalSpent: number;
  paidSpent: number;
  scheduledSpent: number;
  totalRemaining: number;
  savingsAllocated: number;
  savingsActual: number;
  savingsRatePct: number;
  effectiveSavingsRatePct: number;
  burnRatePerDay: number;
  projectedEndBalance: number;
  safeDailyFunSpend: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  buckets: Record<BucketType, BucketMetrics>;
  categories: CategorySummary[];
  dailySeries: DailyPoint[];
  largestExpense: ExpenseEntry | null;
  topCategory: CategorySummary | null;
}

export interface MultiMonthPoint {
  monthKey: string;
  label: string;
  income: number;
  mandatory: number;
  fun: number;
  savings: number;
  totalSpent: number;
  netLeft: number;
}

export type ActiveSheet = 'sheet' | 'analytics' | 'settings';

// Strict palette: White, Red, Green, Yellow ONLY
export const BUCKET_META: Record<
  BucketType,
  {
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
  }
> = {
  mandatory: {
    label: 'Mandatory',
    shortLabel: 'Mandatory',
    description: 'Rent, groceries, bills, utilities & essential fees',
    color: '#dc2626',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    badgeClass: 'bg-red-100 text-red-800 border border-red-300',
  },
  fun: {
    label: 'Fun Spending',
    shortLabel: 'Fun Spending',
    description: 'Dining out, entertainment, hobbies & shopping',
    color: '#eab308',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-400',
    badgeClass: 'bg-yellow-100 text-yellow-900 border border-yellow-400',
  },
  savings: {
    label: 'Savings / Debt',
    shortLabel: 'Savings / Debt',
    description: 'Emergency fund, investments & debt payoff',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    badgeClass: 'bg-green-100 text-green-800 border border-green-300',
  },
};

export const INCOME_TYPE_META: Record<IncomeType, { label: string; badgeClass: string }> = {
  salary: { label: 'Salary', badgeClass: 'bg-green-100 text-green-800 border border-green-300' },
  extra: { label: 'Extra', badgeClass: 'bg-yellow-100 text-yellow-900 border border-yellow-400' },
  freelance: { label: 'Freelance', badgeClass: 'bg-green-50 text-green-800 border border-green-300' },
  bonus: { label: 'Bonus', badgeClass: 'bg-yellow-100 text-yellow-900 border border-yellow-400' },
  other: { label: 'Other', badgeClass: 'bg-neutral-100 text-neutral-800 border border-neutral-300' },
};

export const CURRENCY_PRESETS: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', decimals: 2 },
  { code: 'JOD', symbol: 'JD ', decimals: 2 },
  { code: 'SAR', symbol: 'SAR ', decimals: 2 },
  { code: 'AED', symbol: 'AED ', decimals: 2 },
  { code: 'EUR', symbol: '€', decimals: 2 },
  { code: 'GBP', symbol: '£', decimals: 2 },
  { code: 'EGP', symbol: 'EGP ', decimals: 2 },
  { code: 'KWD', symbol: 'KD ', decimals: 3 },
];

export const SPLIT_PRESETS: { name: string; split: BucketSplit }[] = [
  { name: '50 / 30 / 20', split: { mandatory: 50, fun: 30, savings: 20 } },
  { name: '50 / 20 / 30', split: { mandatory: 50, fun: 20, savings: 30 } },
  { name: '60 / 20 / 20', split: { mandatory: 60, fun: 20, savings: 20 } },
  { name: '50 / 10 / 40', split: { mandatory: 50, fun: 10, savings: 40 } },
];
