import { describe, expect, it } from 'vitest';
import {
  calculateAllocatedByBucket,
  calculateMonthSummary,
  cloneRecurringForNewMonth,
  normalizeBucketsSplit,
} from './calculations';
import { migrateStore } from './seed';
import { MonthData } from '../types/finance';

describe('Dynamic Budget & Salary Cut Calculation Engine', () => {
  const sampleMonth: MonthData = {
    monthKey: '2026-11',
    buckets: [
      { id: 'mandatory', name: 'Mandatory', color: 'red', splitPercent: 50 },
      { id: 'fun', name: 'Fun Spending', color: 'yellow', splitPercent: 30 },
      { id: 'savings', name: 'Savings / Debt', color: 'green', splitPercent: 20 },
    ],
    incomes: [
      {
        id: 'i1',
        date: '2026-11-01',
        title: 'Monthly Salary',
        type: 'salary',
        amount: 1000,
        allocationMode: 'split',
        recurring: true,
      },
      {
        id: 'i2',
        date: '2026-11-01',
        title: 'Social Security Deduction',
        type: 'cut',
        amount: -100,
        allocationMode: 'split',
        recurring: true,
      },
      {
        id: 'i3',
        date: '2026-11-10',
        title: 'Extra Freelance',
        type: 'extra',
        amount: 200,
        allocationMode: 'split',
        recurring: false,
      },
      {
        id: 'i4',
        date: '2026-11-12',
        title: 'Direct Savings Bonus',
        type: 'bonus',
        amount: 100,
        allocationMode: 'savings',
        recurring: false,
      },
    ],
    expenses: [
      {
        id: 'e1',
        date: '2026-11-02',
        title: 'Rent',
        bucket: 'mandatory',
        category: 'Rent / Housing',
        amount: 400,
        status: 'paid',
        recurring: true,
      },
      {
        id: 'e2',
        date: '2026-11-05',
        title: 'Coffee',
        bucket: 'fun',
        category: 'Coffee & Snacks',
        amount: 50,
        status: 'paid',
      },
    ],
  };

  it('deducts negative salary cuts naturally before splitting across dynamic buckets', () => {
    // Split income = 1000 - 100 + 200 = 1100
    // Mandatory 50% = 550, Fun 30% = 330, Savings 20% = 220 + 100 direct = 320
    const allocated = calculateAllocatedByBucket(sampleMonth);
    expect(allocated.mandatory).toBe(550);
    expect(allocated.fun).toBe(330);
    expect(allocated.savings).toBe(320);
  });

  it('tracks gross income, salary cuts, net income, and remaining balances per bucket', () => {
    const summary = calculateMonthSummary(sampleMonth, new Date(2026, 10, 15));
    expect(summary.grossIncome).toBe(1300);
    expect(summary.salaryCuts).toBe(100);
    expect(summary.totalIncome).toBe(1200);
    expect(summary.totalSpent).toBe(450);
    expect(summary.totalRemaining).toBe(750);
    expect(summary.bucketMap.mandatory.remaining).toBe(150);
    expect(summary.bucketMap.fun.remaining).toBe(280);
    expect(summary.bucketMap.savings.remaining).toBe(320);
  });

  it('supports adding custom 4th/5th buckets dynamically', () => {
    const customMonth: MonthData = {
      ...sampleMonth,
      buckets: [
        { id: 'mandatory', name: 'Mandatory', color: 'red', splitPercent: 40 },
        { id: 'fun', name: 'Fun', color: 'yellow', splitPercent: 20 },
        { id: 'savings', name: 'Savings', color: 'green', splitPercent: 20 },
        { id: 'car', name: 'Car Fund', color: 'blue', splitPercent: 20 },
      ],
      expenses: [
        ...sampleMonth.expenses,
        {
          id: 'e3',
          date: '2026-11-11',
          title: 'Oil Change',
          bucket: 'car',
          category: 'Maintenance',
          amount: 45,
          status: 'paid',
        },
      ],
    };

    const summary = calculateMonthSummary(customMonth, new Date(2026, 10, 15));
    expect(summary.buckets).toHaveLength(4);
    expect(summary.bucketMap.car.allocated).toBe(220);
    expect(summary.bucketMap.car.spent).toBe(45);
    expect(summary.bucketMap.car.remaining).toBe(175);
  });

  it('normalizes arbitrary number of buckets to total 100%', () => {
    const normalized = normalizeBucketsSplit([
      { id: 'a', name: 'A', color: 'red', splitPercent: 10 },
      { id: 'b', name: 'B', color: 'blue', splitPercent: 10 },
      { id: 'c', name: 'C', color: 'green', splitPercent: 20 },
    ]);
    const sum = normalized.reduce((s, b) => s + b.splitPercent, 0);
    expect(sum).toBe(100);
    expect(normalized[2].splitPercent).toBe(50);
  });

  it('migrates v1 fixed-3-bucket store into v2 dynamic buckets without losing data', () => {
    const v1 = {
      version: 1,
      activeMonth: '2026-11',
      settings: { currency: { code: 'JOD', symbol: 'JD ', decimals: 2 } },
      months: {
        '2026-11': {
          monthKey: '2026-11',
          split: { mandatory: 60, fun: 20, savings: 20 },
          incomes: [
            { id: 'i1', date: '2026-11-01', title: 'Monthly Salary', type: 'salary', amount: 420, allocationMode: 'split', recurring: true },
          ],
          expenses: [],
        },
      },
    };
    const migrated = migrateStore(v1);
    expect(migrated?.version).toBe(2);
    expect(migrated?.months['2026-11'].buckets).toHaveLength(3);
    expect(migrated?.months['2026-11'].buckets[0].splitPercent).toBe(60);
    expect(migrated?.months['2026-11'].incomes[0].amount).toBe(420);
  });

  it('clones recurring items and custom buckets into next month', () => {
    const next = cloneRecurringForNewMonth(sampleMonth, '2026-12');
    expect(next.buckets).toHaveLength(3);
    expect(next.incomes).toHaveLength(2); // Salary + recurring salary cut
    expect(next.expenses).toHaveLength(1);
    expect(next.expenses[0].status).toBe('scheduled');
  });
});
