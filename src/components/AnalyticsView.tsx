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
  Activity,
  Award,
  Flame,
  PieChart as PieChartIcon,
  Target,
  TrendingUp,
} from 'lucide-react';
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

const CATEGORY_COLORS = [
  '#38bdf8',
  '#c084fc',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#818cf8',
  '#2dd4bf',
  '#f97316',
  '#a3e635',
  '#e879f9',
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
        Allocated: summary.buckets[b].allocated,
        Cut: summary.buckets[b].spent,
        Remaining: Math.max(0, summary.buckets[b].remaining),
        color: BUCKET_META[b].color,
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

  const sortedCategories = useMemo(() => {
    return [...summary.categories].sort((a, b) => b[catSort] - a[catSort]);
  }, [summary.categories, catSort]);

  const tooltipStyle = {
    backgroundColor: '#0c1220',
    border: '1px solid #334155',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#f1f5f9',
  };

  return (
    <div className="space-y-4">
      {/* Top 5 Financial Intelligence KPI Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>SAVINGS ALLOCATION</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-400 tabular-nums">
            {formatPercent(summary.effectiveSavingsRatePct, 1)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            {formatMoney(summary.savingsAllocated, currency)} target · {formatMoney(summary.savingsActual, currency)} moved
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>DAILY BURN RATE</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-100 tabular-nums">
            {formatMoney(summary.burnRatePerDay, currency)}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            Across {summary.daysElapsed} elapsed days
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>PROJECTED END BAL</span>
            <TrendingUp
              className={`h-4 w-4 ${
                summary.projectedEndBalance >= 0 ? 'text-sky-400' : 'text-rose-400'
              }`}
            />
          </div>
          <div
            className={`mt-1 text-xl font-bold tabular-nums ${
              summary.projectedEndBalance >= 0 ? 'text-sky-300' : 'text-rose-400'
            }`}
          >
            {formatMoney(summary.projectedEndBalance, currency, true)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            At current daily spending pace
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>LARGEST SINGLE FEE</span>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-rose-300 tabular-nums">
            {summary.largestExpense
              ? formatMoney(summary.largestExpense.amount, currency)
              : formatMoney(0, currency)}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">
            {summary.largestExpense ? summary.largestExpense.title : 'No fees yet'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>TOP CATEGORY</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-1 truncate text-lg font-bold text-purple-300">
            {summary.topCategory ? summary.topCategory.category : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            {summary.topCategory
              ? `${formatMoney(summary.topCategory.total, currency)} (${formatPercent(summary.topCategory.pctOfIncome)} of income)`
              : 'No data'}
          </div>
        </div>
      </div>

      {/* Row 1 of Charts: Bucket Allocated vs Cut + Breakdown Donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Bucket Allocation vs. Actual Fees Cut
              </h3>
              <p className="text-[11px] text-slate-400">
                Compare target income split against what you actually spent per bucket
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketComparisonData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currency.symbol}${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatMoney(value, currency)}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Allocated" fill="#38bdf8" radius={[6, 6, 0, 0]} maxBarSize={44} />
                <Bar dataKey="Cut" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={44} />
                <Bar dataKey="Remaining" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Spending Distribution
              </h3>
            </div>
            <div className="flex rounded-lg bg-slate-950 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setPieMode('bucket')}
                className={`rounded-md px-2 py-0.5 font-medium transition ${
                  pieMode === 'bucket' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                By Bucket
              </button>
              <button
                type="button"
                onClick={() => setPieMode('category')}
                className={`rounded-md px-2 py-0.5 font-medium transition ${
                  pieMode === 'category' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                By Category
              </button>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-500">
              Add expenses to visualize distribution
            </div>
          ) : (
            <div className="grid h-64 grid-cols-12 items-center gap-2">
              <div className="col-span-7 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="#0f1624" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => formatMoney(value, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="col-span-5 space-y-1.5 overflow-y-auto pr-1 text-[11px]">
                {pieData.map((d) => {
                  const pct = summary.totalSpent > 0 ? (d.value / summary.totalSpent) * 100 : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="truncate">{d.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-slate-400 tabular-nums">
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

      {/* Row 2 of Charts: Daily Burn-Down + Multi-Month Trends */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4 lg:col-span-6">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Daily Cashflow Burn-Down Curve
            </h3>
            <p className="text-[11px] text-slate-400">
              Remaining monthly budget vs. cumulative fees cut across days 1–{summary.daysInMonth}
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.dailySeries}>
                <defs>
                  <linearGradient id="remGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
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
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#remGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeSpent"
                  name="Cumulative Fees Cut"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fill="url(#spentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4 lg:col-span-6">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Multi-Month Income & Bucket Trends
            </h3>
            <p className="text-[11px] text-slate-400">
              Track income growth and bucket spending consistency across months
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiMonthTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${currency.symbol}${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatMoney(value, currency)}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="income" name="Income" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="mandatory" name="Mandatory" stackId="a" fill="#38bdf8" maxBarSize={26} />
                <Bar dataKey="fun" name="Fun" stackId="a" fill="#c084fc" maxBarSize={26} />
                <Bar dataKey="savings" name="Savings/Debt" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table 1: Bucket Variance Analytics Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0f1624]">
        <div className="border-b border-slate-800/80 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Bucket Variance Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0c1220] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2">Bucket</th>
                <th className="px-4 py-2 text-right">Target %</th>
                <th className="px-4 py-2 text-right">Allocated</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2 text-right">Scheduled</th>
                <th className="px-4 py-2 text-right">Total Cut</th>
                <th className="px-4 py-2 text-right">Variance / Left</th>
                <th className="px-4 py-2 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {BUCKETS.map((bKey: BucketType) => {
                const m = summary.buckets[bKey];
                const meta = BUCKET_META[bKey];
                return (
                  <tr key={bKey} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-300">{m.splitPercent}%</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                      {formatMoney(m.allocated, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                      {formatMoney(m.paidSpent, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-300/90">
                      {formatMoney(m.scheduledSpent, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-300">
                      -{formatMoney(m.spent, currency)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-bold ${
                        m.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatMoney(m.remaining, currency, true)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="ml-auto flex w-28 items-center justify-end gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, m.utilizationPct)}%`,
                              backgroundColor: m.isOverBudget ? '#fb7185' : meta.color,
                            }}
                          />
                        </div>
                        <span className="w-11 font-mono text-[11px] text-slate-300">
                          {formatPercent(m.utilizationPct, 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Category Pivot Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0f1624]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Category Breakdown Pivot Table
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Sort by:</span>
            {(['total', 'count', 'average', 'pctOfIncome'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setCatSort(k)}
                className={`rounded-md px-2 py-0.5 font-medium transition ${
                  catSort === k ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {k === 'total' ? 'Total Cut' : k === 'count' ? 'Txns' : k === 'average' ? 'Avg' : '% Income'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0c1220] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Bucket</th>
                <th className="px-4 py-2 text-right">Entries</th>
                <th className="px-4 py-2 text-right">Average Fee</th>
                <th className="px-4 py-2 text-right">% of Bucket</th>
                <th className="px-4 py-2 text-right">% of Income</th>
                <th className="px-4 py-2 text-right">Total Cut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No category spending recorded for this month.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((cat) => {
                  const meta = BUCKET_META[cat.bucket];
                  return (
                    <tr key={`${cat.bucket}-${cat.category}`} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2 font-medium text-slate-100">{cat.category}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}>
                          {meta.shortLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-300">{cat.count}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-300">
                        {formatMoney(cat.average, currency)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">
                        {formatPercent(cat.pctOfBucket, 1)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="ml-auto flex w-28 items-center justify-end gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, cat.pctOfIncome * 2)}%`,
                                backgroundColor: meta.color,
                              }}
                            />
                          </div>
                          <span className="w-11 font-mono text-[11px] text-slate-300">
                            {formatPercent(cat.pctOfIncome, 1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-rose-300">
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
    </div>
  );
};
