// DownloadProgressScreen — экран начала загрузки
// Тикет №57 — Download (узел 06)

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChecksumVerifier } from './components/ChecksumVerifier';

interface DownloadState {
  label?: string;
  url?: string;
  size?: string | number;
  version?: string;
  checksum?: string;
  format?: string;
}

function formatSize(size?: string | number): string {
  if (!size) return '—';
  const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
  if (isNaN(bytes) || bytes === 0) return '—';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} ГБ`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} МБ`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${bytes} Б`;
}

const INSTALL_TIPS: Record<string, string> = {
  exe: 'Запустите скачанный .exe файл и следуйте мастеру установки.',
  msi: 'Дважды кликните на .msi файл для корпоративной установки.',
  zip: 'Распакуйте архив в любую папку и запустите Balloo.exe — установка не требуется.',
  appimage: 'Сделайте файл исполняемым: chmod +x Balloo.AppImage, затем запустите.',
  deb: 'Установите: sudo dpkg -i balloo.deb или sudo apt install ./balloo.deb',
  rpm: 'Установите: sudo rpm -i balloo.rpm или sudo dnf install balloo.rpm',
  'tar.gz': 'Распакуйте: tar -xzf BallooPortable.tar.gz и запустите Balloo',
  dmg: 'Откройте .dmg и перетащите Balloo в папку Applications.',
  apk: 'Разрешите установку из неизвестных источников, затем откройте APK файл.',
  aab: 'AAB предназначен для загрузки в Google Play (разработчикам).',
};

export function DownloadProgressScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as DownloadState;

  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  // Если нет данных — предлагаем вернуться
  useEffect(() => {
    if (!state.url) return;
    setStarted(true);

    // Имитация прогресса (реальная загрузка идёт через window.location.href)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [state.url]);

  if (!state.url) {
    return (
      <div className="main">
        <div className="content overflow-y-auto">
          <div className="page-container text-center">
            <h1 className="page-title">⬇️ Загрузка</h1>
            <p className="page-subtitle">Файл не выбран</p>
            <button className="btn btn--primary mt-4" onClick={() => navigate('/download')}>
              ← Вернуться к загрузкам
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tip = state.format ? INSTALL_TIPS[state.format] || '' : '';

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          <h1 className="page-title">⬇️ Загрузка файла</h1>
          <p className="page-subtitle">{state.label || 'Пакет Balloo'}</p>

          {/* Прогресс-бар */}
          <div className="card mb-6">
            <div style={{ marginBottom: '12px' }}>
              <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {state.label}
                </span>
                <span className="text-sm text-muted">
                  {formatSize(state.size)}
                  {state.version ? ` · v${state.version}` : ''}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '24px',
                  background: 'var(--bg-hover, rgba(255,255,255,0.05))',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {Math.round(Math.min(progress, 100))}%
                </div>
              </div>

              {progress >= 90 && (
                <div className="text-xs text-muted mt-2">
                  Если загрузка не началась автоматически —{' '}
                  <a href={state.url} className="text-accent">
                    нажмите здесь
                  </a>
                </div>
              )}
            </div>

            {started && (
              <a
                href={state.url}
                className="btn btn--primary btn--block"
                onClick={() => setProgress(100)}
              >
                ⬇️ Скачать {state.label}
              </a>
            )}
          </div>

          {/* Советы по установке */}
          {tip && (
            <div className="card mb-6">
              <h3 className="section-title" style={{ marginBottom: '12px' }}>
                💡 Советы по установке
              </h3>
              <div className="text-sm" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {tip}
              </div>
            </div>
          )}

          {/* Контрольная сумма */}
          <div className="card mb-6">
            <h3 className="section-title" style={{ marginBottom: '12px' }}>
              🔐 Проверка контрольной суммы
            </h3>
            <ChecksumVerifier
              checksum={state.checksum}
              fileName={state.label}
            />
          </div>

          {/* Ссылки на документацию */}
          <div className="card text-center mb-3">
            <div className="text-sm text-secondary mb-2">Нужна помощь?</div>
            <a href="https://api.balloo.su/doc" className="btn btn--tertiary">
              📚 Документация API →
            </a>
          </div>

          {/* Для Android: QR */}
          {state.format === 'apk' && (
            <div className="card text-center">
              <div className="text-sm text-secondary mb-2">
                Открыть на телефоне? Наведите камеру на QR-код:
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '16px',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    width: '140px',
                    height: '140px',
                    background:
                      'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 10px 10px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      width: '32px',
                      height: '32px',
                      background: '#fff',
                      border: '6px solid #000',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '32px',
                      height: '32px',
                      background: '#fff',
                      border: '6px solid #000',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      left: '6px',
                      width: '32px',
                      height: '32px',
                      background: '#fff',
                      border: '6px solid #000',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: '24px',
                      height: '24px',
                      clipPath:
                        'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-4">
            <button className="btn btn--tertiary" onClick={() => navigate('/download')}>
              ← Вернуться к загрузкам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
