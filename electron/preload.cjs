const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('financeAPI', {
  isDesktop: true,
  load: () => ipcRenderer.invoke('finance:load'),
  save: (data) => ipcRenderer.invoke('finance:save', data),
  getDataPath: () => ipcRenderer.invoke('finance:getDataPath'),
  exportFile: (payload) => ipcRenderer.invoke('finance:exportFile', payload),
  importJson: () => ipcRenderer.invoke('finance:importJson'),
});
