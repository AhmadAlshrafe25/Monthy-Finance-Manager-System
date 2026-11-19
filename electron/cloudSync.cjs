const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { app, dialog, shell, safeStorage } = require('electron');

const SYNC_FILENAME = 'monthly-finance-sync.json';
const CLOUD_CONFIG_FILENAME = 'cloud-config.json';
const OAUTH_PORT = 48291;
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}/callback`;

function getCloudConfigPath() {
  return path.join(app.getPath('userData'), CLOUD_CONFIG_FILENAME);
}

function encryptSecret(plainText) {
  if (!plainText) return '';
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return 'enc:' + safeStorage.encryptString(plainText).toString('base64');
    }
  } catch {
    // Fallback to plain storage if OS keyring is unavailable
  }
  return 'raw:' + Buffer.from(plainText, 'utf-8').toString('base64');
}

function decryptSecret(stored) {
  if (!stored) return '';
  try {
    if (stored.startsWith('enc:') && safeStorage && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'));
    }
    if (stored.startsWith('raw:')) {
      return Buffer.from(stored.slice(4), 'base64').toString('utf-8');
    }
  } catch {
    return '';
  }
  return stored;
}

function readCloudConfig() {
  const filePath = getCloudConfigPath();
  if (!fs.existsSync(filePath)) {
    return {
      provider: null, // 'folder' | 'google' | 'onedrive' | null
      autoSync: true,
      folderPath: '',
      accountEmail: '',
      lastSyncedAt: null,
      google: { clientId: '', clientSecretEnc: '', fileId: '' },
      onedrive: { clientId: '' },
      tokens: { accessEnc: '', refreshEnc: '', expiresAt: 0 },
    };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {
      provider: null,
      autoSync: true,
      folderPath: '',
      accountEmail: '',
      lastSyncedAt: null,
      google: { clientId: '', clientSecretEnc: '', fileId: '' },
      onedrive: { clientId: '' },
      tokens: { accessEnc: '', refreshEnc: '', expiresAt: 0 },
    };
  }
}

function writeCloudConfig(cfg) {
  const filePath = getCloudConfigPath();
  const tmp = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

function detectCloudFolders() {
  const home = os.homedir();
  const candidates = [
    { label: 'Google Drive', dir: path.join(home, 'Google Drive') },
    { label: 'Google Drive', dir: path.join(home, 'GoogleDrive') },
    { label: 'Google Drive', dir: path.join(home, 'gdrive') },
    { label: 'OneDrive', dir: path.join(home, 'OneDrive') },
    { label: 'OneDrive', dir: path.join(home, 'OneDrive - Personal') },
    { label: 'Dropbox', dir: path.join(home, 'Dropbox') },
    { label: 'Nextcloud', dir: path.join(home, 'Nextcloud') },
  ];

  // Also detect Linux GVFS Google Drive / OneDrive mounts if present
  try {
    const uid = typeof os.userInfo === 'function' ? os.userInfo().uid : null;
    if (uid !== null && uid >= 0) {
      const gvfsDir = `/run/user/${uid}/gvfs`;
      if (fs.existsSync(gvfsDir)) {
        for (const entry of fs.readdirSync(gvfsDir)) {
          if (entry.startsWith('google-drive:') || entry.startsWith('onedrive:')) {
            candidates.push({
              label: entry.startsWith('google-drive:') ? 'Google Drive (GVFS)' : 'OneDrive (GVFS)',
              dir: path.join(gvfsDir, entry),
            });
          }
        }
      }
    }
  } catch {
    // Ignore GVFS scan errors
  }

  const found = [];
  const seen = new Set();
  for (const c of candidates) {
    if (!seen.has(c.dir) && fs.existsSync(c.dir)) {
      try {
        if (fs.statSync(c.dir).isDirectory()) {
          seen.add(c.dir);
          found.push(c);
        }
      } catch {
        // Ignore unreadable paths
      }
    }
  }
  return found;
}

function getSafeStatus() {
  const cfg = readCloudConfig();
  return {
    connected: Boolean(cfg.provider),
    provider: cfg.provider,
    autoSync: cfg.autoSync ?? true,
    folderPath: cfg.folderPath || '',
    accountEmail: cfg.accountEmail || '',
    lastSyncedAt: cfg.lastSyncedAt || null,
    googleClientId: cfg.google?.clientId || '',
    onedriveClientId: cfg.onedrive?.clientId || '',
    redirectUri: REDIRECT_URI,
    detectedFolders: detectCloudFolders(),
  };
}

function base64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generatePkce() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function waitForOAuthCallback(expectedState, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, `http://127.0.0.1:${OAUTH_PORT}`);
        if (url.pathname !== '/callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDesc = url.searchParams.get('error_description');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (error || !code || state !== expectedState) {
          res.end(`
            <html><body style="font-family:sans-serif;padding:40px;text-align:center;">
              <h2 style="color:#dc2626;">Cloud Connection Failed</h2>
              <p>${errorDesc || error || 'Invalid authorization response.'}</p>
              <p>You can close this tab and return to Monthly Finance Sheet.</p>
            </body></html>
          `);
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            server.close();
            reject(new Error(errorDesc || error || 'Authorization failed or state mismatch'));
          }
          return;
        }

        res.end(`
          <html><body style="font-family:sans-serif;padding:40px;text-align:center;">
            <h2 style="color:#16a34a;">Connected Successfully!</h2>
            <p>Your cloud account is now linked to Monthly Finance Sheet.</p>
            <p>You can close this browser tab now.</p>
          </body></html>
        `);

        if (!settled) {
          settled = true;
          clearTimeout(timer);
          server.close();
          resolve(code);
        }
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          server.close();
          reject(err);
        }
      }
    });

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        server.close();
        reject(new Error('Sign-in timed out after 3 minutes. Please try again.'));
      }
    }, timeoutMs);

    server.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Could not start local OAuth listener on port ${OAUTH_PORT}: ${err.message}`));
      }
    });

    server.listen(OAUTH_PORT, '127.0.0.1');
  });
}

// ---------------- FOLDER SYNC ----------------

async function pickCloudFolder() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select your Google Drive, OneDrive, or Cloud Sync Folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (canceled || !filePaths || filePaths.length === 0) {
    return { ok: false, canceled: true };
  }
  return connectFolder(filePaths[0]);
}

function connectFolder(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { ok: false, error: 'Selected folder does not exist.' };
  }
  const cfg = readCloudConfig();
  cfg.provider = 'folder';
  cfg.folderPath = folderPath;
  cfg.accountEmail = '';
  writeCloudConfig(cfg);
  return { ok: true, status: getSafeStatus() };
}

function pushToFolder(folderPath, data) {
  fs.mkdirSync(folderPath, { recursive: true });
  const target = path.join(folderPath, SYNC_FILENAME);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, target);
}

function pullFromFolder(folderPath) {
  const target = path.join(folderPath, SYNC_FILENAME);
  if (!fs.existsSync(target)) {
    throw new Error(`No sync file (${SYNC_FILENAME}) found in ${folderPath} yet. Push first to create it.`);
  }
  return JSON.parse(fs.readFileSync(target, 'utf-8'));
}

// ---------------- GOOGLE DRIVE OAUTH + API v3 ----------------

async function connectGoogleDrive({ clientId, clientSecret }) {
  const cleanId = (clientId || '').trim();
  const cleanSecret = (clientSecret || '').trim();
  if (!cleanId) {
    return { ok: false, error: 'Please enter your Google OAuth Client ID.' };
  }

  const { verifier, challenge } = generatePkce();
  const state = base64Url(crypto.randomBytes(16));

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', cleanId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set(
    'scope',
    'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email'
  );
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  const callbackPromise = waitForOAuthCallback(state);
  await shell.openExternal(authUrl.toString());
  const code = await callbackPromise;

  const body = new URLSearchParams({
    client_id: cleanId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });
  if (cleanSecret) body.set('client_secret', cleanSecret);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'Google token exchange failed');
  }

  let email = 'Google Drive Account';
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (userRes.ok) {
      const u = await userRes.json();
      if (u.email) email = u.email;
    }
  } catch {
    // Optional email lookup
  }

  const cfg = readCloudConfig();
  cfg.provider = 'google';
  cfg.accountEmail = email;
  cfg.google = {
    clientId: cleanId,
    clientSecretEnc: cleanSecret ? encryptSecret(cleanSecret) : cfg.google?.clientSecretEnc || '',
    fileId: '',
  };
  cfg.tokens = {
    accessEnc: encryptSecret(tokenJson.access_token),
    refreshEnc: tokenJson.refresh_token ? encryptSecret(tokenJson.refresh_token) : cfg.tokens?.refreshEnc || '',
    expiresAt: Date.now() + (tokenJson.expires_in || 3600) * 1000 - 60000,
  };
  writeCloudConfig(cfg);
  return { ok: true, status: getSafeStatus() };
}

async function getValidGoogleToken(cfg) {
  const access = decryptSecret(cfg.tokens?.accessEnc);
  if (access && Date.now() < (cfg.tokens?.expiresAt || 0)) {
    return access;
  }

  const refresh = decryptSecret(cfg.tokens?.refreshEnc);
  if (!refresh) {
    throw new Error('Google Drive session expired. Please reconnect in Settings.');
  }

  const body = new URLSearchParams({
    client_id: cfg.google.clientId,
    refresh_token: refresh,
    grant_type: 'refresh_token',
  });
  const secret = decryptSecret(cfg.google.clientSecretEnc);
  if (secret) body.set('client_secret', secret);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || 'Could not refresh Google Drive token. Please reconnect.');
  }

  cfg.tokens.accessEnc = encryptSecret(json.access_token);
  cfg.tokens.expiresAt = Date.now() + (json.expires_in || 3600) * 1000 - 60000;
  writeCloudConfig(cfg);
  return json.access_token;
}

async function findGoogleFileId(token) {
  const q = encodeURIComponent(`name='${SYNC_FILENAME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Google Drive query failed (${res.status})`);
  const json = await res.json();
  return json.files && json.files.length > 0 ? json.files[0].id : null;
}

