import React, { useEffect, useState } from 'react';
import { Download, HardDrive, Plus, RefreshCw, Trash2, Upload, X } from 'lucide-react';
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
    if (!val || settings.categories[bucket].includes(val)) return;
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
      {/* Currency */}
      <div className="border border-neutral-300 bg-white">
        <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
          Currency
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-8">
          {CURRENCY_PRESETS.map((curr) => {
            const active = settings.currency.code === curr.code;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => handleCurrencyChange(curr)}
                className={`rounded border px-3 py-2 text-center transition ${
                  active
                    ? 'border-green-700 bg-green-600 text-white'
                    : 'border-neutral-300 bg-white text-neutral-800 hover:bg-yellow-50'
                }`}
              >
                <div className="font-mono text-sm font-bold">{curr.symbol.trim()}</div>
                <div className={`text-[10px] ${active ? 'text-green-100' : 'text-neutral-500'}`}>
                  {curr.code}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="border border-neutral-300 bg-white">
        <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
          Bucket Categories
        </div>
        <div className="grid grid-cols-1 gap-4 p-3 lg:grid-cols-3">
          {BUCKETS.map((bucket) => {
            const meta = BUCKET_META[bucket];
            return (
              <div key={bucket} className="border border-neutral-300 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-500">
                    {settings.categories[bucket].length} items
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {settings.categories[bucket].map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-800"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(bucket, cat)}
                        className="text-neutral-400 hover:text-red-600"
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
                    className="h-8 flex-1 rounded border border-neutral-300 bg-white px-2.5 text-xs text-neutral-900 outline-none focus:border-green-600 focus:bg-yellow-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory(bucket)}
                    className="flex h-8 w-8 items-center justify-center rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data & Backup */}
      <div className="border border-neutral-300 bg-white">
        <div className="border-b border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-800">
          Local Storage, Backup & Reset
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2 border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
            <HardDrive className="h-4 w-4 shrink-0 text-green-700" />
            <span className="truncate font-mono text-[11px]">{storagePath}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="flex items-center gap-1.5 rounded border border-green-700 bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
            >
              <Download className="h-3.5 w-3.5" /> Export Month CSV
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-yellow-50"
            >
              <Download className="h-3.5 w-3.5 text-green-700" /> Export JSON Backup
            </button>
            <button
              type="button"
              onClick={onImportJson}
              className="flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-yellow-50"
            >
              <Upload className="h-3.5 w-3.5 text-yellow-700" /> Import JSON Backup
            </button>
            <button
              type="button"
              onClick={onLoadDemoData}
              className="flex items-center gap-1.5 rounded border border-yellow-400 bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-950 hover:bg-yellow-200"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Load Sample Data
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="ml-auto flex items-center gap-1.5 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All & Start Blank
              </button>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-bold text-red-700">Erase all months?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllData();
                    setConfirmReset(false);
                  }}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
