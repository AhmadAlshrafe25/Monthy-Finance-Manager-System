import React, { useEffect, useState } from 'react';
import {
  Database,
  Download,
  HardDrive,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AppSettings,
  BUCKET_META,
  BucketType,
  CURRENCY_PRESETS,
  CurrencyConfig,
} from '../types/finance';
import { BUCKETS } from '../lib/calculations';
import { getStoragePath } from '../lib/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: () => void;
  onLoadDemoData: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportJson,
  onExportCsv,
  onImportJson,
  onLoadDemoData,
  onResetAllData,
}) => {
  const [storagePath, setStoragePath] = useState('Loading...');
  const [newCatInputs, setNewCatInputs] = useState<Record<BucketType, string>>({
    mandatory: '',
    fun: '',
    savings: '',
  });
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    getStoragePath().then(setStoragePath);
  }, []);

  const handleCurrencyChange = (curr: CurrencyConfig) => {
    onUpdateSettings({ ...settings, currency: curr });
  };

  const handleAddCategory = (bucket: BucketType) => {
    const val = newCatInputs[bucket].trim();
    if (!val) return;
    if (settings.categories[bucket].includes(val)) return;

    onUpdateSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [bucket]: [...settings.categories[bucket], val],
      },
    });
    setNewCatInputs((prev) => ({ ...prev, [bucket]: '' }));
  };

  const handleRemoveCategory = (bucket: BucketType, cat: string) => {
    if (settings.categories[bucket].length <= 1) return;
    onUpdateSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [bucket]: settings.categories[bucket].filter((c) => c !== cat),
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Currency Picker */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Display Currency
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          Choose the currency symbol and decimal precision used across all tables and charts
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {CURRENCY_PRESETS.map((curr) => {
            const active = settings.currency.code === curr.code;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => handleCurrencyChange(curr)}
                className={`rounded-lg border px-3 py-2 text-center transition ${
                  active
                    ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="font-mono text-sm font-bold">{curr.symbol.trim()}</div>
                <div className="text-[10px] text-slate-400">{curr.code}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Categories per Bucket */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Bucket Categories
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          Customize the quick-select categories for Mandatory, Fun Spending, and Savings/Debt
        </p>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {BUCKETS.map((bucket) => {
            const meta = BUCKET_META[bucket];
            return (
              <div
                key={bucket}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {settings.categories[bucket].length} items
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {settings.categories[bucket].map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-200"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(bucket, cat)}
                        className="text-slate-500 hover:text-rose-400"
                        title="Remove category"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCatInputs[bucket]}
                    onChange={(e) =>
                      setNewCatInputs((prev) => ({ ...prev, [bucket]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(bucket)}
                    placeholder={`Add ${meta.shortLabel} category...`}
                    className="h-8 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory(bucket)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 transition hover:bg-sky-500 hover:text-slate-950"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup, Export, & Storage */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0f1624] p-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Local Storage & Data Portability
          </h3>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
          <HardDrive className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate font-mono text-[11px] text-slate-300">{storagePath}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportJson}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-500/50 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            Export Full JSON Backup
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            Export Active Month CSV
          </button>

          <button
            type="button"
            onClick={onImportJson}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-purple-500/50 hover:text-white"
          >
            <Upload className="h-3.5 w-3.5 text-purple-400" />
            Import JSON Backup
          </button>

          <button
            type="button"
            onClick={onLoadDemoData}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-amber-500/50 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
            Load Sample Demo Data
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="ml-auto flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Start Fresh (Clear All)
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-rose-300">Erase all months?</span>
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setConfirmReset(false);
                }}
                className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
