import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  Database,
  Download,
  Globe,
  HardDrive,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AppSettings,
  BucketConfig,
  CURRENCY_PRESETS,
  CurrencyConfig,
  ExpenseStatus,
  getBucketTheme,
} from '../types/finance';
import {
  DEFAULT_EXCHANGE_RATES,
  convertMoney,
  fetchLiveExchangeRates,
} from '../lib/currency';
import { FALLBACK_CATEGORIES } from '../lib/seed';
import { formatMoney } from '../lib/format';
import { getStoragePath } from '../lib/storage';
import { CloudStatus } from '../lib/cloud';
import { CloudSyncPanel } from './CloudSyncPanel';

interface SettingsViewProps {
  buckets: BucketConfig[];
  settings: AppSettings;
  stats: {
    monthCount: number;
    incomeCount: number;
    expenseCount: number;
  };
  cloudStatus: CloudStatus;
  cloudSyncing: boolean;
  onUpdateSettings: (next: AppSettings) => void;
  onChangeCurrency: (currency: CurrencyConfig) => void;
  onSaveBucketsAsDefault: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: () => void;
  onLoadDemoData: () => void;
  onResetAllData: () => void;
  onPickCloudFolder: () => void;
  onConnectCloudFolder: (dir: string) => void;
  onConnectGoogle: (clientId: string, clientSecret: string) => Promise<void>;
  onConnectOneDrive: (clientId: string) => Promise<void>;
  onCloudPush: () => void;
  onCloudPull: () => void;
  onCloudDisconnect: () => void;
  onCloudToggleAutoSync: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  buckets,
  settings,
  stats,
  cloudStatus,
  cloudSyncing,
  onUpdateSettings,
  onChangeCurrency,
  onSaveBucketsAsDefault,
  onExportJson,
  onExportCsv,
  onImportJson,
  onLoadDemoData,
  onResetAllData,
  onPickCloudFolder,
  onConnectCloudFolder,
  onConnectGoogle,
  onConnectOneDrive,
  onCloudPush,
  onCloudPull,
  onCloudDisconnect,
  onCloudToggleAutoSync,
}) => {
  const [storagePath, setStoragePath] = useState('Loading...');
  const [selectedBucketId, setSelectedBucketId] = useState<string>(buckets[0]?.id || 'mandatory');
  const [newCategory, setNewCategory] = useState('');
  const [fetchingRates, setFetchingRates] = useState(false);
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    getStoragePath().then(setStoragePath);
  }, []);

  useEffect(() => {
    if (!buckets.some((b) => b.id === selectedBucketId) && buckets[0]) {
      setSelectedBucketId(buckets[0].id);
    }
  }, [buckets, selectedBucketId]);

  const rates = settings.exchangeRates || DEFAULT_EXCHANGE_RATES;
  const autoConvert = settings.autoConvertOnCurrencySwitch ?? true;
  const autoCarry = settings.autoCarryOverNextMonth ?? true;
  const defaultStatus: ExpenseStatus = settings.defaultExpenseStatus ?? 'paid';
  const maxTables = settings.maxVisibleTables ?? 3;

  const handleRateChange = (code: string, raw: string) => {
    const num = parseFloat(raw);
    if (Number.isNaN(num) || num <= 0) return;
    onUpdateSettings({
      ...settings,
      exchangeRates: {
        ...rates,
        [code]: num,
      },
    });
  };

  const handleFetchLiveRates = async () => {
    setFetchingRates(true);
    setRateFeedback(null);
    const live = await fetchLiveExchangeRates();
    setFetchingRates(false);
    if (live) {
      onUpdateSettings({ ...settings, exchangeRates: live });
      setRateFeedback('Live rates updated');
    } else {
      setRateFeedback('Offline — using saved rates');
    }
    window.setTimeout(() => setRateFeedback(null), 3500);
  };

  const handleResetRates = () => {
    onUpdateSettings({
      ...settings,
      exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
    });
    setRateFeedback('Reset to default rates');
    window.setTimeout(() => setRateFeedback(null), 2500);
  };

  const activeBucket = buckets.find((b) => b.id === selectedBucketId) || buckets[0];
  const activeCategories = activeBucket
    ? settings.categories[activeBucket.id] || FALLBACK_CATEGORIES
    : FALLBACK_CATEGORIES;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBucket) return;
    const val = newCategory.trim();
    if (!val || activeCategories.includes(val)) return;
    onUpdateSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [activeBucket.id]: [...activeCategories, val],
      },
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (!activeBucket || activeCategories.length <= 1) return;
    onUpdateSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [activeBucket.id]: activeCategories.filter((c) => c !== cat),
      },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* LEFT COLUMN: CURRENCY CONVERSION + WORKFLOW RULES */}
      <div className="space-y-4 xl:col-span-7">
        {/* 1. Currency & Live Exchange Rate Table */}
        <section className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-green-700 px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Currency Converter & Exchange Rates
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {rateFeedback && (
                <span className="rounded bg-yellow-300 px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                  {rateFeedback}
                </span>
              )}
              <button
                type="button"
                disabled={fetchingRates}
                onClick={handleFetchLiveRates}
                className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-bold text-green-800 transition hover:bg-green-50 disabled:opacity-60"
              >
                <Globe className={`h-3 w-3 ${fetchingRates ? 'animate-spin' : ''}`} />
                {fetchingRates ? 'Fetching...' : 'Live Rates'}
              </button>
              <button
                type="button"
                onClick={handleResetRates}
                title="Reset rates to defaults"
                className="flex items-center gap-1 rounded bg-green-800 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-green-900"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-yellow-50 px-3 py-2 text-xs">
            <span className="text-neutral-700">
              Active currency:{' '}
              <b className="font-mono text-green-800">
                {settings.currency.code} ({settings.currency.symbol.trim()})
              </b>
              {' · '}
              {autoConvert
                ? 'Switching converts all salaries, cuts & monthly fees automatically.'
                : 'Symbol-only mode (amounts stay unchanged).'}
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 font-bold text-neutral-800">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    autoConvertOnCurrencySwitch: e.target.checked,
                  })
                }
                className="h-3.5 w-3.5 accent-green-700"
              />
              Auto-convert amounts
            </label>
          </div>

          <table className="excel-table text-xs tabular-nums">
            <thead>
              <tr className="bg-neutral-100 text-[11px] font-bold text-neutral-600">
                <th className="px-3 py-1.5 text-left">Currency</th>
                <th className="w-20 px-2 py-1.5 text-center">Symbol</th>
                <th className="w-36 px-2 py-1.5 text-right">1 USD = (Tap to edit)</th>
                <th className="w-36 px-2 py-1.5 text-right">1,000 USD Preview</th>
                <th className="w-36 px-2 py-1.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {CURRENCY_PRESETS.map((curr) => {
                const isActive = settings.currency.code === curr.code;
                const rateVal = rates[curr.code] ?? DEFAULT_EXCHANGE_RATES[curr.code] ?? 1;
                const preview1000 = convertMoney(1000, 'USD', curr.code, rates, curr.decimals);

                return (
                  <tr
                    key={curr.code}
                    className={isActive ? 'bg-green-50/80' : 'hover:bg-yellow-50/40'}
                  >
                    <td className="px-3 py-1.5 font-bold text-neutral-900">
                      {curr.code}
                      {isActive && (
                        <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-neutral-700">
                      {curr.symbol.trim()}
                    </td>
                    <td className="p-0">
                      {curr.code === 'USD' ? (
                        <div className="px-2 py-1.5 text-right font-mono text-neutral-500">
                          1.0000 (Base)
                        </div>
                      ) : (
                        <input
                          type="number"
                          step="0.001"
                          min="0.0001"
                          value={rateVal}
                          onChange={(e) => handleRateChange(curr.code, e.target.value)}
                          className="excel-cell-input text-right font-mono font-semibold text-neutral-900"
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-green-800">
                      {formatMoney(preview1000, curr)}
                    </td>
                    <td className="p-1 text-center">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onChangeCurrency(curr)}
                          className="w-full rounded border border-green-700 bg-white px-2 py-1 text-[11px] font-bold text-green-800 transition hover:bg-green-600 hover:text-white"
                        >
                          {autoConvert ? `Convert to ${curr.code}` : `Use ${curr.code}`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* 2. Practical Workflow Rules */}
        <section className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-2">
            <Sliders className="h-4 w-4 text-green-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
              Workflow & Sheet Preferences
            </span>
          </div>

          <table className="excel-table text-xs">
            <tbody>
              <tr>
                <td className="px-3 py-2.5">
                  <div className="font-bold text-neutral-900">Next Month Rollover</div>
                  <div className="text-[11px] text-neutral-500">
                    Carry recurring salary, recurring cuts & your budget splits when pressing &gt;
                  </div>
                </td>
                <td className="w-44 px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        autoCarryOverNextMonth: !autoCarry,
                      })
                    }
                    className={`rounded border px-3 py-1 text-xs font-bold transition ${
                      autoCarry
                        ? 'border-green-700 bg-green-600 text-white'
                        : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {autoCarry ? 'Enabled (ON)' : 'Blank Month (OFF)'}
                  </button>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2.5">
                  <div className="font-bold text-neutral-900">Default New Expense Status</div>
                  <div className="text-[11px] text-neutral-500">
                    Choose whether newly added fees start as Paid or Scheduled
                  </div>
                </td>
                <td className="w-44 px-3 py-2.5 text-right">
                  <div className="inline-flex overflow-hidden rounded border border-neutral-300">
                    {(['paid', 'scheduled'] as ExpenseStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, defaultExpenseStatus: st })
                        }
                        className={`px-2.5 py-1 text-[11px] font-bold capitalize transition ${
                          defaultStatus === st
                            ? st === 'paid'
                              ? 'bg-green-600 text-white'
                              : 'bg-yellow-400 text-neutral-950'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2.5">
                  <div className="font-bold text-neutral-900">Max Expense Tables Side-by-Side</div>
                  <div className="text-[11px] text-neutral-500">
                    Control how many bucket expense tables appear at once on the Salary tab
                  </div>
                </td>
                <td className="w-44 px-3 py-2.5 text-right">
                  <div className="inline-flex overflow-hidden rounded border border-neutral-300">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, maxVisibleTables: n })
                        }
                        className={`px-3 py-1 font-mono text-xs font-bold transition ${
                          maxTables === n
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="px-3 py-2.5">
                  <div className="font-bold text-neutral-900">Default Splits Template</div>
                  <div className="text-[11px] text-neutral-500">
                    Save this month&apos;s {buckets.length} custom splits & colors as default for future blank months
                  </div>
                </td>
                <td className="w-44 px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={onSaveBucketsAsDefault}
                    className="inline-flex items-center gap-1.5 rounded border border-green-700 bg-green-50 px-3 py-1.5 text-[11px] font-bold text-green-800 transition hover:bg-green-600 hover:text-white"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Template
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* RIGHT COLUMN: CLOUD SYNC + CATEGORY MANAGER + WORKBOOK BACKUPS */}
      <div className="space-y-4 xl:col-span-5">
        <CloudSyncPanel
          status={cloudStatus}
          syncing={cloudSyncing}
          onPickFolder={onPickCloudFolder}
          onConnectDetectedFolder={onConnectCloudFolder}
          onConnectGoogle={onConnectGoogle}
          onConnectOneDrive={onConnectOneDrive}
          onPush={onCloudPush}
          onPull={onCloudPull}
          onDisconnect={onCloudDisconnect}
          onToggleAutoSync={onCloudToggleAutoSync}
        />

        {/* 3. Clean Tabbed Category Manager */}
        <section className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-100 px-3 py-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-green-700" />
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
                Categories Manager
              </span>
            </div>
            <span className="font-mono text-[11px] text-neutral-500">
              {activeCategories.length} categories
            </span>
          </div>

          {/* Bucket selector tabs */}
          <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50 p-2">
            {buckets.map((b) => {
              const theme = getBucketTheme(b.color);
              const selected = activeBucket?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBucketId(b.id)}
                  className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-bold transition ${
                    selected
                      ? theme.headerBgClass + ' border-transparent shadow-xs'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-yellow-50'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selected ? 'bg-white' : theme.dotClass
                    }`}
                  />
                  {b.name}
                </button>
              );
            })}
          </div>

          {/* Add category row + Excel list */}
          <form onSubmit={handleAddCategory} className="flex border-b border-neutral-300 bg-yellow-50">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={`+ Add category to ${activeBucket?.name || 'bucket'}...`}
              className="excel-cell-input flex-1 text-xs placeholder-neutral-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1 bg-green-600 px-3 text-xs font-bold text-white transition hover:bg-green-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </form>

          <div className="max-h-60 overflow-y-auto">
            <table className="excel-table text-xs">
              <tbody>
                {activeCategories.map((cat, idx) => (
                  <tr key={cat} className="hover:bg-yellow-50/40">
                    <td className="w-8 bg-neutral-50 py-1.5 text-center font-mono text-[11px] text-neutral-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-neutral-800">{cat}</td>
                    <td className="w-9 p-0 text-center">
                      <button
                        type="button"
                        disabled={activeCategories.length <= 1}
                        onClick={() => handleRemoveCategory(cat)}
                        title="Remove category"
                        className="flex h-full w-full items-center justify-center py-1.5 text-neutral-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-25"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Data, Backups & Reset */}
        <section className="overflow-hidden border border-neutral-300 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-2">
            <Database className="h-4 w-4 text-green-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-800">
              Local Workbook & Backups
            </span>
          </div>

          {/* Live stats strip */}
          <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-50 text-center tabular-nums">
            <div className="border-r border-neutral-200 py-2">
              <div className="font-mono text-base font-bold text-neutral-900">{stats.monthCount}</div>
              <div className="text-[10px] font-semibold uppercase text-neutral-500">Months</div>
            </div>
            <div className="border-r border-neutral-200 py-2">
              <div className="font-mono text-base font-bold text-green-700">{stats.incomeCount}</div>
              <div className="text-[10px] font-semibold uppercase text-neutral-500">Incomes/Cuts</div>
            </div>
            <div className="py-2">
              <div className="font-mono text-base font-bold text-red-700">{stats.expenseCount}</div>
              <div className="text-[10px] font-semibold uppercase text-neutral-500">Expenses</div>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-600">
              <HardDrive className="h-3.5 w-3.5 shrink-0 text-green-700" />
              <span className="truncate font-mono">{storagePath}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportCsv}
                className="flex items-center justify-center gap-1.5 rounded border border-green-700 bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                type="button"
                onClick={onExportJson}
                className="flex items-center justify-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 transition hover:bg-yellow-50"
              >
                <Download className="h-3.5 w-3.5 text-green-700" /> Backup JSON
              </button>
              <button
                type="button"
                onClick={onImportJson}
                className="flex items-center justify-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 transition hover:bg-yellow-50"
              >
                <Upload className="h-3.5 w-3.5 text-yellow-700" /> Restore JSON
              </button>
              <button
                type="button"
                onClick={onLoadDemoData}
                className="flex items-center justify-center gap-1.5 rounded border border-yellow-400 bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-950 transition hover:bg-yellow-200"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Load Demo
              </button>
            </div>

            <div className="border-t border-neutral-200 pt-2.5">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All Data & Start Blank
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded border border-red-300 bg-red-50 px-3 py-2">
                  <span className="text-xs font-bold text-red-800">Erase all months?</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onResetAllData();
                        setConfirmReset(false);
                      }}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Yes, Erase
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="rounded border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
