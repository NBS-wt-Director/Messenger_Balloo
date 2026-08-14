// main.ts — Electron main process
// Window management, system tray, native notifications, menu bar, auto-updater

import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, shell } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';

// Store for persistent settings
const store = new Store({
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    isMaximized: false,
    theme: 'dark',
    language: 'ru',
    autoStart: false,
    minimizeToTray: true,
    closeToTray: true,
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ============================================================
// Window Management
// ============================================================

function createWindow(): void {
  const { width, height } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: getAssetPath('icon.png'),
    title: 'Balloo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }

  // Restore maximized state
  if (store.get('isMaximized')) {
    mainWindow.maximize();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Save window bounds on resize
  mainWindow.on('resize', () => {
    if (!mainWindow || mainWindow.isMaximized()) return;
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  // Save maximized state
  mainWindow.on('maximize', () => store.set('isMaximized', true));
  mainWindow.on('unmaximize', () => store.set('isMaximized', false));

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('closeToTray')) {
      event.preventDefault();
      mainWindow?.hide();
      showTrayNotification('Balloo свёрнут в трей', 'Приложение продолжает работать в фоновом режиме');
    }
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ============================================================
// System Tray
// ============================================================

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(getAssetPath('tray-icon.png'));
  const resizedIcon = trayIcon.resize({ width: 16, height: 16 });

  tray = new Tray(resizedIcon);
  tray.setToolTip('Balloo Messenger');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть Balloo',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Статус',
      submenu: [
        { label: 'Онлайн', type: 'radio', checked: true, click: () => updatePresence('online') },
        { label: 'Отошёл', type: 'radio', click: () => updatePresence('away') },
        { label: 'Не беспокоить', type: 'radio', click: () => updatePresence('dnd') },
        { label: 'Невидимка', type: 'radio', click: () => updatePresence('invisible') },
      ],
    },
    { type: 'separator' },
    {
      label: 'Выйти',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function updatePresence(status: string): void {
  mainWindow?.webContents.send('presence:update', status);
}

// ============================================================
// Native Notifications
// ============================================================

function showTrayNotification(title: string, body: string): void {
  if (Notification.isSupported()) {
    const notification = new Notification({ title, body, icon: getAssetPath('icon.png') });
    notification.on('click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    notification.show();
  }
}

// ============================================================
// Menu Bar
// ============================================================

function createMenuBar(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Balloo',
      submenu: [
        {
          label: 'О Balloo',
          click: () => mainWindow?.webContents.send('navigate', '/settings/about'),
        },
        { type: 'separator' },
        {
          label: 'Настройки',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', '/settings'),
        },
        { type: 'separator' },
        {
          label: 'Скрыть',
          accelerator: 'CmdOrCtrl+H',
          role: 'hide',
        },
        {
          label: 'Скрыть остальные',
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideOthers',
        },
        { type: 'separator' },
        {
          label: 'Выйти',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo', label: 'Отменить' },
        { role: 'redo', label: 'Повторить' },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выделить всё' },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Переключить тему',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow?.webContents.send('theme:toggle'),
        },
        { type: 'separator' },
        { role: 'reload', label: 'Обновить' },
        { role: 'forceReload', label: 'Полная перезагрузка' },
        { role: 'toggleDevTools', label: 'Инструменты разработчика' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { role: 'resetZoom', label: 'Сбросить масштаб' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' },
      ],
    },
    {
      label: 'Чат',
      submenu: [
        {
          label: 'Новый чат',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('navigate', '/chat/new'),
        },
        {
          label: 'Поиск',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('search:open'),
        },
        {
          label: 'Создать группу',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow?.webContents.send('navigate', '/group/create'),
        },
      ],
    },
    {
      label: 'Окно',
      submenu: [
        { role: 'minimize', label: 'Свернуть' },
        { role: 'zoom', label: 'Развернуть' },
        { role: 'close', label: 'Закрыть' },
      ],
    },
    {
      label: 'Помощь',
      submenu: [
        {
          label: 'База знаний',
          click: () => mainWindow?.webContents.send('navigate', '/knowledge'),
        },
        {
          label: 'Сообщить об ошибке',
          click: () => mainWindow?.webContents.send('navigate', '/features'),
        },
        { type: 'separator' },
        {
          label: 'О Balloo',
          click: () => mainWindow?.webContents.send('navigate', '/settings/about'),
        },
      ],
    },
  ];

  // macOS-specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about', label: `О Balloo` },
        { type: 'separator' },
        { role: 'services', label: 'Сервисы' },
        { type: 'separator' },
        { role: 'hide', label: 'Скрыть Balloo' },
        { role: 'hideOthers', label: 'Скрыть остальные' },
        { role: 'unhide', label: 'Показать все' },
        { type: 'separator' },
        { role: 'quit', label: 'Выйти' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
// Auto-Update
// ============================================================

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', info);
    showTrayNotification(
      'Доступно обновление',
      `Версия ${info.version} готова к установке`
    );
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update:not-available');
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update:error', err.message);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:progress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded');
    showTrayNotification(
      'Обновление загружено',
      'Перезапустите приложение для установки'
    );
  });

  // Check for updates every 6 hours
  setInterval(() => autoUpdater.checkForUpdates(), 6 * 60 * 60 * 1000);
}

// ============================================================
// IPC Handlers
// ============================================================

function setupIPC(): void {
  // Window controls
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

  // Store operations
  ipcMain.handle('store:get', (_event, key: string) => store.get(key));
  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    store.set(key, value);
  });

  // Notifications
  ipcMain.handle('notification:show', (_event, title: string, body: string) => {
    showTrayNotification(title, body);
  });

  // Auto-updater
  ipcMain.handle('update:check', () => autoUpdater.checkForUpdates());
  ipcMain.handle('update:download', () => autoUpdater.downloadUpdate());
  ipcMain.handle('update:install', () => autoUpdater.quitAndInstall());

  // System info
  ipcMain.handle('system:platform', () => process.platform);
  ipcMain.handle('system:version', () => app.getVersion());
  ipcMain.handle('system:arch', () => process.arch);

  // Tray presence update
  ipcMain.on('presence:set', (_event, status: string) => {
    updateTrayPresence(status);
  });
}

function updateTrayPresence(status: string): void {
  if (!tray) return;
  const labels: Record<string, string> = {
    online: 'Онлайн',
    away: 'Отошёл',
    dnd: 'Не беспокоить',
    invisible: 'Невидимка',
  };
  tray.setToolTip(`Balloo — ${labels[status] || 'Онлайн'}`);
}

// ============================================================
// Asset Helper
// ============================================================

function getAssetPath(filename: string): string {
  const assetsPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');
  return path.join(assetsPath, filename);
}

// ============================================================
// App Lifecycle
// ============================================================

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  createMenuBar();
  setupAutoUpdater();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit on window close — keep tray alive
    // Only quit if isQuitting is set
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Prevent multiple instances from creating multiple trays
app.on('will-quit', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});