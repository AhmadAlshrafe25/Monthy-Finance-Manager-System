import { FinanceStore } from '../types/finance';

const LOCAL_STORAGE_KEY = 'monthly-finance-manager-store-v1';

interface ElectronFinanceAPI {
  isDesktop: boolean;
  load: () => Promise<FinanceStore | null>;
  save: (data: FinanceStore) => Promise<{ ok: boolean; path?: string; error?: string }>;
  getDataPath: () => Promise<string>;
  exportFile: (payload: {
    defaultName: string;
    content: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string }>;
  importJson: () => Promise<{ ok: boolean; canceled?: boolean; data?: FinanceStore; error?: string }>;
}

declare global {
  interface Window {
    financeAPI?: ElectronFinanceAPI;
  }
}

export function isDesktopEnv(): boolean {
  return Boolean(window.financeAPI?.isDesktop);
}

export async function loadStore(): Promise<FinanceStore | null> {
  if (window.financeAPI) {
    return await window.financeAPI.load();
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FinanceStore) : null;
  } catch {
    return null;
  }
}

export async function saveStore(store: FinanceStore): Promise<void> {
  if (window.financeAPI) {
    await window.financeAPI.save(store);
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export async function getStoragePath(): Promise<string> {
  if (window.financeAPI) {
    return await window.financeAPI.getDataPath();
  }
  return 'Browser localStorage (web preview mode)';
}

export async function exportTextFile(
  defaultName: string,
  content: string,
  extension: 'csv' | 'json'
): Promise<{ ok: boolean; path?: string }> {
  if (window.financeAPI) {
    const res = await window.financeAPI.exportFile({
      defaultName,
      content,
      filters:
        extension === 'csv'
          ? [{ name: 'CSV Spreadsheet', extensions: ['csv'] }]
          : [{ name: 'JSON Backup', extensions: ['json'] }],
    });
    return { ok: res.ok, path: res.filePath };
  }

  // Web browser fallback download
  const blob = new Blob([content], {
    type: extension === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true, path: defaultName };
}

export async function importJsonBackup(): Promise<{ ok: boolean; data?: FinanceStore; error?: string }> {
  if (window.financeAPI) {
    return await window.financeAPI.importJson();
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ ok: false });
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text) as FinanceStore;
        resolve({ ok: true, data });
      } catch (err) {
        resolve({ ok: false, error: (err as Error).message });
      }
    };
    input.click();
  });
}
