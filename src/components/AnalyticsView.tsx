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
  BUCKET_COLORS,
  BucketConfig,
  CurrencyConfig,
  MonthSummary,
  MultiMonthPoint,
  getBucketTheme,
} from '../types/finance';
import { formatMoney, formatPercent } from '../lib/format';

interface AnalyticsViewProps {
  buckets: BucketConfig[];
  summary: MonthSummary;
  multiMonthTrends: MultiMonthPoint[];
  currency: CurrencyConfig;
}

const CHART_PALETTE = [
  '#dc2626',
  '#eab308',
  '#16a34a',
  '#2563eb',
  '#ea580c',
  '#9333ea',
  '#0d9488',
  '#db2777',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  buckets,
  summary,
  multiMonthTrends,
  currency,
}) => {
  const [pieMode, setPieMode] = useState<'bucket' | 'category'>('bucket');
  const [catSort, setCatSort] = useState<'total' | 'count' | 'average' | 'pctOfIncome'>('total');

  const bucketComparisonData = useMemo(
    () =>
      summary.buckets.map((b) => ({
        name: b.name,
        Budget: b.allocated,
        Cut: b.spent,
        Remaining: Math.max(0, b.remaining),
      })),
    [summary]
  );

  const pieData = useMemo(() => {
    if (pieMode === 'bucket') {
      return summary.buckets
        .map((b) => ({
          name: b.name,
          value: b.spent,
          color: BUCKET_COLORS[b.color]?.hex || '#16a34a',
        }))
        .filter((d) => d.value > 0);
    }
    return summary.categories.slice(0, 8).map((c, i) => ({
      name: c.category,
      value: c.total,
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
  }, [pieMode, summary]);

  const multiMonthChartData = useMemo(() => {
    return multiMonthTrends.map((pt) => {
      const row: Record<string, string | number> = {
        label: pt.label,
        Income: pt.income,
      };
      for (const b of buckets) {
        row[b.name] = pt.byBucket[b.id] || 0;
      }
      return row;
    });
  }, [multiMonthTrends, buckets]);

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
        <div className="overflow-x-auto">
          <table className="excel-table text-xs tabular-nums">
            <thead>
              <tr className="bg-neutral-100 text-[11px] font-bold text-neutral-600">
                <th className="px-3 py-1.5 text-left">Gross Income</th>
                <th className="px-3 py-1.5 text-left">Salary Cuts (-)</th>
                <th className="px-3 py-1.5 text-left">Net Income</th>
                <th className="px-3 py-1.5 text-left">Total Expenses Cut</th>
                <th className="px-3 py-1.5 text-left">Total Remaining</th>
                <th className="px-3 py-1.5 text-left">Daily Burn</th>
                <th className="px-3 py-1.5 text-left">Projected Month End</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2.5 font-mono text-sm font-bold text-neutral-800">
                  {formatMoney(summary.grossIncome, currency)}
                </td>
                <td className="bg-red-50 px-3 py-2.5 font-mono text-sm font-bold text-red-700">
                  -{formatMoney(summary.salaryCuts, currency)}
                </td>
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
                <td className="bg-yellow-50 px-3 py-2.5 font-mono text-sm font-bold text-yellow-900">
                  {formatMoney(summary.burnRatePerDay, currency)}/d
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
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="border border-neutral-300 bg-white lg:col-span-7">
          <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
            Budget Allocated vs. Fees Cut (Per Split)
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
            Multi-Month History (Net Income & Buckets)
          </div>
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiMonthChartData}>
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
                <Bar dataKey="Income" fill="#15803d" maxBarSize={24} />
                {buckets.map((b) => (
                  <Bar
                    key={b.id}
                    dataKey={b.name}
                    stackId="a"
                    fill={BUCKET_COLORS[b.color]?.hex || '#16a34a'}
                    maxBarSize={24}
                  />
                ))}
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
              <th className="px-3 py-1.5 text-right">% of Net Income</th>
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
                const theme = getBucketTheme(cat.bucketColor);
                return (
                  <tr key={`${cat.bucketId}-${cat.category}`} className="hover:bg-yellow-50/40">
                    <td className="bg-neutral-50 text-center font-mono text-[11px] text-neutral-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-neutral-900">{cat.category}</td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${theme.badgeClass}`}>
                        {cat.bucketName}
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
