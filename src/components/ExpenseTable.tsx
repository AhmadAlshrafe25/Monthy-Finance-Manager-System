import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  BUCKET_META,
  BucketMetrics,
  BucketType,
  CurrencyConfig,
  ExpenseEntry,
  ExpenseStatus,
} from '../types/finance';
import { formatMoney, formatPercent, getDefaultDateForMonth } from '../lib/format';
import { BUCKETS } from '../lib/calculations';

interface ExpenseTableProps {
  monthKey: string;
  expenses: ExpenseEntry[];
  buckets: Record<BucketType, BucketMetrics>;
  categoriesByBucket: Record<BucketType, string[]>;
  currency: CurrencyConfig;
  selectedBucketFilter: BucketType | 'all';
  onSelectBucketFilter: (bucket: BucketType | 'all') => void;
  quickAddTitleRef?: React.RefObject<HTMLInputElement | null>;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onAddExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
  onUpdateExpense: (id: string, patch: Partial<ExpenseEntry>) => void;
  onDeleteExpense: (id: string) => void;
  onDuplicateExpense: (entry: ExpenseEntry) => void;
}

type SortKey = 'date' | 'title' | 'bucket' | 'category' | 'amount' | 'status';

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  monthKey,
  expenses,
  buckets,
  categoriesByBucket,
  currency,
  selectedBucketFilter,
  onSelectBucketFilter,
  quickAddTitleRef,
  searchInputRef,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDuplicateExpense,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Quick-add row state
  const [date, setDate] = useState(() => getDefaultDateForMonth(monthKey));
  const [title, setTitle] = useState('');
  const [bucket, setBucket] = useState<BucketType>('mandatory');
  const [category, setCategory] = useState(categoriesByBucket.mandatory[0] || 'Bills & Fees');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>('paid');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ExpenseEntry>>({});

  useEffect(() => {
    setDate(getDefaultDateForMonth(monthKey));
  }, [monthKey]);

  // If user clicked a bucket card filter, default the quick-add bucket to it for speed!
  useEffect(() => {
    if (selectedBucketFilter !== 'all') {
      setBucket(selectedBucketFilter);
      const cats = categoriesByBucket[selectedBucketFilter];
      if (cats && cats.length > 0 && !cats.includes(category)) {
        setCategory(cats[0]);
      }
    }
  }, [selectedBucketFilter, categoriesByBucket]);

  const handleBucketChange = (nextBucket: BucketType) => {
    setBucket(nextBucket);
    const cats = categoriesByBucket[nextBucket];
    if (cats && cats.length > 0) {
      setCategory(cats[0]);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'amount' || key === 'date' ? 'desc' : 'asc');
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = expenses.filter((exp) => {
      if (selectedBucketFilter !== 'all' && exp.bucket !== selectedBucketFilter) return false;
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      if (q) {
        const hay = `${exp.title} ${exp.category} ${exp.bucket} ${exp.notes || ''}`.toLowerCase();
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
  }, [expenses, selectedBucketFilter, statusFilter, search, sortKey, sortDir]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!title.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) return;

    onAddExpense({
      date: date || getDefaultDateForMonth(monthKey),
      title: title.trim(),
      bucket,
      category: category || 'General',
      amount: numericAmount,
      status,
    });

    setTitle('');
    setAmount('');
    quickAddTitleRef?.current?.focus();
  };

  const startEdit = (exp: ExpenseEntry) => {
    setEditingId(exp.id);
    setEditDraft({ ...exp });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const numeric = Number(editDraft.amount);
    if (!editDraft.title?.trim() || Number.isNaN(numeric) || numeric <= 0) return;
    onUpdateExpense(editingId, {
      ...editDraft,
      title: editDraft.title.trim(),
      amount: numeric,
    });
    setEditingId(null);
    setEditDraft({});
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-35" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-sky-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-sky-400" />
    );
  };

  const activeBucketCats = categoriesByBucket[bucket] || [];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0f1624]">
      {/* Header + Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Fees & Expenses Ledger
          </h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
            {filteredExpenses.length}/{expenses.length}
          </span>

          {/* Bucket Filter Pills */}
          <div className="ml-2 flex items-center gap-1 rounded-lg bg-slate-950/70 p-0.5">
            <button
              type="button"
              onClick={() => onSelectBucketFilter('all')}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                selectedBucketFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {BUCKETS.map((b) => {
              const meta = BUCKET_META[b];
              const active = selectedBucketFilter === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onSelectBucketFilter(b)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    active ? meta.badgeClass : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Status Filter + Filtered Sum */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter fees... (/)"
              className="h-7 w-44 rounded-lg border border-slate-800 bg-slate-950/80 pr-2 pl-8 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ExpenseStatus)}
            className="h-7 rounded-lg border border-slate-800 bg-slate-950/80 px-2 text-[11px] text-slate-300 outline-none focus:border-sky-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="scheduled">Scheduled</option>
          </select>

          <div className="rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs">
            <span className="text-slate-400">Cut: </span>
            <span className="font-mono font-bold text-rose-400 tabular-nums">
              -{formatMoney(filteredTotal, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Inline Fast Quick-Add Fee Row */}
      <form
        onSubmit={handleQuickAdd}
        className="grid grid-cols-12 items-center gap-2 border-b border-slate-800/80 bg-[#141d31] px-3 py-2"
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 font-mono text-[11px] text-slate-200 outline-none focus:border-sky-400"
        />
        <input
          ref={quickAddTitleRef}
          type="text"
          placeholder="Add new fee / expense... (Alt+E) — press Enter to cut instantly"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400"
        />
        <select
          value={bucket}
          onChange={(e) => handleBucketChange(e.target.value as BucketType)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 text-xs font-medium text-slate-200 outline-none focus:border-sky-400"
        >
          <option value="mandatory">Mandatory</option>
          <option value="fun">Fun Spending</option>
          <option value="savings">Savings / Debt</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 text-xs text-slate-200 outline-none focus:border-sky-400"
        >
          {activeBucketCats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder={`Fee (${currency.symbol.trim()})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="col-span-1 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 text-right font-mono text-xs text-rose-300 placeholder-slate-500 outline-none focus:border-rose-400"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
          className="col-span-1 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-1.5 text-[11px] text-slate-200 outline-none focus:border-sky-400"
        >
          <option value="paid">Paid</option>
          <option value="scheduled">Sched</option>
        </select>
        <button
          type="submit"
          title="Cut fee from bucket (Enter)"
          className="col-span-1 flex h-8 items-center justify-center gap-1 rounded-lg bg-sky-500 px-2 text-xs font-bold text-slate-950 transition hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" /> Cut
        </button>
      </form>

      {/* Main Ledger Table */}
      <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-[#0c1220] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <tr className="border-b border-slate-800/90">
              <th className="w-28 px-3 py-2">
                <button type="button" onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-slate-200">
                  Date {renderSortIcon('date')}
                </button>
              </th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-slate-200">
                  Description {renderSortIcon('title')}
                </button>
              </th>
              <th className="w-32 px-3 py-2">
                <button type="button" onClick={() => toggleSort('bucket')} className="flex items-center gap-1 hover:text-slate-200">
                  Bucket {renderSortIcon('bucket')}
                </button>
              </th>
              <th className="w-40 px-3 py-2">
                <button type="button" onClick={() => toggleSort('category')} className="flex items-center gap-1 hover:text-slate-200">
                  Category {renderSortIcon('category')}
                </button>
              </th>
              <th className="w-24 px-3 py-2 text-center">
                <button type="button" onClick={() => toggleSort('status')} className="mx-auto flex items-center gap-1 hover:text-slate-200">
                  Status {renderSortIcon('status')}
                </button>
              </th>
              <th className="w-24 px-3 py-2 text-right">Bucket %</th>
              <th className="w-32 px-3 py-2 text-right">
                <button type="button" onClick={() => toggleSort('amount')} className="ml-auto flex items-center gap-1 hover:text-slate-200">
                  Amount Cut {renderSortIcon('amount')}
                </button>
              </th>
              <th className="w-24 px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-500">
                  {expenses.length === 0
                    ? 'No fees recorded yet. Use the quick-add bar above to cut a fee from Mandatory, Fun, or Savings/Debt.'
                    : 'No matching entries for the current filter.'}
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const isEditing = editingId === exp.id;
                const bMeta = BUCKET_META[exp.bucket];
                const bucketAllocated = buckets[exp.bucket].allocated;
                const impactPct = bucketAllocated > 0 ? (exp.amount / bucketAllocated) * 100 : 0;

                if (isEditing) {
                  const editBucket = (editDraft.bucket || exp.bucket) as BucketType;
                  const editCats = categoriesByBucket[editBucket] || [];
                  return (
                    <tr key={exp.id} className="bg-slate-800/45">
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={editDraft.date || ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-1.5 font-mono text-[11px]"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={editDraft.title || ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-2 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={editBucket}
                          onChange={(e) => {
                            const nb = e.target.value as BucketType;
                            setEditDraft((d) => ({
                              ...d,
                              bucket: nb,
                              category: categoriesByBucket[nb]?.[0] || d.category,
                            }));
                          }}
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-1.5 text-xs"
                        >
                          <option value="mandatory">Mandatory</option>
                          <option value="fun">Fun Spending</option>
                          <option value="savings">Savings / Debt</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={editDraft.category || ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-1.5 text-xs"
                        >
                          {editCats.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={editDraft.status || 'paid'}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, status: e.target.value as ExpenseStatus }))
                          }
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-1.5 text-xs"
                        >
                          <option value="paid">Paid</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[11px] text-slate-500">—</td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={editDraft.amount ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, amount: Number(e.target.value) }))}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-2 text-right font-mono text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="rounded p-1 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={exp.id} className="group transition hover:bg-slate-800/35">
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-400 tabular-nums">
                      {exp.date}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-100">{exp.title}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${bMeta.badgeClass}`}>
                        {bMeta.shortLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{exp.category}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateExpense(exp.id, {
                            status: exp.status === 'paid' ? 'scheduled' : 'paid',
                          })
                        }
                        title="Click to toggle Paid / Scheduled"
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                          exp.status === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                        }`}
                      >
                        {exp.status === 'paid' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {exp.status === 'paid' ? 'Paid' : 'Sched'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                      {formatPercent(impactPct, 1)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-rose-300 tabular-nums">
                      -{formatMoney(exp.amount, currency)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-40 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onDuplicateExpense(exp)}
                          title="Duplicate entry"
                          className="rounded p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(exp)}
                          title="Edit entry"
                          className="rounded p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          title="Delete entry"
                          className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
