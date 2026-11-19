import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { BUCKET_META, BucketType, CurrencyConfig, MonthSummary } from '../types/finance';
import { formatMoney, formatPercent } from '../lib/format';
import { BUCKETS } from '../lib/calculations';

interface TopSummaryBarProps {
  summary: MonthSummary;
  currency: CurrencyConfig;
  selectedBucketFilter: BucketType | 'all';
  onSelectBucketFilter: (bucket: BucketType | 'all') => void;
}

const BUCKET_ICONS: Record<BucketType, React.ComponentType<{ className?: string }>> = {
  mandatory: ShieldCheck,
  fun: Sparkles,
  savings: PiggyBank,
};

export const TopSummaryBar: React.FC<TopSummaryBarProps> = ({
  summary,
  currency,
  selectedBucketFilter,
  onSelectBucketFilter,
}) => {
  return (
    <section className="space-y-3">
      {/* Top 4 Global KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] px-4 py-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Income</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-white tabular-nums">
            {formatMoney(summary.totalIncome, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            Salary {formatMoney(summary.salaryIncome, currency)} · Extra {formatMoney(summary.extraIncome, currency)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] px-4 py-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Fees Cut</span>
            <ArrowDownRight className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-rose-300 tabular-nums">
            {formatMoney(summary.totalSpent, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            Paid {formatMoney(summary.paidSpent, currency)} · Sched {formatMoney(summary.scheduledSpent, currency)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] px-4 py-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Remaining</span>
            <TrendingUp className={`h-4 w-4 ${summary.totalRemaining >= 0 ? 'text-sky-400' : 'text-rose-400'}`} />
          </div>
          <div
            className={`mt-1 text-xl font-bold tracking-tight tabular-nums ${
              summary.totalRemaining >= 0 ? 'text-sky-300' : 'text-rose-400'
            }`}
          >
            {formatMoney(summary.totalRemaining, currency)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            {summary.totalIncome > 0
              ? `${formatPercent((summary.totalRemaining / summary.totalIncome) * 100)} of income unspent`
              : 'Add salary to begin'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] px-4 py-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Safe Daily Fun</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-purple-300 tabular-nums">
            {formatMoney(summary.safeDailyFunSpend, currency)}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            {summary.daysRemaining > 0
              ? `${summary.daysRemaining} days left · Savings rate ${formatPercent(summary.effectiveSavingsRatePct, 0)}`
              : `Month ended · Burn ${formatMoney(summary.burnRatePerDay, currency)}/d`}
          </div>
        </div>
      </div>

      {/* 3 Core Bucket Cards (Clickable to filter tables!) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {BUCKETS.map((bucketKey) => {
          const b = summary.buckets[bucketKey];
          const meta = BUCKET_META[bucketKey];
          const Icon = BUCKET_ICONS[bucketKey];
          const isSelected = selectedBucketFilter === bucketKey;
          const clampedPct = Math.min(100, Math.max(0, b.utilizationPct));

          let barColor = meta.color;
          if (b.isOverBudget) {
            barColor = '#fb7185';
          } else if (bucketKey !== 'savings' && b.utilizationPct >= 85) {
            barColor = '#f59e0b';
          }

          return (
            <button
              key={bucketKey}
              type="button"
              onClick={() => onSelectBucketFilter(isSelected ? 'all' : bucketKey)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${
                isSelected
                  ? `border-slate-500 bg-[#152036] ring-1 ring-inset ring-white/15`
                  : b.isOverBudget
                  ? 'border-rose-500/50 bg-[#1a1120] hover:border-rose-400/70'
                  : 'border-slate-800/90 bg-[#0f1624] hover:border-slate-700 hover:bg-[#131c2e]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bgClass}`}>
                    <Icon className={`h-4 w-4 ${meta.textClass}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">{meta.label}</h3>
                      <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${meta.badgeClass}`}>
                        {b.splitPercent}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {b.transactionCount} {b.transactionCount === 1 ? 'entry' : 'entries'}
                      {isSelected ? ' · Filtered' : ''}
                    </p>
                  </div>
                </div>

                {b.isOverBudget && (
                  <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    <AlertTriangle className="h-3 w-3" /> OVER
                  </span>
                )}
              </div>

              {/* Numbers Row */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-800/70 pt-3">
                <div>
                  <div className="text-[10px] font-medium uppercase text-slate-500">Allocated</div>
                  <div className="text-sm font-semibold text-slate-200 tabular-nums">
                    {formatMoney(b.allocated, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase text-slate-500">Cut / Spent</div>
                  <div className="text-sm font-semibold text-slate-300 tabular-nums">
                    {formatMoney(b.spent, currency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-medium uppercase text-slate-500">Remaining</div>
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      b.isOverBudget ? 'text-rose-400' : meta.textClass
                    }`}
                  >
                    {formatMoney(b.remaining, currency)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-slate-400 tabular-nums">
                  <span>{formatPercent(b.utilizationPct, 1)} used</span>
                  <span>
                    {b.isOverBudget
                      ? `${formatMoney(Math.abs(b.remaining), currency)} over limit`
                      : `${formatPercent(Math.max(0, 100 - b.utilizationPct), 1)} left`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${clampedPct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
