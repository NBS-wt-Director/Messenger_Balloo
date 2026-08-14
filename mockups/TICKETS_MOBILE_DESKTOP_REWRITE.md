# 🎫 ТИКЕТЫ: Переписывание mobile и desktop экранов по новым правилам

> **Источник правил:** `AGENTS_TICKET_MOBILE_DESKTOP.md` (в корне проекта)
> **Принцип:** Каждый экран mobile/desktop — адаптация web-экрана из `balloo-su/`. Бизнес-логика копируется 1:1, меняется только визуальная оболочка.
> **Решения пользователя:** Все экраны — «скопируй логику с web» / «принять как есть (1:1 web)»
> **Дата создания:** 2026-07-21
> **Дата обновления:** 2026-07-22 (Тикеты 1, 2, 3, 4, 5, 6 — ✅ Выполнены)
> **Всего экранов:** 30 (19 mobile + 11 desktop)
> **Тикетов:** 6 (по 4-6 экранов на тикет)
> **Выполнено:** 6 тикетов (30 экранов) — Тикет 1, Тикет 2, Тикет 3, Тикет 4, Тикет 5, Тикет 6

---

## 📊 Статистика по всем экранам проекта

| Узел | Экранов | ✅ Принято | 👁 Просмотрено | ❌ Не принято |
|---|---|---|---|---|
| `у_00` shared (общие) | 8 | 0 | 8 | 0 |
| `у_01` balloo.su | 31 | 18 | 13 | 0 |
| `у_02` admin.balloo.su | 26 | 26 | 0 | 0 |
| `у_03` command.balloo.su | 23 | 23 | 0 | 0 |
| `у_04` features.balloo.su | 5 | 5 | 0 | 0 |
| `у_05` history.balloo.su | 4 | 2 | 0 | 2 |
| `у_06` download.balloo.su | 2 | 2 | 0 | 0 |
| `у_07` docs.balloo.su | 1 | 1 | 0 | 0 |
| `у_08` mobile | 20 | 20 | 2 | 0 |
| `у_09` desktop | 15 | 12 | 3 | 0 |
| `у_10` specifity | 7 | 7 | 0 | 0 |
| `у_11` blog | 6 | 6 | 0 | 0 |
| **Итого** | **146** | **114** | **26** | **4** |

- **Принято:** 114/146 (78.1%)
- **Просмотрено:** 26/146 (17.8%)
- **Не принято:** 4/141 (2.8%)

### Статус тикетов mobile/desktop

| Тикет | Платформа | Экранов | Статус |
|---|---|---|---|
| 1 | Mobile — чат | 6 | ✅ Выполнен |
| 2 | Mobile — контакты/настройки | 5 | ✅ Выполнен |
| 3 | Mobile — авторизация | 6 | ✅ Выполнен |
| 4 | Mobile — донаты | 2 | ✅ Выполнен |
| 5 | Desktop — чат | 5 | ✅ Выполнен |
| 6 | Desktop — формы | 6 | ✅ Выполнен |
| **Итого** | | **30** | **✅ 6/6 (100%)** |

### Выполненные экраны Тикета 2

| # | Экран | Статус |
|---|---|---|
| 1 | `contacts.html` | ✅ Принят |
| 2 | `settings.html` | ✅ Принят (13 табов, 2FA email-код) |
| 3 | `profile.html` | ✅ Принят (3 slide-панели) |
| 4 | `group-create.html` | ✅ Принят (тип = dropdown, авто-аватар) |
| 5 | `poll-editor.html` | ✅ Принят (5 типов интерактивов) |

### Выполненные экраны Тикета 3

| # | Экран | Статус |
|---|---|---|
| 1 | `login.html` | ✅ Принят (OAuth: Яндекс/Mail.ru/Rambler, QR-вход, reCAPTCHA) |
| 2 | `register.html` | ✅ Принят (OAuth, автоаватар, капча, email-код подтверждения) |
| 3 | `password-reset.html` | ✅ Принят (4 шага, кириллическая капча с JS-генерацией) |
| 4 | `two-factor.html` | ✅ Принят (email-код вместо TOTP, без QR/backup-кодов) |
| 5 | `add-device.html` | ✅ Принят (QR с таймером 60 сек, инструкции, безопасность) |
| 6 | `my-devices.html` | ✅ Принят (полные карточки устройств, metadata, session details) |

