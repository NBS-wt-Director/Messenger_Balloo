# 🎫 TICKET: Mobile & Desktop Screens — Правила создания

> **Тикет для ИИ-ассистентов (Koda).** Этот файл — ПРАВИЛО, которое нужно читать перед созданием любых экранов в `mockups/mobile/` и `mockups/desktop/`.  
> **Нарушение правил = сломанный продукт.** Всегда копируй бизнес-логику из `balloo-su/` (web), адаптируя только визуальную структуру под платформу.

---

## ⚠️ КРИТИЧЕСКИЕ ПРАВИЛА (ВСЕГДА СОБЛЮДАТЬ)

### 1. ШАБЛОН TOPBAR — ОБЯЗАТЕЛЕН НА КАЖДОМ ЭКРАНЕ

**Каждый экран mobile и desktop ДОЛЖЕН содержать:**

```html
<!-- TOPBAR -->
<div class="topbar">
  <div class="topbar__logo">
    <div class="topbar__logo-icon">B</div>
    <span>Balloo</span>
    <!-- DROPDOWN навигации -->
    <div class="topbar__dropdown">
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/chats.html'">💬 Balloo</div>
      <div class="topbar__dropdown-divider"></div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../admin-balloo-su/index.html'">🛡️ Admin</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../command-balloo-su/index.html'">🏢 Command</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../features-balloo-su/index.html'">💡 Features</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../history-balloo-su/index.html'">📜 History</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../download-balloo-su/index.html'">⬇️ Download</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='../docs-balloo-su/index.html'">📚 API Docs</div>
      <div class="topbar__dropdown-divider"></div>
      <!-- Внутренние ссылки balloo-su -->
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/contacts.html'">👤 Контакты</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/search.html'">🔍 Поиск</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/archive.html'">📦 Архив</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/calls.html'">📞 Звонки</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/invites.html'">📨 Приглашения</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/bots.html'">🤖 О ботах</div>
      <div class="topbar__dropdown-item" onclick="window.location.href='balloo-su/about-balloo.html'">ℹ️ О Balloo</div>
    </div>
  </div>
  <div class="topbar__title">Название экрана</div>
  <div class="topbar__right">
    <!-- АВАТАР -->
    <div class="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact" onclick="window.location.href='balloo-su/profile.html'">
      <div class="avatar__inner"><span>ИИ</span></div>
    </div>
    <!-- ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА -->
    <span class="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
    <!-- ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ -->
    <span class="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
  </div>
</div>
```

**Что обязательно:**
- ✅ `topbar__logo` с dropdown навигацией (все пункты кликабельные через `onclick="window.location.href='...'`)
- ✅ `topbar__title` — название текущего экрана
- ✅ `topbar__right` с аватаром, переключателем языка (🇷🇺 RU) и переключателем темы (🌙 Тёмная)
- ✅ `data-lang-toggle` и `data-theme-toggle` атрибуты на переключателях

**НЕЛЬЗЯ:**
- ❌ Создавать экран без dropdown навигации
- ❌ Создавать экран без переключателя языка
- ❌ Создавать экран без переключателя темы
- ❌ Создавать экран без аватара пользователя

---

### 2. БИЗНЕС-ЛОГИКА: КОПИРУЙ ИЗ WEB (balloo-su/)

**Правило: Каждый экран mobile/desktop — это адаптация web-экрана, не новая сущность.**

#### Как правильно:
1. Открой соответствующий web-экран в `mockups/balloo-su/`
2. Скопируй ВСЮ бизнес-логику (кнопки, функции, навигацию, модальные окна)
3. Адаптируй только визуальную структуру под платформу (phone-frame, tabbar, desktop-window)

#### Примеры соответствий:

