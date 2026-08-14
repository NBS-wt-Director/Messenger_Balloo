// DesktopProvider.tsx — Electron-specific context provider
// Provides electronAPI to the React app and handles window drag regions

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Type for the electronAPI exposed via preload
interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  store: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  notification: {
    show: (title: string, body: string) => Promise<void>;
  };
  update: {
    check: () => Promise<void>;
    download: () => Promise<void>;
    install: () => Promise<void>;
    onChecking: (callback: () => void) => void;
    onAvailable: (callback: (info: unknown) => void) => void;
    onNotAvailable: (callback: () => void) => void;
    onError: (callback: (message: string) => void) => void;
    onProgress: (callback: (progress: unknown) => void) => void;
    onDownloaded: (callback: () => void) => void;
  };
  system: {
    platform: () => Promise<string>;
    version: () => Promise<string>;
    arch: () => Promise<string>;
  };
  presence: {
    set: (status: string) => void;
    onUpdate: (callback: (status: string) => void) => void;
  };
  onNavigate: (callback: (path: string) => void) => void;
  onSearchOpen: (callback: () => void) => void;
  onThemeToggle: (callback: () => void) => void;
}

interface DesktopContextType {
  electronAPI: ElectronAPI | null;
  isElectron: boolean;
  isMaximized: boolean;
  platform: string;
  appVersion: string;
}

const DesktopContext = createContext<DesktopContextType>({
  electronAPI: null,
  isElectron: false,
  isMaximized: false,
  platform: 'web',
  appVersion: '0.0.0',
});

export function useDesktop(): DesktopContextType {
  return useContext(DesktopContext);
}

interface DesktopProviderProps {
  children: ReactNode;
}

export function DesktopProvider({ children }: DesktopProviderProps) {
  const api = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI || null;
  const isElectron = !!api;

  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState('web');
  const [appVersion, setAppVersion] = useState('0.0.0');

  useEffect(() => {
    if (!api) return;

    // Check if window is maximized
    api.window.isMaximized().then(setIsMaximized);

    // Get system info
    api.system.platform().then(setPlatform);
    api.system.version().then(setAppVersion);

    // Listen for maximize/unmaximize events
    const checkMaximized = () => api.window.isMaximized().then(setIsMaximized);
    window.addEventListener('resize', checkMaximized);

    return () => window.removeEventListener('resize', checkMaximized);
  }, [api]);

  return (
    <DesktopContext.Provider value={{ electronAPI: api, isElectron, isMaximized, platform, appVersion }}>
      {children}
    </DesktopContext.Provider>
  );
}

// Hooks for Electron features
export function useWindowControls() {
  const { electronAPI, isElectron, isMaximized } = useContext(DesktopContext);

  return {
    minimize: () => electronAPI?.window.minimize(),
    maximize: () => electronAPI?.window.maximize(),
    close: () => electronAPI?.window.close(),
    isMaximized,
    isElectron,
  };
}

export function useAppUpdate() {
  const { electronAPI } = useContext(DesktopContext);
  return electronAPI?.update || null;
}

export function useSystemInfo() {
  const { platform, appVersion } = useContext(DesktopContext);
  return { platform, appVersion };
}