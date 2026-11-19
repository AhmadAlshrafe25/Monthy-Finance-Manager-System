import {
  BucketConfig,
  BucketMetrics,
  CategorySummary,
  DailyPoint,
  ExpenseEntry,
  MonthData,
  MonthSummary,
  MultiMonthPoint,
} from '../types/finance';

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

export function normalizeBucketsSplit(buckets: BucketConfig[]): BucketConfig[] {
  if (buckets.length === 0) return [];
  const total = buckets.reduce((sum, b) => sum + Math.max(0, b.splitPercent), 0);
  if (total === 100) return buckets;
  if (total <= 0) {
    const even = Math.floor(100 / buckets.length);
    const rem = 100 - even * buckets.length;
    return buckets.map((b, i) => ({
      ...b,
      splitPercent: even + (i === 0 ? rem : 0),
    }));
  }

  let running = 0;
  return buckets.map((b, idx) => {
    if (idx === buckets.length - 1) {
      return { ...b, splitPercent: Math.max(0, 100 - running) };
    }
    const pct = Math.round((Math.max(0, b.splitPercent) / total) * 100);
    running += pct;
    return { ...b, splitPercent: pct };
  });
}

export function calculateAllocatedByBucket(month: MonthData): Record<string, number> {
  const allocated: Record<string, number> = {};
  for (const b of month.buckets) {
    allocated[b.id] = 0;
  }

  if (month.buckets.length === 0) return allocated;

  const totalPct = month.buckets.reduce((s, b) => s + Math.max(0, b.splitPercent), 0);
  const divisor = totalPct > 0 ? totalPct : 100;

  for (const income of month.incomes) {
    // Allow negative numbers naturally (e.g. -35 for salary cuts/deductions)
    const amt = Number(income.amount) || 0;
    if (income.allocationMode === 'split' || allocated[income.allocationMode] === undefined) {
      for (const b of month.buckets) {
        const share = totalPct > 0 ? Math.max(0, b.splitPercent) / divisor : 1 / month.buckets.length;
        allocated[b.id] += amt * share;
      }
    } else {
      allocated[income.allocationMode] += amt;
    }
  }

  for (const id of Object.keys(allocated)) {
    allocated[id] = roundMoney(allocated[id]);
  }
  return allocated;
}

