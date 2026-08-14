// DesktopTitlebar.tsx — Custom frameless titlebar for Electron desktop app
// Shows app title, drag region, and macOS-style window controls

import React from 'react';
import { WindowControls } from './WindowControls';
import { useSystemInfo } from '../providers/DesktopProvider';

interface DesktopTitlebarProps {
  title?: string;
}

export function DesktopTitlebar({ title = 'Balloo' }: DesktopTitlebarProps) {
  const { platform } = useSystemInfo();
  const isDarwin = platform === 'darwin';

  return (
    <div className={`desktop-titlebar ${isDarwin ? 'platform-darwin' : ''}`}>
      {isDarwin && <WindowControls />}
      <span className="app-title">{title}</span>
      {!isDarwin && <WindowControls />}
    </div>
  );
}
