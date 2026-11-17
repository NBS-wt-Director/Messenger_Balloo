"use strict";
const electron = require("electron");
const electronAPI = {
  // Window controls
  window: {
    minimize: () => electron.ipcRenderer.invoke("window:minimize"),
    maximize: () => electron.ipcRenderer.invoke("window:maximize"),
    close: () => electron.ipcRenderer.invoke("window:close"),
    isMaximized: () => electron.ipcRenderer.invoke("window:isMaximized")
  },
  // Persistent store
  store: {
    get: (key) => electron.ipcRenderer.invoke("store:get", key),
    set: (key, value) => electron.ipcRenderer.invoke("store:set", key, value)
  },
  // Notifications
  notification: {
    show: (title, body) => electron.ipcRenderer.invoke("notification:show", title, body)
  },
  // Auto-updater
  update: {
    check: () => electron.ipcRenderer.invoke("update:check"),
    download: () => electron.ipcRenderer.invoke("update:download"),
    install: () => electron.ipcRenderer.invoke("update:install"),
    onChecking: (callback) => electron.ipcRenderer.on("update:checking", callback),
    onAvailable: (callback) => electron.ipcRenderer.on("update:available", (_event, info) => callback(info)),
    onNotAvailable: (callback) => electron.ipcRenderer.on("update:not-available", callback),
    onError: (callback) => electron.ipcRenderer.on("update:error", (_event, message) => callback(message)),
    onProgress: (callback) => electron.ipcRenderer.on("update:progress", (_event, progress) => callback(progress)),
    onDownloaded: (callback) => electron.ipcRenderer.on("update:downloaded", callback)
  },
  // System info
  system: {
    platform: () => electron.ipcRenderer.invoke("system:platform"),
    version: () => electron.ipcRenderer.invoke("system:version"),
    arch: () => electron.ipcRenderer.invoke("system:arch")
  },
  // Presence
  presence: {
    set: (status) => electron.ipcRenderer.send("presence:set", status),
    onUpdate: (callback) => {
      electron.ipcRenderer.on("presence:update", (_event, status) => callback(status));
    }
  },
  // Navigation from menu
  onNavigate: (callback) => {
    electron.ipcRenderer.on("navigate", (_event, path) => callback(path));
  },
  // Search shortcut
  onSearchOpen: (callback) => {
    electron.ipcRenderer.on("search:open", callback);
  },
  // Theme toggle
  onThemeToggle: (callback) => {
    electron.ipcRenderer.on("theme:toggle", callback);
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
