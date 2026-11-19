import { AppSettings, FinanceStore, MonthData } from '../types/finance';
import { getCurrentMonthKey, shiftMonthKey } from './format';

export const DEFAULT_CATEGORIES: AppSettings['categories'] = {
  mandatory: [
    'Rent / Housing',
    'Groceries',
    'Electricity & Water',
    'Internet & Phone',
    'Transport & Fuel',
    'Healthcare',
    'Insurance',
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
    'Travel & Outings',
  ],
  savings: [
    'Emergency Fund',
    'Investments',
    'Debt Payoff',
    'Credit Card',
    'Long-Term Goal',
    'Car / Tech Fund',
  ],
};

export const DEFAULT_SETTINGS: AppSettings = {
  currency: { code: 'USD', symbol: '$', decimals: 2 },
  defaultSplit: { mandatory: 50, fun: 30, savings: 20 },
  categories: DEFAULT_CATEGORIES,
  isSampleData: false,
};

export function createEmptyMonth(monthKey: string, split = DEFAULT_SETTINGS.defaultSplit): MonthData {
  return {
    monthKey,
    split: { ...split },
    incomes: [],
    expenses: [],
  };
}

export function createEmptyStore(): FinanceStore {
  const currentMonth = getCurrentMonthKey();
  return {
    version: 1,
    activeMonth: currentMonth,
    settings: {
      ...DEFAULT_SETTINGS,
      isSampleData: false,
    },
    months: {
      [currentMonth]: createEmptyMonth(currentMonth),
    },
  };
}

