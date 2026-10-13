// DonateScreen — страница balloo.su/donat
// Страница донатов: QR-код СБП, номер телефона, заглушка ЮKassa
// P35: единая шапка/подвал (@balloo/ui)
// Читает GET /api/payments/config для динамических реквизитов (тикет 1791864002)

import { useState, useEffect } from 'react';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

interface PaymentConfig {
  mode: string;
  sbpQrUrl: string;
  sbpPhoneNumber: string;
  sbpPhoneName: string;
}

// Fallback-значения при недоступности API
const FALLBACK: PaymentConfig = {
  mode: 'anonymous',
  sbpQrUrl: '/qr.webp',
  sbpPhoneNumber: '+7 912 202-30-35',
  sbpPhoneName: 'Оберюхттин Иван',
};

// Нормализация номера телефона: 89122023035 → +7 912 202-30-35
function formatPhone(raw: string): string {
  if (!raw) return FALLBACK.sbpPhoneNumber;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.slice(1);
  }
  if (digits.length !== 11 || !digits.startsWith('7')) return raw;
  return `+${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function DonateScreen() {
  const [config, setConfig] = useState<PaymentConfig>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/payments/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PaymentConfig | null) => {
        if (!cancelled && data) {
          setConfig({
            mode: data.mode || FALLBACK.mode,
            sbpQrUrl: data.sbpQrUrl || FALLBACK.sbpQrUrl,
            sbpPhoneNumber: data.sbpPhoneNumber || FALLBACK.sbpPhoneNumber,
            sbpPhoneName: data.sbpPhoneName || FALLBACK.sbpPhoneName,
          });
        }
      })
      .catch(() => {
        // API недоступен — fallback остаётся
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: 'Inter, Manrope, sans-serif',
    }}>
      {/* P35: единая шапка (@balloo/ui) */}
      <AppTopbar title="Донаты" />

      <div style={{
        maxWidth: 600,
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px',
        flex: 1,
      }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💚</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Поддержать Balloo
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.5 }}>
          Мессенджер бесплатный. Ваши донаты идут на развитие проекта,
          оплату серверов и новых разработчиков.
        </p>
      </div>

      {/* QR Code Card */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>📱 СБП по QR-коду</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          Откройте приложение банка → «Сканировать QR» → наведите на код ниже
        </p>
        <img
          src={config.sbpQrUrl}
          alt="QR-код для перевода по СБП"
          style={{
            maxWidth: 280,
            width: '100%',
            borderRadius: 8,
            border: '2px solid var(--border)',
          }}
        />
      </div>

      {/* Phone Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>📞 Перевод по номеру</h2>
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: 20,
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Сбербанк (СБП)
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
            marginBottom: 8,
            fontFamily: 'monospace',
          }}>
            {formatPhone(config.sbpPhoneNumber)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {config.sbpPhoneName}
          </div>
        </div>
      </div>

      {/* YooKassa Placeholder */}
      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <h2 className="card__title" style={{ marginBottom: 12 }}>🔔 Подключение ЮKassa</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Мы работаем над подключением ЮKassa для автоматических платежей.
          Пока все донаты принимаются вручную по QR-коду и переводу на номер.
          После подключения вы сможете платить:
        </p>
        <ul style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, paddingLeft: 20, marginTop: 8 }}>
          <li>Картами Visa/Mastercard/МИР</li>
          <li>СБП автоматически</li>
          <li>Через SberPay, YooMoney</li>
        </ul>
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--bg-tertiary)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          borderRadius: 6,
        }}>
          Режим: {config.mode === 'anonymous' ? 'ручной приём (СБП)' : config.mode}
        </div>
      </div>
      </div>

      {/* P35: единый подвал (@balloo/ui) */}
      <AppFooter />
    </div>
  );
}