async function pushToGoogleDrive(cfg, data) {
  const token = await getValidGoogleToken(cfg);
  let fileId = cfg.google?.fileId || (await findGoogleFileId(token));
  const payload = JSON.stringify(data, null, 2);

  if (fileId) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      }
    );
    if (!res.ok) {
      if (res.status === 404) {
        fileId = null;
      } else {
        throw new Error(`Google Drive upload failed (${res.status})`);
      }
    }
  }

  if (!fileId) {
    const boundary = 'mfms_sync_boundary_' + Date.now();
    const metadata = JSON.stringify({
      name: SYNC_FILENAME,
      parents: ['appDataFolder'],
    });
    const multipartBody = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      payload,
      `--${boundary}--`,
    ].join('\r\n');

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );
    const json = await res.json();
    if (!res.ok || !json.id) {
      throw new Error(json.error?.message || `Google Drive create failed (${res.status})`);
    }
    cfg.google.fileId = json.id;
  }
}

async function pullFromGoogleDrive(cfg) {
  const token = await getValidGoogleToken(cfg);
  const fileId = cfg.google?.fileId || (await findGoogleFileId(token));
  if (!fileId) {
    throw new Error('No cloud backup found in your Google Drive yet. Push first to create it.');
  }
  cfg.google.fileId = fileId;
  writeCloudConfig(cfg);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Drive download failed (${res.status})`);
  return await res.json();
}

// ---------------- MICROSOFT ONEDRIVE OAUTH + GRAPH API ----------------

async function connectOneDrive({ clientId }) {
  const cleanId = (clientId || '').trim();
  if (!cleanId) {
    return { ok: false, error: 'Please enter your Microsoft Azure Application (Client) ID.' };
  }

  const { verifier, challenge } = generatePkce();
  const state = base64Url(crypto.randomBytes(16));
  const scopes = 'offline_access Files.ReadWrite.AppFolder User.Read';

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.set('client_id', cleanId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);

  const callbackPromise = waitForOAuthCallback(state);
  await shell.openExternal(authUrl.toString());
  const code = await callbackPromise;

  const body = new URLSearchParams({
    client_id: cleanId,
    scope: scopes,
    code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });

  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'OneDrive token exchange failed');
  }

  let email = 'OneDrive Account';
  try {
    const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      email = me.mail || me.userPrincipalName || email;
    }
  } catch {
    // Optional profile lookup
  }

  const cfg = readCloudConfig();
  cfg.provider = 'onedrive';
  cfg.accountEmail = email;
  cfg.onedrive = { clientId: cleanId };
  cfg.tokens = {
    accessEnc: encryptSecret(tokenJson.access_token),
    refreshEnc: tokenJson.refresh_token ? encryptSecret(tokenJson.refresh_token) : cfg.tokens?.refreshEnc || '',
    expiresAt: Date.now() + (tokenJson.expires_in || 3600) * 1000 - 60000,
  };
  writeCloudConfig(cfg);
  return { ok: true, status: getSafeStatus() };
}

async function getValidOneDriveToken(cfg) {
  const access = decryptSecret(cfg.tokens?.accessEnc);
  if (access && Date.now() < (cfg.tokens?.expiresAt || 0)) {
    return access;
  }

  const refresh = decryptSecret(cfg.tokens?.refreshEnc);
  if (!refresh) {
    throw new Error('OneDrive session expired. Please reconnect in Settings.');
  }

  const body = new URLSearchParams({
    client_id: cfg.onedrive.clientId,
    scope: 'offline_access Files.ReadWrite.AppFolder User.Read',
    refresh_token: refresh,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || 'Could not refresh OneDrive token. Please reconnect.');
  }

  cfg.tokens.accessEnc = encryptSecret(json.access_token);
  if (json.refresh_token) {
    cfg.tokens.refreshEnc = encryptSecret(json.refresh_token);
  }
  cfg.tokens.expiresAt = Date.now() + (json.expires_in || 3600) * 1000 - 60000;
  writeCloudConfig(cfg);
  return json.access_token;
}

async function pushToOneDrive(cfg, data) {
  const token = await getValidOneDriveToken(cfg);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${SYNC_FILENAME}:/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, null, 2),
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OneDrive upload failed (${res.status}): ${errText.slice(0, 120)}`);
  }
}

