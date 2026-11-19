import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, X } from 'lucide-react';
import {
  BUCKET_META,
  BucketMetrics,
  BucketType,
  CurrencyConfig,
  ExpenseEntry,
  ExpenseStatus,
} from '../types/finance';
import { BUCKETS } from '../lib/calculations';
import { formatMoney, formatPercent, getDefaultDateForMonth } from '../lib/format';

interface ExpenseExcelSheetProps {
  monthKey: string;
  expenses: ExpenseEntry[];
  buckets: Record<BucketType, BucketMetrics>;
  categoriesByBucket: Record<BucketType, string[]>;
  currency: CurrencyConfig;
  selectedBucketFilter: BucketType | 'all';
  quickAddTitleRef?: React.RefObject<HTMLInputElement | null>;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelectBucketFilter: (bucket: BucketType | 'all') => void;
  onAddExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
  onUpdateExpense: (id: string, patch: Partial<ExpenseEntry>) => void;
  onDeleteExpense: (id: string) => void;
}

type SortKey = 'date' | 'title' | 'bucket' | 'category' | 'status' | 'amount';

export const ExpenseExcelSheet: React.FC<ExpenseExcelSheetProps> = ({
  monthKey,
  expenses,
  buckets,
  categoriesByBucket,
  currency,
  selectedBucketFilter,
  quickAddTitleRef,
  searchInputRef,
  onSelectBucketFilter,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // New fee quick-entry row (Row +)
  const [date, setDate] = useState(() => getDefaultDateForMonth(monthKey));
  const [title, setTitle] = useState('');
  const [bucket, setBucket] = useState<BucketType>('mandatory');
  const [category, setCategory] = useState(categoriesByBucket.mandatory[0] || 'Bills & Fees');
  const [status, setStatus] = useState<ExpenseStatus>('paid');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setDate(getDefaultDateForMonth(monthKey));
  }, [monthKey]);

  useEffect(() => {
    if (selectedBucketFilter !== 'all') {
      setBucket(selectedBucketFilter);
      const cats = categoriesByBucket[selectedBucketFilter];
      if (cats?.length && !cats.includes(category)) {
        setCategory(cats[0]);
      }
    }
  }, [selectedBucketFilter, categoriesByBucket]);

  const handleNewBucketChange = (nb: BucketType) => {
    setBucket(nb);
    const cats = categoriesByBucket[nb];
    if (cats?.length) setCategory(cats[0]);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title.trim() || Number.isNaN(num) || num <= 0) return;
    onAddExpense({
      date: date || getDefaultDateForMonth(monthKey),
      title: title.trim(),
      bucket,
      category: category || 'General',
      amount: num,
      status,
    });
    setTitle('');
    setAmount('');
    quickAddTitleRef?.current?.focus();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'amount' || key === 'date' ? 'desc' : 'asc');
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = expenses.filter((exp) => {
      if (selectedBucketFilter !== 'all' && exp.bucket !== selectedBucketFilter) return false;
      if (q) {
        const hay = `${exp.title} ${exp.category} ${exp.bucket} ${exp.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'bucket') cmp = a.bucket.localeCompare(b.bucket);
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = a.title.localeCompare(b.title);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [expenses, selectedBucketFilter, search, sortKey, sortDir]);

  const filteredSum = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-green-700" />
    ) : (
      <ArrowDown className="h-3 w-3 text-green-700" />
    );
  };

  const activeNewCats = categoriesByBucket[bucket] || [];

  return (
    <div className="overflow-hidden border border-neutral-300 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
            3. Fees & Expenses Sheet (Tap any cell to edit · Press Enter on yellow row to cut)
          </span>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectBucketFilter('all')}
              className={`rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                selectedBucketFilter === 'all'
                  ? 'border-neutral-800 bg-neutral-800 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              All ({expenses.length})
            </button>
            {BUCKETS.map((b) => {
              const meta = BUCKET_META[b];
              const active = selectedBucketFilter === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onSelectBucketFilter(b)}
                  className={`rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                    active
                      ? meta.badgeClass
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sheet... (/)"
              className="h-7 w-44 rounded border border-neutral-300 bg-white pr-2 pl-7 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:border-green-600 focus:bg-yellow-50/40"
            />
          </div>

          <div className="rounded border border-red-300 bg-red-50 px-2.5 py-0.5 font-mono text-xs font-bold text-red-700 tabular-nums">
            Cut: -{formatMoney(filteredSum, currency)}
          </div>
        </div>
      </div>

      {/* Main Excel Grid */}
      <form id="quick-fee-form" onSubmit={handleQuickAdd} />
      <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
        <table className="excel-table text-xs tabular-nums">
          <thead className="sticky top-0 z-10 bg-neutral-100 text-[11px] font-bold text-neutral-700">
            <tr>
              <th className="w-10 py-1.5 text-center">#</th>
              <th className="w-32 px-2 py-1.5 text-left">
                <button type="button" onClick={() => toggleSort('date')} className="flex items-center gap-1">
                  A · Date {sortIcon('date')}
                </button>
              </th>
              <th className="px-2 py-1.5 text-left">
                <button type="button" onClick={() => toggleSort('title')} className="flex items-center gap-1">
                  B · Fee / Description {sortIcon('title')}
                </button>
              </th>
              <th className="w-36 px-2 py-1.5 text-left">
                <button type="button" onClick={() => toggleSort('bucket')} className="flex items-center gap-1">
                  C · Bucket {sortIcon('bucket')}
                </button>
              </th>
              <th className="w-40 px-2 py-1.5 text-left">
                <button type="button" onClick={() => toggleSort('category')} className="flex items-center gap-1">
                  D · Category {sortIcon('category')}
                </button>
              </th>
              <th className="w-28 px-2 py-1.5 text-center">
                <button type="button" onClick={() => toggleSort('status')} className="mx-auto flex items-center gap-1">
                  E · Status {sortIcon('status')}
                </button>
              </th>
              <th className="w-32 px-2 py-1.5 text-right">
                <button type="button" onClick={() => toggleSort('amount')} className="ml-auto flex items-center gap-1">
                  F · Cut ({currency.symbol.trim()}) {sortIcon('amount')}
                </button>
              </th>
              <th className="w-20 px-2 py-1.5 text-right">G · %</th>
              <th className="w-10 py-1.5 text-center"></th>
            </tr>
          </thead>

          <tbody>
            {/* PINNED YELLOW QUICK-ADD ROW */}
            <tr className="bg-yellow-50">
              <td className="bg-yellow-200 text-center font-mono text-xs font-bold text-yellow-950">
                +
              </td>
              <td className="p-0">
                <input
                  form="quick-fee-form"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="excel-cell-input font-mono text-xs text-neutral-800"
                />
              </td>
              <td className="p-0">
                <input
                  ref={quickAddTitleRef}
                  form="quick-fee-form"
                  type="text"
                  placeholder="Type new fee here... (Alt+E)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="excel-cell-input font-medium text-neutral-900 placeholder-neutral-500"
                />
              </td>
              <td className="p-0">
                <select
                  form="quick-fee-form"
                  value={bucket}
                  onChange={(e) => handleNewBucketChange(e.target.value as BucketType)}
                  className={`excel-cell-input cursor-pointer font-bold ${BUCKET_META[bucket].textClass}`}
                >
                  <option value="mandatory">Mandatory</option>
                  <option value="fun">Fun Spending</option>
                  <option value="savings">Savings / Debt</option>
                </select>
              </td>
              <td className="p-0">
                <select
                  form="quick-fee-form"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="excel-cell-input cursor-pointer text-neutral-800"
                >
                  {activeNewCats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-0">
                <select
                  form="quick-fee-form"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                  className="excel-cell-input cursor-pointer text-center font-semibold text-neutral-800"
                >
                  <option value="paid">Paid</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </td>
              <td className="p-0">
                <input
                  form="quick-fee-form"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAdd(e);
                  }}
                  className="excel-cell-input text-right font-mono font-bold text-red-700 placeholder-neutral-400"
                />
              </td>
              <td className="px-2 py-1 text-right font-mono text-[11px] text-neutral-400">
                —
              </td>
              <td className="p-0 text-center">
                <button
                  type="submit"
                  form="quick-fee-form"
                  title="Cut fee (Enter)"
                  className="flex h-full w-full items-center justify-center bg-red-600 py-2 text-white transition hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </td>
            </tr>

            {/* EXISTING DIRECT-EDITABLE EXCEL ROWS */}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-xs text-neutral-500">
                  No fees in this view yet. Tap the yellow row above, enter a fee and amount, and press Enter!
                </td>
              </tr>
            ) : (
              rows.map((exp, idx) => {
                const bMeta = BUCKET_META[exp.bucket];
                const bCats = categoriesByBucket[exp.bucket] || [];
                const catList = bCats.includes(exp.category) ? bCats : [exp.category, ...bCats];
                const bucketAlloc = buckets[exp.bucket].allocated;
                const impactPct = bucketAlloc > 0 ? (exp.amount / bucketAlloc) * 100 : 0;

                return (
                  <tr key={exp.id} className="hover:bg-yellow-50/40">
                    <td className="bg-neutral-50 text-center font-mono text-[11px] text-neutral-500">
                      {idx + 1}
                    </td>

                    <td className="p-0">
                      <input
                        type="date"
                        value={exp.date}
                        onChange={(e) => onUpdateExpense(exp.id, { date: e.target.value })}
                        className="excel-cell-input font-mono text-xs text-neutral-700"
                      />
                    </td>

                    <td className="p-0">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => onUpdateExpense(exp.id, { title: e.target.value })}
                        className="excel-cell-input font-medium text-neutral-900"
                      />
                    </td>

                    <td className={`p-0 ${bMeta.bgClass}`}>
                      <select
                        value={exp.bucket}
                        onChange={(e) => {
                          const nb = e.target.value as BucketType;
                          const nextCats = categoriesByBucket[nb] || [];
                          onUpdateExpense(exp.id, {
                            bucket: nb,
                            category: nextCats[0] || exp.category,
                          });
                        }}
                        className={`excel-cell-input cursor-pointer font-bold ${bMeta.textClass}`}
                      >
                        <option value="mandatory">Mandatory</option>
                        <option value="fun">Fun Spending</option>
                        <option value="savings">Savings / Debt</option>
                      </select>
                    </td>

                    <td className="p-0">
                      <select
                        value={exp.category}
                        onChange={(e) => onUpdateExpense(exp.id, { category: e.target.value })}
                        className="excel-cell-input cursor-pointer text-neutral-800"
                      >
                        {catList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-0 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateExpense(exp.id, {
                            status: exp.status === 'paid' ? 'scheduled' : 'paid',
                          })
                        }
                        className={`h-full w-full py-1.5 text-[11px] font-bold transition ${
                          exp.status === 'paid'
                            ? 'bg-green-50 text-green-800 hover:bg-green-100'
                            : 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200'
                        }`}
                      >
                        {exp.status === 'paid' ? 'Paid ✓' : 'Scheduled'}
                      </button>
                    </td>

                    <td className="p-0">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={exp.amount}
                        onChange={(e) =>
                          onUpdateExpense(exp.id, {
                            amount: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="excel-cell-input text-right font-mono font-bold text-red-700"
                      />
                    </td>

                    <td className="px-2 py-1 text-right font-mono text-[11px] text-neutral-600">
                      {formatPercent(impactPct, 1)}
                    </td>

                    <td className="p-0 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        title="Delete row"
                        className="flex h-full w-full items-center justify-center py-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
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
