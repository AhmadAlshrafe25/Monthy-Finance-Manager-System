import React, { useMemo, useState } from 'react';
import { Plus, Scale, X } from 'lucide-react';
import {
  AllocationMode,
  BUCKET_COLOR_KEYS,
  BUCKET_COLORS,
  BucketColorKey,
  BucketConfig,
  CurrencyConfig,
  IncomeEntry,
  MonthSummary,
  getBucketTheme,
} from '../types/finance';
import { formatMoney, formatPercent, getDefaultDateForMonth } from '../lib/format';

interface SalaryAndSplitSheetProps {
  monthKey: string;
  buckets: BucketConfig[];
  incomes: IncomeEntry[];
  summary: MonthSummary;
  currency: CurrencyConfig;
  visibleBucketIds: string[];
  salaryInputRef?: React.RefObject<HTMLInputElement | null>;
  onFocusBucketTable: (bucketId: string) => void;
  onSetSalary: (amount: number) => void;
  onAddIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  onUpdateIncome: (id: string, patch: Partial<IncomeEntry>) => void;
  onDeleteIncome: (id: string) => void;
  onAddBucket: (name: string, color: BucketColorKey, splitPercent: number) => void;
  onUpdateBucket: (bucketId: string, patch: Partial<BucketConfig>) => void;
  onDeleteBucket: (bucketId: string) => void;
  onAutoBalanceSplit: () => void;
}

