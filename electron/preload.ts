import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('set-always-on-top', flag),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  fetchBalance: (provider: string, apiKey: string) => ipcRenderer.invoke('fetch-balance', provider, apiKey),
  fetchUsage: (provider: string, apiKey: string) => ipcRenderer.invoke('fetch-usage', provider, apiKey),
  onRefreshData: (callback: () => void) => {
    ipcRenderer.on('refresh-data', callback)
    return () => ipcRenderer.removeListener('refresh-data', callback)
  },
  writeSettings: (data: any) => ipcRenderer.invoke('write-settings', data),
  readSettings: () => ipcRenderer.invoke('read-settings'),
  verifyApiKey: (provider: string, apiKey: string) => ipcRenderer.invoke('verify-api-key', provider, apiKey),
  saveSettingsToFile: (data: any) => ipcRenderer.invoke('save-settings-to-file', data),
  resizeWindow: (width: number, height: number) => ipcRenderer.invoke('resize-window', width, height),
  moveWindow: (x: number, y: number) => ipcRenderer.invoke('move-window', x, y),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
})
