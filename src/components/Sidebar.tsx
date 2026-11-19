import React from 'react';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Plus,
  Settings,
  TableProperties,
  Wallet,
} from 'lucide-react';
import { ActiveTab, BucketSplit } from '../types/finance';
import { getMonthLabel } from '../lib/calculations';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeMonth: string;
  availableMonths: string[];
  onSelectMonth: (monthKey: string) => void;
  onShiftMonth: (delta: number) => void;
  onCreateNextMonth: () => void;
  split: BucketSplit;
  onExportCsv: () => void;
  isSampleData?: boolean;
  onClearSampleData: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; shortcut: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Overview & Split', shortcut: '1', icon: LayoutDashboard },
  { id: 'ledger', label: 'Tables & Ledger', shortcut: '2', icon: TableProperties },
  { id: 'analytics', label: 'Analytics Lab', shortcut: '3', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Data', shortcut: '4', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeMonth,
  availableMonths,
  onSelectMonth,
  onShiftMonth,
  onCreateNextMonth,
  split,
  onExportCsv,
  isSampleData,
  onClearSampleData,
}) => {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-800/80 bg-[#0c1220] select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-emerald-400 shadow-lg shadow-sky-500/20">
          <Wallet className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-slate-100">
            Finance Manager
          </h1>
          <p className="text-[11px] font-medium text-slate-400">
            Monthly Split Engine
          </p>
        </div>
      </div>

      {/* Month Switcher */}
      <div className="border-b border-slate-800/80 p-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Active Month
          </span>
          <button
            onClick={onCreateNextMonth}
            title="Start next month (carries over recurring salary & bills)"
            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 transition hover:bg-sky-500/15"
          >
            <Plus className="h-3 w-3" /> Next
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onShiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 transition hover:border-slate-700 hover:text-slate-100"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <select
            value={activeMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="h-8 flex-1 cursor-pointer rounded-lg border border-slate-800 bg-slate-900/90 px-2 text-center text-xs font-semibold text-slate-100 outline-none transition hover:border-slate-700 focus:border-sky-500"
          >
            {availableMonths.map((mk) => (
              <option key={mk} value={mk} className="bg-slate-900 text-slate-100">
                {getMonthLabel(mk)}
              </option>
            ))}
          </select>

          <button
            onClick={() => onShiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 transition hover:border-slate-700 hover:text-slate-100"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                active
                  ? 'bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
              </span>
              <kbd
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  active ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-900 text-slate-500'
                }`}
              >
                {item.shortcut}
              </kbd>
            </button>
          );
        })}

        {/* Active Split Pill */}
        <div className="mt-5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Month Split Ratio</span>
            <span className="font-mono text-slate-300">
              {split.mandatory}/{split.fun}/{split.savings}
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div style={{ width: `${split.mandatory}%` }} className="bg-sky-400 transition-all duration-300" />
            <div style={{ width: `${split.fun}%` }} className="bg-purple-400 transition-all duration-300" />
            <div style={{ width: `${split.savings}%` }} className="bg-emerald-400 transition-all duration-300" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-medium">
            <span className="text-sky-400">Mand {split.mandatory}%</span>
            <span className="text-center text-purple-400">Fun {split.fun}%</span>
            <span className="text-right text-emerald-400">Sav {split.savings}%</span>
          </div>
        </div>

        {/* Keyboard Shortcuts Legend */}
        <div className="mt-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-[11px] text-slate-400">
          <p className="mb-1.5 font-semibold text-slate-300">Fast Shortcuts</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Quick-add fee</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">Alt+E</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Quick-add income</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">Alt+I</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Search tables</span>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">/</kbd>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-2 border-t border-slate-800/80 p-3">
        {isSampleData && (
          <button
            onClick={onClearSampleData}
            className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-[11px] font-medium text-amber-300 transition hover:bg-amber-500/20"
          >
            Demo data loaded — click to start fresh with your own numbers
          </button>
        )}
        <button
          onClick={onExportCsv}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <Download className="h-3.5 w-3.5 text-sky-400" />
          Export Month CSV
        </button>
      </div>
    </aside>
  );
};
