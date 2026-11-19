import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BUCKET_META,
  BucketType,
  CurrencyConfig,
  MonthSummary,
  MultiMonthPoint,
} from '../types/finance';
import { BUCKETS } from '../lib/calculations';
import { formatMoney, formatPercent } from '../lib/format';

interface AnalyticsViewProps {
  summary: MonthSummary;
  multiMonthTrends: MultiMonthPoint[];
  currency: CurrencyConfig;
}

// Strict Red / Yellow / Green palette shades only
const CATEGORY_COLORS = [
  '#dc2626',
  '#eab308',
  '#16a34a',
  '#ef4444',
  '#ca8a04',
  '#22c55e',
  '#b91c1c',
  '#facc15',
  '#15803d',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  summary,
  multiMonthTrends,
  currency,
}) => {
  const [pieMode, setPieMode] = useState<'bucket' | 'category'>('bucket');
  const [catSort, setCatSort] = useState<'total' | 'count' | 'average' | 'pctOfIncome'>('total');

  const bucketComparisonData = useMemo(
    () =>
      BUCKETS.map((b) => ({
        name: BUCKET_META[b].shortLabel,
        Budget: summary.buckets[b].allocated,
        Cut: summary.buckets[b].spent,
        Remaining: Math.max(0, summary.buckets[b].remaining),
      })),
    [summary]
  );

  const pieData = useMemo(() => {
    if (pieMode === 'bucket') {
      return BUCKETS.map((b) => ({
        name: BUCKET_META[b].label,
        value: summary.buckets[b].spent,
        color: BUCKET_META[b].color,
      })).filter((d) => d.value > 0);
    }
    return summary.categories.slice(0, 8).map((c, i) => ({
      name: c.category,
      value: c.total,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [pieMode, summary]);

  const sortedCategories = useMemo(
    () => [...summary.categories].sort((a, b) => b[catSort] - a[catSort]),
    [summary.categories, catSort]
  );

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #d4d4d8',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#171717',
  };

  return (
    <div className="space-y-4">
      {/* Top KPI Summary Excel Strip */}
      <div className="overflow-hidden border border-neutral-300 bg-white">
        <div className="border-b border-neutral-300 bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-green-900">
          Monthly Financial Indicators
        </div>
        <table className="excel-table text-xs tabular-nums">
          <thead>
            <tr className="bg-neutral-100 text-[11px] font-bold text-neutral-600">
              <th className="px-3 py-1.5 text-left">Total Income</th>
              <th className="px-3 py-1.5 text-left">Total Fees Cut</th>
              <th className="px-3 py-1.5 text-left">Total Remaining</th>
              <th className="px-3 py-1.5 text-left">Savings Rate</th>
              <th className="px-3 py-1.5 text-left">Daily Burn Rate</th>
              <th className="px-3 py-1.5 text-left">Safe Daily Fun</th>
              <th className="px-3 py-1.5 text-left">Projected Month End</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bg-green-50 px-3 py-2.5 font-mono text-sm font-bold text-green-800">
                {formatMoney(summary.totalIncome, currency)}
              </td>
              <td className="bg-red-50 px-3 py-2.5 font-mono text-sm font-bold text-red-700">
                -{formatMoney(summary.totalSpent, currency)}
              </td>
              <td
                className={`px-3 py-2.5 font-mono text-sm font-bold ${
                  summary.totalRemaining >= 0
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {formatMoney(summary.totalRemaining, currency)}
              </td>
              <td className="px-3 py-2.5 font-mono text-sm font-bold text-green-700">
                {formatPercent(summary.effectiveSavingsRatePct, 1)}
              </td>
              <td className="bg-yellow-50 px-3 py-2.5 font-mono text-sm font-bold text-yellow-900">
                {formatMoney(summary.burnRatePerDay, currency)}/d
              </td>
              <td className="bg-yellow-50 px-3 py-2.5 font-mono text-sm font-bold text-yellow-900">
                {formatMoney(summary.safeDailyFunSpend, currency)}/d
              </td>
              <td
                className={`px-3 py-2.5 font-mono text-sm font-bold ${
                  summary.projectedEndBalance >= 0
                    ? 'text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {formatMoney(summary.projectedEndBalance, currency, true)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border border-neutral-300 bg-white lg:col-span-7">
          <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
            Budget Allocated vs. Fees Cut (Per Bucket)
          </div>
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketComparisonData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#525252"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currency.symbol}${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatMoney(value, currency)}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Budget" fill="#eab308" radius={[3, 3, 0, 0]} maxBarSize={42} />
                <Bar dataKey="Cut" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={42} />
                <Bar dataKey="Remaining" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-neutral-300 bg-white lg:col-span-5">
          <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-100 px-3 py-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
              Spending Breakdown
            </span>
            <div className="flex gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setPieMode('bucket')}
                className={`rounded border px-2 py-0.5 font-bold ${
                  pieMode === 'bucket'
                    ? 'border-green-700 bg-green-600 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                By Bucket
              </button>
              <button
                type="button"
                onClick={() => setPieMode('category')}
                className={`rounded border px-2 py-0.5 font-bold ${
                  pieMode === 'category'
                    ? 'border-green-700 bg-green-600 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                By Category
              </button>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-neutral-500">
              Add expenses to see breakdown chart
            </div>
          ) : (
            <div className="grid h-64 grid-cols-12 items-center gap-2 p-3">
              <div className="col-span-7 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => formatMoney(value, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="col-span-5 space-y-1.5 overflow-y-auto pr-1 text-xs">
                {pieData.map((d) => {
                  const pct = summary.totalSpent > 0 ? (d.value / summary.totalSpent) * 100 : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-neutral-800">
                        <span
                          className="h-2.5 w-2.5 shrink-0 border border-neutral-300"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="truncate font-medium">{d.name}</span>
                      </span>
                      <span className="shrink-0 font-mono font-bold text-neutral-700 tabular-nums">
                        {formatPercent(pct, 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border border-neutral-300 bg-white lg:col-span-6">
          <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
            Daily Remaining Budget vs. Cumulative Fees Cut
          </div>
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#525252"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currency.symbol}${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(day) => `Day ${day}`}
                  formatter={(value: number) => formatMoney(value, currency)}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="remainingBudget"
                  name="Remaining Budget"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="#dcfce7"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeSpent"
                  name="Cumulative Cut"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="#fee2e2"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-neutral-300 bg-white lg:col-span-6">
          <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
            Multi-Month History (Income & Buckets)
          </div>
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiMonthTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#525252"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currency.symbol}${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatMoney(value, currency)}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="income" name="Income" fill="#15803d" maxBarSize={24} />
                <Bar dataKey="mandatory" name="Mandatory" stackId="a" fill="#dc2626" maxBarSize={24} />
                <Bar dataKey="fun" name="Fun Spending" stackId="a" fill="#eab308" maxBarSize={24} />
                <Bar dataKey="savings" name="Savings / Debt" stackId="a" fill="#22c55e" maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Pivot Excel Table */}
      <div className="overflow-hidden border border-neutral-300 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
            Category Breakdown Pivot Table
          </span>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-neutral-500">Sort:</span>
            {(['total', 'count', 'average', 'pctOfIncome'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setCatSort(k)}
                className={`rounded border px-2 py-0.5 font-bold ${
                  catSort === k
                    ? 'border-green-700 bg-green-600 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                {k === 'total' ? 'Total Cut' : k === 'count' ? 'Entries' : k === 'average' ? 'Avg' : '% Income'}
              </button>
            ))}
          </div>
        </div>

        <table className="excel-table text-xs tabular-nums">
          <thead>
            <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-600">
              <th className="w-10 py-1.5 text-center">#</th>
              <th className="px-3 py-1.5 text-left">Category</th>
              <th className="px-3 py-1.5 text-left">Bucket</th>
              <th className="px-3 py-1.5 text-right">Count</th>
              <th className="px-3 py-1.5 text-right">Average</th>
              <th className="px-3 py-1.5 text-right">% of Bucket</th>
              <th className="px-3 py-1.5 text-right">% of Income</th>
              <th className="px-3 py-1.5 text-right">Total Cut</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-neutral-500">
                  No category spending yet.
                </td>
              </tr>
            ) : (
              sortedCategories.map((cat, idx) => {
                const meta = BUCKET_META[cat.bucket as BucketType];
                return (
                  <tr key={`${cat.bucket}-${cat.category}`} className="hover:bg-yellow-50/40">
                    <td className="bg-neutral-50 text-center font-mono text-[11px] text-neutral-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-neutral-900">{cat.category}</td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}>
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">{cat.count}</td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {formatMoney(cat.average, currency)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {formatPercent(cat.pctOfBucket, 1)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {formatPercent(cat.pctOfIncome, 1)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-red-700">
                      -{formatMoney(cat.total, currency)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
