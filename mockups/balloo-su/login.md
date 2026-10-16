# Задание: balloo.su — Вход

## Макет
`balloo-su/login.html`

## Описание страницы
Экран входа в мессенджер. Поддерживает OAuth (рабочие: Яндекс, VK, Mail.ru; неактивные плитки: Rambler, MAX, Госуслуги), email+пароль, вход через другое устройство (QR). reCAPTCHA v3. v2: SMS-код.

## Структура страницы

### Topbar
- Логотип Balloo с dropdown навигацией
- Заголовок «Вход»
- Маскот 🦊, язык, тема

### Auth-card (центрированная)
1. Заголовок «С возвращением!» + подзаголовок
2. **OAuth-сетка квадратов** (P20/P21, 2026-09-18; 3×2 с 16.10.2026, решение владельца 1.2.6): сетка `auth-oauth-grid` — **3×2** (6 квадратов, `grid-template-columns: repeat(3, 1fr)`, `aspect-ratio: 1/1`), при наведении выбранный **рабочий** квадрат растёт на 50% наружу относительно сетки (`transform: scale(1.5)`, поверх соседей, `z-index: 10`):
   - Яндекс (красный Y, `#fc3f1d`) — рабочий
   - VK (синий VK, `#0077ff`) — рабочий
   - Mail.ru (синий @, `#005ff9`) — рабочий
   - Rambler (жёлтый R, `#ffcc00`) — неактивный: серая плитка `auth-oauth-tile--disabled`, `aria-disabled`, при наведении/фокусе подсказка «Проходим валидацию. Извините за неудобства.» (ждёт OAuth-приложение, решение 1.2.6 (б))
   - MAX (фиолетовый M, `#7b61ff`) — неактивный (приложения нет)
   - Госуслуги (синий Г, `#0d4cd3`) — неактивный (клиент в ESIA не заведён)
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
- `OAuthGrid` — сетка квадратов OAuth-провайдеров (6 плиток 3×2: Яндекс/VK/Mail.ru рабочие — hover +50% наружу; Rambler/MAX/Госуслуги неактивные, серые, с подсказкой про валидацию)
- `EmailLoginForm` — форма email + пароль
- `QRLoginButton` — кнопка входа через QR
- `ReCaptchaModal` — модалка reCAPTCHA

## API
- `POST /api/v1/auth/login` — вход по email+пароль
- `GET /api/v1/auth/oauth/:provider` — редирект (302) на authorize URL провайдера; провайдер не настроен → 302 на `/#/login?oauth_error=not_configured`
- `GET /api/v1/auth/oauth/yandex-callback` — callback Яндекс
- `GET /api/v1/auth/oauth/vk/callback` — callback VK
- `GET /api/v1/auth/oauth/mailru/callback` — callback Mail.ru
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
