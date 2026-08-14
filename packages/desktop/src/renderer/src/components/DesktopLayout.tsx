// DesktopLayout.tsx — Main desktop layout wrapper
// Adds frameless titlebar, drag region, keyboard shortcuts, and update badge

import React, { useEffect, useState } from 'react';
import { DesktopTitlebar } from './DesktopTitlebar';
import { useDesktop } from '../providers/DesktopProvider';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const { electronAPI, isElectron } = useDesktop();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!isElectron || !electronAPI) return;

    // Listen for navigation events from the menu
    electronAPI.onNavigate((path: string) => {
      // Use hash router navigation
      window.location.hash = path;
    });

    // Listen for search open
    electronAPI.onSearchOpen(() => {
      window.location.hash = '/search';
    });

    // Listen for theme toggle
    electronAPI.onThemeToggle(() => {
      // Theme toggle handled by ThemeProvider
      document.dispatchEvent(new CustomEvent('theme:toggle'));
    });

    // Listen for presence updates
    electronAPI.presence.onUpdate((status: string) => {
      document.dispatchEvent(new CustomEvent('presence:update', { detail: status }));
    });

    // Update availability
    electronAPI.update.onAvailable(() => setUpdateAvailable(true));
    electronAPI.update.onDownloaded(() => setUpdateAvailable(false));
  }, [isElectron, electronAPI]);

  const handleUpdate = () => {
    if (electronAPI?.update) {
      electronAPI.update.download().then(() => {
        electronAPI.update.install();
      });
    }
  };

  return (
    <div className="desktop-frame">
      <DesktopTitlebar />
      {updateAvailable && (
        <div className="desktop-update-badge" onClick={handleUpdate}>
          Доступно обновление — установить
        </div>
      )}
      <div className="desktop-content">{children}</div>
    </div>
  );
}
