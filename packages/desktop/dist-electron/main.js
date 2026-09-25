"use strict";
const electron = require("electron");
const path = require("path");
const electronUpdater = require("electron-updater");
const Store = require("electron-store");
const store = new Store({
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    isMaximized: false,
    theme: "dark",
    language: "ru",
    autoStart: false,
    minimizeToTray: true,
    closeToTray: true
  }
});
let mainWindow = null;
let tray = null;
let isQuitting = false;
function createWindow() {
  const { width, height } = store.get("windowBounds");
  mainWindow = new electron.BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: getAssetPath("icon.png"),
    title: "Balloo",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  }
  if (store.get("isMaximized")) {
    mainWindow.maximize();
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
  });
  mainWindow.on("resize", () => {
    if (!mainWindow || mainWindow.isMaximized()) return;
    const bounds = mainWindow.getBounds();
    store.set("windowBounds", bounds);
  });
  mainWindow.on("maximize", () => store.set("isMaximized", true));
  mainWindow.on("unmaximize", () => store.set("isMaximized", false));
  mainWindow.on("close", (event) => {
    if (!isQuitting && store.get("closeToTray")) {
      event.preventDefault();
      mainWindow == null ? void 0 : mainWindow.hide();
      showTrayNotification("Balloo свёрнут в трей", "Приложение продолжает работать в фоновом режиме");
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
}
function createTray() {
  const trayIcon = electron.nativeImage.createFromPath(getAssetPath("tray-icon.png"));
  const resizedIcon = trayIcon.resize({ width: 16, height: 16 });
  tray = new electron.Tray(resizedIcon);
  tray.setToolTip("Balloo Messenger");
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "Открыть Balloo",
      click: () => {
        mainWindow == null ? void 0 : mainWindow.show();
        mainWindow == null ? void 0 : mainWindow.focus();
      }
    },
    { type: "separator" },
    {
      label: "Статус",
      submenu: [
        { label: "Онлайн", type: "radio", checked: true, click: () => updatePresence("online") },
        { label: "Отошёл", type: "radio", click: () => updatePresence("away") },
        { label: "Не беспокоить", type: "radio", click: () => updatePresence("dnd") },
        { label: "Невидимка", type: "radio", click: () => updatePresence("invisible") }
      ]
    },
    { type: "separator" },
    {
      label: "Выйти",
      click: () => {
        isQuitting = true;
        electron.app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    mainWindow == null ? void 0 : mainWindow.show();
    mainWindow == null ? void 0 : mainWindow.focus();
  });
}
function updatePresence(status) {
  mainWindow == null ? void 0 : mainWindow.webContents.send("presence:update", status);
}
function showTrayNotification(title, body) {
  if (electron.Notification.isSupported()) {
    const notification = new electron.Notification({ title, body, icon: getAssetPath("icon.png") });
    notification.on("click", () => {
      mainWindow == null ? void 0 : mainWindow.show();
      mainWindow == null ? void 0 : mainWindow.focus();
    });
    notification.show();
  }
}
function createMenuBar() {
  const template = [
    {
      label: "Balloo",
      submenu: [
        {
          label: "О Balloo",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/settings/about")
        },
        { type: "separator" },
        {
          label: "Настройки",
          accelerator: "CmdOrCtrl+,",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/settings")
        },
        { type: "separator" },
        {
          label: "Скрыть",
          accelerator: "CmdOrCtrl+H",
          role: "hide"
        },
        {
          label: "Скрыть остальные",
          accelerator: "CmdOrCtrl+Shift+H",
          role: "hideOthers"
        },
        { type: "separator" },
        {
          label: "Выйти",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            isQuitting = true;
            electron.app.quit();
          }
        }
      ]
    },
    {
      label: "Правка",
      submenu: [
        { role: "undo", label: "Отменить" },
        { role: "redo", label: "Повторить" },
        { type: "separator" },
        { role: "cut", label: "Вырезать" },
        { role: "copy", label: "Копировать" },
        { role: "paste", label: "Вставить" },
        { role: "selectAll", label: "Выделить всё" }
      ]
    },
    {
      label: "Вид",
      submenu: [
        {
          label: "Переключить тему",
          accelerator: "CmdOrCtrl+T",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("theme:toggle")
        },
        { type: "separator" },
        { role: "reload", label: "Обновить" },
        { role: "forceReload", label: "Полная перезагрузка" },
        { role: "toggleDevTools", label: "Инструменты разработчика" },
        { type: "separator" },
        { role: "zoomIn", label: "Увеличить" },
        { role: "zoomOut", label: "Уменьшить" },
        { role: "resetZoom", label: "Сбросить масштаб" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Полный экран" }
      ]
    },
    {
      label: "Чат",
      submenu: [
        {
          label: "Новый чат",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/chat/new")
        },
        {
          label: "Поиск",
          accelerator: "CmdOrCtrl+K",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("search:open")
        },
        {
          label: "Создать группу",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/group/create")
        }
      ]
    },
    {
      label: "Окно",
      submenu: [
        { role: "minimize", label: "Свернуть" },
        { role: "zoom", label: "Развернуть" },
        { role: "close", label: "Закрыть" }
      ]
    },
    {
      label: "Помощь",
      submenu: [
        {
          label: "База знаний",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/knowledge")
        },
        {
          label: "Сообщить об ошибке",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/features")
        },
        { type: "separator" },
        {
          label: "О Balloo",
          click: () => mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "/settings/about")
        }
      ]
    }
  ];
  if (process.platform === "darwin") {
    template.unshift({
      label: electron.app.name,
      submenu: [
        { role: "about", label: `О Balloo` },
        { type: "separator" },
        { role: "services", label: "Сервисы" },
        { type: "separator" },
        { role: "hide", label: "Скрыть Balloo" },
        { role: "hideOthers", label: "Скрыть остальные" },
        { role: "unhide", label: "Показать все" },
        { type: "separator" },
        { role: "quit", label: "Выйти" }
      ]
    });
  }
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}
function setupAutoUpdater() {
  electronUpdater.autoUpdater.autoDownload = false;
  electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
  electronUpdater.autoUpdater.on("checking-for-update", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("update:checking");
  });
  electronUpdater.autoUpdater.on("update-available", (info) => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("update:available", info);
    showTrayNotification(
      "Доступно обновление",
      `Версия ${info.version} готова к установке`
    );
  });
  electronUpdater.autoUpdater.on("update-not-available", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("update:not-available");
  });
  electronUpdater.autoUpdater.on("error", (err) => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("update:error", err.message);
  });
  electronUpdater.autoUpdater.on("download-progress", (progress) => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("update:progress", progress);
  });
  electronUpdater.autoUpdater.on("update-downloaded", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("update:downloaded");
    showTrayNotification(
      "Обновление загружено",
      "Перезапустите приложение для установки"
    );
  });
  setInterval(() => electronUpdater.autoUpdater.checkForUpdates(), 6 * 60 * 60 * 1e3);
}
function setupIPC() {
  electron.ipcMain.handle("window:minimize", () => mainWindow == null ? void 0 : mainWindow.minimize());
  electron.ipcMain.handle("window:maximize", () => {
    if (mainWindow == null ? void 0 : mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow == null ? void 0 : mainWindow.maximize();
    }
  });
  electron.ipcMain.handle("window:close", () => mainWindow == null ? void 0 : mainWindow.close());
  electron.ipcMain.handle("window:isMaximized", () => mainWindow == null ? void 0 : mainWindow.isMaximized());
  electron.ipcMain.handle("store:get", (_event, key) => store.get(key));
  electron.ipcMain.handle("store:set", (_event, key, value) => {
    store.set(key, value);
  });
  electron.ipcMain.handle("notification:show", (_event, title, body) => {
    showTrayNotification(title, body);
  });
  electron.ipcMain.handle("update:check", () => electronUpdater.autoUpdater.checkForUpdates());
  electron.ipcMain.handle("update:download", () => electronUpdater.autoUpdater.downloadUpdate());
  electron.ipcMain.handle("update:install", () => electronUpdater.autoUpdater.quitAndInstall());
  electron.ipcMain.handle("system:platform", () => process.platform);
  electron.ipcMain.handle("system:version", () => electron.app.getVersion());
  electron.ipcMain.handle("system:arch", () => process.arch);
  electron.ipcMain.on("presence:set", (_event, status) => {
    updateTrayPresence(status);
  });
}
function updateTrayPresence(status) {
  if (!tray) return;
  const labels = {
    online: "Онлайн",
    away: "Отошёл",
    dnd: "Не беспокоить",
    invisible: "Невидимка"
  };
  tray.setToolTip(`Balloo — ${labels[status] || "Онлайн"}`);
}
function getAssetPath(filename) {
  const assetsPath = electron.app.isPackaged ? path.join(process.resourcesPath, "assets") : path.join(__dirname, "../assets");
  return path.join(assetsPath, filename);
}
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
electron.app.whenReady().then(() => {
  createWindow();
  createTray();
  createMenuBar();
  setupAutoUpdater();
  setupIPC();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") ;
});
electron.app.on("before-quit", () => {
  isQuitting = true;
});
electron.app.on("will-quit", () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
