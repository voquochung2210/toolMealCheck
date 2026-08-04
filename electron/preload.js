import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  loadMealData: (forceRefresh = false) => ipcRenderer.invoke('meal:fetch', forceRefresh),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (newConfig) => ipcRenderer.invoke('config:save', newConfig),
  logout: () => ipcRenderer.invoke('auth:logout'),
  openExternalUrl: (url) => ipcRenderer.invoke('app:openUrl', url),
  minimizeToTray: () => ipcRenderer.invoke('app:minimizeToTray'),
  onMealDataUpdated: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('meal:updated', subscription);
    return () => ipcRenderer.removeListener('meal:updated', subscription);
  },
});