---

## 📋 Общие правила для ВСЕХ тикетов

### Обязательный topbar (на каждом экране)

```html
<div class="topbar">
  <div class="topbar__logo">
    <div class="topbar__logo-icon">B</div>
    <span>Balloo</span>
    <div class="topbar__dropdown">
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/chats.html'">💬 Balloo</div>
      <div class="topbar__dropdown-divider"></div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../admin-balloo-su/index.html'">🛡️ Admin</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../command-balloo-su/index.html'">🏢 Command</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../features-balloo-su/index.html'">💡 Features</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../history-balloo-su/index.html'">📜 History</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../download-balloo-su/index.html'">⬇️ Download</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../docs-balloo-su/index.html'">📚 API Docs</div>
      <div class="topbar__dropdown-divider"></div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/contacts.html'">👤 Контакты</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/search.html'">🔍 Поиск</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/archive.html'">📦 Архив</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/calls.html'">📞 Звонки</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/invites.html'">📨 Приглашения</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/bots.html'">🤖 О ботах</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../balloo-su/about-balloo.html'">ℹ️ О Balloo</div>
    </div>
  </div>
  <div class="topbar__title">Название экрана</div>
  <div class="topbar__right">
    <div class="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact" onclick="window.location.href='../balloo-su/profile.html'">
      <div class="avatar__inner"><span>ИИ</span></div>
    </div>
    <span class="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
    <span class="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
  </div>
</div>
```

> **Важно:** Пути в dropdown — `../balloo-su/...` и `../admin-balloo-su/...` (относительно `mobile/` или `desktop/`).

### Mobile: phone-frame + tabbar

```html
<div class="phone-frame">
  <div class="phone-frame__notch"></div>
  <div class="phone-frame__statusbar"><span>9:41</span><span>📶 🔋</span></div>
  <div class="phone-frame__screen">
    <!-- TOPBAR (обязательный, см. выше) -->
    <!-- КОНТЕНТ ЭКРАНА (из web-источника, адаптированный) -->
    <!-- TABBAR (нижняя навигация) -->
    <div class="phone-tabbar">
      <div class="phone-tabbar__item" onclick="window.location.href='chat.html'"><span class="phone-tabbar__icon">💬</span>Чаты</div>
      <div class="phone-tabbar__item" onclick="window.location.href='contacts.html'"><span class="phone-tabbar__icon">👥</span>Контакты</div>
      <div class="phone-tabbar__item" onclick="window.location.href='stories.html'"><span class="phone-tabbar__icon">📷</span>Сторис</div>
      <div class="phone-tabbar__item" onclick="window.location.href='calls-history.html'"><span class="phone-tabbar__icon">📞</span>Звонки</div>
      <div class="phone-tabbar__item phone-tabbar__item--active" onclick="window.location.href='settings.html'"><span class="phone-tabbar__icon">⚙</span>Настройки</div>
    </div>
  </div>
  <div class="phone-frame__home-bar"></div>
</div>
```

> **Tabbar:** активный элемент зависит от экрана. На экране `chat.html` — активен «Чаты», на `settings.html` — «Настройки» и т.д.
> **Tabbar НЕ нужен** на экранах: login, register, password-reset, two-factor (auth-экраны без навигации).

### Desktop: window-frame + sidebar