| Web (balloo-su/) | Mobile (mobile/) | Desktop (desktop/) |
|---|---|---|
| `chats.html` | `chat.html` (полный чат) | `chat.html` (полный чат) |
| `stories.html` | `stories.html` (трей + viewer) | `stories.html` (трей + viewer) |
| `contacts.html` | `contacts.html` (список) | `contacts.html` (список) |
| `archive.html` | `archive.html` (список) | `archive.html` (список) |
| `calls.html` | `calls-history.html` (история) | `calls-history.html` (история) |
| `group-create.html` | `group-create.html` (форма) | `group-create.html` (форма) |
| `poll-editor.html` | `poll-editor.html` (форма) | `poll-editor.html` (форма) |
| `settings.html` | `settings.html` (табы) | `settings.html` (табы) |
| `profile.html` | `profile.html` (профиль) | `profile.html` (профиль) |

#### Что нужно копировать:
- **Все кнопки** и их `onclick` обработчики
- **Все ссылки** (`href` и `onclick="window.location.href='...'"`)
- **Все модальные окна и slide-панели**
- **JavaScript функции** (openCall, openModal, switchTab и т.д.)
- **Структуру данных** (карточки, списки, таблицы)

#### Что можно адаптировать:
- **Размеры** (phone-frame 360x720, desktop-window 1200x800)
- **Layout** (sidebar/content → single-column на mobile)
- **Навигация** (tabbar на mobile, sidebar на desktop)
- **Масштаб** (шрифты, padding — меньше на mobile)

---

### 3. МОБИЛЬНАЯ ПЛАТФОРМА — ПРАВИЛА

#### 3.1 Структура phone-frame

```html
<div class="phone-frame">
  <div class="phone-frame__notch"></div>
  <div class="phone-frame__statusbar"><span>9:41</span><span>📶 🔋</span></div>
  <div class="phone-frame__screen">
    <!-- TOPBAR (обязательно, см. правило 1) -->
    <!-- КОНТЕНТ ЭКРАНА -->
    <!-- TABBAR (нижняя навигация, 4-5 элементов) -->
  </div>
  <div class="phone-frame__home-bar"></div>
</div>
```

#### 3.2 Tabbar — нижняя навигация

```html
<div class="phone-tabbar">
  <div class="phone-tabbar__item" onclick="window.location.href='../mobile/chat.html'">
    <span class="phone-tabbar__icon">💬</span>Чаты
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='../mobile/contacts.html'">
    <span class="phone-tabbar__icon">👥</span>Контакты
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='../mobile/stories.html'">
    <span class="phone-tabbar__icon">📷</span>Сторис
  </div>
  <div class="phone-tabbar__item" onclick="window.location.href='../mobile/calls-history.html'">
    <span class="phone-tabbar__icon">📞</span>Звонки
  </div>
  <div class="phone-tabbar__item phone-tabbar__item--active" onclick="window.location.href='../mobile/settings.html'">
    <span class="phone-tabbar__icon">⚙</span>Настройки
  </div>
</div>
```

**Правила tabbar:**
- ✅ 4-5 элементов максимум
- ✅ Каждый элемент кликабельный (`onclick="window.location.href='...'"`)
- ✅ Активный элемент: `phone-tabbar__item--active` + `color: var(--accent)`
- ✅ Иконка + текст
- ✅ Ссылки на другие мобильные экраны в `../mobile/`

#### 3.3 Мобильные экраны — список

