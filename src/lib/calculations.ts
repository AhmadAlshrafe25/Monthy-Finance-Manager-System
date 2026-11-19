import {
  BucketMetrics,
  BucketSplit,
  BucketType,
  CategorySummary,
  DailyPoint,
  ExpenseEntry,
  MonthData,
  MonthSummary,
  MultiMonthPoint,
} from '../types/finance';

export const BUCKETS: BucketType[] = ['mandatory', 'fun', 'savings'];

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return 30;
  return new Date(year, month, 0).getDate();
}

export function getMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function normalizeSplit(split: BucketSplit): BucketSplit {
  const total = split.mandatory + split.fun + split.savings;
  if (total === 100) return split;
  if (total <= 0) return { mandatory: 50, fun: 30, savings: 20 };
  const mandatory = Math.round((split.mandatory / total) * 100);
  const fun = Math.round((split.fun / total) * 100);
  const savings = 100 - mandatory - fun;
  return { mandatory, fun, savings };
}

export function calculateAllocatedByBucket(month: MonthData): Record<BucketType, number> {
  const split = normalizeSplit(month.split);
  const allocated: Record<BucketType, number> = {
    mandatory: 0,
    fun: 0,
    savings: 0,
  };

  for (const income of month.incomes) {
    const amt = Math.max(0, Number(income.amount) || 0);
    if (income.allocationMode === 'split') {
      allocated.mandatory += amt * (split.mandatory / 100);
      allocated.fun += amt * (split.fun / 100);
      allocated.savings += amt * (split.savings / 100);
    } else {
      allocated[income.allocationMode] += amt;
    }
  }

  return {
    mandatory: roundMoney(allocated.mandatory),
    fun: roundMoney(allocated.fun),
    savings: roundMoney(allocated.savings),
  };
}