```html
<div class="window-frame">
  <div class="titlebar">
    <div class="titlebar__left">
      <div class="titlebar__icon">B</div>
      <span class="titlebar__title">Balloo Messenger — Название экрана</span>
    </div>
    <div class="titlebar__menu">
      <div class="titlebar__menu-item">Файл</div>
      <div class="titlebar__menu-item">Правка</div>
      <div class="titlebar__menu-item">Вид</div>
      <div class="titlebar__menu-item">Окно</div>
      <div class="titlebar__menu-item">Справка</div>
    </div>
    <div class="titlebar__controls">
      <div class="titlebar__btn" title="Свернуть">─</div>
      <div class="titlebar__btn" title="Развернуть">▢</div>
      <div class="titlebar__btn titlebar__btn--close" title="Закрыть">✕</div>
    </div>
  </div>
  <!-- TOPBAR (обязательный, внутри window-body или над ним) -->
  <div class="window-body">
    <div class="window-sidebar"><!-- Список чатов/контактов/настроек --></div>
    <div class="window-content"><!-- Основной контент из web-источника --></div>
  </div>
  <div class="statusbar">
    <div><span class="status-dot status-dot--online"></span> Подключено · WebSocket</div>
    <div class="statusbar__sep">💾 Кэш: 124 МБ · v1.0.0-beta</div>
  </div>
</div>
```

### Чеклист перед сохранением (для каждого экрана)

- [ ] `topbar` присутствует с `topbar__dropdown`
- [ ] Все пункты dropdown имеют `onclick="window.location.href='...'"` с правильными путями `../`
- [ ] `topbar__right` с аватаром (`avatar--sm avatar--bordered`)
- [ ] `data-lang-toggle` (🇷🇺 RU) присутствует
- [ ] `data-theme-toggle` (🌙 Тёмная) присутствует
- [ ] Бизнес-логика скопирована из web-экрана (`balloo-su/`)
- [ ] Все кнопки имеют `onclick` (не пустые)
- [ ] Mobile: `phone-frame` + `phone-tabbar` (кроме auth-экранов)
- [ ] Desktop: `window-frame` + `titlebar` + `window-sidebar` + `window-content` + `statusbar`
- [ ] `<script src="../assets/common.js"></script>` в конце файла
- [ ] MD-документация рядом обновлена
- [ ] `index_ecrans.md` обновлён (статус экрана)

### Порядок работы для каждого экрана

1. **Прочитать web-источник** в `mockups/balloo-su/<экран>.html`
2. **Создать/переписать** `mockups/mobile/<экран>.html` или `mockups/desktop/<экран>.html`
3. **Обернуть контент** в phone-frame (mobile) или window-frame (desktop)
4. **Добавить обязательный topbar** с dropdown, аватаром, lang/theme toggle
5. **Добавить tabbar** (mobile, кроме auth) или sidebar (desktop)
6. **Скопировать ВСЮ бизнес-логику**: кнопки, onclick, модалки, JS-функции, slide-панели
7. **Адаптировать пути**: `../balloo-su/...` для ссылок на web-экраны
8. **Обновить MD** рядом с макетом
9. **Обновить `index_ecrans.md`** — статус экрана

---

## 🎫 Тикет 1: Mobile — Чат и сообщения (6 экранов) ✅ **ВЫПОЛНЕН**

**Папка:** `mockups/mobile/`
**Web-источники:** `mockups/balloo-su/`

| # | Файл | Web-источник | Описание | Статус |
|---|---|---|---|---|
| 1 | `chat.html` | `balloo-su/chats.html` | Полный чат: сообщения, input-area, реакции, ответы, модалки (new-chat, call-overlay, attachments-panel) | ✅ Готов |
| 2 | `stories.html` | `balloo-su/stories.html` | Сторис: трей + viewer + октагон 24ч, ответы в чат | ✅ Готов |
| 3 | `chat-attachments.html` | `balloo-su/chat-attachments.html` | Вложения чата по категориям: файлы, медиа, ссылки, сортировка, поиск | ✅ Готов |
| 4 | `report-message.html` | `balloo-su/report-message.html` | Жалоба на сообщение: причина, комментарий, скриншот, отправка | ✅ Готов |
| 5 | `calls-history.html` | `balloo-su/calls.html` | История звонков: входящие/исходящие/пропущенные, фильтры, openCall() | ✅ Готов |
| 6 | `archive.html` | `balloo-su/archive.html` | Архив чатов: список, восстановление, удаление | ✅ Готов |

