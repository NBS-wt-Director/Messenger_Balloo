# Задание: balloo.su — Вход

## Макет
`balloo-su/login.html`

## Описание страницы
Экран входа в мессенджер. Поддерживает OAuth (Яндекс, Mail.ru, Rambler), email+пароль, вход через другое устройство (QR). reCAPTCHA v3. v2: Госуслуги и SMS-код.

## Структура страницы

### Topbar
- Логотип Balloo с dropdown навигацией
- Заголовок «Вход»
- Маскот 🦊, язык, тема

### Auth-card (центрированная)
1. Заголовок «С возвращением!» + подзаголовок
2. **OAuth-кнопки**:
   - Войти через Яндекс (красный Y)
   - Войти через Mail.ru (синий @)
   - Войти через Rambler (жёлтый R)
3. Divider «или»
4. **Email-форма**:
   - Email
   - Пароль
   - Кнопка «Войти» (primary, block)
5. Divider
6. **Вход через другое устройство (QR)**:
   - Подсказка «Уже вошли на другом устройстве?»
   - Кнопка «📱 Войти через другое устройство (QR)» → `add-device.html`
   - Текст: «Отсканируйте QR-код с экрана авторизованного устройства»
7. Divider
8. Ссылка «Нет аккаунта? Зарегистрироваться» → `register.html`
9. Divider
10. v2-плашка: «Вход через Госуслуги и SMS-код (3 цифры)»

### Modal: reCAPTCHA
- Проверка «Я не робот» (checkbox)
- Кнопка «Подтвердить»

## Функционал
- **OAuth-вход** — редирект на OAuth-провайдера, возврат с токеном
- **Email+пароль** — валидация, отправка, получение JWT
- **QR-вход** — переход на `add-device.html` для сканирования QR
- **reCAPTCHA** — модалка проверки при подозрительной активности
- **Регистрация** — переход на `register.html`

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Auth-card центрированная, glassmorphism
- OAuth-кнопки с цветными логотипами провайдеров
- Кнопка «Войти» — primary, block

## Компоненты
- `AuthCard` — контейнер формы входа
- `OAuthButtons` — кнопки OAuth-провайдеров
- `EmailLoginForm` — форма email + пароль
- `QRLoginButton` — кнопка входа через QR
- `ReCaptchaModal` — модалка reCAPTCHA

## API
- `POST /api/v1/auth/login` — вход по email+пароль
- `GET /api/v1/auth/oauth/:provider` — редирект на OAuth
- `GET /api/v1/auth/oauth/:provider/callback` — callback после OAuth
- `POST /api/v1/auth/recaptcha/verify` — проверка reCAPTCHA
- `POST /api/v1/devices/pair-token` — QR-токен для входа через устройство

## Безопасность
- JWT access + refresh tokens
- reCAPTCHA v3 при подозрительной активности
- Rate limiting: 5 попыток / 15 минут
- Пароли хешируются (bcrypt/argon2)

## Адаптивность
- Desktop: центрированная auth-card, max-width 440px
- Mobile: полный экран
- Desktop: показывается в окне приложения

## Технологии
- React 19 + Next.js
- NextAuth.js — OAuth-провайдеры
- Zustand: `authStore` (token, user, login, logout)
- JWT в httpOnly cookies
