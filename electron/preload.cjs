const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('financeAPI', {
  isDesktop: true,
  load: () => ipcRenderer.invoke('finance:load'),
  save: (data) => ipcRenderer.invoke('finance:save', data),
  getDataPath: () => ipcRenderer.invoke('finance:getDataPath'),
  exportFile: (payload) => ipcRenderer.invoke('finance:exportFile', payload),
  importJson: () => ipcRenderer.invoke('finance:importJson'),
  cloud: {
    status: () => ipcRenderer.invoke('cloud:status'),
    pickFolder: () => ipcRenderer.invoke('cloud:pickFolder'),
    connectFolder: (folderPath) => ipcRenderer.invoke('cloud:connectFolder', folderPath),
    connectGoogle: (creds) => ipcRenderer.invoke('cloud:connectGoogle', creds),
    connectOneDrive: (creds) => ipcRenderer.invoke('cloud:connectOneDrive', creds),
    push: (data) => ipcRenderer.invoke('cloud:push', data),
    pull: () => ipcRenderer.invoke('cloud:pull'),
    disconnect: () => ipcRenderer.invoke('cloud:disconnect'),
    setAutoSync: (enabled) => ipcRenderer.invoke('cloud:setAutoSync', enabled),
  },
});