**Активный tabbar-элемент:**
- chat.html → Чаты
- stories.html → Сторис
- calls-history.html → Звонки
- archive.html, chat-attachments.html, report-message.html → Чаты (или без активного)

**API-зависимости этого тикета:**
- WebSocket: **native Node.js** (не Hono+uWebSockets). Подключение `ws://balloo.su/ws?token=<JWT>`
- WS event `2fa.required`: payload `{userId, methods: ["email"]}` (не `["totp"]`)
- Все WS события (message:new, call:invite, call:join, call:leave, chat:typing, message:read, user:status) — без изменений
- Эндпоинт `POST /attachments/upload`: лимит **15 МБ** без облака (было 10 МБ), **1 ГБ** с облаком
- Эндпоинт `POST /attachments/cloud` (было `/attachments/yandex-disk`) — поддержка Yandex Disk + Mail.ru Cloud

**Особенности:**
- `chat.html` — самый сложный. Скопировать ВСЕ JS-функции: openCall, toggleEmojiPanel, openAttachments, openPollEditor, openStoryCreate, switchChat, sendMessage, toggleReaction
- `stories.html` — скопировать story viewer, story tray, создание сторис
- Все модальные окна и slide-панели из web-источника должны быть в mobile-версии

---

## 🎫 Тикет 2: Mobile — Контакты, настройки, формы (5 экранов) ✅ **ВЫПОЛНЕН**

**Папка:** `mockups/mobile/`
**Web-источники:** `mockups/balloo-su/`

| # | Файл | Web-источник | Описание | Статус |
|---|---|---|---|---|
| 1 | `contacts.html` | `balloo-su/contacts.html` | Список контактов с поиском, добавление, удаление, написать/позвонить | ✅ Готов |
| 2 | `settings.html` | `balloo-su/settings.html` | Настройки с табами: уведомления, приватность, темы, языки, медиа (13 табов, 2FA email-код) | ✅ Готов |
| 3 | `profile.html` | `balloo-su/profile.html` | Профиль пользователя: аватар, имя, статус, редактирование, slide-панели | ✅ Готов |
| 4 | `group-create.html` | `balloo-su/group-create.html` | Создание группы: тип (выпадающий список), автогенерация аватарки, обложка, участники | ✅ Готов |
| 5 | `poll-editor.html` | `balloo-su/poll-editor.html` | Редактор опроса/квиза: 5 типов, вопросы, варианты, таймеры | ✅ Готов |

**Активный tabbar-элемент:**
- contacts.html → Контакты
- settings.html → Настройки
- profile.html → Настройки (или без активного)
- group-create.html, poll-editor.html → Чаты (или без активного)

**API-зависимости этого тикета:**
- 2FA вкладка в settings использует: `POST /auth/2fa/send-code`, `POST /auth/2fa/verify`, `DELETE /auth/2fa` (email-код, не TOTP)
- Экспорт чата группы: `GET /groups/:id/export` (PDF, только админ)
- Экспорт чата: `POST /chats/:id/export` (PDF)
- `POST /users/me` — обновление профиля (имя, био, статус, аватар, язык, тема)
- `POST /attachments/cloud` — загрузка на Yandex Disk / Mail.ru Cloud

**Особенности:**
- `settings.html` — скопировать все табы и switch-компоненты из web. Вкладка 2FA — **email-код (не TOTP)**, без QR и backup-кодов
- `group-create.html` — тип группы = выпадающий список (не радио-кнопки); автогенерация аватарки = случайный градиентный фон + случайный символ; можно перегенерировать или загрузить свою; можно загрузить обложку; поле «срок действия ссылки» НЕ нужно
- `poll-editor.html` — 5 типов интерактивов: опрос, квиз, активный список, пассивный список, персонали

---

## 🎫 Тикет 3: Mobile — Авторизация и устройства (6 экранов) ✅ **ВЫПОЛНЕН**

**Папка:** `mockups/mobile/`
**Web-источники:** `mockups/balloo-su/`

