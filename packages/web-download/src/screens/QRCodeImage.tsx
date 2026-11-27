// QRCodeImage — настоящий QR-код (тик. 1795683301, D2).
//
// Раньше на экране загрузок стояла CSS-имитация, которую сканеры не читают.
// Здесь — кодирование через `qrcode` (toString → SVG data-URL), октагон-логотип
// по центру как наложение; уровень коррекции H переносит перекрытие.

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeImageProps {
  value: string;
  size?: number;
}

export function QRCodeImage({ value, size = 180 }: QRCodeImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    QRCodeLib.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'H' })
      .then((svg) => {
        if (!cancelled) setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
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

  const logo = Math.round(size * 0.16);

  return (
    <div style={{ display: 'inline-block', padding: 16, background: '#fff' }}>
      {src ? (
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
              clipPath: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
              background: 'var(--accent)',
              boxShadow: '0 0 0 4px #fff',
            }}
          />
        </a>
      ) : (
        // Генерация не удалась — отдаём ссылку текстом, а не битую картинку
        <a
          href={value}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            fontSize: 12,
            lineHeight: 1.3,
            textAlign: 'center',
            color: '#000',
            background: failed ? '#f3f4f6' : 'transparent',
          }}
        >
          {failed ? value : '…'}
        </a>
      )}
    </div>
  );
}
