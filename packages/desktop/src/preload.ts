// preload.ts — Electron preload script
// Exposes safe IPC methods to the renderer process via contextBridge

import { contextBridge, ipcRenderer } from 'electron';

// Type-safe API exposed to renderer
const electronAPI = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Persistent store
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  },

  // Notifications
  notification: {
    show: (title: string, body: string) => ipcRenderer.invoke('notification:show', title, body),
  },

  // Auto-updater
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onChecking: (callback: () => void) => ipcRenderer.on('update:checking', callback),
    onAvailable: (callback: (info: unknown) => void) => ipcRenderer.on('update:available', (_event, info) => callback(info)),
    onNotAvailable: (callback: () => void) => ipcRenderer.on('update:not-available', callback),
    onError: (callback: (message: string) => void) => ipcRenderer.on('update:error', (_event, message) => callback(message)),
    onProgress: (callback: (progress: unknown) => void) => ipcRenderer.on('update:progress', (_event, progress) => callback(progress)),
    onDownloaded: (callback: () => void) => ipcRenderer.on('update:downloaded', callback),
  },

  // System info
  system: {
    platform: () => ipcRenderer.invoke('system:platform'),
    version: () => ipcRenderer.invoke('system:version'),
    arch: () => ipcRenderer.invoke('system:arch'),
  },

  // Presence
  presence: {
    set: (status: string) => ipcRenderer.send('presence:set', status),
    onUpdate: (callback: (status: string) => void) => {
      ipcRenderer.on('presence:update', (_event, status) => callback(status));
    },
  },

  // Navigation from menu
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (_event, path) => callback(path));
  },

  // Search shortcut
  onSearchOpen: (callback: () => void) => {
    ipcRenderer.on('search:open', callback);
  },

  // Theme toggle
  onThemeToggle: (callback: () => void) => {
    ipcRenderer.on('theme:toggle', callback);
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
export type ElectronAPI = typeof electronAPI;