| # | Файл | Web-источник | Описание | Статус |
|---|---|---|---|---|
| 1 | `login.html` | `balloo-su/login.html` | Вход: email/пароль, OAuth (Яндекс, Mail.ru, Rambler), QR-вход, реCAPTCHA модалка | ✅ Готов |
| 2 | `register.html` | `balloo-su/register.html` | Регистрация: имя, автоаватар, email, пароль, капча, email-код подтверждения | ✅ Готов |
| 3 | `password-reset.html` | `balloo-su/password-reset.html` | Сброс пароля: 4 шага, кириллическая капча (JS), email-код | ✅ Готов |
| 4 | `two-factor.html` | `balloo-su/two-factor.html` | 2FA: **email-код** (не TOTP). Отправка кода на email, подтверждение, отключение | ✅ Готов |
| 5 | `add-device.html` | `balloo-su/add-device.html` | QR-привязка устройства: QR с таймером 60 сек, инструкции, безопасность | ✅ Готов |
| 6 | `my-devices.html` | `balloo-su/my-devices.html` | Мои устройства: список сессий, metadata, session details, переименование | ✅ Готов |

**Tabbar:** НЕТ на всех экранах этого тикета (auth-экраны без нижней навигации).
**Topbar:** ДА на всех (с dropdown, аватаром, lang/theme toggle).

**API-зависимости этого тикета:**
- **2FA: email-код (не TOTP).** Эндпоинты: `POST /auth/2fa/send-code` (отправить код), `POST /auth/2fa/verify` (подтвердить), `DELETE /auth/2fa` (отключить).
- **Нет** `POST /auth/2fa/setup` (TOTP setup) — удалён
- **Нет** `POST /auth/2fa/backup-codes/regenerate` — удалён (backup-коды не нужны)
- Капча: собственная серверная генерация (не reCAPTCHA/hCaptcha)
- Rate limiting: 5 попыток/мин на login, капча после 3 неудач
- OAuth: Яндекс, Mail.ru, Rambler (redirect URI `/api/v1/auth/oauth/<provider>/callback`)
- QR-привязка: `POST /devices/pair-token` (TTL 60 сек), `POST /devices/pair/confirm`
- Управление устройствами: `GET /devices`, `GET /devices/:id`, `PATCH /devices/:id`, `DELETE /devices/:id`, `GET /sessions/:id`, `DELETE /sessions/:id`, `DELETE /sessions` (завершить все другие)

**Особенности:**
- `password-reset.html` — капча: 6 кириллических символов, случайный наклон (до 45°), градиентный фон, градиент символов (один тон совпадает с фоном), кнопка «Другой»
- `two-factor.html` — **2FA через email-код (не TOTP).** Сервер отправляет код на email, пользователь вводит его. Нет QR-кода, нет backup-кодов. Отключение — подтверждение email-кодом. Это вкладка в settings.
- `login.html` — скопировать OAuth-кнопки (Яндекс, Mail.ru, Rambler), QR-вход

---

### Выполненные экраны Тикета 6

| # | Экран | Статус |
|---|---|---|
| 1 | `group-create.html` | ✅ Принят (sidebar-навигация, 5 секций) |
| 2 | `poll-editor.html` | ✅ Принят (5 типов, добавление вариантов) |
| 3 | `settings.html` | ✅ Принят (13 табов, 2FA email-код) |
| 4 | `profile.html` | ✅ Принят (sidebar-навигация, 3 slide-панели) |
| 5 | `donate.html` | ✅ Принят (tiers, прогресс, доноры) |
| 6 | `my-donates.html` | ✅ Принят (таблицы подписок и истории) |

---


**Папка:** `mockups/mobile/`
**Web-источники:** `mockups/balloo-su/`

| # | Файл | Web-источник | Описание | Статус |
|---|---|---|---|---|
| 1 | `donate.html` | `balloo-su/donate.html` | Страница доната: уровни (tiers), рекуррентные платежи, прогресс-бар, список доноров | ✅ Готов |
| 2 | `my-donates.html` | `balloo-su/my-donates.html` | Мои донаты: история, подписки, управление, публичная видимость | ✅ Готов |