| Файл | Описание | Web-источник |
|---|---|---|
| `chat.html` | Полный чат (сообщения, input-area) | `balloo-su/chats.html` |
| `stories.html` | Сторис трей + viewer + создание | `balloo-su/stories.html` |
| `contacts.html` | Список контактов с поиском | `balloo-su/contacts.html` |
| `archive.html` | Архив чатов | `balloo-su/archive.html` |
| `calls-history.html` | История звонков | `balloo-su/calls.html` |
| `group-create.html` | Форма создания группы | `balloo-su/group-create.html` |
| `poll-editor.html` | Создание опроса/квиза | `balloo-su/poll-editor.html` |
| `settings.html` | Настройки с табами | `balloo-su/settings.html` |
| `profile.html` | Профиль пользователя | `balloo-su/profile.html` |
| `donate.html` | Страница доната | `balloo-su/donate.html` |
| `my-donates.html` | Мои донаты | `balloo-su/my-donates.html` |
| `report-message.html` | Жалоба на сообщение | `balloo-su/report-message.html` |
| `chat-attachments.html` | Вложения чата | `balloo-su/chat-attachments.html` |
| `login.html` | Вход | `balloo-su/login.html` |
| `register.html` | Регистрация | `balloo-su/register.html` |
| `password-reset.html` | Сброс пароля | `balloo-su/password-reset.html` |
| `two-factor.html` | 2FA | `balloo-su/two-factor.html` |
| `add-device.html` | Добавление устройства | `balloo-su/add-device.html` |
| `my-devices.html` | Мои устройства | `balloo-su/my-devices.html` |

---

### 4. ДЕСКТОПНАЯ ПЛАТФОРМА — ПРАВИЛА

#### 4.1 Структура window-frame

```html
<div class="window-frame">
  <!-- Titlebar (кастомная, не системная) -->
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

  <!-- Body -->
  <div class="window-body">
    <!-- Sidebar (слева, 320px) + Content (справа) -->
    <!-- ИЛИ single-column для форм -->
  </div>

  <!-- Statusbar (внизу) -->
  <div class="statusbar">
    <div><span class="status-dot status-dot--online"></span> Подключено · WebSocket</div>
    <div class="statusbar__sep">🔒 E2E · 💾 Кэш: 124 МБ · v1.0.0-beta</div>
  </div>
</div>
```

#### 4.2 Desktop экраны — список

| Файл | Описание | Web-источник |
|---|---|---|
| `chat.html` | Полный чат в окне | `balloo-su/chats.html` |
| `stories.html` | Сторис в окне | `balloo-su/stories.html` |
| `contacts.html` | Контакты в окне | `balloo-su/contacts.html` |
| `archive.html` | Архив в окне | `balloo-su/archive.html` |
| `calls-history.html` | История звонков | `balloo-su/calls.html` |
| `group-create.html` | Создание группы | `balloo-su/group-create.html` |
| `poll-editor.html` | Редактор опросов | `balloo-su/poll-editor.html` |
| `settings.html` | Настройки | `balloo-su/settings.html` |
| `profile.html` | Профиль | `balloo-su/profile.html` |
| `donate.html` | Донат | `balloo-su/donate.html` |
| `my-donates.html` | Мои донаты | `balloo-su/my-donates.html` |

#### 4.3 Desktop layout

```html
<div class="window-body">
  <!-- Sidebar (320px, всегда есть) -->
  <div class="window-sidebar">
    <!-- Список чатов / контактов / настроек -->
  </div>
  <!-- Content (flex: 1) -->
  <div class="window-content">
    <!-- Основной контент -->
  </div>
</div>
```

---

### 5. ТЕМЫ И ЯЗЫКИ — ОБЯЗАТЕЛЬНО

#### 5.1 Переключатель темы

```html
<span class="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
```

**Функция (в common.js):**
- Тёмная: `🌙 Тёмная`
- Светлая: `☀️ Светлая`
- Российская: `🇷🇺 Наша`

#### 5.2 Переключатель языка

```html
<span class="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
```

**20 языков (3 группы):**
- Русские: RU, TT, BA, CE, CV, AV, DAR, UDM, LEZ, KBD, CHM, OS, SAH, BUA, UK
- Дружественные: ZH, HI, BE
- Остальные: EN, FR

#### 5.3 На КАЖДОМ экране

```html
<!-- Это ВСТАВЛЯЕТСЯ в topbar__right на каждом экране -->
<div class="topbar__right">
  <div class="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact" onclick="window.location.href='balloo-su/profile.html'">
    <div class="avatar__inner"><span>ИИ</span></div>
  </div>
  <span class="topbar__lang" data-lang-toggle>🇷🇺 RU</span>
  <span class="topbar__theme" data-theme-toggle>🌙 Тёмная</span>
</div>
```

