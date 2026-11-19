import { FinanceStore } from '../types/finance';

export type CloudProvider = 'google' | 'onedrive' | 'folder' | null;

export interface DetectedCloudFolder {
  label: string;
  dir: string;
}

export interface CloudStatus {
  connected: boolean;
  provider: CloudProvider;
  autoSync: boolean;
  folderPath: string;
  accountEmail: string;
  lastSyncedAt: string | null;
  googleClientId: string;
  onedriveClientId: string;
  redirectUri: string;
  detectedFolders: DetectedCloudFolder[];
}

interface CloudIPCResult {
  ok: boolean;
  canceled?: boolean;
  error?: string;
  status?: CloudStatus;
  data?: FinanceStore;
}

interface CloudBridge {
  status: () => Promise<CloudStatus>;
  pickFolder: () => Promise<CloudIPCResult>;
  connectFolder: (folderPath: string) => Promise<CloudIPCResult>;
  connectGoogle: (creds: { clientId: string; clientSecret?: string }) => Promise<CloudIPCResult>;
  connectOneDrive: (creds: { clientId: string }) => Promise<CloudIPCResult>;
  push: (data: FinanceStore) => Promise<CloudIPCResult>;
  pull: () => Promise<CloudIPCResult>;
  disconnect: () => Promise<CloudIPCResult>;
  setAutoSync: (enabled: boolean) => Promise<CloudIPCResult>;
}

function getBridge(): CloudBridge | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (window as any).financeAPI;
  return api?.cloud || null;
}

export const EMPTY_CLOUD_STATUS: CloudStatus = {
  connected: false,
  provider: null,
  autoSync: true,
  folderPath: '',
  accountEmail: '',
  lastSyncedAt: null,
  googleClientId: '',
  onedriveClientId: '',
  redirectUri: 'http://127.0.0.1:48291/callback',
  detectedFolders: [],
};

export function isCloudDesktopAvailable(): boolean {
  return Boolean(getBridge());
}

export async function getCloudStatus(): Promise<CloudStatus> {
  const bridge = getBridge();
  if (!bridge) return EMPTY_CLOUD_STATUS;
  return await bridge.status();
}

export async function pickCloudFolder(): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Run in the Desktop App (npm start) to use Cloud Sync.' };
  return await bridge.pickFolder();
}

export async function connectCloudFolder(folderPath: string): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Run in the Desktop App (npm start) to use Cloud Sync.' };
  return await bridge.connectFolder(folderPath);
}

export async function connectGoogleDrive(
  clientId: string,
  clientSecret?: string
): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Run in the Desktop App (npm start) to use Cloud Sync.' };
  return await bridge.connectGoogle({ clientId, clientSecret });
}

export async function connectOneDrive(clientId: string): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Run in the Desktop App (npm start) to use Cloud Sync.' };
  return await bridge.connectOneDrive({ clientId });
}

export async function pushCloudBackup(data: FinanceStore): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Desktop Cloud Sync unavailable in browser preview.' };
  return await bridge.push(data);
}

export async function pullCloudBackup(): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Desktop Cloud Sync unavailable in browser preview.' };
  return await bridge.pull();
}

export async function disconnectCloud(): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Desktop Cloud Sync unavailable.' };
  return await bridge.disconnect();
}

export async function setCloudAutoSync(enabled: boolean): Promise<CloudIPCResult> {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: 'Desktop Cloud Sync unavailable.' };
  return await bridge.setAutoSync(enabled);
}
