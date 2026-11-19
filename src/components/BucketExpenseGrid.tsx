import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import {
  BucketConfig,
  BucketMetrics,
  CurrencyConfig,
  ExpenseEntry,
  getBucketTheme,
} from '../types/finance';
import { FALLBACK_CATEGORIES } from '../lib/seed';
import { formatMoney, getDefaultDateForMonth } from '../lib/format';

interface BucketExpenseGridProps {
  monthKey: string;
  buckets: BucketConfig[];
  visibleBucketIds: string[];
  maxVisibleTables: number;
  defaultExpenseStatus: 'paid' | 'scheduled';
  bucketMap: Record<string, BucketMetrics>;
  expenses: ExpenseEntry[];
  categoriesByBucket: Record<string, string[]>;
  currency: CurrencyConfig;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  firstTableInputRef?: React.RefObject<HTMLInputElement | null>;
  onToggleVisibleBucket: (bucketId: string) => void;
  onShiftVisibleWindow: (delta: number) => void;
  onAddExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
  onUpdateExpense: (id: string, patch: Partial<ExpenseEntry>) => void;
  onDeleteExpense: (id: string) => void;
}

interface SingleBucketTableProps {
  monthKey: string;
  bucket: BucketConfig;
  defaultExpenseStatus: 'paid' | 'scheduled';
  metrics: BucketMetrics | undefined;
  expenses: ExpenseEntry[];
  categories: string[];
  currency: CurrencyConfig;
  searchQuery: string;
  titleInputRef?: React.RefObject<HTMLInputElement | null>;
  onAddExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
  onUpdateExpense: (id: string, patch: Partial<ExpenseEntry>) => void;
  onDeleteExpense: (id: string) => void;
}

