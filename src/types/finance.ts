export type BucketColorKey =
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'teal'
  | 'pink';

export interface BucketConfig {
  id: string;
  name: string;
  color: BucketColorKey;
  splitPercent: number;
}

export type IncomeType = 'salary' | 'extra' | 'cut' | 'freelance' | 'bonus' | 'other';

export type AllocationMode = 'split' | string; // 'split' or a BucketConfig.id

export type ExpenseStatus = 'paid' | 'scheduled';

export interface IncomeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: IncomeType;
  amount: number; // Positive for income, negative (-) for salary cuts/deductions
  allocationMode: AllocationMode;
  recurring: boolean;
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  bucket: string; // BucketConfig.id
  category: string;
  amount: number;
  status: ExpenseStatus;
  recurring?: boolean;
  notes?: string;
}

export interface MonthData {
  monthKey: string; // YYYY-MM
  buckets: BucketConfig[];
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
  defaultBuckets: BucketConfig[];
  categories: Record<string, string[]>;
  exchangeRates?: Record<string, number>;
  autoConvertOnCurrencySwitch?: boolean;
  autoCarryOverNextMonth?: boolean;
  defaultExpenseStatus?: ExpenseStatus;
  warningThresholdPct?: number;
  maxVisibleTables?: number;
  isSampleData?: boolean;
}

export interface FinanceStore {
  version: number;
  activeMonth: string; // YYYY-MM
  settings: AppSettings;
  months: Record<string, MonthData>;
}

export interface BucketMetrics {
  bucketId: string;
  name: string;
  color: BucketColorKey;
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
  bucketId: string;
  bucketName: string;
  bucketColor: BucketColorKey;
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
}

export interface MonthSummary {
  monthKey: string;
  totalIncome: number; // Net income (gross - salary cuts)
  grossIncome: number;
  salaryIncome: number;
  extraIncome: number;
  salaryCuts: number; // Positive magnitude of negative income entries
  totalSpent: number;
  paidSpent: number;
  scheduledSpent: number;
  totalRemaining: number;
  burnRatePerDay: number;
  projectedEndBalance: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  buckets: BucketMetrics[];
  bucketMap: Record<string, BucketMetrics>;
  categories: CategorySummary[];
  dailySeries: DailyPoint[];
  largestExpense: ExpenseEntry | null;
  topCategory: CategorySummary | null;
}

export interface MultiMonthPoint {
  monthKey: string;
  label: string;
  income: number;
  totalSpent: number;
  netLeft: number;
  byBucket: Record<string, number>;
}

export type ActiveSheet = 'sheet' | 'analytics' | 'settings';

export interface BucketColorTheme {
  key: BucketColorKey;
  label: string;
  hex: string;
  bgClass: string;
  headerBgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
}

export const BUCKET_COLOR_KEYS: BucketColorKey[] = [
  'red',
  'yellow',
  'green',
  'blue',
  'orange',
  'purple',
  'teal',
  'pink',
];

export const BUCKET_COLORS: Record<BucketColorKey, BucketColorTheme> = {
  red: {
    key: 'red',
    label: 'Red',
    hex: '#dc2626',
    bgClass: 'bg-red-50',
    headerBgClass: 'bg-red-600 text-white',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    badgeClass: 'bg-red-100 text-red-800 border border-red-300',
    dotClass: 'bg-red-600',
    barClass: 'bg-red-600',
  },
  yellow: {
    key: 'yellow',
    label: 'Yellow',
    hex: '#eab308',
    bgClass: 'bg-yellow-50',
    headerBgClass: 'bg-yellow-400 text-neutral-950',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-400',
    badgeClass: 'bg-yellow-100 text-yellow-900 border border-yellow-400',
    dotClass: 'bg-yellow-500',
    barClass: 'bg-yellow-500',
  },
  green: {
    key: 'green',
    label: 'Green',
    hex: '#16a34a',
    bgClass: 'bg-green-50',
    headerBgClass: 'bg-green-600 text-white',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    badgeClass: 'bg-green-100 text-green-800 border border-green-300',
    dotClass: 'bg-green-600',
    barClass: 'bg-green-600',
  },
  blue: {
    key: 'blue',
    label: 'Blue',
    hex: '#2563eb',
    bgClass: 'bg-blue-50',
    headerBgClass: 'bg-blue-600 text-white',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300',
    dotClass: 'bg-blue-600',
    barClass: 'bg-blue-600',
  },
  orange: {
    key: 'orange',
    label: 'Orange',
    hex: '#ea580c',
    bgClass: 'bg-orange-50',
    headerBgClass: 'bg-orange-500 text-white',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300',
    dotClass: 'bg-orange-500',
    barClass: 'bg-orange-500',
  },
  purple: {
    key: 'purple',
    label: 'Purple',
    hex: '#9333ea',
    bgClass: 'bg-purple-50',
    headerBgClass: 'bg-purple-600 text-white',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-300',
    badgeClass: 'bg-purple-100 text-purple-800 border border-purple-300',
    dotClass: 'bg-purple-600',
    barClass: 'bg-purple-600',
  },
  teal: {
    key: 'teal',
    label: 'Teal',
    hex: '#0d9488',
    bgClass: 'bg-teal-50',
    headerBgClass: 'bg-teal-600 text-white',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-300',
    badgeClass: 'bg-teal-100 text-teal-800 border border-teal-300',
    dotClass: 'bg-teal-600',
    barClass: 'bg-teal-600',
  },
  pink: {
    key: 'pink',
    label: 'Pink',
    hex: '#db2777',
    bgClass: 'bg-pink-50',
    headerBgClass: 'bg-pink-600 text-white',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-300',
    badgeClass: 'bg-pink-100 text-pink-800 border border-pink-300',
    dotClass: 'bg-pink-600',
    barClass: 'bg-pink-600',
  },
};

export function getBucketTheme(color: BucketColorKey): BucketColorTheme {
  return BUCKET_COLORS[color] || BUCKET_COLORS.green;
}

export const CURRENCY_PRESETS: CurrencyConfig[] = [
  { code: 'JOD', symbol: 'JD ', decimals: 2 },
  { code: 'USD', symbol: '$', decimals: 2 },
  { code: 'SAR', symbol: 'SAR ', decimals: 2 },
  { code: 'AED', symbol: 'AED ', decimals: 2 },
  { code: 'EUR', symbol: '€', decimals: 2 },
  { code: 'GBP', symbol: '£', decimals: 2 },
  { code: 'EGP', symbol: 'EGP ', decimals: 2 },
  { code: 'KWD', symbol: 'KD ', decimals: 3 },
];
