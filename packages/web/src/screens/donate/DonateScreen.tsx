// DonateScreen — страница balloo.su/donat
// Страница донатов: QR-код СБП, номер телефона, заглушка ЮKassa

export function DonateScreen() {
  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: '40px 24px',
      fontFamily: 'Inter, Manrope, sans-serif',
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
          src="/qr.webp"
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
            +7 912 202-30-35
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Оберюхттин Иван
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
          color: 'var(--accent)',
          borderRadius: 6,
        }}>
          ✅ Спонсоры будут отмечены в благодарственном чате
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--text-secondary)', fontSize: 14 }}>
        <p>Balloo Messenger © 2026. Все права защищены.</p>
        <p style={{ marginTop: 4 }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>На главную</a>
        </p>
      </div>
    </div>
  );
}
