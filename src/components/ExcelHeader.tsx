import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { CURRENCY_PRESETS, CurrencyConfig } from '../types/finance';
import { getMonthLabel } from '../lib/calculations';

interface ExcelHeaderProps {
  activeMonth: string;
  availableMonths: string[];
  currency: CurrencyConfig;
  isSampleData?: boolean;
  onSelectMonth: (monthKey: string) => void;
  onShiftMonth: (delta: number) => void;
  onCreateNextMonth: () => void;
  onChangeCurrency: (currency: CurrencyConfig) => void;
  onExportCsv: () => void;
  onClearDemo: () => void;
}

export const ExcelHeader: React.FC<ExcelHeaderProps> = ({
  activeMonth,
  availableMonths,
  currency,
  isSampleData,
  onSelectMonth,
  onShiftMonth,
  onCreateNextMonth,
  onChangeCurrency,
  onExportCsv,
  onClearDemo,
}) => {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b-2 border-green-800 bg-green-700 px-4 text-white select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-green-700 shadow-sm">
          <FileSpreadsheet className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight">
          Monthly Finance Sheet
        </span>
      </div>

      {/* Center: Month Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          className="flex h-7 w-7 items-center justify-center rounded bg-green-800/80 text-white transition hover:bg-green-900"
          title="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <select
          value={activeMonth}
          onChange={(e) => onSelectMonth(e.target.value)}
          className="h-7 cursor-pointer rounded border border-green-500 bg-white px-2.5 text-xs font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-yellow-300"
        >
          {availableMonths.map((mk) => (
            <option key={mk} value={mk}>
              {getMonthLabel(mk)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          className="flex h-7 w-7 items-center justify-center rounded bg-green-800/80 text-white transition hover:bg-green-900"
          title="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onCreateNextMonth}
          className="ml-1 flex h-7 items-center gap-1 rounded bg-yellow-400 px-2.5 text-xs font-bold text-neutral-950 transition hover:bg-yellow-300"
          title="Create next month and carry over recurring salary & bills"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Next Month
        </button>
      </div>

      {/* Right: Currency + Demo Reset + Export CSV */}
      <div className="flex items-center gap-2">
        <select
          value={currency.code}
          onChange={(e) => {
            const found = CURRENCY_PRESETS.find((c) => c.code === e.target.value);
            if (found) onChangeCurrency(found);
          }}
          title="Currency"
          className="h-7 cursor-pointer rounded border border-green-500 bg-white px-2 text-xs font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-yellow-300"
        >
          {CURRENCY_PRESETS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.symbol.trim()})
            </option>
          ))}
        </select>

        {isSampleData && (
          <button
            type="button"
            onClick={onClearDemo}
            className="flex h-7 items-center gap-1 rounded bg-red-600 px-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            title="Clear sample numbers and start with a blank sheet"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Demo
          </button>
        )}

        <button
          type="button"
          onClick={onExportCsv}
          className="flex h-7 items-center gap-1 rounded bg-white px-2.5 text-xs font-bold text-green-800 transition hover:bg-green-50"
          title="Download this month as Excel CSV"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>
    </header>
  );
};