const SingleBucketTable: React.FC<SingleBucketTableProps> = ({
  monthKey,
  bucket,
  defaultExpenseStatus,
  metrics,
  expenses,
  categories,
  currency,
  searchQuery,
  titleInputRef,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const theme = getBucketTheme(bucket.color);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [date, setDate] = useState(() => getDefaultDateForMonth(monthKey));

  React.useEffect(() => {
    setDate(getDefaultDateForMonth(monthKey));
  }, [monthKey]);

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses
      .filter((e) => {
        if (!q) return true;
        return `${e.title} ${e.category} ${e.date}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, searchQuery]);

  const handleAdd = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) return;

    const cleanTitle = title.trim() || category || bucket.name;

    onAddExpense({
      date: date || getDefaultDateForMonth(monthKey),
      title: cleanTitle,
      bucket: bucket.id,
      category: category || 'General',
      amount: num,
      status: defaultExpenseStatus,
    });

    setTitle('');
    setAmount('');
    titleInputRef?.current?.focus();
  };

  const isOver = metrics?.isOverBudget ?? false;

  return (
    <div className="flex flex-col overflow-hidden border border-neutral-300 bg-white">
      {/* Colored Bucket Header Bar */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2 ${theme.headerBgClass}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-xs font-extrabold uppercase tracking-wide">
              {bucket.name}
            </h3>
            <span className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              {bucket.splitPercent}%
            </span>
          </div>
        </div>
        <div className="shrink-0 font-mono text-xs font-extrabold tabular-nums">
          Left: {formatMoney(metrics?.remaining ?? 0, currency)}
        </div>
      </div>

      {/* Mini Live Formula Strip */}
      <div
        className={`flex items-center justify-between border-b border-neutral-300 px-3 py-1 font-mono text-[11px] tabular-nums ${
          isOver ? 'bg-red-100 text-red-800' : theme.bgClass
        }`}
      >
        <span className="text-neutral-700">
          Budget: <b>{formatMoney(metrics?.allocated ?? 0, currency)}</b>
        </span>
        <span className="font-bold text-red-700">
          Cut: -{formatMoney(metrics?.spent ?? 0, currency)}
        </span>
      </div>

      {/* Excel Table Body */}
      <div className="max-h-[420px] flex-1 overflow-x-auto overflow-y-auto">
        <table className="excel-table text-xs tabular-nums">
          <thead className="sticky top-0 z-10 bg-neutral-100 text-[10px] font-bold uppercase text-neutral-600">
            <tr>
              <th className="w-7 py-1.5 text-center">#</th>
              <th className="px-2 py-1.5 text-left">Expense / Fee</th>
              <th className="w-28 px-1.5 py-1.5 text-left">Category</th>
              <th className="w-24 px-1.5 py-1.5 text-right">Cut ({currency.symbol.trim()})</th>
              <th className="w-7 py-1.5 text-center"></th>
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
                  ref={titleInputRef}
                  type="text"
                  placeholder={`Add to ${bucket.name}...`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(e);
                  }}
                  className="excel-cell-input font-medium text-neutral-900 placeholder-neutral-500"
                />
              </td>
              <td className="p-0">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="excel-cell-input cursor-pointer text-[11px] text-neutral-700"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-0">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(e);
                  }}
                  className="excel-cell-input text-right font-mono font-bold text-red-700 placeholder-neutral-400"
                />
              </td>
              <td className="p-0 text-center">
                <button
                  type="button"
                  onClick={() => handleAdd()}
                  title={`Cut fee from ${bucket.name} (Enter)`}
                  className="flex h-full w-full items-center justify-center bg-red-600 py-1.5 text-white transition hover:bg-red-700"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </td>
            </tr>

            {/* DIRECT-EDITABLE EXPENSE ROWS */}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[11px] text-neutral-400">
                  No expenses in {bucket.name} yet.
                </td>
              </tr>
            ) : (
              filtered.map((exp, idx) => {
                const catList = categories.includes(exp.category)
                  ? categories
                  : [exp.category, ...categories];

                return (
                  <tr key={exp.id} className="hover:bg-yellow-50/40">
                    <td className="bg-neutral-50 text-center font-mono text-[10px] text-neutral-500">
                      {idx + 1}
                    </td>
                    <td className="p-0">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => onUpdateExpense(exp.id, { title: e.target.value })}
                        className="excel-cell-input font-medium text-neutral-900"
                      />
                    </td>
                    <td className="p-0">
                      <select
                        value={exp.category}
                        onChange={(e) => onUpdateExpense(exp.id, { category: e.target.value })}
                        className="excel-cell-input cursor-pointer text-[11px] text-neutral-700"
                      >
                        {catList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
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
                    <td className="p-0 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        title="Delete expense"
                        className="flex h-full w-full items-center justify-center py-1.5 text-neutral-400 transition hover:bg-red-100 hover:text-red-600"
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

export const BucketExpenseGrid: React.FC<BucketExpenseGridProps> = ({
  monthKey,
  buckets,
  visibleBucketIds,
  maxVisibleTables,
  defaultExpenseStatus,
  bucketMap,
  expenses,
  categoriesByBucket,
  currency,
  searchInputRef,
  firstTableInputRef,
  onToggleVisibleBucket,
  onShiftVisibleWindow,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [search, setSearch] = useState('');

  // Strictly enforce maxVisibleTables (default 3)
  const visibleBuckets = useMemo(() => {
    const cap = Math.max(1, Math.min(3, maxVisibleTables));
    const idSet = new Set(visibleBucketIds.slice(0, cap));
    const matched = buckets.filter((b) => idSet.has(b.id));
    if (matched.length > 0) return matched.slice(0, cap);
    return buckets.slice(0, cap);
  }, [buckets, visibleBucketIds, maxVisibleTables]);

  const gridColsClass =
    visibleBuckets.length === 1
      ? 'grid-cols-1'
      : visibleBuckets.length === 2
      ? 'grid-cols-1 lg:grid-cols-2'
      : 'grid-cols-1 lg:grid-cols-3';

  return (
    <section className="space-y-2.5">
      {/* Section Header + Table Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-neutral-300 bg-white px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
            3. Bucket Expense Tables (Showing {visibleBuckets.length} of {buckets.length} · Max {maxVisibleTables})
          </span>

          {/* Bucket Selector Pills */}
          <div className="flex flex-wrap items-center gap-1">
            {buckets.map((b) => {
              const theme = getBucketTheme(b.color);
              const active = visibleBuckets.some((vb) => vb.id === b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onToggleVisibleBucket(b.id)}
                  className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                    active
                      ? theme.badgeClass
                      : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${theme.dotClass}`} />
                  {b.name}
                  {active ? ' ✓' : ''}
                </button>
              );
            })}
          </div>

          {buckets.length > maxVisibleTables && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onShiftVisibleWindow(-1)}
                title="Previous tables"
                className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onShiftVisibleWindow(1)}
                title="Next tables"
                className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Search across all bucket tables */}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all tables... (/)"
            className="h-7 w-48 rounded border border-neutral-300 bg-white pr-2 pl-7 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:border-green-600 focus:bg-yellow-50/40"
          />
        </div>
      </div>

      {/* Individual Side-by-Side Bucket Expense Tables */}
      <div className={`grid gap-3 ${gridColsClass}`}>
        {visibleBuckets.map((bucket, idx) => (
          <SingleBucketTable
            key={bucket.id}
            monthKey={monthKey}
            bucket={bucket}
            defaultExpenseStatus={defaultExpenseStatus}
            metrics={bucketMap[bucket.id]}
            expenses={expenses.filter((e) => e.bucket === bucket.id)}
            categories={categoriesByBucket[bucket.id] || FALLBACK_CATEGORIES}
            currency={currency}
            searchQuery={search}
            titleInputRef={idx === 0 ? firstTableInputRef : undefined}
            onAddExpense={onAddExpense}
            onUpdateExpense={onUpdateExpense}
            onDeleteExpense={onDeleteExpense}
          />
        ))}
      </div>
    </section>
  );
};
