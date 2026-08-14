// global.d.ts — TypeScript declarations for Electron preload API

export {};

declare global {
  interface Window {
    electronAPI?: {
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
    };
  }
}