export function createStarterStore(): FinanceStore {
  const m0 = getCurrentMonthKey();
  const m1 = shiftMonthKey(m0, -1);
  const m2 = shiftMonthKey(m0, -2);
  const m3 = shiftMonthKey(m0, -3);

  const months: Record<string, MonthData> = {
    [m3]: {
      monthKey: m3,
      split: { mandatory: 50, fun: 30, savings: 20 },
      incomes: [
        { id: 's3_i1', date: `${m3}-01`, title: 'Monthly Salary', type: 'salary', amount: 3000, allocationMode: 'split', recurring: true },
        { id: 's3_i2', date: `${m3}-15`, title: 'Weekend Freelance Task', type: 'freelance', amount: 350, allocationMode: 'split', recurring: false },
      ],
      expenses: [
        { id: 's3_e1', date: `${m3}-02`, title: 'Apartment Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 950, status: 'paid', recurring: true },
        { id: 's3_e2', date: `${m3}-05`, title: 'Supermarket Groceries', bucket: 'mandatory', category: 'Groceries', amount: 380, status: 'paid', recurring: false },
        { id: 's3_e3', date: `${m3}-07`, title: 'Utilities & Fiber', bucket: 'mandatory', category: 'Internet & Phone', amount: 175, status: 'paid', recurring: true },
        { id: 's3_e4', date: `${m3}-10`, title: 'Fuel & Commute', bucket: 'mandatory', category: 'Transport & Fuel', amount: 140, status: 'paid', recurring: false },
        { id: 's3_e5', date: `${m3}-12`, title: 'Restaurants & Coffee', bucket: 'fun', category: 'Dining Out', amount: 310, status: 'paid', recurring: false },
        { id: 's3_e6', date: `${m3}-18`, title: 'Streaming & Gaming', bucket: 'fun', category: 'Gaming & Hobbies', amount: 195, status: 'paid', recurring: false },
        { id: 's3_e7', date: `${m3}-22`, title: 'Clothes & Gear', bucket: 'fun', category: 'Shopping', amount: 280, status: 'paid', recurring: false },
        { id: 's3_e8', date: `${m3}-03`, title: 'Emergency Savings Transfer', bucket: 'savings', category: 'Emergency Fund', amount: 450, status: 'paid', recurring: true },
        { id: 's3_e9', date: `${m3}-20`, title: 'Credit Card Paydown', bucket: 'savings', category: 'Debt Payoff', amount: 220, status: 'paid', recurring: false },
      ],
    },
    [m2]: {
      monthKey: m2,
      split: { mandatory: 50, fun: 30, savings: 20 },
      incomes: [
        { id: 's2_i1', date: `${m2}-01`, title: 'Monthly Salary', type: 'salary', amount: 3000, allocationMode: 'split', recurring: true },
        { id: 's2_i2', date: `${m2}-19`, title: 'Side Project Milestone', type: 'extra', amount: 500, allocationMode: 'split', recurring: false },
      ],
      expenses: [
        { id: 's2_e1', date: `${m2}-02`, title: 'Apartment Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 950, status: 'paid', recurring: true },
        { id: 's2_e2', date: `${m2}-06`, title: 'Groceries & Household', bucket: 'mandatory', category: 'Groceries', amount: 410, status: 'paid', recurring: false },
        { id: 's2_e3', date: `${m2}-08`, title: 'Electricity, Water & Fiber', bucket: 'mandatory', category: 'Electricity & Water', amount: 190, status: 'paid', recurring: true },
        { id: 's2_e4', date: `${m2}-14`, title: 'Fuel & Transit', bucket: 'mandatory', category: 'Transport & Fuel', amount: 155, status: 'paid', recurring: false },
        { id: 's2_e5', date: `${m2}-11`, title: 'Weekend Outing & Dinner', bucket: 'fun', category: 'Dining Out', amount: 360, status: 'paid', recurring: false },
        { id: 's2_e6', date: `${m2}-17`, title: 'Gym & Subscriptions', bucket: 'fun', category: 'Subscriptions', amount: 110, status: 'paid', recurring: true },
        { id: 's2_e7', date: `${m2}-24`, title: 'Tech Accessories', bucket: 'fun', category: 'Shopping', amount: 420, status: 'paid', recurring: false },
        { id: 's2_e8', date: `${m2}-03`, title: 'Emergency Fund Deposit', bucket: 'savings', category: 'Emergency Fund', amount: 500, status: 'paid', recurring: true },
        { id: 's2_e9', date: `${m2}-21`, title: 'Index Fund Investment', bucket: 'savings', category: 'Investments', amount: 250, status: 'paid', recurring: false },
      ],
    },
    [m1]: {
      monthKey: m1,
      split: { mandatory: 50, fun: 30, savings: 20 },
      incomes: [
        { id: 's1_i1', date: `${m1}-01`, title: 'Monthly Salary', type: 'salary', amount: 3200, allocationMode: 'split', recurring: true },
        { id: 's1_i2', date: `${m1}-12`, title: 'Consulting Extra Income', type: 'freelance', amount: 450, allocationMode: 'split', recurring: false },
        { id: 's1_i3', date: `${m1}-25`, title: 'Performance Bonus', type: 'bonus', amount: 300, allocationMode: 'savings', recurring: false, notes: 'Directed 100% to Savings/Debt' },
      ],
      expenses: [
        { id: 's1_e1', date: `${m1}-02`, title: 'Apartment Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 950, status: 'paid', recurring: true },
        { id: 's1_e2', date: `${m1}-05`, title: 'Weekly Groceries', bucket: 'mandatory', category: 'Groceries', amount: 430, status: 'paid', recurring: false },
        { id: 's1_e3', date: `${m1}-08`, title: 'Electricity & Internet', bucket: 'mandatory', category: 'Electricity & Water', amount: 185, status: 'paid', recurring: true },
        { id: 's1_e4', date: `${m1}-15`, title: 'Fuel & Car Service', bucket: 'mandatory', category: 'Transport & Fuel', amount: 210, status: 'paid', recurring: false },
        { id: 's1_e5', date: `${m1}-09`, title: 'Dining & Coffee Runs', bucket: 'fun', category: 'Dining Out', amount: 340, status: 'paid', recurring: false },
        { id: 's1_e6', date: `${m1}-14`, title: 'Gym Membership & Apps', bucket: 'fun', category: 'Subscriptions', amount: 115, status: 'paid', recurring: true },
        { id: 's1_e7', date: `${m1}-22`, title: 'Cinema & Friends Hangout', bucket: 'fun', category: 'Entertainment', amount: 265, status: 'paid', recurring: false },
        { id: 's1_e8', date: `${m1}-03`, title: 'Emergency Fund Auto-Save', bucket: 'savings', category: 'Emergency Fund', amount: 600, status: 'paid', recurring: true },
        { id: 's1_e9', date: `${m1}-26`, title: 'Debt Extra Principal', bucket: 'savings', category: 'Debt Payoff', amount: 380, status: 'paid', recurring: false },
      ],
    },
    [m0]: {
      monthKey: m0,
      split: { mandatory: 50, fun: 30, savings: 20 },
      incomes: [
        { id: 's0_i1', date: `${m0}-01`, title: 'Monthly Salary', type: 'salary', amount: 3200, allocationMode: 'split', recurring: true, notes: 'Primary paycheck' },
        { id: 's0_i2', date: `${m0}-10`, title: 'Freelance Design & Dev', type: 'freelance', amount: 600, allocationMode: 'split', recurring: false, notes: 'Client invoice #14' },
        { id: 's0_i3', date: `${m0}-14`, title: 'Cashback & Referral Extra', type: 'extra', amount: 120, allocationMode: 'fun', recurring: false, notes: 'Straight to Fun budget' },
      ],
      expenses: [
        { id: 's0_e1', date: `${m0}-02`, title: 'Apartment Rent', bucket: 'mandatory', category: 'Rent / Housing', amount: 950, status: 'paid', recurring: true },
        { id: 's0_e2', date: `${m0}-04`, title: 'Monthly Groceries (Batch 1)', bucket: 'mandatory', category: 'Groceries', amount: 245, status: 'paid', recurring: false },
        { id: 's0_e3', date: `${m0}-06`, title: 'Fiber Internet & Mobile Plan', bucket: 'mandatory', category: 'Internet & Phone', amount: 78, status: 'paid', recurring: true },
        { id: 's0_e4', date: `${m0}-08`, title: 'Electricity & Water Bill', bucket: 'mandatory', category: 'Electricity & Water', amount: 112, status: 'paid', recurring: true },
        { id: 's0_e5', date: `${m0}-12`, title: 'Gas & Commute Refill', bucket: 'mandatory', category: 'Transport & Fuel', amount: 95, status: 'paid', recurring: false },
        { id: 's0_e6', date: `${m0}-24`, title: 'Upcoming Groceries Buffer', bucket: 'mandatory', category: 'Groceries', amount: 180, status: 'scheduled', recurring: false },
        { id: 's0_e7', date: `${m0}-05`, title: 'Specialty Coffee & Snacks', bucket: 'fun', category: 'Coffee & Snacks', amount: 64, status: 'paid', recurring: false },
        { id: 's0_e8', date: `${m0}-09`, title: 'Gym & Streaming Bundle', bucket: 'fun', category: 'Subscriptions', amount: 92, status: 'paid', recurring: true },
        { id: 's0_e9', date: `${m0}-13`, title: 'Dinner Out with Friends', bucket: 'fun', category: 'Dining Out', amount: 145, status: 'paid', recurring: false },
        { id: 's0_e10', date: `${m0}-16`, title: 'New Mechanical Keyboard Keycaps', bucket: 'fun', category: 'Gaming & Hobbies', amount: 88, status: 'paid', recurring: false },
        { id: 's0_e11', date: `${m0}-03`, title: 'Emergency Fund Transfer', bucket: 'savings', category: 'Emergency Fund', amount: 450, status: 'paid', recurring: true },
        { id: 's0_e12', date: `${m0}-15`, title: 'Debt Payoff Installment', bucket: 'savings', category: 'Debt Payoff', amount: 250, status: 'paid', recurring: true },
      ],
    },
  };

  return {
    version: 1,
    activeMonth: m0,
    settings: {
      ...DEFAULT_SETTINGS,
      isSampleData: true,
    },
    months,
  };
}