**Активный tabbar-элемент:** без активного (или Настройки)

**Особенности:**
- `my-donates.html` — публичная вкладка профиля: видно имя, уровень, общую сумму, кол-во пожертвований; скрыто email, точные суммы, ID
- `donate.html` — скопировать tiers, payment form, recurring toggle, donor list, progress bar

---

## 🎫 Тикет 5: Desktop — Чат, сторис, звонки, архив, контакты (5 экранов)  ✅ **ВЫПОЛНЕН**

**Папка:** `mockups/desktop/`
**Web-источники:** `mockups/balloo-su/`

| # | Файл | Web-источник | Описание | Статус |
|---|---|---|---|---|
| 1 | `chat.html` | `balloo-su/chats.html` | Полный чат в окне: sidebar (список чатов 320px) + content (сообщения, input) | ✅ Готов |
| 2 | `stories.html` | `balloo-su/stories.html` | Сторис в окне: трей + viewer + создание | ✅ Готов |
| 3 | `calls-history.html` | `balloo-su/calls.html` | История звонков: sidebar (фильтры) + content (список звонков) | ✅ Готов |
| 4 | `archive.html` | `balloo-su/archive.html` | Архив: sidebar (поиск) + content (список архивных чатов) | ✅ Готов |
| 5 | `contacts.html` | `balloo-su/contacts.html` | Контакты: sidebar (список + поиск) + content (детали контакта) | ✅ Готов |

**Layout:** Все 5 экранов — `window-sidebar` (320px) + `window-content` (flex:1).

**API-зависимости этого тикета:**
- WebSocket: **native Node.js** (не Hono+uWebSockets). Подключение `ws://balloo.su/ws?token=<JWT>`
- Все WS события (message:new, call:invite, call:join, call:leave, chat:typing, message:read, user:status) — без изменений
- WS event `2fa.required`: payload `{userId, methods: ["email"]}` (не `["totp"]`)
- Эндпоинт `POST /attachments/upload`: лимит **15 МБ** без облака (было 10 МБ), **1 ГБ** с облаком
- Эндпоинт `POST /attachments/cloud` (было `/attachments/yandex-disk`) — поддержка Yandex Disk + Mail.ru Cloud
- `GET /chats` — пагинация, infinite scroll
- `GET /chats/:id/messages` — пагинация по 100
- `POST /chats/:id/messages` — отправка сообщения
- `POST /chats/:id/messages/:msgId/reactions` — реакции
- `POST /chats/:id/report` — жалоба на сообщение

**Особенности:**
- `chat.html` — самый сложный. Sidebar = список чатов с поиском. Content = выбраный чат с сообщениями, input-area, модалками (openCall, openPollEditor, openStoryCreate, attachments-panel). Скопировать ВСЕ JS-функции.
- `stories.html` — sidebar = трей сторис, content = viewer на полную ширину
- Titlebar menu items должны ссылаться на desktop-экраны: `chat.html`, `contacts.html`, `archive.html`, `calls-history.html`

---

## 🎫 Тикет 6: Desktop — Формы, настройки, профиль, донаты (6 экранов)

**Папка:** `mockups/desktop/`
**Web-источники:** `mockups/balloo-su/`

| # | Файл | Web-источник | Описание |
|---|---|---|---|
| 1 | `group-create.html` | `balloo-su/group-create.html` | Создание группы: форма, тип (выпадающий), аватарка, обложка, участники |
| 2 | `poll-editor.html` | `balloo-su/poll-editor.html` | Редактор опросов: 5 типов, вопросы, варианты, таймеры, превью |
| 3 | `settings.html` | `balloo-su/settings.html` | Настройки: sidebar (табы) + content (настройки таба) |
| 4 | `profile.html` | `balloo-su/profile.html` | Профиль: аватар, имя, статус, редактирование, вкладки |
| 5 | `donate.html` | `balloo-su/donate.html` | Донат: уровни, форма оплаты, прогресс, доноры |
| 6 | `my-donates.html` | `balloo-su/my-donates.html` | Мои донаты: история, подписки, публичная видимость |

