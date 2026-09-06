// PrivacyScreen — страница /privacy
// Политика конфиденциальности — 152-ФЗ, Конституция РФ ст.23, ст.24

export function PrivacyScreen() {
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
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Политика конфиденциальности
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Версия 1.0 · Обновлено: 31 августа 2026 г.
        </p>
      </div>

      {/* Operator */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>1. Оператор персональных данных</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>Оператор:</strong> Balloo Messenger (ООО «Баллоо»)</p>
          <p><strong>ИНН:</strong> [Указывается при регистрации ЮЛ]</p>
          <p><strong>ОГРН:</strong> [Указывается при регистрации ЮЛ]</p>
          <p><strong>Адрес:</strong> [Юридический адрес оператора]</p>
          <p><strong>Email:</strong> <a href="mailto:privacy@balloo.su" style={{ color: 'var(--accent)' }}>privacy@balloo.su</a></p>
          <p><strong>Телефон:</strong> +7 (912) 202-30-35</p>
        </div>
      </div>

      {/* General provisions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>2. Общие положения</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Настоящая Политика конфиденциальности (далее — «Политика») разработана
            в соответствии с <strong>Федеральным законом от 27.07.2006 № 152-ФЗ</strong>
            «О персональных данных», <strong>Конституцией Российской Федерации</strong>
            (статьи 23, 24), и определяет порядок обработки и защиты персональных данных
            пользователей сервиса Balloo Messenger (далее — «Сервис»).
          </p>
          <p>
            Используя Сервис, пользователь даёт своё согласие на обработку персональных
            данных в порядке, указанном в настоящей Политике.
          </p>
        </div>
      </div>

      {/* Scope of data */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>3. Какие данные мы собираем</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>3.1. Данные, предоставляемые пользователем:</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Имя и фамилия (при регистрации)</li>
            <li>Адрес электронной почты</li>
            <li>Номер телефона</li>
            <li>Имя пользователя (username)</li>
            <li>Аватар и информация профиля</li>
          </ul>
          <p><strong>3.2. Данные, собираемые автоматически:</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>IP-адрес и данные о подключении</li>
            <li>Тип устройства и браузера</li>
            <li>Файлы cookie (см. <a href="/cookies" style={{ color: 'var(--accent)' }}>Политику cookies</a>)</li>
            <li>Данные о сессиях входа (устройства, время)</li>
          </ul>
          <p><strong>3.3. Данные, создаваемые пользователем:</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Сообщения, файлы, медиафайлы</li>
            <li>Списки контактов и друзей</li>
            <li>Содержимое групп и каналов</li>
          </ul>
        </div>
      </div>

      {/* Purposes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>4. Цели обработки персональных данных</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <ul style={{ paddingLeft: 20 }}>
            <li>Регистрация и аутентификация пользователя</li>
            <li>Предоставление функций мессенджера (чаты, звонки, каналы, группы)</li>
            <li>Персонализация интерфейса и настроек</li>
            <li>Отправка уведомлений (push, email)</li>
            <li>Обработка платежей (донаты, подписки)</li>
            <li>Поддержка безопасности и предотвращение мошенничества</li>
            <li>Улучшение качества Сервиса</li>
            <li>Выполнение требований законодательства РФ</li>
          </ul>
        </div>
      </div>

      {/* Legal basis */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>5. Правовые основания обработки</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Согласие пользователя</strong> — при регистрации и приёме условий</li>
            <li><strong>Договор</strong> — предоставление услуг Сервиса (публичная оферта)</li>
            <li><strong>Закон</strong> — требования 152-ФЗ, 149-ФЗ, УПК РФ, ФЗ «О связи»</li>
            <li><strong>Законный интерес</strong> — безопасность, улучшение Сервиса</li>
          </ul>
        </div>
      </div>

      {/* Storage and protection */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>6. Хранение и защита данных</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>6.1. Хранение:</strong></p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>Персональные данные хранятся на серверах, расположенных на территории РФ (ст. 18 152-ФЗ)</li>
            <li>Срок хранения — до удаления аккаунта пользователем или прекращения обслуживания</li>
            <li>После удаления аккаунта данные удаляются в течение 30 дней</li>
          </ul>
          <p><strong>6.2. Защита:</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Шифрование данных при передаче (TLS 1.3)</li>
            <li>Хеширование паролей (bcrypt, cost factor ≥ 12)</li>
            <li>Двухфакторная аутентификация (2FA)</li>
            <li>Регулярный аудит безопасности</li>
            <li>Ограничение доступа к данным по принципу «необходимо знать»</li>
          </ul>
        </div>
      </div>

      {/* User rights */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>7. Права пользователя</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>Пользователь вправе:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Получить информацию</strong> о хранящихся данных (ст. 14 152-ФЗ)</li>
            <li><strong>Требовать уточнения, блокирования или удаления</strong> данных (ст. 14 152-ФЗ)</li>
            <li><strong>Отозвать согласие</strong> на обработку и удалить аккаунт</li>
            <li><strong>Подавать жалобы</strong> в Роскомнадзор</li>
            <li><strong>Перенести данные</strong> в другом формате (data portability)</li>
          </ul>
          <p style={{ marginTop: 16 }}>
            Для реализации прав направьте запрос на{' '}
            <a href="mailto:privacy@balloo.su" style={{ color: 'var(--accent)' }}>privacy@balloo.su</a>.
            Ответ предоставляется в течение 30 дней.
          </p>
        </div>
      </div>

      {/* Cookies reference */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>8. Файлы cookie</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Сервис использует файлы cookie для обеспечения функциональности, аналитики
            и персонализации. Подробнее — в{' '}
            <a href="/cookies" style={{ color: 'var(--accent)' }}>Политике использования cookies</a>.
          </p>
        </div>
      </div>

      {/* Third parties */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>9. Передача данных третьим лицам</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>Мы <strong>не продаём</strong> и <strong>не передаём</strong> персональные данные третьим лицам, за исключением случаев:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>По требованию уполномоченных государственных органов РФ (в рамках УПК РФ, ФЗ «О связи»)</li>
            <li>Для обеспечения работы Сервиса (хостинг, CI/CD — с заключёнными договорами обработки ПД)</li>
            <li>С согласия пользователя (OAuth-вход через Яндекс, VK, Mail.ru)</li>
          </ul>
        </div>
      </div>

      {/* Changes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>10. Изменение Политики</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p>
            Мы можем обновлять эту Политику. При существенных изменениях уведомим
            пользователей по email или через уведомление в Сервисе.
            Дата последней версии указывается в верхней части документа.
          </p>
        </div>
      </div>

      {/* Contacts */}
      <div className="card" style={{ marginBottom: 48, borderColor: 'var(--accent)' }}>
        <h2 className="card__title" style={{ marginBottom: 16 }}>11. Контакты оператора</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          <p><strong>Email:</strong> <a href="mailto:privacy@balloo.su" style={{ color: 'var(--accent)' }}>privacy@balloo.su</a></p>
          <p><strong>Телефон:</strong> +7 (912) 202-30-35</p>
          <p><strong>Форма обратной связи:</strong> <a href="/features" style={{ color: 'var(--accent)' }}>features.balloo.su</a></p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p>Balloo Messenger © 2026. Все права защищены.</p>
        <p style={{ marginTop: 8 }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginRight: 16 }}>На главную</a>
          <a href="/rules" style={{ color: 'var(--accent)', textDecoration: 'none', marginRight: 16 }}>Пользовательское соглашение</a>
          <a href="/cookies" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Политика cookies</a>
        </p>
      </div>
    </div>
  );
}
