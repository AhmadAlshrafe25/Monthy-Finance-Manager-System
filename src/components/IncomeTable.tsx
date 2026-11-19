import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import {
  AllocationMode,
  BUCKET_META,
  BucketSplit,
  CurrencyConfig,
  INCOME_TYPE_META,
  IncomeEntry,
  IncomeType,
} from '../types/finance';
import { formatMoney, getDefaultDateForMonth } from '../lib/format';

interface IncomeTableProps {
  monthKey: string;
  incomes: IncomeEntry[];
  split: BucketSplit;
  currency: CurrencyConfig;
  quickAddTitleRef?: React.RefObject<HTMLInputElement | null>;
  onAddIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  onUpdateIncome: (id: string, patch: Partial<IncomeEntry>) => void;
  onDeleteIncome: (id: string) => void;
  compact?: boolean;
}

type SortKey = 'date' | 'title' | 'type' | 'amount';

export const IncomeTable: React.FC<IncomeTableProps> = ({
  monthKey,
  incomes,
  split,
  currency,
  quickAddTitleRef,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  compact = false,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Quick-add row state
  const [date, setDate] = useState(() => getDefaultDateForMonth(monthKey));
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncomeType>('salary');
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('split');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(false);

  // Sync quick-add default date when active month changes
  React.useEffect(() => {
    setDate(getDefaultDateForMonth(monthKey));
  }, [monthKey]);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<IncomeEntry>>({});

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'amount' || key === 'date' ? 'desc' : 'asc');
    }
  };

  const sortedIncomes = useMemo(() => {
    const list = [...incomes];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
      else cmp = a.title.localeCompare(b.title);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [incomes, sortKey, sortDir]);

  const totalIncome = useMemo(
    () => incomes.reduce((sum, item) => sum + item.amount, 0),
    [incomes]
  );

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!title.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) return;

    onAddIncome({
      date: date || getDefaultDateForMonth(monthKey),
      title: title.trim(),
      type,
      amount: numericAmount,
      allocationMode,
      recurring,
    });

    setTitle('');
    setAmount('');
    setType('extra');
    setAllocationMode('split');
    setRecurring(false);
    quickAddTitleRef?.current?.focus();
  };

  const startEdit = (inc: IncomeEntry) => {
    setEditingId(inc.id);
    setEditDraft({ ...inc });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const numeric = Number(editDraft.amount);
    if (!editDraft.title?.trim() || Number.isNaN(numeric) || numeric <= 0) return;
    onUpdateIncome(editingId, {
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

  const renderSplitBreakdown = (inc: IncomeEntry) => {
    if (inc.allocationMode !== 'split') {
      const meta = BUCKET_META[inc.allocationMode];
      return (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}>
          100% → {meta.shortLabel}
        </span>
      );
    }

    const m = (inc.amount * split.mandatory) / 100;
    const f = (inc.amount * split.fun) / 100;
    const s = (inc.amount * split.savings) / 100;
    return (
      <div className="flex items-center gap-2 font-mono text-[10px] tabular-nums">
        <span className="text-sky-400">M:{formatMoney(m, currency)}</span>
        <span className="text-purple-400">F:{formatMoney(f, currency)}</span>
        <span className="text-emerald-400">S:{formatMoney(s, currency)}</span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0f1624]">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Income Sources (Salary & Extra)
          </h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
            {incomes.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Total Inflow:</span>
          <span className="font-mono font-bold text-emerald-400 tabular-nums">
            {formatMoney(totalIncome, currency)}
          </span>
        </div>
      </div>

      {/* Inline Quick-Add Form */}
      <form
        onSubmit={handleQuickAdd}
        className="grid grid-cols-12 items-center gap-2 border-b border-slate-800/80 bg-[#121c2f] px-3 py-2"
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 font-mono text-[11px] text-slate-200 outline-none focus:border-emerald-400"
          title="Income date"
        />
        <input
          ref={quickAddTitleRef}
          type="text"
          placeholder="Add salary or extra income... (Alt+I)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as IncomeType)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 text-xs text-slate-200 outline-none focus:border-emerald-400"
        >
          <option value="salary">Salary</option>
          <option value="extra">Extra Income</option>
          <option value="freelance">Freelance</option>
          <option value="bonus">Bonus</option>
          <option value="other">Other</option>
        </select>
        <select
          value={allocationMode}
          onChange={(e) => setAllocationMode(e.target.value as AllocationMode)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 text-xs text-slate-200 outline-none focus:border-emerald-400"
          title="How this income gets divided across your buckets"
        >
          <option value="split">Auto Split ({split.mandatory}/{split.fun}/{split.savings})</option>
          <option value="mandatory">100% Mandatory</option>
          <option value="fun">100% Fun</option>
          <option value="savings">100% Savings/Debt</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder={`Amount (${currency.symbol.trim()})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="col-span-2 h-8 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2.5 text-right font-mono text-xs text-emerald-300 placeholder-slate-500 outline-none focus:border-emerald-400"
        />
        <div className="col-span-1 flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setRecurring((r) => !r)}
            title={recurring ? 'Recurring monthly (ON)' : 'Mark as recurring monthly'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition ${
              recurring
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700/80 bg-slate-950/70 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>
          <button
            type="submit"
            title="Add income (Enter)"
            className="flex h-8 flex-1 items-center justify-center rounded-lg bg-emerald-500 px-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Data Table */}
      <div className={`overflow-x-auto ${compact ? 'max-h-60' : 'max-h-[420px]'} overflow-y-auto`}>
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
                  Source {renderSortIcon('title')}
                </button>
              </th>
              <th className="w-28 px-3 py-2">
                <button type="button" onClick={() => toggleSort('type')} className="flex items-center gap-1 hover:text-slate-200">
                  Type {renderSortIcon('type')}
                </button>
              </th>
              <th className="px-3 py-2">Bucket Split Breakdown</th>
              <th className="w-32 px-3 py-2 text-right">
                <button type="button" onClick={() => toggleSort('amount')} className="ml-auto flex items-center gap-1 hover:text-slate-200">
                  Amount {renderSortIcon('amount')}
                </button>
              </th>
              <th className="w-20 px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedIncomes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                  No income added for this month yet. Enter your salary or extra income in the quick-add row above!
                </td>
              </tr>
            ) : (
              sortedIncomes.map((inc) => {
                const isEditing = editingId === inc.id;
                const typeMeta = INCOME_TYPE_META[inc.type];

                if (isEditing) {
                  return (
                    <tr key={inc.id} className="bg-slate-800/40">
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
                          value={editDraft.type || 'salary'}
                          onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value as IncomeType }))}
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-1.5 text-xs"
                        >
                          <option value="salary">Salary</option>
                          <option value="extra">Extra Income</option>
                          <option value="freelance">Freelance</option>
                          <option value="bonus">Bonus</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={editDraft.allocationMode || 'split'}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, allocationMode: e.target.value as AllocationMode }))
                          }
                          className="h-7 w-full rounded border border-slate-600 bg-slate-950 px-1.5 text-xs"
                        >
                          <option value="split">Auto Split</option>
                          <option value="mandatory">100% Mandatory</option>
                          <option value="fun">100% Fun</option>
                          <option value="savings">100% Savings/Debt</option>
                        </select>
                      </td>
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
                  <tr key={inc.id} className="group transition hover:bg-slate-800/35">
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-400 tabular-nums">
                      {inc.date}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{inc.title}</span>
                        {inc.recurring && (
                          <span title="Recurring monthly" className="text-emerald-400/80">
                            <Repeat className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeMeta.badgeClass}`}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">{renderSplitBreakdown(inc)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-400 tabular-nums">
                      {formatMoney(inc.amount, currency, true)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-40 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(inc)}
                          title="Edit income"
                          className="rounded p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteIncome(inc.id)}
                          title="Delete income"
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