export function calculateMonthSummary(month: MonthData, referenceDate: Date = new Date()): MonthSummary {
  const split = normalizeSplit(month.split);
  const daysInMonth = getDaysInMonth(month.monthKey);

  // Determine elapsed & remaining days relative to referenceDate
  const [yearStr, monthStr] = month.monthKey.split('-');
  const y = Number(yearStr);
  const m = Number(monthStr);
  const refY = referenceDate.getFullYear();
  const refM = referenceDate.getMonth() + 1;

  let daysElapsed = daysInMonth;
  let daysRemaining = 0;

  if (y === refY && m === refM) {
    daysElapsed = Math.min(daysInMonth, Math.max(1, referenceDate.getDate()));
    daysRemaining = Math.max(1, daysInMonth - daysElapsed + 1);
  } else if (y > refY || (y === refY && m > refM)) {
    daysElapsed = 1;
    daysRemaining = daysInMonth;
  } else {
    daysElapsed = daysInMonth;
    daysRemaining = 0;
  }

  // Income totals
  let totalIncome = 0;
  let salaryIncome = 0;
  let extraIncome = 0;

  for (const inc of month.incomes) {
    const amt = Math.max(0, Number(inc.amount) || 0);
    totalIncome += amt;
    if (inc.type === 'salary') {
      salaryIncome += amt;
    } else {
      extraIncome += amt;
    }
  }
  totalIncome = roundMoney(totalIncome);
  salaryIncome = roundMoney(salaryIncome);
  extraIncome = roundMoney(extraIncome);

  // Allocated per bucket
  const allocatedMap = calculateAllocatedByBucket(month);

  // Expense aggregations
  const spentMap: Record<BucketType, number> = { mandatory: 0, fun: 0, savings: 0 };
  const paidMap: Record<BucketType, number> = { mandatory: 0, fun: 0, savings: 0 };
  const scheduledMap: Record<BucketType, number> = { mandatory: 0, fun: 0, savings: 0 };
  const countMap: Record<BucketType, number> = { mandatory: 0, fun: 0, savings: 0 };

  const categoryMap = new Map<string, { bucket: BucketType; total: number; count: number }>();
  let largestExpense: ExpenseEntry | null = null;

  for (const exp of month.expenses) {
    const amt = Math.max(0, Number(exp.amount) || 0);
    spentMap[exp.bucket] += amt;
    countMap[exp.bucket] += 1;
    if (exp.status === 'paid') {
      paidMap[exp.bucket] += amt;
    } else {
      scheduledMap[exp.bucket] += amt;
    }

    const catKey = `${exp.bucket}::${exp.category}`;
    const existing = categoryMap.get(catKey);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
    } else {
      categoryMap.set(catKey, { bucket: exp.bucket, total: amt, count: 1 });
    }

    if (!largestExpense || amt > largestExpense.amount) {
      largestExpense = exp;
    }
  }

  const buckets = {} as Record<BucketType, BucketMetrics>;
  for (const b of BUCKETS) {
    const allocated = allocatedMap[b];
    const spent = roundMoney(spentMap[b]);
    const remaining = roundMoney(allocated - spent);
    const utilizationPct = allocated > 0 ? roundMoney((spent / allocated) * 100) : spent > 0 ? 100 : 0;

    buckets[b] = {
      bucket: b,
      splitPercent: split[b],
      allocated,
      spent,
      paidSpent: roundMoney(paidMap[b]),
      scheduledSpent: roundMoney(scheduledMap[b]),
      remaining,
      utilizationPct,
      isOverBudget: remaining < 0,
      transactionCount: countMap[b],
    };
  }

  const totalSpent = roundMoney(spentMap.mandatory + spentMap.fun + spentMap.savings);
  const paidSpent = roundMoney(paidMap.mandatory + paidMap.fun + paidMap.savings);
  const scheduledSpent = roundMoney(scheduledMap.mandatory + scheduledMap.fun + scheduledMap.savings);
  const totalRemaining = roundMoney(totalIncome - totalSpent);

  const savingsAllocated = buckets.savings.allocated;
  const savingsActual = buckets.savings.spent;
  const effectiveSavingsRatePct = totalIncome > 0 ? roundMoney((savingsAllocated / totalIncome) * 100) : 0;
  // Total wealth kept: savings allocation + any unspent mandatory/fun surplus (or minus overspend)
  const netSavedOrLeft = roundMoney(savingsAllocated + Math.min(0, buckets.mandatory.remaining) + Math.min(0, buckets.fun.remaining));
  const savingsRatePct = totalIncome > 0 ? roundMoney((Math.max(0, netSavedOrLeft) / totalIncome) * 100) : 0;

  // Burn rate based on mandatory + fun consumption (non-savings spending) or total fees cut
  const burnRatePerDay = daysElapsed > 0 ? roundMoney(totalSpent / daysElapsed) : 0;
  const projectedTotalSpent =
    daysRemaining > 0 ? roundMoney(burnRatePerDay * daysInMonth) : totalSpent;
  const projectedEndBalance = roundMoney(totalIncome - projectedTotalSpent);

  const safeDailyFunSpend =
    daysRemaining > 0 ? roundMoney(Math.max(0, buckets.fun.remaining) / daysRemaining) : 0;

  // Categories pivot
  const categories: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([key, val]) => {
      const category = key.split('::')[1] || 'Uncategorized';
      const bucketAllocated = buckets[val.bucket].allocated;
      return {
        category,
        bucket: val.bucket,
        total: roundMoney(val.total),
        count: val.count,
        average: roundMoney(val.total / val.count),
        pctOfBucket: bucketAllocated > 0 ? roundMoney((val.total / bucketAllocated) * 100) : 0,
        pctOfIncome: totalIncome > 0 ? roundMoney((val.total / totalIncome) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Daily cumulative burn-down series
  const dailyBuckets: Record<number, { total: number; mandatory: number; fun: number; savings: number }> = {};
  for (const exp of month.expenses) {
    const dayPart = Number(exp.date.split('-')[2]);
    const day = dayPart >= 1 && dayPart <= daysInMonth ? dayPart : 1;
    if (!dailyBuckets[day]) {
      dailyBuckets[day] = { total: 0, mandatory: 0, fun: 0, savings: 0 };
    }
    const amt = Math.max(0, Number(exp.amount) || 0);
    dailyBuckets[day].total += amt;
    dailyBuckets[day][exp.bucket] += amt;
  }

  const dailySeries: DailyPoint[] = [];
  let cumTotal = 0;
  let cumMandatory = 0;
  let cumFun = 0;
  let cumSavings = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = dailyBuckets[day];
    const dailySpent = d ? roundMoney(d.total) : 0;
    cumTotal = roundMoney(cumTotal + dailySpent);
    cumMandatory = roundMoney(cumMandatory + (d ? d.mandatory : 0));
    cumFun = roundMoney(cumFun + (d ? d.fun : 0));
    cumSavings = roundMoney(cumSavings + (d ? d.savings : 0));

    dailySeries.push({
      day,
      date: `${month.monthKey}-${String(day).padStart(2, '0')}`,
      dailySpent,
      cumulativeSpent: cumTotal,
      remainingBudget: roundMoney(totalIncome - cumTotal),
      mandatoryCum: cumMandatory,
      funCum: cumFun,
      savingsCum: cumSavings,
    });
  }

  return {
    monthKey: month.monthKey,
    totalIncome,
    salaryIncome,
    extraIncome,
    totalSpent,
    paidSpent,
    scheduledSpent,
    totalRemaining,
    savingsAllocated,
    savingsActual,
    savingsRatePct,
    effectiveSavingsRatePct,
    burnRatePerDay,
    projectedEndBalance,
    safeDailyFunSpend,
    daysElapsed,
    daysRemaining,
    daysInMonth,
    buckets,
    categories,
    dailySeries,
    largestExpense,
    topCategory: categories[0] ?? null,
  };
}

export function calculateMultiMonthTrends(months: Record<string, MonthData>): MultiMonthPoint[] {
  const keys = Object.keys(months).sort();
  return keys.map((key) => {
    const summary = calculateMonthSummary(months[key]);
    return {
      monthKey: key,
      label: getMonthLabel(key),
      income: summary.totalIncome,
      mandatory: summary.buckets.mandatory.spent,
      fun: summary.buckets.fun.spent,
      savings: summary.buckets.savings.spent,
      totalSpent: summary.totalSpent,
      netLeft: summary.totalRemaining,
    };
  });
}

export function cloneRecurringForNewMonth(
  sourceMonth: MonthData,
  targetMonthKey: string
): MonthData {
  const newDayDate = (oldDate: string) => {
    const day = Math.min(28, Math.max(1, Number(oldDate.split('-')[2]) || 1));
    return `${targetMonthKey}-${String(day).padStart(2, '0')}`;
  };

  const incomes = sourceMonth.incomes
    .filter((i) => i.recurring)
    .map((i) => ({
      ...i,
      id: `inc_${crypto.randomUUID().slice(0, 8)}`,
      date: newDayDate(i.date),
    }));

  const expenses = sourceMonth.expenses
    .filter((e) => e.recurring)
    .map((e) => ({
      ...e,
      id: `exp_${crypto.randomUUID().slice(0, 8)}`,
      date: newDayDate(e.date),
      status: 'scheduled' as const,
    }));

  return {
    monthKey: targetMonthKey,
    split: { ...sourceMonth.split },
    incomes,
    expenses,
  };
}