async function pullFromOneDrive(cfg) {
  const token = await getValidOneDriveToken(cfg);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${SYNC_FILENAME}:/content`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 404) {
    throw new Error('No cloud backup found in your OneDrive yet. Push first to create it.');
  }
  if (!res.ok) throw new Error(`OneDrive download failed (${res.status})`);
  return await res.json();
}

// ---------------- UNIFIED DISPATCH ----------------

async function pushToCloud(data) {
  const cfg = readCloudConfig();
  if (!cfg.provider) {
    return { ok: false, error: 'No cloud provider connected.' };
  }
  try {
    if (cfg.provider === 'folder') {
      pushToFolder(cfg.folderPath, data);
    } else if (cfg.provider === 'google') {
      await pushToGoogleDrive(cfg, data);
    } else if (cfg.provider === 'onedrive') {
      await pushToOneDrive(cfg, data);
    }
    cfg.lastSyncedAt = new Date().toISOString();
    writeCloudConfig(cfg);
    return { ok: true, status: getSafeStatus() };
  } catch (err) {
    return { ok: false, error: err.message || 'Cloud upload failed' };
  }
}

async function pullFromCloud() {
  const cfg = readCloudConfig();
  if (!cfg.provider) {
    return { ok: false, error: 'No cloud provider connected.' };
  }
  try {
    let data = null;
    if (cfg.provider === 'folder') {
      data = pullFromFolder(cfg.folderPath);
    } else if (cfg.provider === 'google') {
      data = await pullFromGoogleDrive(cfg);
    } else if (cfg.provider === 'onedrive') {
      data = await pullFromOneDrive(cfg);
    }
    cfg.lastSyncedAt = new Date().toISOString();
    writeCloudConfig(cfg);
    return { ok: true, data, status: getSafeStatus() };
  } catch (err) {
    return { ok: false, error: err.message || 'Cloud download failed' };
  }
}

function disconnectCloud() {
  const cfg = readCloudConfig();
  cfg.provider = null;
  cfg.folderPath = '';
  cfg.accountEmail = '';
  cfg.tokens = { accessEnc: '', refreshEnc: '', expiresAt: 0 };
  writeCloudConfig(cfg);
  return { ok: true, status: getSafeStatus() };
}

function setAutoSync(enabled) {
  const cfg = readCloudConfig();
  cfg.autoSync = Boolean(enabled);
  writeCloudConfig(cfg);
  return { ok: true, status: getSafeStatus() };
}

module.exports = {
  getSafeStatus,
  pickCloudFolder,
  connectFolder,
  connectGoogleDrive,
  connectOneDrive,
  pushToCloud,
  pullFromCloud,
  disconnectCloud,
  setAutoSync,
};
