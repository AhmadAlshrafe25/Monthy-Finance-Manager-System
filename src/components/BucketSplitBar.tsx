import React, { useEffect, useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { BucketSplit, CurrencyConfig, SPLIT_PRESETS } from '../types/finance';
import { formatMoney } from '../lib/format';

interface BucketSplitBarProps {
  split: BucketSplit;
  totalSplitIncome: number;
  currency: CurrencyConfig;
  onChangeSplit: (nextSplit: BucketSplit) => void;
}

export const BucketSplitBar: React.FC<BucketSplitBarProps> = ({
  split,
  totalSplitIncome,
  currency,
  onChangeSplit,
}) => {
  const [draft, setDraft] = useState<BucketSplit>(split);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setDraft(split);
  }, [split]);

  const totalPct = draft.mandatory + draft.fun + draft.savings;
  const isValid = totalPct === 100;

  const updateField = (key: keyof BucketSplit, raw: string) => {
    const val = Math.max(0, Math.min(100, Number(raw) || 0));
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    if (!isValid) return;
    onChangeSplit(draft);
    setEditing(false);
  };

  const applyPreset = (preset: BucketSplit) => {
    setDraft(preset);
    onChangeSplit(preset);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            Income Allocation Split
          </span>
          <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-300 tabular-nums">
            Mandatory {split.mandatory}% · Fun {split.fun}% · Savings/Debt {split.savings}%
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SPLIT_PRESETS.map((p) => {
            const active =
              split.mandatory === p.split.mandatory &&
              split.fun === p.split.fun &&
              split.savings === p.split.savings;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p.split)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  active
                    ? 'bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-500/40'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {p.split.mandatory}/{p.split.fun}/{p.split.savings}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-sky-500/50 hover:text-sky-300"
          >
            {editing ? 'Close' : 'Custom %'}
          </button>
        </div>
      </div>

      {/* Visual Segmented Allocation Strip */}
      <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          style={{ width: `${split.mandatory}%` }}
          className="bg-sky-400 transition-all duration-300"
          title={`Mandatory: ${split.mandatory}% (${formatMoney((totalSplitIncome * split.mandatory) / 100, currency)})`}
        />
        <div
          style={{ width: `${split.fun}%` }}
          className="bg-purple-400 transition-all duration-300"
          title={`Fun Spending: ${split.fun}% (${formatMoney((totalSplitIncome * split.fun) / 100, currency)})`}
        />
        <div
          style={{ width: `${split.savings}%` }}
          className="bg-emerald-400 transition-all duration-300"
          title={`Savings / Debt: ${split.savings}% (${formatMoney((totalSplitIncome * split.savings) / 100, currency)})`}
        />
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-800 pt-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-sky-400">
              Mandatory %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.mandatory}
              onChange={(e) => updateField('mandatory', e.target.value)}
              className="h-8 w-24 rounded-lg border border-slate-700 bg-slate-900 px-2.5 font-mono text-xs text-slate-100 outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-purple-400">
              Fun Spending %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.fun}
              onChange={(e) => updateField('fun', e.target.value)}
              className="h-8 w-24 rounded-lg border border-slate-700 bg-slate-900 px-2.5 font-mono text-xs text-slate-100 outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-emerald-400">
              Savings / Debt %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.savings}
              onChange={(e) => updateField('savings', e.target.value)}
              className="h-8 w-24 rounded-lg border border-slate-700 bg-slate-900 px-2.5 font-mono text-xs text-slate-100 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${
                isValid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              Total: {totalPct}%
            </span>
            <button
              type="button"
              disabled={!isValid}
              onClick={handleApply}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" /> Apply Split
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
