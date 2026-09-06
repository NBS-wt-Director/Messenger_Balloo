// RulesScreen — страница /rules
// Пользовательское соглашение (публичная оферта) — 149-ФЗ, ГК РФ

export function RulesScreen() {
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
        <div style={{ fontSize: 40, marginBottom: 16 }}>📜</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Пользовательское соглашение
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Версия 1.0 · Обновлено: 31 августа 2026 г.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Настоящий документ является публичной офертой в соответствии со ст. 437 ГК РФ
        </p>
      </div>

      {/* 1. Общие положения */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>1. Общие положения</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения
            между администрацией сервиса Balloo Messenger (далее — «Сервис») и пользователем
            (далее — «Пользователь») в отношении использования Сервиса.
          </p>
          <p>
            Сервис осуществляется на условиях публичной оферты (ст. 437 ГК РФ).
            Полное наименование: ООО «Баллоо».
            Дата публикации: 31 августа 2026 г.
          </p>
          <p>
            Использование Сервиса означает принятие настоящего Соглашения и согласие с условиями
            обработки персональных данных в соответствии с{' '}
            <a href="/privacy" style={{ color: 'var(--accent)' }}>Политикой конфиденциальности</a>.
          </p>
        </div>
      </div>

      {/* 2. Предмет соглашения */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>2. Предмет соглашения</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            <strong>2.1.</strong> Сервис предоставляет Пользователю доступ к функционалу
            мессенджера, включая:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Обмен текстовыми, голосовыми и видео-сообщениями</li>
            <li>Создание и управление группами и каналами</li>
            <li>Голосовые и видеозвонки</li>
            <li>Публикацию контента (статьи, посты, медиафайлы)</li>
            <li>Использование функций поиска и каталогов</li>
            <li>Интеграцию с внешними сервисами (OAuth, платёжные системы)</li>
          </ul>
          <p>
            <strong>2.2.</strong> Сервис предоставляется на безвозмездной основе.
            Дополнительно могут предоставляться платные функции (донаты, подписки)
            на условиях отдельных соглашений.
          </p>
        </div>
      </div>

      {/* 3. Регистрация и учётная запись */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>3. Регистрация и учётная запись</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>3.1.</strong> Для доступа к Сервису Пользователь обязан пройти регистрацию, предоставив:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Адрес электронной почты или номер телефона</li>
            <li>Пароль длиной не менее 8 символов</li>
            <li>Отображаемое имя (displayName)</li>
            <li>Уникальное имя пользователя (username)</li>
          </ul>
          <p><strong>3.2.</strong> Пользователь несёт ответственность за сохранность учётных данных.</p>
          <p><strong>3.3.</strong> Пользователь обязуется не передавать доступ к учётной записи третьим лицам.</p>
          <p><strong>3.4.</strong> Администрация вправе заблокировать учётную запись при нарушении условий Соглашения.</p>
        </div>
      </div>

      {/* 4. Правила поведения */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>4. Правила поведения</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>Пользователь <strong>не вправе</strong>:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Распространять контент, нарушающий законодательство РФ</li>
            <li>Осуществлять действия, направленные на взлом, мошенничество или спам</li>
            <li>Создавать вредоносное ПО (вирусы, боты, скрейперы)</li>
            <li>Собирать персональные данные других пользователей без согласия</li>
            <li>Использовать Сервис для противоправной деятельности</li>
            <li>Создавать несколько учётных записей с целью манипуляций</li>
          </ul>
          <p>
            За нарушение правил Пользователь может быть заблокирован без предупреждения.
            Повторные нарушения влекут перманентную блокировку.
          </p>
        </div>
      </div>

      {/* 5. Интеллектуальная собственность */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>5. Интеллектуальная собственность</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            <strong>5.1.</strong> Все компоненты Сервиса (дизайн, код, логотипы, торговые марки,
            контент) являются объектами интеллектуальной собственности и защищены
            ГК РФ (часть 4) и международными договорами.
          </p>
          <p>
            <strong>5.2.</strong> Контент, размещаемый Пользователем, остаётся собственностью
            Пользователя. При публикации Пользователь предоставляет Сервису бессрочную
            неисключительную лицензию на использование, хранение и отображение контента.
          </p>
          <p>
            <strong>5.3.</strong> При удалении аккаунта контент Пользователя удаляется
            в течение 30 дней.
          </p>
        </div>
      </div>

      {/* 6. Ограничение ответственности */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>6. Ограничение ответственности</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            <strong>6.1.</strong> Сервис предоставляется по принципу «как есть» (as-is).
            Администрация не гарантирует uninterrupted, безошибочную работу Сервиса.
          </p>
          <p>
            <strong>6.2.</strong> Администрация не несёт ответственности за:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Временные перебои в работе Сервиса (плановое обслуживание, технические причины)</li>
            <li>Содержание пользовательских сообщений и контента</li>
            <li>Действия третьих лиц, использующих Сервис</li>
            <li>Потерю данных, если Пользователь не использовал резервное копирование</li>
          </ul>
          <p>
            <strong>6.3.</strong> Ответственность администрации ограничена суммой,
            фактически уплаченной Пользователем за использование Сервиса за последние 6 месяцев.
          </p>
        </div>
      </div>

      {/* 7. Персональные данные */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>7. Персональные данные</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Обработка персональных данных осуществляется в соответствии с{' '}
            <a href="/privacy" style={{ color: 'var(--accent)' }}>Политикой конфиденциальности</a>
            и Федеральным законом № 152-ФЗ «О персональных данных».
            Регистрируясь, Пользователь даёт согласие на обработку своих персональных данных.
          </p>
        </div>
      </div>

      {/* 8. Разрешение споров */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>8. Разрешение споров</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            <strong>8.1.</strong> Споры разрешаются путём переговоров.
            Претензия направляется на{' '}
            <a href="mailto:support@balloo.su" style={{ color: 'var(--accent)' }}>support@balloo.su</a>.
            Срок ответа — 30 дней.
          </p>
          <p>
            <strong>8.2.</strong> При недостижении согласия спор передаётся на рассмотрение
            в суд по месту нахождения Администрации в соответствии с законодательством РФ.
          </p>
        </div>
      </div>

      {/* 9. Изменение условий */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>9. Изменение условий</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Администрация вправе вносить изменения в настоящее Соглашение.
            При существенных изменениях уведомление будет размещено
            в Сервисе не менее чем за 10 дней до вступления изменений в силу.
            Продолжение использования Сервиса означает согласие с изменёнными условиями.
          </p>
        </div>
      </div>

      {/* 10. Заключительные положения */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>10. Заключительные положения</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <ul style={{ paddingLeft: 20 }}>
            <li>Соглашение вступает в силу с момента регистрации в Сервисе</li>
            <li>Регулируется законодательством Российской Федерации</li>
            <li>Применяется ГК РФ, ФЗ № 149-ФЗ «Об информации», ФЗ № 152-ФЗ «О персональных данных»</li>
            <li>Конституция РФ (ст. 23, 24) — право на приватность</li>
          </ul>
        </div>
      </div>

      {/* Контакты */}
      <div className="card" style={{ marginBottom: 48, borderColor: 'var(--accent)' }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>Контакты</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>Оператор:</strong> ООО «Баллоо»</p>
          <p><strong>Email:</strong> <a href="mailto:support@balloo.su" style={{ color: 'var(--accent)' }}>support@balloo.su</a></p>
          <p><strong>Форма обратной связи:</strong> <a href="/features" style={{ color: 'var(--accent)' }}>features.balloo.su</a></p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p>Balloo Messenger © 2026. Все права защищены.</p>
        <p style={{ marginTop: 8 }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginRight: 16 }}>На главную</a>
          <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none', marginRight: 16 }}>Политика конфиденциальности</a>
          <a href="/cookies" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Политика cookies</a>
        </p>
      </div>
    </div>
  );
}
