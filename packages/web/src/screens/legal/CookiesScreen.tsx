// CookiesScreen — страница /cookies
// Политика использования файлов cookie

export function CookiesScreen() {
  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '48px 24px',
      fontFamily: 'Inter, Manrope, sans-serif',
      color: 'var(--text-primary)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🍪</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Политика использования файлов cookie
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Версия 1.1 · Обновлено: 1 сентября 2026 г.
        </p>
      </div>

      {/* 1. Что такое cookie */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>1. Что такое cookie</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            <strong>Cookies (файлы cookie)</strong> — это небольшие текстовые файлы, которые
            сохраняются на вашем устройстве при посещении нашего Сервиса. Они помогают
            Сервису работать корректно, запоминают ваши настройки и улучшают
            пользовательский опыт.
          </p>
          <p>
            Файлы cookie не содержат персональных данных, позволяющих идентифицировать
            конкретное физическое лицо, за исключением случаев, предусмотренных
            законодательством РФ.
          </p>
        </div>
      </div>

      {/* 2. Какие cookie мы используем */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>2. Категории используемых cookie</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>2.1. Необходимые (строго необходимые) cookie:</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Обеспечивают базовую функциональность Сервиса</li>
            <li>Не требуют согласия пользователя</li>
            <li>Примеры: идентификатор сессии, токен аутентификации</li>
            <li>Срок: до выхода из браузера или до истечения срока действия токена</li>
          </ul>
          <p><strong>2.2. Функциональные cookie:</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Запоминают ваши предпочтения (язык, тема оформления, размеры)</li>
            <li>Позволяют персонализировать интерфейс</li>
            <li>Срок: от 1 дня до 1 года</li>
          </ul>
          <p><strong>2.3. Аналитические cookie (устанавливаются только с вашего согласия):</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Яндекс.Метрика — веб-аналитика Сервиса</li>
            <li>Cookie: <code>_ym_uid</code> (идентификатор посетителя), <code>_ym_isad</code> (признак блокировщика рекламы), <code>_ym_d</code> (дата визита)</li>
            <li>IP-адрес анонимизируется (параметр <code>ip: true</code>) в соответствии с 152-ФЗ</li>
            <li>Скрипт Метрики загружается <strong>только после нажатия «Принять все»</strong> в баннере cookie</li>
            <li>При выборе «Только необходимые» аналитические cookie не устанавливаются</li>
            <li>Срок: до 2 лет</li>
          </ul>
          <p><strong>2.4. Cookie сторонних сервисов (устанавливаются только с вашего согласия):</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>OAuth-вход (Яндекс ID, VK ID, Mail.ru ID) — временные cookie на доменах провайдеров, срок: сессия авторизации</li>
            <li>Платёжная система (ЮKassa) — cookie на домене yookassa.ru для обработки платежей, срок: сессия оплаты</li>
            <li>Согласие на сторонние cookie фиксируется в cookie <code>balloo-cookie-consent</code> на домене balloo.su</li>
          </ul>
        </div>
      </div>

      {/* 3. Управление cookie */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>3. Управление cookie</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Вы можете управлять cookie через настройки вашего браузера:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>Chrome:</strong> Настройки → Конфиденциальность → Файлы cookie</li>
            <li><strong>Firefox:</strong> Настройки → Приватность и файлы cookie</li>
            <li><strong>Safari:</strong> Настройки → Конфиденциальность</li>
            <li><strong>Яндекс.Браузер:</strong> Настройки → Конфиденциальность</li>
          </ul>
          <p>
            Отключение cookie может ограничить функциональность Сервиса.
            Например, без необходимых cookie вы не сможете войти в аккаунт.
          </p>
        </div>
      </div>

      {/* 4. Хранение данных */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>4. Хранение и безопасность cookie</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <ul style={{ paddingLeft: 20 }}>
            <li>Cookies хранятся локально на вашем устройстве</li>
            <li>Передаются по зашифрованному каналу (TLS 1.3)</li>
            <li>Не содержат конфиденциальной информации (пароли, банковские данные)</li>
            <li>Используются только в целях, описанных в настоящей Политике</li>
            <li>Не передаются третьим лицам без вашего согласия (кроме случаев, указанных ниже)</li>
          </ul>
        </div>
      </div>

      {/* 5. Передача третьим лицам */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>5. Передача данных третьим лицам</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Данные из cookie могут быть переданы:
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>По требованию уполномоченных государственных органов РФ</li>
            <li>Сторонним сервисам, интегрированным в Сервис (OAuth, аналитика) — в соответствии с их политикой конфиденциальности</li>
            <li>С вашего явного согласия</li>
          </ul>
        </div>
      </div>

      {/* 6. Согласие */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>6. Согласие на использование cookie</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            При первом посещении Сервиса отображается баннер согласия на использование cookie
            с двумя вариантами:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>
              <strong>«Принять все»</strong> — разрешает аналитические cookie (Яндекс.Метрика,
              с анонимизацией IP) и сторонние cookie (OAuth-провайдеры: Яндекс ID, VK ID,
              Mail.ru ID; платёжная система ЮKassa). Яндекс.Метрика загружается только после
              этого выбора.
            </li>
            <li>
              <strong>«Только необходимые»</strong> — работают только необходимые и
              функциональные cookie (аутентификация, тема, язык). Аналитические и сторонние
              cookie не устанавливаются.
            </li>
          </ul>
          <p>
            Ваш выбор сохраняется в cookie <code>balloo-cookie-consent</code> на срок 365 дней
            и действует на всех поддоменах balloo.su.
          </p>
          <p>
            Отозвать согласие можно в любое время: удалите cookie Сервиса в настройках
            браузера (см. раздел 3) — при следующем визите баннер появится снова, и вы сможете
            выбрать другой вариант. Отзыв согласия не ограничивает доступ к Сервису.
          </p>
        </div>
      </div>

      {/* 7. Контакты */}
      <div className="card" style={{ marginBottom: 48, borderColor: 'var(--accent)' }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>Контакты</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            По вопросам, связанным с использованием cookie, обращайтесь на:{' '}
            <a href="mailto:privacy@balloo.su" style={{ color: 'var(--accent)' }}>privacy@balloo.su</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p>Balloo Messenger © 2026. Все права защищены.</p>
        <p style={{ marginTop: 8 }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginRight: 16 }}>На главную</a>
          <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none', marginRight: 16 }}>Политика конфиденциальности</a>
          <a href="/rules" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Пользовательское соглашение</a>
        </p>
      </div>
    </div>
  );
}
