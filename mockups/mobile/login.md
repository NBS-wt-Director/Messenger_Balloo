# Экран: Вход — Mobile

**ID:** `1_08_01`  
**Узел:** `у_08` — mobile (сборные мобильные макеты)  
**Web-источник:** `balloo-su/login.html`

## Описание

Мобильная версия страницы авторизации. Форма входа с OAuth-кнопками (Яндекс, Mail.ru, Rambler), email/пароль, вход через QR-код с другого устройства, modal reCAPTCHA.

## Структура

### Topbar
- Логотип Balloo с dropdown навигацией (7 пунктов + divider)
- Название экрана: «Вход»
- Аватар пользователя (`avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact`)
- Переключатель языка (🇷🇺 RU, `data-lang-toggle`)
- Переключатель темы (🌙 Тёмная, `data-theme-toggle`)

### Контент (single-column, phone-frame)
1. **Заголовок** — «С возвращением!»
2. **Подзаголовок** — «Войдите в свой аккаунт Balloo»
3. **OAuth-кнопки** — Яндекс (🔴 Y), Mail.ru (🔵 @), Rambler (🟡 R)
4. **Разделитель** — «или»
5. **Email** — текстовое поле
6. **Пароль** — с ссылкой «Забыли пароль?»
7. **Кнопка «Войти»** — primary, блок
8. **Разделитель**
9. **Вход через QR** — «Войти через другое устройство (QR)» → `add-device.html`
10. **Ссылка на регистрацию** — «Зарегистрироваться» → `register.html`
11. **Версия** — «v2: Вход через Госуслуги и SMS-код (3 цифры)»

### Modal: reCAPTCHA
- Модальное окно «Проверка reCAPTCHA»
- Чекбокс «Я не робот»
- Кнопка «Подтвердить»
- Закрывается по клику на overlay или крестик

## Бизнес-логика

### JavaScript
- `closeModal(id)` — закрытие модального окна, скрытие overlay

### Навигация
- «Забыли пароль?» → `password-reset.html`
- «Войти через другое устройство (QR)» → `add-device.html`
- «Зарегистрироваться» → `register.html`
- OAuth кнопки — placeholder (интеграция с Яндекс/Mail.ru/Rambler)

## API
- `POST /auth/login` — вход по email/паролю
- `POST /auth/oauth/<provider>/callback` — OAuth (Яндекс, Mail.ru, Rambler)
- Rate limiting: 5 попыток/мин, капча после 3 неудач

## Адаптация под mobile

| Web | Mobile |
|---|---|
| topbar full-width | topbar в phone-frame |
| auth-card centered | auth-card centered + max-width: 100% |
| — | phone-frame 360×760, tabbar: НЕТ (auth) |
