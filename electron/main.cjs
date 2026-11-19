const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const cloudSync = require('./cloudSync.cjs');

const STORE_FILENAME = 'finance-store.json';

function getStorePath() {
  return path.join(app.getPath('userData'), STORE_FILENAME);
}

function readStore() {
  const filePath = getStorePath();
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read store:', err);
    return null;
  }
}

function writeStoreAtomic(data) {
  const filePath = getStorePath();
  const tempPath = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
  return filePath;
}

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}

function createWindow() {
  const isSmokeTest = process.argv.includes('--smoke-test');
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#ffffff',
    title: 'Monthly Finance Manager',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Hide default menu bar for a clean desktop app look (Alt still toggles if needed)
  Menu.setApplicationMenu(null);

  win.once('ready-to-show', () => {
    if (!isSmokeTest) {
      win.show();
    }
  });

  if (isSmokeTest) {
    win.webContents.once('did-finish-load', () => {
      console.log('ELECTRON_SMOKE_TEST_OK');
      app.quit();
    });
  }

  const isDev = process.env.ELECTRON_DEV === '1';
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('finance:load', () => {
    return readStore();
  });

  ipcMain.handle('finance:save', (_event, data) => {
    try {
      const savedPath = writeStoreAtomic(data);
      return { ok: true, path: savedPath };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('finance:getDataPath', () => {
    return getStorePath();
  });

  ipcMain.handle('finance:exportFile', async (_event, { defaultName, content, filters }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    if (canceled || !filePath) {
      return { ok: false, canceled: true };
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { ok: true, filePath };
  });

  ipcMain.handle('finance:importJson', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    try {
      const raw = fs.readFileSync(filePaths[0], 'utf-8');
      const data = JSON.parse(raw);
      return { ok: true, data, filePath: filePaths[0] };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Cloud Sync IPC (Google Drive, OneDrive, & Synced Cloud Folder)
  ipcMain.handle('cloud:status', () => cloudSync.getSafeStatus());
  ipcMain.handle('cloud:pickFolder', () => cloudSync.pickCloudFolder());
  ipcMain.handle('cloud:connectFolder', (_e, folderPath) => cloudSync.connectFolder(folderPath));
  ipcMain.handle('cloud:connectGoogle', async (_e, creds) => {
    try {
      return await cloudSync.connectGoogleDrive(creds);
    } catch (err) {
      return { ok: false, error: err.message || 'Google Drive sign-in failed' };
    }
  });
  ipcMain.handle('cloud:connectOneDrive', async (_e, creds) => {
    try {
      return await cloudSync.connectOneDrive(creds);
    } catch (err) {
      return { ok: false, error: err.message || 'OneDrive sign-in failed' };
    }
  });
  ipcMain.handle('cloud:push', (_e, data) => cloudSync.pushToCloud(data));
  ipcMain.handle('cloud:pull', () => cloudSync.pullFromCloud());
  ipcMain.handle('cloud:disconnect', () => cloudSync.disconnectCloud());
  ipcMain.handle('cloud:setAutoSync', (_e, enabled) => cloudSync.setAutoSync(enabled));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