export const SalaryAndSplitSheet: React.FC<SalaryAndSplitSheetProps> = ({
  monthKey,
  buckets,
  incomes,
  summary,
  currency,
  visibleBucketIds,
  salaryInputRef,
  onFocusBucketTable,
  onSetSalary,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onAddBucket,
  onUpdateBucket,
  onDeleteBucket,
  onAutoBalanceSplit,
}) => {
  const primarySalary = useMemo(
    () => incomes.find((i) => i.type === 'salary') || null,
    [incomes]
  );

  const otherIncomes = useMemo(
    () => incomes.filter((i) => !primarySalary || i.id !== primarySalary.id),
    [incomes, primarySalary]
  );

  // Quick-add extra income OR salary cut (just type "-" in amount!)
  const [extraTitle, setExtraTitle] = useState('');
  const [extraAlloc, setExtraAlloc] = useState<AllocationMode>('split');
  const [extraAmount, setExtraAmount] = useState('');

  // Quick-add new budget split bucket
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPct, setNewBucketPct] = useState('10');
  const nextDefaultColor: BucketColorKey = useMemo(() => {
    const used = new Set(buckets.map((b) => b.color));
    return BUCKET_COLOR_KEYS.find((c) => !used.has(c)) || 'blue';
  }, [buckets]);
  const [newBucketColor, setNewBucketColor] = useState<BucketColorKey>('blue');

  React.useEffect(() => {
    setNewBucketColor(nextDefaultColor);
  }, [nextDefaultColor]);

  const handleAddExtraOrCut = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(extraAmount);
    if (!extraTitle.trim() || Number.isNaN(num) || num === 0) return;

    onAddIncome({
      date: getDefaultDateForMonth(monthKey),
      title: extraTitle.trim(),
      type: num < 0 ? 'cut' : 'extra',
      amount: num,
      allocationMode: extraAlloc,
      recurring: false,
    });
    setExtraTitle('');
    setExtraAmount('');
  };

  const handleCreateBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    const pct = Math.max(0, Math.min(100, parseFloat(newBucketPct) || 0));
    onAddBucket(newBucketName.trim(), newBucketColor, pct);
    setNewBucketName('');
    setNewBucketPct('10');
  };

  const cycleBucketColor = (bucket: BucketConfig) => {
    const idx = BUCKET_COLOR_KEYS.indexOf(bucket.color);
    const nextColor = BUCKET_COLOR_KEYS[(idx + 1) % BUCKET_COLOR_KEYS.length];
    onUpdateBucket(bucket.id, { color: nextColor });
  };

  const splitSum = buckets.reduce((sum, b) => sum + (Number(b.splitPercent) || 0), 0);
  const splitBalanced = Math.round(splitSum * 100) / 100 === 100;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* LEFT: 1. SALARY, EXTRA INCOME & SALARY CUTS (Just type "-" to deduct!) */}
      <div className="xl:col-span-5">
        <div className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-green-50 px-3 py-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-green-900">
              1. Salary, Extra Income & Cuts (Use &quot;-&quot; to deduct)
            </span>
            <div className="flex items-center gap-2 font-mono text-xs font-bold tabular-nums">
              {summary.salaryCuts > 0 && (
                <span className="text-red-600">
                  Cuts: -{formatMoney(summary.salaryCuts, currency)}
                </span>
              )}
              <span className={summary.totalIncome >= 0 ? 'text-green-700' : 'text-red-700'}>
                Net: {formatMoney(summary.totalIncome, currency)}
              </span>
            </div>
          </div>

          <form id="extra-income-form" onSubmit={handleAddExtraOrCut} />
          <table className="excel-table text-xs tabular-nums">
            <thead>
              <tr className="bg-neutral-100 text-[11px] font-bold text-neutral-600">
                <th className="w-8 py-1.5 text-center">#</th>
                <th className="px-2 py-1.5 text-left">Source / Deduction</th>
                <th className="w-28 px-2 py-1.5 text-left">Applies To</th>
                <th className="w-28 px-2 py-1.5 text-right">Amount ({currency.symbol.trim()})</th>
                <th className="w-8 py-1.5 text-center"></th>
              </tr>
            </thead>

            <tbody>
              {/* ROW 1: MONTHLY SALARY */}
              <tr className="bg-green-50/70">
                <td className="bg-green-100 text-center font-mono text-[11px] font-bold text-green-800">
                  1
                </td>
                <td className="px-2 py-1.5 font-bold text-green-950">Monthly Salary</td>
                <td className="px-2 py-1.5 text-[11px] font-semibold text-green-800">
                  Auto Split
                </td>
                <td className="p-0">
                  <input
                    ref={salaryInputRef}
                    type="number"
                    step="0.01"
                    placeholder="Type salary..."
                    value={primarySalary ? primarySalary.amount : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onSetSalary(Number.isNaN(val) ? 0 : val);
                    }}
                    className="excel-cell-input bg-green-100/80 text-right font-mono text-sm font-bold text-green-900 placeholder-green-600/60"
                  />
                </td>
                <td className="bg-green-50 text-center text-[10px] font-bold text-green-700">
                  ★
                </td>
              </tr>

              {/* EXTRA INCOMES & SALARY CUTS (negative numbers auto-highlight red!) */}
              {otherIncomes.map((inc, idx) => {
                const isCut = inc.amount < 0;
                return (
                  <tr
                    key={inc.id}
                    className={isCut ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-yellow-50/40'}
                  >
                    <td className="bg-neutral-50 text-center font-mono text-[11px] text-neutral-500">
                      {idx + 2}
                    </td>
                    <td className="p-0">
                      <input
                        type="text"
                        value={inc.title}
                        onChange={(e) => onUpdateIncome(inc.id, { title: e.target.value })}
                        className={`excel-cell-input font-medium ${
                          isCut ? 'text-red-800' : 'text-neutral-900'
                        }`}
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
                        {buckets.map((b) => (
                          <option key={b.id} value={b.id}>
                            100% {b.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-0">
                      <input
                        type="number"
                        step="0.01"
                        value={inc.amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const parsed = Number.isNaN(val) ? 0 : val;
                          onUpdateIncome(inc.id, {
                            amount: parsed,
                            type: parsed < 0 ? 'cut' : inc.type === 'cut' ? 'extra' : inc.type,
                          });
                        }}
                        className={`excel-cell-input text-right font-mono font-bold ${
                          isCut ? 'text-red-700' : 'text-green-700'
                        }`}
                      />
                    </td>
                    <td className="p-0 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteIncome(inc.id)}
                        title="Remove row"
                        className="flex h-full w-full items-center justify-center py-1.5 text-neutral-400 transition hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* YELLOW QUICK-ADD ROW: WORKS FOR BOTH +EXTRA INCOME AND -SALARY CUT */}
              <tr className="bg-yellow-50">
                <td className="bg-yellow-100 text-center font-mono text-xs font-bold text-yellow-900">
                  +
                </td>
                <td className="p-0">
                  <input
                    form="extra-income-form"
                    type="text"
                    placeholder="Bonus, freelance, or tax/cut..."
                    value={extraTitle}
                    onChange={(e) => setExtraTitle(e.target.value)}
                    className="excel-cell-input placeholder-neutral-500"
                  />
                </td>
                <td className="p-0">
                  <select
                    form="extra-income-form"
                    value={extraAlloc}
                    onChange={(e) => setExtraAlloc(e.target.value as AllocationMode)}
                    className="excel-cell-input cursor-pointer text-[11px] text-neutral-700"
                  >
                    <option value="split">Auto Split</option>
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id}>
                        100% {b.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-0">
                  <input
                    form="extra-income-form"
                    type="number"
                    step="0.01"
                    placeholder="+50 or -30"
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddExtraOrCut(e);
                    }}
                    className={`excel-cell-input text-right font-mono font-bold placeholder-neutral-400 ${
                      parseFloat(extraAmount) < 0 ? 'text-red-700' : 'text-green-800'
                    }`}
                  />
                </td>
                <td className="p-0 text-center">
                  <button
                    type="submit"
                    form="extra-income-form"
                    title="Add income or cut (Enter)"
                    className={`flex h-full w-full items-center justify-center py-1.5 text-white transition ${
                      parseFloat(extraAmount) < 0
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: 2. DYNAMIC BUDGET SPLIT & LIVE BALANCES (ADD / RENAME / COLOR / DELETE!) */}
      <div className="xl:col-span-7">
        <div className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
                2. Budget Splits & Live Balances (Tap color dot, name, or %)
              </span>
              {!splitBalanced && (
                <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Total {splitSum}% ≠ 100%
                </span>
              )}
            </div>

            {!splitBalanced && (
              <button
                type="button"
                onClick={onAutoBalanceSplit}
                className="flex items-center gap-1 rounded border border-green-700 bg-green-600 px-2 py-0.5 text-[11px] font-bold text-white transition hover:bg-green-700"
                title="Automatically scale all splits to equal 100%"
              >
                <Scale className="h-3 w-3" /> Auto-Balance 100%
              </button>
            )}
          </div>

          <form id="add-bucket-form" onSubmit={handleCreateBucket} />
          <table className="excel-table text-xs tabular-nums">
            <thead>
              <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-600">
                <th className="w-8 py-1.5 text-center" title="Click dot to change color">
                  Clr
                </th>
                <th className="px-2 py-1.5 text-left">Bucket Name (Editable)</th>
                <th className="w-20 px-2 py-1.5 text-center">Split %</th>
                <th className="w-24 px-2 py-1.5 text-right">Budget</th>
                <th className="w-24 px-2 py-1.5 text-right">Cut</th>
                <th className="w-24 px-2 py-1.5 text-right">Left</th>
                <th className="w-28 px-2 py-1.5 text-left">Used</th>
                <th className="w-8 py-1.5 text-center"></th>
              </tr>
            </thead>

            <tbody>
              {buckets.map((b) => {
                const m = summary.bucketMap[b.id];
                const theme = getBucketTheme(b.color);
                const isVisible = visibleBucketIds.includes(b.id);
                const pctUsed = m ? m.utilizationPct : 0;
                const barWidth = Math.min(100, Math.max(0, pctUsed));

                return (
                  <tr
                    key={b.id}
                    className={m?.isOverBudget ? 'bg-red-50/70' : 'hover:bg-neutral-50'}
                  >
                    {/* Color Dot (Click to cycle visibility colors!) */}
                    <td className="p-0 text-center">
                      <button
                        type="button"
                        onClick={() => cycleBucketColor(b)}
                        title={`Color: ${theme.label} — click to change color`}
                        className="flex h-full w-full items-center justify-center py-1.5 hover:bg-neutral-100"
                      >
                        <span
                          className={`h-4 w-4 rounded-sm border border-neutral-400 shadow-xs ${theme.dotClass}`}
                        />
                      </button>
                    </td>

                    {/* Editable Bucket Name + View Table Shortcut */}
                    <td className={`p-0 ${theme.bgClass}`}>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={b.name}
                          onChange={(e) => onUpdateBucket(b.id, { name: e.target.value })}
                          className={`excel-cell-input font-bold ${theme.textClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => onFocusBucketTable(b.id)}
                          title={isVisible ? 'Table currently shown below' : 'Show this bucket table below'}
                          className={`mr-1.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                            isVisible
                              ? 'bg-white/80 text-neutral-700'
                              : 'bg-neutral-800 text-white hover:bg-neutral-700'
                          }`}
                        >
                          {isVisible ? 'Shown' : 'View'}
                        </button>
                      </div>
                    </td>

                    {/* Editable Split % */}
                    <td className="p-0">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={b.splitPercent}
                          onChange={(e) =>
                            onUpdateBucket(b.id, {
                              splitPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                            })
                          }
                          className="excel-cell-input w-12 text-center font-mono font-bold text-neutral-900"
                        />
                        <span className="pr-1.5 font-mono text-[11px] text-neutral-500">%</span>
                      </div>
                    </td>

                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-neutral-900">
                      {formatMoney(m?.allocated ?? 0, currency)}
                    </td>

                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-red-600">
                      -{formatMoney(m?.spent ?? 0, currency)}
                    </td>

                    <td
                      className={`px-2 py-1.5 text-right font-mono font-bold ${
                        m?.isOverBudget
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {formatMoney(m?.remaining ?? 0, currency)}
                    </td>

                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 flex-1 overflow-hidden border border-neutral-300 bg-white">
                          <div
                            className={`h-full transition-all duration-200 ${
                              m?.isOverBudget ? 'bg-red-600' : theme.barClass
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[10px] font-bold text-neutral-700">
                          {formatPercent(pctUsed, 0)}
                        </span>
                      </div>
                    </td>

                    {/* Delete Bucket */}
                    <td className="p-0 text-center">
                      <button
                        type="button"
                        disabled={buckets.length <= 1}
                        onClick={() => onDeleteBucket(b.id)}
                        title={
                          buckets.length <= 1
                            ? 'Must keep at least 1 budget split'
                            : `Delete "${b.name}" bucket`
                        }
                        className="flex h-full w-full items-center justify-center py-1.5 text-neutral-400 transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* ADD NEW BUCKET SPLIT ROW (YELLOW) */}
              <tr className="bg-yellow-50">
                <td className="p-0 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = BUCKET_COLOR_KEYS.indexOf(newBucketColor);
                      setNewBucketColor(
                        BUCKET_COLOR_KEYS[(idx + 1) % BUCKET_COLOR_KEYS.length]
                      );
                    }}
                    title={`New bucket color: ${BUCKET_COLORS[newBucketColor].label} (click to cycle)`}
                    className="flex h-full w-full items-center justify-center py-1.5"
                  >
                    <span
                      className={`h-4 w-4 rounded-sm border border-neutral-500 ${BUCKET_COLORS[newBucketColor].dotClass}`}
                    />
                  </button>
                </td>
                <td className="p-0">
                  <input
                    form="add-bucket-form"
                    type="text"
                    placeholder="+ Add new split (e.g. Car, Travel, Family)..."
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    className="excel-cell-input placeholder-neutral-500"
                  />
                </td>
                <td className="p-0">
                  <div className="flex items-center justify-center">
                    <input
                      form="add-bucket-form"
                      type="number"
                      min={0}
                      max={100}
                      value={newBucketPct}
                      onChange={(e) => setNewBucketPct(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateBucket(e);
                      }}
                      className="excel-cell-input w-12 text-center font-mono font-bold text-neutral-900"
                    />
                    <span className="pr-1.5 font-mono text-[11px] text-neutral-500">%</span>
                  </div>
                </td>
                <td colSpan={4} className="px-2 py-1 text-[11px] text-neutral-500">
                  Creates a new color-coded expense table automatically
                </td>
                <td className="p-0 text-center">
                  <button
                    type="submit"
                    form="add-bucket-form"
                    title="Add new budget split (Enter)"
                    className="flex h-full w-full items-center justify-center bg-green-600 py-1.5 text-white transition hover:bg-green-700"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </td>
              </tr>

              {/* TOTAL SUMMARY ROW */}
              <tr className="bg-neutral-100 font-bold">
                <td className="text-center text-[11px] text-neutral-500">Σ</td>
                <td className="px-2 py-2 text-neutral-900">TOTAL MONTH</td>
                <td
                  className={`px-2 py-2 text-center font-mono ${
                    splitBalanced ? 'text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {splitSum}%
                </td>
                <td className="px-2 py-2 text-right font-mono text-green-800">
                  {formatMoney(summary.totalIncome, currency)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-red-700">
                  -{formatMoney(summary.totalSpent, currency)}
                </td>
                <td
                  className={`px-2 py-2 text-right font-mono ${
                    summary.totalRemaining < 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {formatMoney(summary.totalRemaining, currency)}
                </td>
                <td colSpan={2} className="px-2 py-2 text-[11px] text-neutral-600">
                  {buckets.length} {buckets.length === 1 ? 'bucket' : 'buckets'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