export function calculateMonthSummary(month: MonthData, referenceDate: Date = new Date()): MonthSummary {
  const daysInMonth = getDaysInMonth(month.monthKey);

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
  }

  // Income totals (positive inflows & negative salary cuts)
  let totalIncome = 0;
  let grossIncome = 0;
  let salaryIncome = 0;
  let extraIncome = 0;
  let salaryCuts = 0;

  for (const inc of month.incomes) {
    const amt = Number(inc.amount) || 0;
    totalIncome += amt;
    if (amt < 0) {
      salaryCuts += Math.abs(amt);
    } else {
      grossIncome += amt;
      if (inc.type === 'salary') salaryIncome += amt;
      else extraIncome += amt;
    }
  }

  totalIncome = roundMoney(totalIncome);
  grossIncome = roundMoney(grossIncome);
  salaryIncome = roundMoney(salaryIncome);
  extraIncome = roundMoney(extraIncome);
  salaryCuts = roundMoney(salaryCuts);

  const allocatedMap = calculateAllocatedByBucket(month);

  const spentMap: Record<string, number> = {};
  const paidMap: Record<string, number> = {};
  const scheduledMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};
  const bucketLookup: Record<string, BucketConfig> = {};

  for (const b of month.buckets) {
    spentMap[b.id] = 0;
    paidMap[b.id] = 0;
    scheduledMap[b.id] = 0;
    countMap[b.id] = 0;
    bucketLookup[b.id] = b;
  }

  const categoryMap = new Map<string, { bucketId: string; total: number; count: number }>();
  let largestExpense: ExpenseEntry | null = null;
  let totalSpent = 0;
  let paidSpent = 0;
  let scheduledSpent = 0;

  for (const exp of month.expenses) {
    const amt = Math.max(0, Number(exp.amount) || 0);
    totalSpent += amt;
    if (exp.status === 'paid') paidSpent += amt;
    else scheduledSpent += amt;

    if (spentMap[exp.bucket] !== undefined) {
      spentMap[exp.bucket] += amt;
      countMap[exp.bucket] += 1;
      if (exp.status === 'paid') paidMap[exp.bucket] += amt;
      else scheduledMap[exp.bucket] += amt;
    }

    const catKey = `${exp.bucket}::${exp.category || 'General'}`;
    const existing = categoryMap.get(catKey);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
    } else {
      categoryMap.set(catKey, { bucketId: exp.bucket, total: amt, count: 1 });
    }

    if (!largestExpense || amt > largestExpense.amount) {
      largestExpense = exp;
    }
  }

  totalSpent = roundMoney(totalSpent);
  paidSpent = roundMoney(paidSpent);
  scheduledSpent = roundMoney(scheduledSpent);
  const totalRemaining = roundMoney(totalIncome - totalSpent);

  const buckets: BucketMetrics[] = month.buckets.map((b) => {
    const allocated = allocatedMap[b.id] ?? 0;
    const spent = roundMoney(spentMap[b.id] ?? 0);
    const remaining = roundMoney(allocated - spent);
    const utilizationPct =
      allocated > 0 ? roundMoney((spent / allocated) * 100) : spent > 0 ? 100 : 0;

    return {
      bucketId: b.id,
      name: b.name,
      color: b.color,
      splitPercent: b.splitPercent,
      allocated,
      spent,
      paidSpent: roundMoney(paidMap[b.id] ?? 0),
      scheduledSpent: roundMoney(scheduledMap[b.id] ?? 0),
      remaining,
      utilizationPct,
      isOverBudget: remaining < 0,
      transactionCount: countMap[b.id] ?? 0,
    };
  });

  const bucketMap: Record<string, BucketMetrics> = {};
  for (const bm of buckets) {
    bucketMap[bm.bucketId] = bm;
  }

  const burnRatePerDay = daysElapsed > 0 ? roundMoney(totalSpent / daysElapsed) : 0;
  const projectedTotalSpent =
    daysRemaining > 0 ? roundMoney(burnRatePerDay * daysInMonth) : totalSpent;
  const projectedEndBalance = roundMoney(totalIncome - projectedTotalSpent);

  const categories: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([key, val]) => {
      const category = key.split('::')[1] || 'General';
      const bCfg = bucketLookup[val.bucketId];
      const bucketAllocated = bucketMap[val.bucketId]?.allocated ?? 0;
      return {
        category,
        bucketId: val.bucketId,
        bucketName: bCfg?.name || val.bucketId,
        bucketColor: bCfg?.color || 'green',
        total: roundMoney(val.total),
        count: val.count,
        average: roundMoney(val.total / val.count),
        pctOfBucket: bucketAllocated > 0 ? roundMoney((val.total / bucketAllocated) * 100) : 0,
        pctOfIncome: totalIncome > 0 ? roundMoney((val.total / totalIncome) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Daily cumulative burn-down
  const dailyMap: Record<number, number> = {};
  for (const exp of month.expenses) {
    const dayPart = Number(exp.date.split('-')[2]);
    const day = dayPart >= 1 && dayPart <= daysInMonth ? dayPart : 1;
    dailyMap[day] = (dailyMap[day] || 0) + Math.max(0, Number(exp.amount) || 0);
  }

  const dailySeries: DailyPoint[] = [];
  let cum = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dailySpent = roundMoney(dailyMap[day] || 0);
    cum = roundMoney(cum + dailySpent);
    dailySeries.push({
      day,
      date: `${month.monthKey}-${String(day).padStart(2, '0')}`,
      dailySpent,
      cumulativeSpent: cum,
      remainingBudget: roundMoney(totalIncome - cum),
    });
  }

  return {
    monthKey: month.monthKey,
    totalIncome,
    grossIncome,
    salaryIncome,
    extraIncome,
    salaryCuts,
    totalSpent,
    paidSpent,
    scheduledSpent,
    totalRemaining,
    burnRatePerDay,
    projectedEndBalance,
    daysElapsed,
    daysRemaining,
    daysInMonth,
    buckets,
    bucketMap,
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
    const byBucket: Record<string, number> = {};
    for (const b of summary.buckets) {
      byBucket[b.bucketId] = b.spent;
    }
    return {
      monthKey: key,
      label: getMonthLabel(key),
      income: summary.totalIncome,
      totalSpent: summary.totalSpent,
      netLeft: summary.totalRemaining,
      byBucket,
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
    buckets: sourceMonth.buckets.map((b) => ({ ...b })),
    incomes,
    expenses,
  };
}
