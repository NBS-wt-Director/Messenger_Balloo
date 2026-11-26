// QRCode — QR-код для мобильной загрузки (Android Universal APK / PWA)
// Тикет №57 — Download (узел 06). Тикет 1795683301 (D2): раньше компонент был
// CSS-ИМИТАЦИЕЙ (repeating-conic-gradient + три квадрата) и сканерами не
// читался. Теперь кодирование настоящее — через `qrcode` (тот же паттерн, что
// в screens/auth/AddDeviceScreen.tsx). Октагон-логотип сохранён как наложение
// по центру; для перекрытия модулей выбран уровень коррекции H (~30%).
//
// Требование владельца (26.11.2026): QR на download.balloo.su ведёт на
// download.balloo.su — значение приходит пропом `value`.

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCode({ value, size = 180, label }: QRCodeProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    QRCodeLib.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'H',
    })
      .then((svg) => {
        if (!cancelled) {
          setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Размер логотипа — ~16% стороны QR: перекрывает <5% площади, уровень H это
  // переносит. Белая обводка отделяет логотип от модулей для сканера.
  const logo = Math.round(size * 0.16);

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          padding: 24,
          background: '#fff',
        }}
      >
        {src && (
          <a
            href={value}
            title="Открыть на телефоне"
            style={{ display: 'inline-block', position: 'relative', lineHeight: 0 }}
          >
            <img
              src={src}
              alt={`QR-код: ${value}`}
              width={size}
              height={size}
              style={{ display: 'block' }}
            />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: logo,
                height: logo,
                clipPath:
                  'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
                background: 'var(--accent)',
                boxShadow: '0 0 0 4px #fff',
              }}
            />
          </a>
        )}

        {/* Fallback: если генерация не удалась — ссылка текстом, не битый QR */}
        {!src && (
          <a
            href={value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size,
              height: size,
              lineHeight: 1.3,
              textAlign: 'center',
              fontSize: 12,
              color: '#000',
              background: failed ? '#f3f4f6' : 'transparent',
            }}
          >
            {failed ? value : '…'}
          </a>
        )}
      </div>

      {label && <p className="text-sm text-secondary mt-2">{label}</p>}
    </div>
  );
}
