const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  loadMealData: (forceRefresh = false) => ipcRenderer.invoke('meal:fetch', forceRefresh),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (newConfig) => ipcRenderer.invoke('config:save', newConfig),
  logout: () => ipcRenderer.invoke('auth:logout'),
  openExternalUrl: (url) => ipcRenderer.invoke('app:openUrl', url),
  minimizeToTray: () => ipcRenderer.invoke('app:minimizeToTray'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkUpdate: () => ipcRenderer.invoke('app:checkUpdate'),
  onMealDataUpdated: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('meal:updated', subscription);
    return () => ipcRenderer.removeListener('meal:updated', subscription);
  },
});
