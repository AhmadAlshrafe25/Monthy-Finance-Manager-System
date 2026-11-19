import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudOff,
  CloudUpload,
  Copy,
  FolderSync,
  HelpCircle,
  Loader2,
  Unlink,
} from 'lucide-react';
import { CloudStatus } from '../lib/cloud';

interface CloudSyncPanelProps {
  status: CloudStatus;
  syncing: boolean;
  onPickFolder: () => void;
  onConnectDetectedFolder: (dir: string) => void;
  onConnectGoogle: (clientId: string, clientSecret: string) => Promise<void>;
  onConnectOneDrive: (clientId: string) => Promise<void>;
  onPush: () => void;
  onPull: () => void;
  onDisconnect: () => void;
  onToggleAutoSync: (enabled: boolean) => void;
}

type ProviderTab = 'google' | 'onedrive' | 'folder';

export const CloudSyncPanel: React.FC<CloudSyncPanelProps> = ({
  status,
  syncing,
  onPickFolder,
  onConnectDetectedFolder,
  onConnectGoogle,
  onConnectOneDrive,
  onPush,
  onPull,
  onDisconnect,
  onToggleAutoSync,
}) => {
  const [providerTab, setProviderTab] = useState<ProviderTab>(
    status.provider || 'google'
  );
  const [googleClientId, setGoogleClientId] = useState(status.googleClientId || '');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [onedriveClientId, setOnedriveClientId] = useState(status.onedriveClientId || '');
  const [connecting, setConnecting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  React.useEffect(() => {
    if (status.googleClientId && !googleClientId) setGoogleClientId(status.googleClientId);
    if (status.onedriveClientId && !onedriveClientId) setOnedriveClientId(status.onedriveClientId);
  }, [status.googleClientId, status.onedriveClientId]);

  const copyRedirectUri = () => {
    navigator.clipboard?.writeText(status.redirectUri);
    setCopiedUri(true);
    window.setTimeout(() => setCopiedUri(false), 1800);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleClientId.trim()) return;
    setConnecting(true);
    try {
      await onConnectGoogle(googleClientId.trim(), googleClientSecret.trim());
    } finally {
      setConnecting(false);
    }
  };

  const handleOneDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onedriveClientId.trim()) return;
    setConnecting(true);
    try {
      await onConnectOneDrive(onedriveClientId.trim());
    } finally {
      setConnecting(false);
    }
  };

  const providerLabel =
    status.provider === 'google'
      ? 'Google Drive'
      : status.provider === 'onedrive'
      ? 'Microsoft OneDrive'
      : status.provider === 'folder'
      ? 'Synced Cloud Folder'
      : 'Not Connected';

  const lastSyncedLabel = status.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleString()
    : 'Not synced yet';

  return (
    <section className="overflow-hidden border border-neutral-300 bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 bg-green-700 px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">
            Personal Cloud Sync (Google Drive · OneDrive · Cloud Folder)
          </span>
        </div>

        <span
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
            status.connected
              ? 'bg-white text-green-800'
              : 'bg-green-900/70 text-green-100'
          }`}
        >
          {status.connected ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {providerLabel}
            </>
          ) : (
            <>
              <CloudOff className="h-3 w-3" /> Local Only
            </>
          )}
        </span>
      </div>

      {/* CONNECTED STATE */}
      {status.connected ? (
        <div className="space-y-3 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-green-300 bg-green-50 p-3">
            <div className="min-w-0 space-y-0.5">
              <div className="font-bold text-green-900">
                Connected to {providerLabel}
              </div>
              <div className="truncate font-mono text-[11px] text-green-800">
                {status.provider === 'folder' ? status.folderPath : status.accountEmail}
              </div>
              <div className="text-[11px] text-neutral-600">
                Last synced: <b className="text-neutral-800">{lastSyncedLabel}</b>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded border border-green-300 bg-white px-2.5 py-1.5 font-bold text-neutral-800">
              <input
                type="checkbox"
                checked={status.autoSync}
                onChange={(e) => onToggleAutoSync(e.target.checked)}
                className="h-3.5 w-3.5 accent-green-700"
              />
              Auto-sync on edit
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={syncing}
              onClick={onPush}
              className="flex items-center gap-1.5 rounded border border-green-700 bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CloudUpload className="h-3.5 w-3.5" />
              )}
              Push to Cloud
            </button>

            <button
              type="button"
              disabled={syncing}
              onClick={onPull}
              className="flex items-center gap-1.5 rounded border border-yellow-400 bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-950 transition hover:bg-yellow-200 disabled:opacity-60"
            >
              <CloudDownload className="h-3.5 w-3.5" />
              Pull from Cloud
            </button>

            <button
              type="button"
              onClick={onDisconnect}
              className="ml-auto flex items-center gap-1.5 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
            >
              <Unlink className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        /* DISCONNECTED STATE — CHOOSE PROVIDER */
        <div>
          {/* Provider Tabs */}
          <div className="grid grid-cols-3 border-b border-neutral-300 bg-neutral-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setProviderTab('google')}
              className={`border-r border-neutral-300 py-2 transition ${
                providerTab === 'google'
                  ? 'bg-white text-green-700 shadow-[inset_0_-2px_0_#15803d]'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Google Drive
            </button>
            <button
              type="button"
              onClick={() => setProviderTab('onedrive')}
              className={`border-r border-neutral-300 py-2 transition ${
                providerTab === 'onedrive'
                  ? 'bg-white text-green-700 shadow-[inset_0_-2px_0_#15803d]'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              OneDrive
            </button>
            <button
              type="button"
              onClick={() => setProviderTab('folder')}
              className={`py-2 transition ${
                providerTab === 'folder'
                  ? 'bg-white text-green-700 shadow-[inset_0_-2px_0_#15803d]'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Cloud Folder (Instant)
            </button>
          </div>

          <div className="p-3 text-xs">
            {/* TAB 1: GOOGLE DRIVE */}
            {providerTab === 'google' && (
              <form onSubmit={handleGoogleSubmit} className="space-y-3">
                <div className="flex items-start justify-between gap-2 rounded border border-neutral-200 bg-neutral-50 p-2.5 text-[11px] text-neutral-700">
                  <div>
                    Syncs directly to your own <b>Google Drive</b> hidden app folder (
                    <code className="font-mono">drive.appdata</code>). Tokens stay encrypted on your PC only.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide((g) => !g)}
                    className="flex shrink-0 items-center gap-1 rounded border border-neutral-300 bg-white px-2 py-1 font-bold text-neutral-800 hover:bg-yellow-50"
                  >
                    <HelpCircle className="h-3 w-3 text-green-700" />
                    {showGuide ? 'Hide Guide' : 'Setup Guide'}
                  </button>
                </div>

                {showGuide && (
                  <div className="space-y-1.5 rounded border border-yellow-300 bg-yellow-50 p-2.5 text-[11px] text-neutral-800">
                    <div className="font-bold">Quick Google Cloud Setup (Free, 2 mins):</div>
                    <ol className="list-decimal space-y-1 pl-4">
                      <li>Open <b>console.cloud.google.com</b> → create a project &amp; enable <b>Google Drive API</b>.</li>
                      <li>Go to <b>APIs &amp; Services → Credentials → Create OAuth Client ID → Desktop App</b>.</li>
                      <li>Copy the <b>Client ID</b> (and Client Secret if shown) and paste below, then click Connect.</li>
                    </ol>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-neutral-700">
                      Google OAuth Client ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="123456789-xxxx.apps.googleusercontent.com"
                      className="h-8 w-full rounded border border-neutral-300 bg-white px-2.5 font-mono text-[11px] outline-none focus:border-green-600 focus:bg-yellow-50/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-neutral-700">
                      Client Secret (Desktop apps)
                    </label>
                    <input
                      type="password"
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      placeholder="GOCSPX-..."
                      className="h-8 w-full rounded border border-neutral-300 bg-white px-2.5 font-mono text-[11px] outline-none focus:border-green-600 focus:bg-yellow-50/40"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <span>Redirect URI:</span>
                    <code className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-800">
                      {status.redirectUri}
                    </code>
                    <button
                      type="button"
                      onClick={copyRedirectUri}
                      className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-neutral-700 hover:bg-neutral-50"
                    >
                      {copiedUri ? 'Copied!' : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={connecting}
                    className="flex items-center gap-1.5 rounded bg-green-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                  >
                    {connecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {connecting ? 'Waiting for browser sign-in...' : 'Connect Google Drive'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ONEDRIVE */}
            {providerTab === 'onedrive' && (
              <form onSubmit={handleOneDriveSubmit} className="space-y-3">
                <div className="flex items-start justify-between gap-2 rounded border border-neutral-200 bg-neutral-50 p-2.5 text-[11px] text-neutral-700">
                  <div>
                    Syncs directly to your own <b>OneDrive</b> App Folder using OAuth 2.0 PKCE (no client secret needed).
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide((g) => !g)}
                    className="flex shrink-0 items-center gap-1 rounded border border-neutral-300 bg-white px-2 py-1 font-bold text-neutral-800 hover:bg-yellow-50"
                  >
                    <HelpCircle className="h-3 w-3 text-green-700" />
                    {showGuide ? 'Hide Guide' : 'Setup Guide'}
                  </button>
                </div>

                {showGuide && (
                  <div className="space-y-1.5 rounded border border-yellow-300 bg-yellow-50 p-2.5 text-[11px] text-neutral-800">
                    <div className="font-bold">Quick OneDrive / Azure Setup (Free, 2 mins):</div>
                    <ol className="list-decimal space-y-1 pl-4">
                      <li>Open <b>portal.azure.com → App registrations → New registration</b>.</li>
                      <li>Select <b>Personal Microsoft accounts</b> (or Any + Personal).</li>
                      <li>Add Redirect URI → Platform <b>Mobile and desktop applications</b> → <code className="font-mono">{status.redirectUri}</code>.</li>
                      <li>Copy the <b>Application (client) ID</b> and paste below.</li>
                    </ol>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-neutral-700">
                    Microsoft Application (Client) ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={onedriveClientId}
                    onChange={(e) => setOnedriveClientId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="h-8 w-full rounded border border-neutral-300 bg-white px-2.5 font-mono text-[11px] outline-none focus:border-green-600 focus:bg-yellow-50/40"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <span>Redirect URI:</span>
                    <code className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-800">
                      {status.redirectUri}
                    </code>
                    <button
                      type="button"
                      onClick={copyRedirectUri}
                      className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-neutral-700 hover:bg-neutral-50"
                    >
                      {copiedUri ? 'Copied!' : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={connecting}
                    className="flex items-center gap-1.5 rounded bg-green-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                  >
                    {connecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {connecting ? 'Waiting for browser sign-in...' : 'Connect OneDrive'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: ZERO-SETUP CLOUD FOLDER */}
            {providerTab === 'folder' && (
              <div className="space-y-3">
                <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5 text-[11px] text-neutral-700">
                  <b>Zero API keys needed!</b> Point the app to any local synced folder (Google Drive Desktop, OneDrive, rclone mount, GNOME Online Accounts, Dropbox, or Nextcloud). Every change syncs automatically.
                </div>

                {status.detectedFolders.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-neutral-700">
                      Detected Cloud Folders on Your Computer:
                    </div>
                    {status.detectedFolders.map((f) => (
                      <div
                        key={f.dir}
                        className="flex items-center justify-between gap-2 rounded border border-neutral-300 bg-white px-2.5 py-1.5"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-900">{f.label}</span>
                          <div className="truncate font-mono text-[10px] text-neutral-500">
                            {f.dir}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onConnectDetectedFolder(f.dir)}
                          className="shrink-0 rounded bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-green-700"
                        >
                          Use Folder
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onPickFolder}
                  className="flex w-full items-center justify-center gap-2 rounded border border-green-700 bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700"
                >
                  <FolderSync className="h-4 w-4" />
                  Choose Google Drive / OneDrive Folder...
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
