import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActiveTab,
  AppSettings,
  BucketSplit,
  BucketType,
  ExpenseEntry,
  FinanceStore,
  IncomeEntry,
  MonthData,
} from './types/finance';
import {
  calculateMonthSummary,
  calculateMultiMonthTrends,
  cloneRecurringForNewMonth,
  getMonthLabel,
} from './lib/calculations';
import {
  createEmptyMonth,
  createEmptyStore,
  createStarterStore,
} from './lib/seed';
import { monthToCsv, shiftMonthKey } from './lib/format';
import {
  exportTextFile,
  importJsonBackup,
  loadStore,
  saveStore,
} from './lib/storage';
import { Sidebar } from './components/Sidebar';
import { TopSummaryBar } from './components/TopSummaryBar';
import { BucketSplitBar } from './components/BucketSplitBar';
import { IncomeTable } from './components/IncomeTable';
import { ExpenseTable } from './components/ExpenseTable';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { Toast, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [store, setStore] = useState<FinanceStore | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState<BucketType | 'all'>('all');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const expenseQuickAddRef = useRef<HTMLInputElement | null>(null);
  const incomeQuickAddRef = useRef<HTMLInputElement | null>(null);
  const expenseSearchRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, onUndo?: () => void) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ id: String(Date.now()), text, onUndo });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Load persisted data on startup
  useEffect(() => {
    let mounted = true;
    loadStore().then((loaded) => {
      if (!mounted) return;
      if (loaded && loaded.months && Object.keys(loaded.months).length > 0) {
        setStore(loaded);
      } else {
        const starter = createStarterStore();
        setStore(starter);
        saveStore(starter);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save whenever store mutates
  const commitStore = useCallback((updater: (prev: FinanceStore) => FinanceStore) => {
    setStore((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  // Global keyboard shortcuts for ultra-fast desktop flow
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (activeTab !== 'dashboard' && activeTab !== 'ledger') {
          setActiveTab('dashboard');
        }
        setTimeout(() => expenseQuickAddRef.current?.focus(), 30);
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (activeTab !== 'dashboard' && activeTab !== 'ledger') {
          setActiveTab('dashboard');
        }
        setTimeout(() => incomeQuickAddRef.current?.focus(), 30);
        return;
      }

      if (isInputFocused) return;

      if (e.key === '1') setActiveTab('dashboard');
      else if (e.key === '2') setActiveTab('ledger');
      else if (e.key === '3') setActiveTab('analytics');
      else if (e.key === '4') setActiveTab('settings');
      else if (e.key === '/') {
        e.preventDefault();
        if (activeTab !== 'dashboard' && activeTab !== 'ledger') {
          setActiveTab('ledger');
        }
        setTimeout(() => expenseSearchRef.current?.focus(), 30);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab]);

  const activeMonthData: MonthData | null = useMemo(() => {
    if (!store) return null;
    return (
      store.months[store.activeMonth] ||
      createEmptyMonth(store.activeMonth, store.settings.defaultSplit)
    );
  }, [store]);

  const availableMonths = useMemo(() => {
    if (!store) return [];
    return Object.keys(store.months).sort().reverse();
  }, [store]);

  const summary = useMemo(() => {
    if (!activeMonthData) return null;
    return calculateMonthSummary(activeMonthData);
  }, [activeMonthData]);

  const multiMonthTrends = useMemo(() => {
    if (!store) return [];
    return calculateMultiMonthTrends(store.months);
  }, [store]);

  const totalSplitIncome = useMemo(() => {
    if (!activeMonthData) return 0;
    return activeMonthData.incomes
      .filter((i) => i.allocationMode === 'split')
      .reduce((acc, i) => acc + i.amount, 0);
  }, [activeMonthData]);

  if (!store || !activeMonthData || !summary) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-xs text-slate-400">
        Loading Monthly Finance Manager...
      </div>
    );
  }

  const updateActiveMonth = (fn: (m: MonthData) => MonthData) => {
    commitStore((prev) => {
      const current =
        prev.months[prev.activeMonth] ||
        createEmptyMonth(prev.activeMonth, prev.settings.defaultSplit);
      return {
        ...prev,
        months: {
          ...prev.months,
          [prev.activeMonth]: fn(current),
        },
      };
    });
  };

  const handleSelectMonth = (monthKey: string) => {
    setSelectedBucketFilter('all');
    commitStore((prev) => ({
      ...prev,
      activeMonth: monthKey,
      months: prev.months[monthKey]
        ? prev.months
        : {
            ...prev.months,
            [monthKey]: createEmptyMonth(monthKey, prev.settings.defaultSplit),
          },
    }));
  };

  const handleShiftMonth = (delta: number) => {
    const nextKey = shiftMonthKey(store.activeMonth, delta);
    handleSelectMonth(nextKey);
  };

  const handleCreateNextMonth = () => {
    const nextKey = shiftMonthKey(store.activeMonth, 1);
    if (store.months[nextKey]) {
      handleSelectMonth(nextKey);
      showToast(`Switched to ${getMonthLabel(nextKey)}`);
      return;
    }

    const cloned = cloneRecurringForNewMonth(activeMonthData, nextKey);
    commitStore((prev) => ({
      ...prev,
      activeMonth: nextKey,
      months: {
        ...prev.months,
        [nextKey]: cloned,
      },
    }));
    showToast(
      `Created ${getMonthLabel(nextKey)} with ${cloned.incomes.length} recurring income(s) & ${cloned.expenses.length} bill(s)`
    );
  };

  const handleChangeSplit = (nextSplit: BucketSplit) => {
    updateActiveMonth((m) => ({ ...m, split: nextSplit }));
    showToast(`Split updated to ${nextSplit.mandatory}/${nextSplit.fun}/${nextSplit.savings}`);
  };

  const handleAddIncome = (entry: Omit<IncomeEntry, 'id'>) => {
    const created: IncomeEntry = {
      ...entry,
      id: `inc_${crypto.randomUUID().slice(0, 8)}`,
    };
    updateActiveMonth((m) => ({ ...m, incomes: [created, ...m.incomes] }));
    showToast(`Added income "${created.title}"`);
  };

  const handleUpdateIncome = (id: string, patch: Partial<IncomeEntry>) => {
    updateActiveMonth((m) => ({
      ...m,
      incomes: m.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  };

  const handleDeleteIncome = (id: string) => {
    const deleted = activeMonthData.incomes.find((i) => i.id === id);
    if (!deleted) return;
    updateActiveMonth((m) => ({
      ...m,
      incomes: m.incomes.filter((i) => i.id !== id),
    }));
    showToast(`Deleted "${deleted.title}"`, () => {
      updateActiveMonth((m) => ({ ...m, incomes: [deleted, ...m.incomes] }));
    });
  };

  const handleAddExpense = (entry: Omit<ExpenseEntry, 'id'>) => {
    const created: ExpenseEntry = {
      ...entry,
      id: `exp_${crypto.randomUUID().slice(0, 8)}`,
    };
    updateActiveMonth((m) => ({ ...m, expenses: [created, ...m.expenses] }));
    showToast(`Cut "${created.title}" from ${created.bucket}`);
  };

  const handleUpdateExpense = (id: string, patch: Partial<ExpenseEntry>) => {
    updateActiveMonth((m) => ({
      ...m,
      expenses: m.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const handleDeleteExpense = (id: string) => {
    const deleted = activeMonthData.expenses.find((e) => e.id === id);
    if (!deleted) return;
    updateActiveMonth((m) => ({
      ...m,
      expenses: m.expenses.filter((e) => e.id !== id),
    }));
    showToast(`Removed fee "${deleted.title}"`, () => {
      updateActiveMonth((m) => ({ ...m, expenses: [deleted, ...m.expenses] }));
    });
  };

  const handleDuplicateExpense = (entry: ExpenseEntry) => {
    const copy: ExpenseEntry = {
      ...entry,
      id: `exp_${crypto.randomUUID().slice(0, 8)}`,
      title: `${entry.title} (copy)`,
    };
    updateActiveMonth((m) => ({ ...m, expenses: [copy, ...m.expenses] }));
    showToast(`Duplicated "${entry.title}"`);
  };

  const handleUpdateSettings = (nextSettings: AppSettings) => {
    commitStore((prev) => ({ ...prev, settings: nextSettings }));
  };

  const handleExportCsv = async () => {
    const csv = monthToCsv(activeMonthData);
    const res = await exportTextFile(`finance-${activeMonthData.monthKey}.csv`, csv, 'csv');
    if (res.ok) showToast(`Exported ${activeMonthData.monthKey} to CSV`);
  };

  const handleExportJson = async () => {
    const res = await exportTextFile(
      `monthly-finance-backup-${store.activeMonth}.json`,
      JSON.stringify(store, null, 2),
      'json'
    );
    if (res.ok) showToast('Saved full JSON backup');
  };

  const handleImportJson = async () => {
    const res = await importJsonBackup();
    if (res.ok && res.data && res.data.months) {
      setStore(res.data);
      saveStore(res.data);
      showToast('Imported JSON backup successfully');
    } else if (res.error) {
      showToast(`Import failed: ${res.error}`);
    }
  };

  const handleClearSampleData = () => {
    const fresh = createEmptyStore();
    setStore(fresh);
    saveStore(fresh);
    setSelectedBucketFilter('all');
    showToast('Started fresh — enter your monthly salary to begin!');
  };

  const handleLoadDemoData = () => {
    const demo = createStarterStore();
    setStore(demo);
    saveStore(demo);
    setSelectedBucketFilter('all');
    showToast('Loaded 4-month demo dataset');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeMonth={store.activeMonth}
        availableMonths={availableMonths}
        onSelectMonth={handleSelectMonth}
        onShiftMonth={handleShiftMonth}
        onCreateNextMonth={handleCreateNextMonth}
        split={activeMonthData.split}
        onExportCsv={handleExportCsv}
        isSampleData={store.settings.isSampleData}
        onClearSampleData={handleClearSampleData}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Compact Top Title Strip */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#0b101d] px-5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-tight text-slate-100">
              {activeTab === 'dashboard' && `Overview & Quick Split — ${getMonthLabel(store.activeMonth)}`}
              {activeTab === 'ledger' && `Full Tables & Ledger — ${getMonthLabel(store.activeMonth)}`}
              {activeTab === 'analytics' && `Analytics Lab — ${getMonthLabel(store.activeMonth)}`}
              {activeTab === 'settings' && 'Settings, Categories & Backups'}
            </h2>
            {selectedBucketFilter !== 'all' && (activeTab === 'dashboard' || activeTab === 'ledger') && (
              <button
                type="button"
                onClick={() => setSelectedBucketFilter('all')}
                className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/25"
              >
                Filtered: {selectedBucketFilter} ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline">Auto-saved locally</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5">
          <div className="mx-auto max-w-[1600px] space-y-4">
            {activeTab === 'dashboard' && (
              <>
                <TopSummaryBar
                  summary={summary}
                  currency={store.settings.currency}
                  selectedBucketFilter={selectedBucketFilter}
                  onSelectBucketFilter={setSelectedBucketFilter}
                />

                <BucketSplitBar
                  split={activeMonthData.split}
                  totalSplitIncome={totalSplitIncome}
                  currency={store.settings.currency}
                  onChangeSplit={handleChangeSplit}
                />

                <ExpenseTable
                  monthKey={activeMonthData.monthKey}
                  expenses={activeMonthData.expenses}
                  buckets={summary.buckets}
                  categoriesByBucket={store.settings.categories}
                  currency={store.settings.currency}
                  selectedBucketFilter={selectedBucketFilter}
                  onSelectBucketFilter={setSelectedBucketFilter}
                  quickAddTitleRef={expenseQuickAddRef}
                  searchInputRef={expenseSearchRef}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onDuplicateExpense={handleDuplicateExpense}
                />

                <IncomeTable
                  monthKey={activeMonthData.monthKey}
                  incomes={activeMonthData.incomes}
                  split={activeMonthData.split}
                  currency={store.settings.currency}
                  quickAddTitleRef={incomeQuickAddRef}
                  onAddIncome={handleAddIncome}
                  onUpdateIncome={handleUpdateIncome}
                  onDeleteIncome={handleDeleteIncome}
                  compact
                />
              </>
            )}

            {activeTab === 'ledger' && (
              <>
                <BucketSplitBar
                  split={activeMonthData.split}
                  totalSplitIncome={totalSplitIncome}
                  currency={store.settings.currency}
                  onChangeSplit={handleChangeSplit}
                />

                <IncomeTable
                  monthKey={activeMonthData.monthKey}
                  incomes={activeMonthData.incomes}
                  split={activeMonthData.split}
                  currency={store.settings.currency}
                  quickAddTitleRef={incomeQuickAddRef}
                  onAddIncome={handleAddIncome}
                  onUpdateIncome={handleUpdateIncome}
                  onDeleteIncome={handleDeleteIncome}
                />

                <ExpenseTable
                  monthKey={activeMonthData.monthKey}
                  expenses={activeMonthData.expenses}
                  buckets={summary.buckets}
                  categoriesByBucket={store.settings.categories}
                  currency={store.settings.currency}
                  selectedBucketFilter={selectedBucketFilter}
                  onSelectBucketFilter={setSelectedBucketFilter}
                  quickAddTitleRef={expenseQuickAddRef}
                  searchInputRef={expenseSearchRef}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onDuplicateExpense={handleDuplicateExpense}
                />
              </>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                summary={summary}
                multiMonthTrends={multiMonthTrends}
                currency={store.settings.currency}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={store.settings}
                onUpdateSettings={handleUpdateSettings}
                onExportJson={handleExportJson}
                onExportCsv={handleExportCsv}
                onImportJson={handleImportJson}
                onLoadDemoData={handleLoadDemoData}
                onResetAllData={handleClearSampleData}
              />
            )}
          </div>
        </div>
      </main>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default App;
