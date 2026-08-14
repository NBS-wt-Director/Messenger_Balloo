// DesktopOverviewScreen.tsx — Desktop main overview screen
// Shows quick overview of chats, recent activity, and status

import React, { useEffect, useState } from 'react';
import { useSystemInfo } from '../providers/DesktopProvider';

interface SystemInfo {
  platform: string;
  version: string;
  arch: string;
}

export function DesktopOverviewScreen() {
  const { platform, appVersion } = useSystemInfo();
  const [sysInfo, setSysInfo] = useState<SystemInfo>({
    platform: platform,
    version: appVersion,
    arch: '',
  });

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api) {
      api.system.arch().then((arch: string) => {
        setSysInfo(prev => ({ ...prev, arch }));
      });
    }
  }, []);

  return (
    <div className="desktop-overview" style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Balloo Messenger</h1>
        <p style={styles.subtitle}>Desktop v{sysInfo.version}</p>
      </div>
      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <h3>Платформа</h3>
          <p>{sysInfo.platform === 'win32' ? 'Windows' : sysInfo.platform === 'darwin' ? 'macOS' : 'Linux'}</p>
        </div>
        <div style={styles.infoCard}>
          <h3>Архитектура</h3>
          <p>{sysInfo.arch}</p>
        </div>
        <div style={styles.infoCard}>
          <h3>Версия приложения</h3>
          <p>{sysInfo.version}</p>
        </div>
        <div style={styles.infoCard}>
          <h3>Статус</h3>
          <p style={{ color: 'var(--accent, #2db84d)' }}>Онлайн</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    textAlign: 'center',
    padding: '32px 0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
    color: 'var(--text-primary, #fff)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary, #8a8aa0)',
    marginTop: '8px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  infoCard: {
    background: 'var(--bg-card, #1e1e32)',
    border: '1px solid var(--border-color, #2a2a40)',
    padding: '16px',
  } as React.CSSProperties,
};