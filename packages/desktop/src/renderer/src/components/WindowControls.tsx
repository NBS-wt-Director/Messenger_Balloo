// WindowControls.tsx — Frameless window control buttons (macOS-style traffic lights)
// Shows minimize, maximize, close buttons for the Electron frameless window

import React from 'react';
import { useWindowControls } from '../providers/DesktopProvider';

export function WindowControls() {
  const { minimize, maximize, close, isMaximized, isElectron } = useWindowControls();

  if (!isElectron) return null;

  return (
    <div className="desktop-window-controls">
      <button
        className="btn-close"
        onClick={close}
        title="Закрыть"
        aria-label="Закрыть окно"
      />
      <button
        className="btn-minimize"
        onClick={minimize}
        title="Свернуть"
        aria-label="Свернуть окно"
      />
      <button
        className="btn-maximize"
        onClick={maximize}
        title={isMaximized ? 'Восстановить' : 'Развернуть'}
        aria-label={isMaximized ? 'Восстановить окно' : 'Развернуть окно'}
      />
    </div>
  );
}
