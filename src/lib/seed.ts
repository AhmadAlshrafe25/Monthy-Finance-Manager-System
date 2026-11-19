import { AppSettings, BucketConfig, FinanceStore, MonthData } from '../types/finance';
import { getCurrentMonthKey, shiftMonthKey } from './format';

export const DEFAULT_BUCKETS: BucketConfig[] = [
  { id: 'mandatory', name: 'Mandatory', color: 'red', splitPercent: 50 },
  { id: 'fun', name: 'Fun Spending', color: 'yellow', splitPercent: 30 },
  { id: 'savings', name: 'Savings / Debt', color: 'green', splitPercent: 20 },
];

export const DEFAULT_CATEGORIES: Record<string, string[]> = {
  mandatory: [
    'Rent / Housing',
    'Groceries',
    'Electricity & Water',
    'Internet & Phone',
    'Transport & Fuel',
    'Healthcare',
    'Bills & Fees',
  ],
  fun: [
    'Dining Out',
    'Coffee & Snacks',
    'Entertainment',
    'Gaming & Hobbies',
    'Shopping',
    'Subscriptions',
    'Gym & Sports',
  ],
  savings: [
    'Emergency Fund',
    'Investments',
    'Debt Payoff',
    'Credit Card',
    'Long-Term Goal',
  ],
};

export const FALLBACK_CATEGORIES = ['General', 'Bills', 'Personal', 'Goal', 'Other'];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: { code: 'JOD', symbol: 'JD ', decimals: 2 },
  defaultBuckets: DEFAULT_BUCKETS,
  categories: DEFAULT_CATEGORIES,
  isSampleData: false,
};

export function createEmptyMonth(
  monthKey: string,
  buckets: BucketConfig[] = DEFAULT_BUCKETS
): MonthData {
  return {
    monthKey,
    buckets: buckets.map((b) => ({ ...b })),
    incomes: [],
    expenses: [],
  };
}

export function createEmptyStore(currency = DEFAULT_SETTINGS.currency): FinanceStore {
  const currentMonth = getCurrentMonthKey();
  return {
    version: 2,
    activeMonth: currentMonth,
    settings: {
      ...DEFAULT_SETTINGS,
      currency,
      isSampleData: false,
    },
    months: {
      [currentMonth]: createEmptyMonth(currentMonth, DEFAULT_BUCKETS),
    },
  };
}

// Automatically migrate v1 fixed-3-bucket stores so existing user data is never lost
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateStore(raw: any): FinanceStore | null {
  if (!raw || typeof raw !== 'object' || !raw.months) return null;

  if (raw.version === 2) {
    return raw as FinanceStore;
  }

  const migratedMonths: Record<string, MonthData> = {};
  for (const [key, m] of Object.entries<any>(raw.months)) {
    const split = m.split || { mandatory: 50, fun: 30, savings: 20 };
    const buckets: BucketConfig[] = Array.isArray(m.buckets)
      ? m.buckets
      : [
          { id: 'mandatory', name: 'Mandatory', color: 'red', splitPercent: split.mandatory ?? 50 },
          { id: 'fun', name: 'Fun Spending', color: 'yellow', splitPercent: split.fun ?? 30 },
          { id: 'savings', name: 'Savings / Debt', color: 'green', splitPercent: split.savings ?? 20 },
        ];

    migratedMonths[key] = {
      monthKey: m.monthKey || key,
      buckets,
      incomes: Array.isArray(m.incomes) ? m.incomes : [],
      expenses: Array.isArray(m.expenses) ? m.expenses : [],
    };
  }

  return {
    version: 2,
    activeMonth: raw.activeMonth || getCurrentMonthKey(),
    settings: {
      currency: raw.settings?.currency || DEFAULT_SETTINGS.currency,
      defaultBuckets: DEFAULT_BUCKETS.map((b) => ({ ...b })),
      categories: raw.settings?.categories || DEFAULT_CATEGORIES,
      isSampleData: Boolean(raw.settings?.isSampleData),
    },
    months: migratedMonths,
  };
}

