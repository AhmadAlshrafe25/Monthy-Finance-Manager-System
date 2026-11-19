import { describe, expect, it } from 'vitest';
import {
  calculateAllocatedByBucket,
  calculateMonthSummary,
  cloneRecurringForNewMonth,
  normalizeSplit,
} from './calculations';
import { MonthData } from '../types/finance';

describe('Financial Calculation Engine', () => {
  const sampleMonth: MonthData = {
    monthKey: '2026-11',
    split: { mandatory: 50, fun: 30, savings: 20 },
    incomes: [
      {
        id: 'i1',
        date: '2026-11-01',
        title: 'Salary',
        type: 'salary',
        amount: 2000,
        allocationMode: 'split',
        recurring: true,
      },
      {
        id: 'i2',
        date: '2026-11-10',
        title: 'Side Hustle',
        type: 'extra',
        amount: 500,
        allocationMode: 'split',
        recurring: false,
      },
      {
        id: 'i3',
        date: '2026-11-12',
        title: 'Debt Bonus',
        type: 'bonus',
        amount: 200,
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
        amount: 800,
        status: 'paid',
        recurring: true,
      },
      {
        id: 'e2',
        date: '2026-11-05',
        title: 'Dining',
        bucket: 'fun',
        category: 'Dining Out',
        amount: 300,
        status: 'paid',
      },
      {
        id: 'e3',
        date: '2026-11-06',
        title: 'Savings Transfer',
        bucket: 'savings',
        category: 'Emergency Fund',
        amount: 500,
        status: 'paid',
      },
    ],
  };

  it('splits salary and extra income accurately and supports direct bucket allocation', () => {
    const allocated = calculateAllocatedByBucket(sampleMonth);
    // Split income = 2000 + 500 = 2500 -> Mandatory 1250, Fun 750, Savings 500 + 200 direct = 700
    expect(allocated.mandatory).toBe(1250);
    expect(allocated.fun).toBe(750);
    expect(allocated.savings).toBe(700);
  });

  it('cuts expenses from assigned buckets immediately and calculates remaining balances', () => {
    const summary = calculateMonthSummary(sampleMonth, new Date(2026, 10, 15));
    expect(summary.totalIncome).toBe(2700);
    expect(summary.salaryIncome).toBe(2000);
    expect(summary.extraIncome).toBe(700);
    expect(summary.totalSpent).toBe(1600);
    expect(summary.totalRemaining).toBe(1100);

    expect(summary.buckets.mandatory.remaining).toBe(450);
    expect(summary.buckets.mandatory.utilizationPct).toBe(64);
    expect(summary.buckets.fun.remaining).toBe(450);
    expect(summary.buckets.fun.utilizationPct).toBe(40);
    expect(summary.buckets.savings.remaining).toBe(200);
    expect(summary.buckets.savings.isOverBudget).toBe(false);
  });

  it('flags overspending when fees exceed bucket allocation', () => {
    const overMonth: MonthData = {
      ...sampleMonth,
      expenses: [
        ...sampleMonth.expenses,
        {
          id: 'e4',
          date: '2026-11-14',
          title: 'Big Concert Trip',
          bucket: 'fun',
          category: 'Travel',
          amount: 600,
          status: 'paid',
        },
      ],
    };

    const summary = calculateMonthSummary(overMonth, new Date(2026, 10, 15));
    expect(summary.buckets.fun.spent).toBe(900);
    expect(summary.buckets.fun.remaining).toBe(-150);
    expect(summary.buckets.fun.isOverBudget).toBe(true);
    expect(summary.buckets.fun.utilizationPct).toBe(120);
  });

  it('normalizes splits that do not total 100', () => {
    const norm = normalizeSplit({ mandatory: 1, fun: 1, savings: 2 });
    expect(norm.mandatory + norm.fun + norm.savings).toBe(100);
    expect(norm.savings).toBe(50);
  });

  it('clones only recurring incomes and expenses into a new month', () => {
    const nextMonth = cloneRecurringForNewMonth(sampleMonth, '2026-12');
    expect(nextMonth.monthKey).toBe('2026-12');
    expect(nextMonth.incomes).toHaveLength(1);
    expect(nextMonth.incomes[0].title).toBe('Salary');
    expect(nextMonth.incomes[0].date).toBe('2026-12-01');
    expect(nextMonth.expenses).toHaveLength(1);
    expect(nextMonth.expenses[0].title).toBe('Rent');
    expect(nextMonth.expenses[0].status).toBe('scheduled');
  });
});
