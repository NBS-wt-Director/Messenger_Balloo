// DownloadPage — download.balloo.su: список платформ и загрузка приложений.
//
// Тик. 1795683301 (D1/D2/U7): плитка платформы, для которой сборки ещё нет,
// остаётся на месте, но с текстом-извинением и БЕЗ битой ссылки (раньше кнопки
// вели на несуществующие файлы: `/win/BallooSetup.exe` отдавал HTML SPA).
// Наличие артефакта проверяется по `GET /api/downloads`: если для платформы
// нет ни одного пакета — показываем состояние «ещё не собрано».

import { useEffect, useMemo, useState } from 'react';
import { detectPlatform, type PlatformKey } from '../lib/detectPlatform';
import { QRCodeImage } from './QRCodeImage';

const API_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3100';

const DOWNLOAD_URL = 'https://download.balloo.su';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=su.balloo';
const RUSTORE_URL = 'https://www.rustore.ru/catalog/app/su.balloo';

interface PlatformTile {
  key: PlatformKey;
  label: string;
  icon: string;
  /** Ссылка на скачивание; null — сборки нет */
  href: string | null;
  note?: string;
}

const BASE_TILES: Omit<PlatformTile, 'href'>[] = [
  { key: 'win', label: 'Windows', icon: '🪟', note: 'Windows 10/11 (x64)' },
  { key: 'linux', label: 'Linux', icon: '🐧', note: 'AppImage, .deb, .rpm' },
  { key: 'mac', label: 'macOS', icon: '🍎', note: 'macOS 12 Monterey и новее' },
  { key: 'android', label: 'Android', icon: '🤖', note: 'Android 8.0 и новее' },
  { key: 'ios', label: 'iOS', icon: '📱', note: 'iOS 14 и новее' },
];

interface DownloadsResponse {
  desktop?: { win?: unknown[]; linux?: unknown[]; mac?: unknown[] };
  android?: unknown[];
  ios?: unknown[];
}

function hasAny(list: unknown): boolean {
  return Array.isArray(list) && list.length > 0;
}

export function DownloadPage() {
  const detected = useMemo(() => detectPlatform(), []);
  const [tiles, setTiles] = useState<PlatformTile[]>(
    BASE_TILES.map((t) => ({ ...t, href: null }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/downloads`);
        const data = (await res.json()) as DownloadsResponse;
        if (cancelled) return;

        // D1: ссылку даём только если артефакт реально опубликован.
        const next = BASE_TILES.map<PlatformTile>((t) => {
          let available = false;
          if (t.key === 'win') available = hasAny(data.desktop?.win);
          else if (t.key === 'linux') available = hasAny(data.desktop?.linux);
          else if (t.key === 'mac') available = hasAny(data.desktop?.mac);
          else if (t.key === 'android') available = hasAny(data.android);
          else if (t.key === 'ios') available = hasAny(data.ios);

          return {
            ...t,
            href: available ? `${DOWNLOAD_URL}/#/download/${t.key}` : null,
          };
        });
        setTiles(next);
      } catch {
        // Сеть недоступна — плитки остаются, но без ссылок (не ведём в никуда)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">Скачать Balloo</h1>
      <p className="page-subtitle">
        Один мессенджер на всех ваших устройствах. Выберите платформу — и в путь.
      </p>

      {/* Блок с QR: открыть download.balloo.su на телефоне (D2) */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: 16,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          marginBottom: 24,
        }}
      >
        <QRCodeImage value={DOWNLOAD_URL} size={140} />
        <div style={{ minWidth: 220, flex: 1 }}>
          <strong style={{ display: 'block', marginBottom: 6 }}>Открыть на телефоне</strong>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Наведите камеру на QR-код — откроется эта страница на мобильном.
            Адрес: <a href={DOWNLOAD_URL}>{DOWNLOAD_URL.replace('https://', '')}</a>
          </p>
        </div>
      </div>

      {loading && <p className="muted">Проверяем доступные сборки…</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {tiles.map((tile) => {
          const isMine = tile.key === detected;
          return (
            <div
              key={tile.key}
              style={{
                padding: 16,
                border: `1px solid ${isMine ? 'var(--accent)' : 'var(--border-color)'}`,
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }} aria-hidden="true">
                  {tile.icon}
                </span>
                <strong style={{ fontSize: 16 }}>{tile.label}</strong>
                {isMine && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                    ✓ Ваша платформа
                  </span>
                )}
              </div>

              {tile.note && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tile.note}</span>
              )}

              {tile.href ? (
                <a
                  className="btn btn--primary"
                  href={tile.href}
                  style={{ marginTop: 'auto', textAlign: 'center' }}
                >
                  Скачать
                </a>
              ) : (
                // U7: платформа есть, сборки пока нет — извиняемся, а не врём ссылкой
                <div
                  style={{
                    marginTop: 'auto',
                    padding: 10,
                    border: '1px dashed var(--border-color)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Приложение для этой платформы пока не собрано. Приносим извинения —
                  мы работаем над этим и сообщим, как только сборка появится.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Мобильные магазины: RuStore + Google Play (F-3 аудита) */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>
        Магазины приложений
      </h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a className="btn btn--secondary" href={RUSTORE_URL} target="_blank" rel="noreferrer">
          RuStore
        </a>
        <a className="btn btn--secondary" href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer">
          Google Play
        </a>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Веб-версия работает без установки:{' '}
        <a href="https://balloo.su">balloo.su</a>. Она всегда свежая — обновляется сама.
      </p>
    </div>
  );
}
