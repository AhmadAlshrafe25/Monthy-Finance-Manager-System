import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Cloud, Settings, Wallet } from 'lucide-react';
import {
  ActiveSheet,
  AppSettings,
  BucketColorKey,
  BucketConfig,
  CurrencyConfig,
  ExpenseEntry,
  FinanceStore,
  IncomeEntry,
  MonthData,
} from './types/finance';
import {
  calculateMonthSummary,
  calculateMultiMonthTrends,
  clampBucketSplitPercent,
  cloneRecurringForNewMonth,
  getMonthLabel,
  normalizeBucketsSplit,
} from './lib/calculations';
import {
  DEFAULT_EXCHANGE_RATES,
  convertStoreCurrency,
  getConversionRate,
} from './lib/currency';
import {
  FALLBACK_CATEGORIES,
  createEmptyMonth,
  createEmptyStore,
  createStarterStore,
  migrateStore,
} from './lib/seed';
import { getDefaultDateForMonth, monthToCsv, shiftMonthKey } from './lib/format';
import {
  exportTextFile,
  importJsonBackup,
  loadStore,
  saveStore,
} from './lib/storage';
import {
  CloudStatus,
  EMPTY_CLOUD_STATUS,
  connectCloudFolder,
  connectGoogleDrive,
  connectOneDrive,
  disconnectCloud,
  getCloudStatus,
  pickCloudFolder,
  pullCloudBackup,
  pushCloudBackup,
  setCloudAutoSync,
} from './lib/cloud';
import { ExcelHeader } from './components/ExcelHeader';
import { SalaryAndSplitSheet } from './components/SalaryAndSplitSheet';
import { BucketExpenseGrid } from './components/BucketExpenseGrid';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { Toast, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [store, setStore] = useState<FinanceStore | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('sheet');
  const [visibleBucketIds, setVisibleBucketIds] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(EMPTY_CLOUD_STATUS);
  const [cloudSyncing, setCloudSyncing] = useState(false);

  const salaryInputRef = useRef<HTMLInputElement | null>(null);
  const firstTableInputRef = useRef<HTMLInputElement | null>(null);
  const expenseSearchRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const autoSyncTimerRef = useRef<number | null>(null);
  const cloudStatusRef = useRef<CloudStatus>(EMPTY_CLOUD_STATUS);

  useEffect(() => {
    cloudStatusRef.current = cloudStatus;
  }, [cloudStatus]);

  const showToast = useCallback((text: string, onUndo?: () => void) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: String(Date.now()), text, onUndo });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const scheduleCloudAutoSync = useCallback((nextStore: FinanceStore) => {
    const st = cloudStatusRef.current;
    if (!st.connected || !st.autoSync) return;
    if (autoSyncTimerRef.current) window.clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = window.setTimeout(async () => {
      setCloudSyncing(true);
      const res = await pushCloudBackup(nextStore);
      setCloudSyncing(false);
      if (res.ok && res.status) {
        setCloudStatus(res.status);
      }
    }, 1800);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadStore().then((raw) => {
      if (!mounted) return;
      const migrated = migrateStore(raw);
      if (migrated && Object.keys(migrated.months).length > 0) {
        setStore(migrated);
        saveStore(migrated);
      } else {
        const starter = createStarterStore();
        setStore(starter);
        saveStore(starter);
      }
    });
    getCloudStatus().then((st) => {
      if (mounted) setCloudStatus(st);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const commitStore = useCallback(
    (updater: (prev: FinanceStore) => FinanceStore) => {
      setStore((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        saveStore(next);
        scheduleCloudAutoSync(next);
        return next;
      });
    },
    [scheduleCloudAutoSync]
  );

  const activeMonthData: MonthData | null = useMemo(() => {
    if (!store) return null;
    return (
      store.months[store.activeMonth] ||
      createEmptyMonth(store.activeMonth, store.settings.defaultBuckets)
    );
  }, [store]);

  const maxVisibleTables = Math.max(1, Math.min(3, store?.settings.maxVisibleTables ?? 3));

  // Keep visibleBucketIds synced (capped at maxVisibleTables, default 3)
  useEffect(() => {
    if (!activeMonthData) return;
    const validIds = activeMonthData.buckets.map((b) => b.id);
    setVisibleBucketIds((prev) => {
      const kept = prev.filter((id) => validIds.includes(id));
      if (kept.length >= Math.min(maxVisibleTables, validIds.length)) {
        return kept.slice(0, maxVisibleTables);
      }
      const next = [...kept];
      for (const id of validIds) {
        if (next.length >= maxVisibleTables) break;
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
  }, [activeMonthData, maxVisibleTables]);

  // Keyboard shortcuts
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
        setActiveSheet('sheet');
        setTimeout(() => firstTableInputRef.current?.focus(), 20);
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setActiveSheet('sheet');
        setTimeout(() => salaryInputRef.current?.focus(), 20);
        return;
      }

      if (isInputFocused) return;

      if (e.key === '1') setActiveSheet('sheet');
      else if (e.key === '2') setActiveSheet('analytics');
      else if (e.key === '3') setActiveSheet('settings');
      else if (e.key === '/') {
        e.preventDefault();
        setActiveSheet('sheet');
        setTimeout(() => expenseSearchRef.current?.focus(), 20);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

  const workbookStats = useMemo(() => {
    if (!store) return { monthCount: 0, incomeCount: 0, expenseCount: 0 };
    const monthList = Object.values(store.months);
    return {
      monthCount: monthList.length,
      incomeCount: monthList.reduce((s, m) => s + m.incomes.length, 0),
      expenseCount: monthList.reduce((s, m) => s + m.expenses.length, 0),
    };
  }, [store]);

  if (!store || !activeMonthData || !summary) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-xs text-neutral-600">
        Loading Monthly Finance Sheet...
      </div>
    );
  }

  const updateActiveMonth = (fn: (m: MonthData) => MonthData) => {
    commitStore((prev) => {
      const current =
        prev.months[prev.activeMonth] ||
        createEmptyMonth(prev.activeMonth, prev.settings.defaultBuckets);
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
    commitStore((prev) => ({
      ...prev,
      activeMonth: monthKey,
      months: prev.months[monthKey]
        ? prev.months
        : {
            ...prev.months,
            [monthKey]: createEmptyMonth(monthKey, prev.settings.defaultBuckets),
          },
    }));
  };

  const handleShiftMonth = (delta: number) => {
    const targetKey = shiftMonthKey(store.activeMonth, delta);
    if (store.months[targetKey]) {
      handleSelectMonth(targetKey);
      return;
    }

    const shouldCarry = store.settings.autoCarryOverNextMonth ?? true;
    if (delta > 0 && shouldCarry) {
      const cloned = cloneRecurringForNewMonth(activeMonthData, targetKey);
      commitStore((prev) => ({
        ...prev,
        activeMonth: targetKey,
        months: {
          ...prev.months,
          [targetKey]: cloned,
        },
      }));
      showToast(`Created ${getMonthLabel(targetKey)} with recurring items & splits`);
    } else {
      handleSelectMonth(targetKey);
    }
  };

  // Salary & Extra Income / Salary Cuts
  const handleSetSalary = (amount: number) => {
    updateActiveMonth((m) => {
      const existing = m.incomes.find((i) => i.type === 'salary');
      if (existing) {
        return {
          ...m,
          incomes: m.incomes.map((i) =>
            i.id === existing.id ? { ...i, amount } : i
          ),
        };
      }
      const created: IncomeEntry = {
        id: `inc_${crypto.randomUUID().slice(0, 8)}`,
        date: getDefaultDateForMonth(m.monthKey),
        title: 'Monthly Salary',
        type: 'salary',
        amount,
        allocationMode: 'split',
        recurring: true,
      };
      return { ...m, incomes: [created, ...m.incomes] };
    });
  };

  const handleAddIncome = (entry: Omit<IncomeEntry, 'id'>) => {
    const created: IncomeEntry = {
      ...entry,
      id: `inc_${crypto.randomUUID().slice(0, 8)}`,
    };
    updateActiveMonth((m) => ({ ...m, incomes: [...m.incomes, created] }));
    showToast(created.amount < 0 ? `Deducted "${created.title}"` : `Added "${created.title}"`);
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
    showToast(`Removed "${deleted.title}"`, () => {
      updateActiveMonth((m) => ({ ...m, incomes: [...m.incomes, deleted] }));
    });
  };

  // Dynamic Budget Split Buckets (Total Split % can NEVER exceed 100%)
  const handleAddBucket = (name: string, color: BucketColorKey, splitPercent: number) => {
    const id = `bkt_${crypto.randomUUID().slice(0, 8)}`;

    commitStore((prev) => {
      const current = prev.months[prev.activeMonth];
      const safePct = clampBucketSplitPercent(current.buckets, null, splitPercent);
      const newBucket: BucketConfig = { id, name, color, splitPercent: safePct };
      return {
        ...prev,
        settings: {
          ...prev.settings,
          categories: {
            ...prev.settings.categories,
            [id]: [...FALLBACK_CATEGORIES],
          },
        },
        months: {
          ...prev.months,
          [prev.activeMonth]: {
            ...current,
            buckets: [...current.buckets, newBucket],
          },
        },
      };
    });

    setVisibleBucketIds((prev) => {
      if (prev.length < maxVisibleTables) return [...prev, id];
      return [...prev.slice(1), id];
    });
    showToast(`Added "${name}" split & table`);
  };

  const handleUpdateBucket = (bucketId: string, patch: Partial<BucketConfig>) => {
    updateActiveMonth((m) => {
      const nextPatch =
        patch.splitPercent !== undefined
          ? {
              ...patch,
              splitPercent: clampBucketSplitPercent(m.buckets, bucketId, patch.splitPercent),
            }
          : patch;
      return {
        ...m,
        buckets: m.buckets.map((b) => (b.id === bucketId ? { ...b, ...nextPatch } : b)),
      };
    });
  };

  const handleDeleteBucket = (bucketId: string) => {
    if (activeMonthData.buckets.length <= 1) return;
    const deletedBucket = activeMonthData.buckets.find((b) => b.id === bucketId);
    if (!deletedBucket) return;
    const deletedExpenses = activeMonthData.expenses.filter((e) => e.bucket === bucketId);

    updateActiveMonth((m) => ({
      ...m,
      buckets: m.buckets.filter((b) => b.id !== bucketId),
      expenses: m.expenses.filter((e) => e.bucket !== bucketId),
    }));

    showToast(`Deleted "${deletedBucket.name}" split`, () => {
      updateActiveMonth((m) => ({
        ...m,
        buckets: [...m.buckets, deletedBucket],
        expenses: [...deletedExpenses, ...m.expenses],
      }));
    });
  };

  const handleAutoBalanceSplit = () => {
    updateActiveMonth((m) => ({
      ...m,
      buckets: normalizeBucketsSplit(m.buckets),
    }));
    showToast('Balanced all splits to 100%');
  };

  const handleSaveBucketsAsDefault = () => {
    commitStore((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        defaultBuckets: activeMonthData.buckets.map((b) => ({ ...b })),
      },
    }));
    showToast('Saved current splits as default template for new months');
  };

  // Max-N Bucket Table Visibility Controls
  const handleToggleVisibleBucket = (bucketId: string) => {
    setVisibleBucketIds((prev) => {
      if (prev.includes(bucketId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== bucketId);
      }
      if (prev.length < maxVisibleTables) return [...prev, bucketId];
      return [...prev.slice(1), bucketId];
    });
  };

  const handleFocusBucketTable = (bucketId: string) => {
    setVisibleBucketIds((prev) => {
      if (prev.includes(bucketId)) return prev;
      if (prev.length < maxVisibleTables) return [...prev, bucketId];
      return [...prev.slice(1), bucketId];
    });
  };

  const handleShiftVisibleWindow = (delta: number) => {
    const allIds = activeMonthData.buckets.map((b) => b.id);
    if (allIds.length <= maxVisibleTables) return;
    setVisibleBucketIds((prev) => {
      const firstIdx = Math.max(0, allIds.indexOf(prev[0] || allIds[0]));
      const nextStart = (firstIdx + delta + allIds.length) % allIds.length;
      const result: string[] = [];
      for (let i = 0; i < maxVisibleTables; i++) {
        result.push(allIds[(nextStart + i) % allIds.length]);
      }
      return result;
    });
  };

  // Expenses
  const handleAddExpense = (entry: Omit<ExpenseEntry, 'id'>) => {
    const created: ExpenseEntry = {
      ...entry,
      id: `exp_${crypto.randomUUID().slice(0, 8)}`,
    };
    updateActiveMonth((m) => ({ ...m, expenses: [created, ...m.expenses] }));
    showToast(`Cut "${created.title}"`);
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
    showToast(`Deleted "${deleted.title}"`, () => {
      updateActiveMonth((m) => ({ ...m, expenses: [deleted, ...m.expenses] }));
    });
  };

  // Settings & Real Currency Conversion
  const handleUpdateSettings = (nextSettings: AppSettings) => {
    commitStore((prev) => ({ ...prev, settings: nextSettings }));
  };

  const handleChangeCurrency = (targetCurrency: CurrencyConfig) => {
    const prevSnapshot = store;
    const fromCode = store.settings.currency.code;
    const toCode = targetCurrency.code;
    if (fromCode === toCode) return;

    const shouldConvert = store.settings.autoConvertOnCurrencySwitch ?? true;
    const rates = store.settings.exchangeRates || DEFAULT_EXCHANGE_RATES;
    const rate = getConversionRate(fromCode, toCode, rates);

    if (shouldConvert) {
      const converted = convertStoreCurrency(store, targetCurrency);
      setStore(converted);
      saveStore(converted);
      scheduleCloudAutoSync(converted);
      showToast(
        `Converted ${fromCode} → ${toCode} (1 ${fromCode} = ${rate.toFixed(3)} ${toCode})`,
        () => {
          setStore(prevSnapshot);
          saveStore(prevSnapshot);
          scheduleCloudAutoSync(prevSnapshot);
        }
      );
    } else {
      commitStore((prev) => ({
        ...prev,
        settings: { ...prev.settings, currency: targetCurrency },
      }));
      showToast(`Changed currency symbol to ${toCode}`);
    }
  };

  const handleExportCsv = async () => {
    const csv = monthToCsv(activeMonthData);
    const res = await exportTextFile(`finance-${activeMonthData.monthKey}.csv`, csv, 'csv');
    if (res.ok) showToast(`Exported ${activeMonthData.monthKey}.csv`);
  };

  const handleExportJson = async () => {
    const res = await exportTextFile(
      `monthly-finance-backup-${store.activeMonth}.json`,
      JSON.stringify(store, null, 2),
      'json'
    );
    if (res.ok) showToast('Saved JSON backup');
  };

  const handleImportJson = async () => {
    const res = await importJsonBackup();
    if (res.ok && res.data) {
      const migrated = migrateStore(res.data);
      if (migrated) {
        setStore(migrated);
        saveStore(migrated);
        showToast('Imported JSON backup');
      }
    }
  };

  const handleClearDemo = () => {
    const fresh = createEmptyStore(store.settings.currency);
    setStore(fresh);
    saveStore(fresh);
    setActiveSheet('sheet');
    showToast('Blank sheet ready — type your salary in Row 1!');
    setTimeout(() => salaryInputRef.current?.focus(), 40);
  };

  const handleLoadDemo = () => {
    const demo = createStarterStore();
    setStore(demo);
    saveStore(demo);
    scheduleCloudAutoSync(demo);
    showToast('Loaded sample demo sheet');
  };

  // Cloud Sync Handlers
  const handlePickCloudFolder = async () => {
    const res = await pickCloudFolder();
    if (res.canceled) return;
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      showToast('Cloud folder linked! Pushing backup...');
      setCloudSyncing(true);
      const pushRes = await pushCloudBackup(store);
      setCloudSyncing(false);
      if (pushRes.ok && pushRes.status) {
        setCloudStatus(pushRes.status);
        showToast('Synced to cloud folder');
      } else if (pushRes.error) {
        showToast(`Sync error: ${pushRes.error}`);
      }
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleConnectCloudFolder = async (dir: string) => {
    const res = await connectCloudFolder(dir);
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      setCloudSyncing(true);
      const pushRes = await pushCloudBackup(store);
      setCloudSyncing(false);
      if (pushRes.ok && pushRes.status) {
        setCloudStatus(pushRes.status);
        showToast('Connected & synced to cloud folder');
      }
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleConnectGoogle = async (clientId: string, clientSecret: string) => {
    const res = await connectGoogleDrive(clientId, clientSecret);
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      showToast(`Connected Google Drive (${res.status.accountEmail})`);
      setCloudSyncing(true);
      const pushRes = await pushCloudBackup(store);
      setCloudSyncing(false);
      if (pushRes.ok && pushRes.status) {
        setCloudStatus(pushRes.status);
      }
    } else {
      showToast(res.error || 'Google Drive connection failed');
    }
  };

  const handleConnectOneDrive = async (clientId: string) => {
    const res = await connectOneDrive(clientId);
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      showToast(`Connected OneDrive (${res.status.accountEmail})`);
      setCloudSyncing(true);
      const pushRes = await pushCloudBackup(store);
      setCloudSyncing(false);
      if (pushRes.ok && pushRes.status) {
        setCloudStatus(pushRes.status);
      }
    } else {
      showToast(res.error || 'OneDrive connection failed');
    }
  };

  const handleCloudPush = async () => {
    setCloudSyncing(true);
    const res = await pushCloudBackup(store);
    setCloudSyncing(false);
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      showToast('Pushed latest workbook to cloud');
    } else {
      showToast(res.error || 'Cloud push failed');
    }
  };

  const handleCloudPull = async () => {
    const prevSnapshot = store;
    setCloudSyncing(true);
    const res = await pullCloudBackup();
    setCloudSyncing(false);
    if (res.ok && res.data) {
      const migrated = migrateStore(res.data);
      if (migrated) {
        setStore(migrated);
        saveStore(migrated);
        if (res.status) setCloudStatus(res.status);
        showToast('Pulled workbook from cloud', () => {
          setStore(prevSnapshot);
          saveStore(prevSnapshot);
        });
      }
    } else {
      showToast(res.error || 'Cloud pull failed');
    }
  };

  const handleCloudDisconnect = async () => {
    const res = await disconnectCloud();
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      showToast('Disconnected cloud sync');
    }
  };

  const handleCloudToggleAutoSync = async (enabled: boolean) => {
    const res = await setCloudAutoSync(enabled);
    if (res.ok && res.status) {
      setCloudStatus(res.status);
      showToast(enabled ? 'Cloud Auto-Sync enabled' : 'Cloud Auto-Sync paused');
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-neutral-900">
      <ExcelHeader
        activeMonth={store.activeMonth}
        availableMonths={availableMonths}
        currency={store.settings.currency}
        isSampleData={store.settings.isSampleData}
        onSelectMonth={handleSelectMonth}
        onShiftMonth={handleShiftMonth}
        onChangeCurrency={handleChangeCurrency}
        onExportCsv={handleExportCsv}
        onClearDemo={handleClearDemo}
      />

      <main className="flex-1 overflow-y-auto bg-neutral-50 p-3 lg:p-4">
        <div className="mx-auto max-w-[1650px] space-y-4">
          {activeSheet === 'sheet' && (
            <>
              <SalaryAndSplitSheet
                monthKey={activeMonthData.monthKey}
                buckets={activeMonthData.buckets}
                incomes={activeMonthData.incomes}
                summary={summary}
                currency={store.settings.currency}
                visibleBucketIds={visibleBucketIds}
                salaryInputRef={salaryInputRef}
                onFocusBucketTable={handleFocusBucketTable}
                onSetSalary={handleSetSalary}
                onAddIncome={handleAddIncome}
                onUpdateIncome={handleUpdateIncome}
                onDeleteIncome={handleDeleteIncome}
                onAddBucket={handleAddBucket}
                onUpdateBucket={handleUpdateBucket}
                onDeleteBucket={handleDeleteBucket}
                onAutoBalanceSplit={handleAutoBalanceSplit}
              />

              <BucketExpenseGrid
                monthKey={activeMonthData.monthKey}
                buckets={activeMonthData.buckets}
                visibleBucketIds={visibleBucketIds}
                maxVisibleTables={maxVisibleTables}
                defaultExpenseStatus={store.settings.defaultExpenseStatus ?? 'paid'}
                bucketMap={summary.bucketMap}
                expenses={activeMonthData.expenses}
                categoriesByBucket={store.settings.categories}
                currency={store.settings.currency}
                searchInputRef={expenseSearchRef}
                firstTableInputRef={firstTableInputRef}
                onToggleVisibleBucket={handleToggleVisibleBucket}
                onShiftVisibleWindow={handleShiftVisibleWindow}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            </>
          )}

          {activeSheet === 'analytics' && (
            <AnalyticsView
              buckets={activeMonthData.buckets}
              summary={summary}
              multiMonthTrends={multiMonthTrends}
              currency={store.settings.currency}
            />
          )}

          {activeSheet === 'settings' && (
            <SettingsView
              buckets={activeMonthData.buckets}
              settings={store.settings}
              stats={workbookStats}
              cloudStatus={cloudStatus}
              cloudSyncing={cloudSyncing}
              onUpdateSettings={handleUpdateSettings}
              onChangeCurrency={handleChangeCurrency}
              onSaveBucketsAsDefault={handleSaveBucketsAsDefault}
              onExportJson={handleExportJson}
              onExportCsv={handleExportCsv}
              onImportJson={handleImportJson}
              onLoadDemoData={handleLoadDemo}
              onResetAllData={handleClearDemo}
              onPickCloudFolder={handlePickCloudFolder}
              onConnectCloudFolder={handleConnectCloudFolder}
              onConnectGoogle={handleConnectGoogle}
              onConnectOneDrive={handleConnectOneDrive}
              onCloudPush={handleCloudPush}
              onCloudPull={handleCloudPull}
              onCloudDisconnect={handleCloudDisconnect}
              onCloudToggleAutoSync={handleCloudToggleAutoSync}
            />
          )}
        </div>
      </main>

      {/* Bottom Tabs: Simple Salary, Analytics, Settings */}
      <footer className="flex h-9 shrink-0 items-center justify-between border-t border-neutral-300 bg-neutral-100 px-3 select-none">
        <div className="flex h-full items-end gap-1">
          <button
            type="button"
            onClick={() => setActiveSheet('sheet')}
            className={`flex h-8 items-center gap-1.5 rounded-t border-x border-t px-4 text-xs font-bold transition ${
              activeSheet === 'sheet'
                ? 'border-neutral-300 border-b-white bg-white text-green-700 shadow-sm'
                : 'border-transparent bg-neutral-200/70 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Salary
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('analytics')}
            className={`flex h-8 items-center gap-1.5 rounded-t border-x border-t px-4 text-xs font-bold transition ${
              activeSheet === 'analytics'
                ? 'border-neutral-300 border-b-white bg-white text-green-700 shadow-sm'
                : 'border-transparent bg-neutral-200/70 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('settings')}
            className={`flex h-8 items-center gap-1.5 rounded-t border-x border-t px-4 text-xs font-bold transition ${
              activeSheet === 'settings'
                ? 'border-neutral-300 border-b-white bg-white text-green-700 shadow-sm'
                : 'border-transparent bg-neutral-200/70 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>

        <div className="hidden items-center gap-3 text-[11px] text-neutral-500 sm:flex">
          <span>
            <kbd className="rounded border border-neutral-300 bg-white px-1 font-mono text-[10px]">Alt+S</kbd> Salary
          </span>
          <span>
            <kbd className="rounded border border-neutral-300 bg-white px-1 font-mono text-[10px]">Alt+E</kbd> Add Fee
          </span>
          <span>
            <kbd className="rounded border border-neutral-300 bg-white px-1 font-mono text-[10px]">/</kbd> Search
          </span>
          <button
            type="button"
            onClick={() => setActiveSheet('settings')}
            className={`flex items-center gap-1 font-semibold transition ${
              cloudSyncing
                ? 'text-yellow-700'
                : cloudStatus.connected
                ? 'text-green-700 hover:underline'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Click to manage Cloud Sync in Settings"
          >
            <Cloud className="h-3.5 w-3.5" />
            {cloudSyncing
              ? 'Syncing cloud...'
              : cloudStatus.connected
              ? `Cloud: ${
                  cloudStatus.provider === 'google'
                    ? 'Google Drive'
                    : cloudStatus.provider === 'onedrive'
                    ? 'OneDrive'
                    : 'Synced Folder'
                }`
              : 'Local only'}
          </button>
        </div>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default App;