---

### 6. НАВИГАЦИЯ DROPDOWN — ВСЕ ПУНКТЫ КЛИКАБЕЛЬНЫЕ

**Каждый пункт dropdown ДОЛЖЕН иметь onclick:**

```html
<div class="topbar__dropdown-item" onclick="window.location.href='путь/к/файлу.html'">📌 Текст пункта</div>
```

**Список всех пунктов:**

| Текст | Путь |
|---|---|
| 💬 Balloo | `balloo-su/chats.html` |
| 🛡️ Admin | `../admin-balloo-su/index.html` |
| 🏢 Command | `../command-balloo-su/index.html` |
| 💡 Features | `../features-balloo-su/index.html` |
| 📜 History | `../history-balloo-su/index.html` |
| ⬇️ Download | `../download-balloo-su/index.html` |
| 📚 API Docs | `../docs-balloo-su/index.html` |
| 👤 Контакты | `balloo-su/contacts.html` |
| 🔍 Поиск | `balloo-su/search.html` |
| 📦 Архив | `balloo-su/archive.html` |
| 📞 Звонки | `balloo-su/calls.html` |
| 📨 Приглашения | `balloo-su/invites.html` |
| 🤖 О ботах | `balloo-su/bots.html` |
| ℹ️ О Balloo | `balloo-su/about-balloo.html` |

---

### 7. ПРОВЕРКА ПЕРЕД СОХРАНЕНИЕМ (CHECKLIST)

**Перед тем как сохранить файл, проверь:**

- [ ] `topbar` присутствует
- [ ] `topbar__logo` с `topbar__dropdown`
- [ ] Все пункты dropdown имеют `onclick="window.location.href='...'"`
- [ ] `topbar__right` с аватаром
- [ ] `data-lang-toggle` (переключатель языка) присутствует
- [ ] `data-theme-toggle` (переключатель темы) присутствует
- [ ] Ссылки ведут на правильные файлы (проверь пути `../`)
- [ ] Бизнес-логика скопирована из web-экрана
- [ ] Кнопки работают (не пустые `onclick`)
- [ ] Навигация tabbar (mobile) / sidebar (desktop) кликабельна
- [ ] `<script src="../assets/common.js"></script>` в конце файла

---

### 8. КОГДА НЕЛЬЗЯ СОЗДАВАТЬ ЭКРАН

- ❌ Без чтения соответствующего web-экрана в `balloo-su/`
- ❌ Без dropdown навигации
- ❌ Без переключателя языка/темы
- ❌ С пустыми кнопками (без `onclick` или с `onclick="showToast(...)"` если должно быть действие)
- ❌ С неправильными путями (всегда проверяй `../`)

---

## 📋 Пример: как правильно создать mobile/chat.html

**Шаг 1:** Открой `balloo-su/chats.html`

**Шаг 2:** Скопируй:
- Весь HTML с `topbar` (адаптировав под mobile структуру)
- Все JavaScript функции (openCall, toggleEmojiPanel и т.д.)
- Все модальные окна (modal-new-chat, call-overlay, attachments-panel)
- Все slide-панели

**Шаг 3:** Адаптируй:
- Оберни в `phone-frame`
- Замени sidebar → single-column
- Добавь `phone-tabbar` внизу с 4-5 элементами
- Сохрани `topbar__lang` и `topbar__theme`

**Шаг 4:** Проверь checklist (раздел 7)

**Шаг 5:** Сохрани как `mockups/mobile/chat.html`

---

> **Помни:** Mobile и Desktop — это НЕ отдельные продукты. Это адаптации одного и того же продукта (Balloo Messenger). Бизнес-логика одинаковая везде. Меняется только визуальная оболочка.