**Layout:**
- `settings.html` — sidebar (список табов) + content (настройки)
- `profile.html` — sidebar (навигация по разделам) + content (детали)
- Остальные — single-column (форма по центру) или sidebar+content

**API-зависимости этого тикета:**
- **2FA вкладка в settings:** `POST /auth/2fa/send-code` (отправить email-код), `POST /auth/2fa/verify` (подтвердить), `DELETE /auth/2fa` (отключить). **Нет** TOTP setup, **нет** backup-кодов.
- `POST /groups` — создание группы (private/public/topic/corporate/media)
- `POST /groups/:id/polls` — создание опроса/квиза/списка/персонали
- `PATCH /users/me` — обновление профиля
- `POST /users/me/avatar` — загрузка аватарки
- `GET /donate/tiers` — уровни поддержки
- `POST /donate/create-payment` — платёж
- `POST /donate/subscribe` — подписка
- `GET /donate/history` — история пожертвований
- `DELETE /donate/subscribe/:id` — отмена подписки

**Особенности:**
- `group-create.html` — тип группы = выпадающий список; автогенерация аватарки; обложка; без поля «срок действия ссылки»
- `settings.html` — скопировать все табы: уведомления, приватность, темы, языки, медиа, устройства, аккаунты, 2FA (email-код, не TOTP)
- `my-donates.html` — публичная видимость: имя, уровень, общая сумма, кол-во; скрыто: email, точные суммы, ID

---

## 📊 Сводка тикетов

| Тикет | Платформа | Экранов | Сложность | Статус |
|---|---|---|---|---|
| 1 | Mobile | 6 (чат, сторис, вложения, жалоба, звонки, архив) | 🔴 Высокая (chat.html) | ✅ **Выполнен** |
| 2 | Mobile | 5 (контакты, настройки, профиль, группа, опросы) | 🟡 Средняя | ✅ **Выполнен** |
| 3 | Mobile | 6 (login, register, password-reset, 2FA email, add-device, my-devices) | 🟡 Средняя | ✅ **Выполнен** |
| 4 | Mobile | 2 (donate, my-donates) | 🟢 Низкая | ✅ **Выполнен** |
| 5 | Desktop | 5 (чат, сторис, звонки, архив, контакты) | 🔴 Высокая (chat.html) | ✅ **Выполнен** |
| 6 | Desktop | 6 (группа, опросы, настройки, профиль, донат, мои донаты) | 🟡 Средняя | ✅ **Выполнен** |
| **Итого** | | **30** | | **✅ 6/6 тикетов** |

---

## ✅ Порядок выполнения

Рекомендуемый порядок (от простого к сложному):

1. ~~**Тикет 4** (Mobile донаты) — ✅ Выполнен~~
2. ~~**Тикет 1** (Mobile чат) — ✅ Выполнен~~
3. ~~**Тикет 2** (Mobile контакты/настройки) — ✅ Выполнен~~
4. ~~**Тикет 3** (Mobile auth) — 6 экранов, средняя сложность — ✅ Выполнен~~
5. ~~**Тикет 5** (Desktop чат) — 5 экранов, высокая сложность — ✅ Выполнен~~
6. **Тикет 6** (Desktop формы) — 6 экранов, средняя сложность — ✅ Выполнен

После каждого тикета:
- Обновить `index_ecrans.md` (статусы экранов → ✅ Принят)
- Обновить `index.html` (ссылки, описания)
- Проверить чеклист (раздел «Общие правила»)

---

## 🔗 Ссылки

- **Правила:** `AGENTS_TICKET_MOBILE_DESKTOP.md`
- **Решения пользователя:** `~/Рабочий стол/непросмотренные_экраны_balloo.md`
- **Web-источники:** `mockups/balloo-su/`
- **Дизайн-система:** `mockups/assets/common.css` + `mockups/assets/common.js`
- **Индекс экранов:** `mockups/index_ecrans.md`
