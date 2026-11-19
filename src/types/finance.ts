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
  allocationMode: AllocationMode; // 'split' uses monthly BucketSplit, or direct to a single bucket
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
  savingsRatePct: number; // (savingsAllocated + unspent surplus) or savingsAllocated / totalIncome
  effectiveSavingsRatePct: number; // (savingsAllocated / totalIncome) * 100
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

export type ActiveTab = 'dashboard' | 'ledger' | 'analytics' | 'settings';

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
    description: 'Essential living costs, bills, rent, groceries & fixed fees',
    color: '#38bdf8',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    badgeClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  },
  fun: {
    label: 'Fun Spending',
    shortLabel: 'Fun',
    description: 'Dining out, entertainment, hobbies, shopping & lifestyle',
    color: '#c084fc',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  },
  savings: {
    label: 'Savings / Debt',
    shortLabel: 'Savings/Debt',
    description: 'Emergency fund, investments, debt payoff & financial goals',
    color: '#34d399',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
};

export const INCOME_TYPE_META: Record<IncomeType, { label: string; badgeClass: string }> = {
  salary: { label: 'Salary', badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  extra: { label: 'Extra Income', badgeClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30' },
  freelance: { label: 'Freelance', badgeClass: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' },
  bonus: { label: 'Bonus', badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  other: { label: 'Other', badgeClass: 'bg-slate-500/15 text-slate-300 border border-slate-500/30' },
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
  { name: 'Classic 50 / 30 / 20', split: { mandatory: 50, fun: 30, savings: 20 } },
  { name: 'Aggressive Saver 50 / 20 / 30', split: { mandatory: 50, fun: 20, savings: 30 } },
  { name: 'High Fixed Costs 60 / 20 / 20', split: { mandatory: 60, fun: 20, savings: 20 } },
  { name: 'Debt Crusher 50 / 10 / 40', split: { mandatory: 50, fun: 10, savings: 40 } },
];
