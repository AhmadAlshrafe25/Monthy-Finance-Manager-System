import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  AllocationMode,
  BUCKET_META,
  BucketSplit,
  BucketType,
  CurrencyConfig,
  IncomeEntry,
  IncomeType,
  MonthSummary,
  SPLIT_PRESETS,
} from '../types/finance';
import { BUCKETS } from '../lib/calculations';
import { formatMoney, formatPercent, getDefaultDateForMonth } from '../lib/format';

interface SalaryAndSplitSheetProps {
  monthKey: string;
  incomes: IncomeEntry[];
  split: BucketSplit;
  summary: MonthSummary;
  currency: CurrencyConfig;
  selectedBucketFilter: BucketType | 'all';
  salaryInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelectBucketFilter: (bucket: BucketType | 'all') => void;
  onSetSalary: (amount: number) => void;
  onAddIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  onUpdateIncome: (id: string, patch: Partial<IncomeEntry>) => void;
  onDeleteIncome: (id: string) => void;
  onChangeSplit: (nextSplit: BucketSplit) => void;
}

export const SalaryAndSplitSheet: React.FC<SalaryAndSplitSheetProps> = ({
  monthKey,
  incomes,
  split,
  summary,
  currency,
  selectedBucketFilter,
  salaryInputRef,
  onSelectBucketFilter,
  onSetSalary,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onChangeSplit,
}) => {
  // Primary salary entry (if any)
  const primarySalary = useMemo(
    () => incomes.find((i) => i.type === 'salary') || null,
    [incomes]
  );

  // All other income entries (extra incomes, freelance, bonus, additional salaries)
  const extraIncomes = useMemo(
    () => incomes.filter((i) => !primarySalary || i.id !== primarySalary.id),
    [incomes, primarySalary]
  );

  // Quick-add extra income row
  const [extraTitle, setExtraTitle] = useState('');
  const [extraType, setExtraType] = useState<IncomeType>('extra');
  const [extraAlloc, setExtraAlloc] = useState<AllocationMode>('split');
  const [extraAmount, setExtraAmount] = useState('');

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(extraAmount);
    if (!extraTitle.trim() || Number.isNaN(num) || num <= 0) return;
    onAddIncome({
      date: getDefaultDateForMonth(monthKey),
      title: extraTitle.trim(),
      type: extraType,
      amount: num,
      allocationMode: extraAlloc,
      recurring: false,
    });
    setExtraTitle('');
    setExtraAmount('');
  };

  const splitSum = split.mandatory + split.fun + split.savings;
  const splitBalanced = splitSum === 100;

  const handleSplitCellChange = (bucket: BucketType, raw: string) => {
    const val = Math.max(0, Math.min(100, Number(raw) || 0));
    onChangeSplit({ ...split, [bucket]: val });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* LEFT SHEET: SALARY & EXTRA INCOME (FRONT AND CENTER!) */}
      <div className="xl:col-span-5">
        <div className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-300 bg-green-50 px-3 py-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-green-900">
              1. Salary & Extra Income (Tap any cell to edit)
            </span>
            <span className="font-mono text-xs font-bold text-green-700 tabular-nums">
              Total: {formatMoney(summary.totalIncome, currency)}
            </span>
          </div>

          <table className="excel-table text-xs">
            <thead>
              <tr className="bg-neutral-100 text-[11px] font-bold text-neutral-600">
                <th className="w-8 py-1.5 text-center">#</th>
                <th className="px-2 py-1.5 text-left">Income Source</th>
                <th className="w-24 px-2 py-1.5 text-left">Split Rule</th>
                <th className="w-32 px-2 py-1.5 text-right">Amount ({currency.symbol.trim()})</th>
                <th className="w-8 py-1.5 text-center"></th>
              </tr>
            </thead>

            <tbody>
              {/* ROW 1: BIG IMPOSSIBLE-TO-MISS MONTHLY SALARY ROW */}
              <tr className="bg-green-50/70">
                <td className="bg-green-100 text-center font-mono text-[11px] font-bold text-green-800">
                  1
                </td>
                <td className="px-2 py-1.5 font-bold text-green-950">
                  Monthly Salary
                </td>
                <td className="px-2 py-1.5 text-[11px] font-semibold text-green-800">
                  Auto Split
                </td>
                <td className="p-0">
                  <input
                    ref={salaryInputRef}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Type salary..."
                    value={primarySalary ? primarySalary.amount : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onSetSalary(Number.isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="excel-cell-input bg-green-100/80 text-right font-mono text-sm font-bold text-green-900 placeholder-green-600/60 tabular-nums"
                  />
                </td>
                <td className="bg-green-50 text-center text-[10px] font-bold text-green-700">
                  ★
                </td>
              </tr>

              {/* EXTRA INCOME ROWS — DIRECTLY EDITABLE ON TAP */}
              {extraIncomes.map((inc, idx) => (
                <tr key={inc.id} className="hover:bg-yellow-50/40">
                  <td className="bg-neutral-50 text-center font-mono text-[11px] text-neutral-500">
                    {idx + 2}
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={inc.title}
                      onChange={(e) => onUpdateIncome(inc.id, { title: e.target.value })}
                      className="excel-cell-input font-medium text-neutral-900"
                    />
                  </td>
                  <td className="p-0">
                    <select
                      value={inc.allocationMode}
                      onChange={(e) =>
                        onUpdateIncome(inc.id, {
                          allocationMode: e.target.value as AllocationMode,
                        })
                      }
                      className="excel-cell-input cursor-pointer text-[11px] text-neutral-700"
                    >
                      <option value="split">Auto Split</option>
                      <option value="mandatory">100% Mand</option>
                      <option value="fun">100% Fun</option>
                      <option value="savings">100% Sav</option>
                    </select>
                  </td>
                  <td className="p-0">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inc.amount}
                      onChange={(e) =>
                        onUpdateIncome(inc.id, {
                          amount: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="excel-cell-input text-right font-mono font-semibold text-green-700 tabular-nums"
                    />
                  </td>
                  <td className="p-0 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteIncome(inc.id)}
                      title="Delete extra income"
                      className="flex h-full w-full items-center justify-center py-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* QUICK-ADD EXTRA INCOME ROW (YELLOW) */}
              <tr className="bg-yellow-50">
                <td className="bg-yellow-100 text-center font-mono text-xs font-bold text-yellow-900">
                  +
                </td>
                <td className="p-0">
                  <form id="extra-income-form" onSubmit={handleAddExtra}>
                    <input
                      type="text"
                      placeholder="+ Extra income (freelance, bonus...)"
                      value={extraTitle}
                      onChange={(e) => setExtraTitle(e.target.value)}
                      className="excel-cell-input placeholder-neutral-500"
                    />
                  </form>
                </td>
                <td className="p-0">
                  <select
                    form="extra-income-form"
                    value={extraAlloc}
                    onChange={(e) => setExtraAlloc(e.target.value as AllocationMode)}
                    className="excel-cell-input cursor-pointer text-[11px] text-neutral-700"
                  >
                    <option value="split">Auto Split</option>
                    <option value="mandatory">100% Mand</option>
                    <option value="fun">100% Fun</option>
                    <option value="savings">100% Sav</option>
                  </select>
                </td>
                <td className="p-0">
                  <input
                    form="extra-income-form"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddExtra(e);
                    }}
                    className="excel-cell-input text-right font-mono font-semibold text-green-800 placeholder-neutral-400"
                  />
                </td>
                <td className="p-0 text-center">
                  <button
                    type="submit"
                    form="extra-income-form"
                    onClick={() => setExtraType('extra')}
                    title="Add extra income"
                    className="flex h-full w-full items-center justify-center bg-green-600 py-1.5 text-white transition hover:bg-green-700"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SHEET: LIVE 3-BUCKET SPLIT & BALANCE TABLE */}
      <div className="xl:col-span-7">
        <div className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
                2. Budget Split & Live Balances
              </span>
              {!splitBalanced && (
                <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Split totals {splitSum}% (must equal 100%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="mr-1 text-[11px] text-neutral-500">Presets:</span>
              {SPLIT_PRESETS.map((p) => {
                const active =
                  split.mandatory === p.split.mandatory &&
                  split.fun === p.split.fun &&
                  split.savings === p.split.savings;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => onChangeSplit(p.split)}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold transition ${
                      active
                        ? 'border-green-700 bg-green-600 text-white'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:bg-yellow-50'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <table className="excel-table text-xs tabular-nums">
            <thead>
              <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-600">
                <th className="px-2.5 py-1.5 text-left">Bucket (Tap to filter)</th>
                <th className="w-20 px-2 py-1.5 text-center">Split %</th>
                <th className="w-28 px-2.5 py-1.5 text-right">Budget</th>
                <th className="w-28 px-2.5 py-1.5 text-right">Fees Cut</th>
                <th className="w-28 px-2.5 py-1.5 text-right">Remaining</th>
                <th className="w-36 px-2.5 py-1.5 text-left">Status Bar</th>
              </tr>
            </thead>
            <tbody>
              {BUCKETS.map((bKey) => {
                const m = summary.buckets[bKey];
                const meta = BUCKET_META[bKey];
                const isSelected = selectedBucketFilter === bKey;
                const barWidth = Math.min(100, Math.max(0, m.utilizationPct));
                const barClass = m.isOverBudget
                  ? 'bg-red-600'
                  : m.utilizationPct >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-600';

                return (
                  <tr
                    key={bKey}
                    className={`transition ${
                      isSelected
                        ? 'bg-yellow-100/80'
                        : m.isOverBudget
                        ? 'bg-red-50/70'
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    <td className="px-2.5 py-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectBucketFilter(isSelected ? 'all' : bKey)
                        }
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {isSelected ? 'Filtered ✓' : `${m.transactionCount} fees`}
                        </span>
                      </button>
                    </td>

                    <td className="p-0">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={split[bKey]}
                          onChange={(e) => handleSplitCellChange(bKey, e.target.value)}
                          className="excel-cell-input w-14 text-center font-mono font-bold text-neutral-900"
                        />
                        <span className="pr-2 font-mono text-[11px] text-neutral-500">%</span>
                      </div>
                    </td>

                    <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-neutral-900">
                      {formatMoney(m.allocated, currency)}
                    </td>

                    <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-red-600">
                      -{formatMoney(m.spent, currency)}
                    </td>

                    <td
                      className={`px-2.5 py-1.5 text-right font-mono font-bold ${
                        m.isOverBudget
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {formatMoney(m.remaining, currency)}
                    </td>

                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 overflow-hidden border border-neutral-300 bg-white">
                          <div
                            className={`h-full transition-all duration-200 ${barClass}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span
                          className={`w-10 text-right font-mono text-[11px] font-bold ${
                            m.isOverBudget ? 'text-red-700' : 'text-neutral-700'
                          }`}
                        >
                          {formatPercent(m.utilizationPct, 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL SUMMARY ROW */}
              <tr className="bg-neutral-100 font-bold">
                <td className="px-2.5 py-2 text-neutral-900">TOTAL MONTH</td>
                <td
                  className={`px-2 py-2 text-center font-mono ${
                    splitBalanced ? 'text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {splitSum}%
                </td>
                <td className="px-2.5 py-2 text-right font-mono text-green-800">
                  {formatMoney(summary.totalIncome, currency)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono text-red-700">
                  -{formatMoney(summary.totalSpent, currency)}
                </td>
                <td
                  className={`px-2.5 py-2 text-right font-mono ${
                    summary.totalRemaining < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {formatMoney(summary.totalRemaining, currency)}
                </td>
                <td className="px-2.5 py-2 text-[11px] text-neutral-700">
                  Safe Fun:{' '}
                  <span className="font-mono font-bold text-yellow-800">
                    {formatMoney(summary.safeDailyFunSpend, currency)}/d
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
