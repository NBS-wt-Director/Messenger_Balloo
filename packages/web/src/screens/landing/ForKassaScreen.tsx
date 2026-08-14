// ForKassaScreen — страница balloo.su/for_kassa
// Содержит реквизиты для регистрации в ЮKassa: сайт, ИНН, оферта, цены

export function ForKassaScreen() {
  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '40px 24px',
      fontFamily: 'Inter, Manrope, sans-serif',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💚</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Реквизиты для ЮKassa
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.5 }}>
          Данные для регистрации и верификации в платёжном сервисе ЮKassa (Яндекс.Касса).
          Страница создана для прохождения модерации и подключения полноценных платежей.
        </p>
      </div>

      {/* Site Info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>🌐 Сайт</h2>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Домен</span>
          <span style={{ fontWeight: 600 }}>balloo.su</span>
        </div>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Название</span>
          <span style={{ fontWeight: 600 }}>Balloo Messenger</span>
        </div>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Описание</span>
          <span style={{ fontWeight: 600 }}>Безопасный мессенджер с функциями админ-панели, портала сотрудников и блога</span>
        </div>
      </div>

      {/* Business Details */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>🏢 Реквизиты</h2>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>ИНН самозанятого</span>
          <span style={{ fontWeight: 600 }}>1234567890 (Иван Оберюхттин)</span>
        </div>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Вид деятельности</span>
          <span style={{ fontWeight: 600 }}>Разработка ПО, IT-услуги, цифровые товары</span>
        </div>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Email для связи</span>
          <span style={{ fontWeight: 600 }}>admin@balloo.su</span>
        </div>
      </div>

      {/* Offer and Prices */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>📄 Оферта и цены</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Пользовательский контент и донаты. Мессенджер предоставляется бесплатно.
          Донаты — добровольные пожертвования на развитие проекта.
          Подписки — доступ к расширенным функциям (в разработке).
        </p>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Оферта</span>
          <span style={{ fontWeight: 600 }}>balloo.su/offer</span>
        </div>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Политика конфиденциальности</span>
          <span style={{ fontWeight: 600 }}>balloo.su/privacy</span>
        </div>
        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Тарифы донатов</span>
          <span style={{ fontWeight: 600 }}>от 50 ₽ до 5000 ₽</span>
        </div>
      </div>

      {/* YooKassa Connection Info */}
      <div className="card" style={{ marginBottom: 24, borderColor: 'var(--accent)' }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>🔔 Подключение ЮKassa</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          В данный момент модуль донатов работает в <strong>анонимном режиме</strong> (QR-код СБП и перевод по номеру телефона).
          После прохождения верификации в ЮKassa будет включён <strong>полноценный режим</strong> с автоматической обработкой платежей,
          HTTP-уведомлениями и поддержкой подписок.
        </p>
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--bg-tertiary)',
          fontSize: 14,
          lineHeight: 1.5,
        }}>
          <strong>Страница сайта:</strong> balloo.su/for_kassa (вы здесь)<br />
          <strong>Страница с реквизитами:</strong> balloo.su/for_kassa<br />
          <strong>ИНН:</strong> 1234567890<br />
          <strong>Оферта:</strong> balloo.su/offer
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