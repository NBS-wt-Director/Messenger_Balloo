// QRCode — QR-код для мобильной загрузки (Android Universal APK)
// Тикет №57 — Download (узел 06)
// Использует CSS-рендер простого QR-подобного паттерна с октагон-логотипом в центре

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCode({ value, size = 180, label }: QRCodeProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          padding: '24px',
          background: '#fff',
        }}
      >
        {/* CSS-имитация QR-кода с октагон-логотипом в центре */}
        <a
          href={value}
          style={{ display: 'block', textDecoration: 'none' }}
          title="Открыть на телефоне"
        >
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background:
                'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 12px 12px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(45deg,transparent 40%,#fff 41%,#fff 44%,transparent 45%),linear-gradient(-45deg,transparent 40%,#fff 41%,#fff 44%,transparent 45%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '40px',
                height: '40px',
                background: '#fff',
                border: '8px solid #000',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '40px',
                height: '40px',
                background: '#fff',
                border: '8px solid #000',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                width: '40px',
                height: '40px',
                background: '#fff',
                border: '8px solid #000',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: '32px',
                height: '32px',
                clipPath:
                  'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
                background: 'var(--accent)',
              }}
            />
          </div>
        </a>
      </div>
      {label && (
        <p className="text-sm text-secondary mt-2">{label}</p>
      )}
    </div>
  );
}