export function createStarterStore(): FinanceStore {
  const m0 = getCurrentMonthKey();
  const m1 = shiftMonthKey(m0, -1);
  const m2 = shiftMonthKey(m0, -2);

  const months: Record<string, MonthData> = {
    [m2]: {
      monthKey: m2,
      buckets: DEFAULT_BUCKETS.map((b) => ({ ...b })),
      incomes: [
        { id: 's2_i1', date: `${m2}-01`, title: 'Monthly Salary', type: 'salary', amount: 1200, allocationMode: 'split', recurring: true },
        { id: 's2_i2', date: `${m2}-01`, title: 'Social Security Deduction', type: 'cut', amount: -85, allocationMode: 'split', recurring: true },
        { id: 's2_i3', date: `${m2}-15`, title: 'Freelance Project', type: 'freelance', amount: 220, allocationMode: 'split', recurring: false },
      ],
      expenses: [
        { id: 's2_e1', date: `${m2}-02`, title: 'Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 350, status: 'paid', recurring: true },
        { id: 's2_e2', date: `${m2}-06`, title: 'Groceries', bucket: 'mandatory', category: 'Groceries', amount: 160, status: 'paid', recurring: false },
        { id: 's2_e3', date: `${m2}-09`, title: 'Internet & Electricity', bucket: 'mandatory', category: 'Internet & Phone', amount: 65, status: 'paid', recurring: true },
        { id: 's2_e4', date: `${m2}-11`, title: 'Dining Out & Coffee', bucket: 'fun', category: 'Dining Out', amount: 140, status: 'paid', recurring: false },
        { id: 's2_e5', date: `${m2}-19`, title: 'Shopping', bucket: 'fun', category: 'Shopping', amount: 110, status: 'paid', recurring: false },
        { id: 's2_e6', date: `${m2}-04`, title: 'Emergency Savings', bucket: 'savings', category: 'Emergency Fund', amount: 250, status: 'paid', recurring: true },
      ],
    },
    [m1]: {
      monthKey: m1,
      buckets: DEFAULT_BUCKETS.map((b) => ({ ...b })),
      incomes: [
        { id: 's1_i1', date: `${m1}-01`, title: 'Monthly Salary', type: 'salary', amount: 1250, allocationMode: 'split', recurring: true },
        { id: 's1_i2', date: `${m1}-01`, title: 'Social Security Deduction', type: 'cut', amount: -85, allocationMode: 'split', recurring: true },
        { id: 's1_i3', date: `${m1}-18`, title: 'Extra Bonus', type: 'bonus', amount: 150, allocationMode: 'split', recurring: false },
      ],
      expenses: [
        { id: 's1_e1', date: `${m1}-02`, title: 'Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 350, status: 'paid', recurring: true },
        { id: 's1_e2', date: `${m1}-05`, title: 'Supermarket', bucket: 'mandatory', category: 'Groceries', amount: 175, status: 'paid', recurring: false },
        { id: 's1_e3', date: `${m1}-08`, title: 'Bills & Fuel', bucket: 'mandatory', category: 'Transport & Fuel', amount: 95, status: 'paid', recurring: true },
        { id: 's1_e4', date: `${m1}-12`, title: 'Weekend Dinner', bucket: 'fun', category: 'Dining Out', amount: 120, status: 'paid', recurring: false },
        { id: 's1_e5', date: `${m1}-20`, title: 'Gym & Subscriptions', bucket: 'fun', category: 'Gym & Sports', amount: 55, status: 'paid', recurring: true },
        { id: 's1_e6', date: `${m1}-04`, title: 'Emergency Fund', bucket: 'savings', category: 'Emergency Fund', amount: 240, status: 'paid', recurring: true },
      ],
    },
    [m0]: {
      monthKey: m0,
      buckets: DEFAULT_BUCKETS.map((b) => ({ ...b })),
      incomes: [
        { id: 's0_i1', date: `${m0}-01`, title: 'Monthly Salary', type: 'salary', amount: 1250, allocationMode: 'split', recurring: true },
        { id: 's0_i2', date: `${m0}-01`, title: 'Social Security Cut', type: 'cut', amount: -85, allocationMode: 'split', recurring: true },
        { id: 's0_i3', date: `${m0}-10`, title: 'Freelance Task', type: 'freelance', amount: 185, allocationMode: 'split', recurring: false },
      ],
      expenses: [
        { id: 's0_e1', date: `${m0}-02`, title: 'Apartment Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 350, status: 'paid', recurring: true },
        { id: 's0_e2', date: `${m0}-05`, title: 'Groceries', bucket: 'mandatory', category: 'Groceries', amount: 140, status: 'paid', recurring: false },
        { id: 's0_e3', date: `${m0}-07`, title: 'Internet & Electricity', bucket: 'mandatory', category: 'Internet & Phone', amount: 72, status: 'paid', recurring: true },
        { id: 's0_e4', date: `${m0}-06`, title: 'Coffee & Snacks', bucket: 'fun', category: 'Coffee & Snacks', amount: 45, status: 'paid', recurring: false },
        { id: 's0_e5', date: `${m0}-11`, title: 'Dinner with Friends', bucket: 'fun', category: 'Dining Out', amount: 68, status: 'paid', recurring: false },
        { id: 's0_e6', date: `${m0}-03`, title: 'Emergency Fund Deposit', bucket: 'savings', category: 'Emergency Fund', amount: 200, status: 'paid', recurring: true },
      ],
    },
  };

  return {
    version: 2,
    activeMonth: m0,
    settings: {
      ...DEFAULT_SETTINGS,
      isSampleData: true,
    },
    months,
  };
}
