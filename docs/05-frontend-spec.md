# AI-Agent: Frontend Specification

> Этот документ — спецификация для генерации UI-компонентов, страниц и дизайн-системы.

## Дизайн-система (Ключевые принципы)

### Формы
- **Аватарки:** Восьмигранные (Octagon). Все круглые элементы → восьмигранные.
- **Пузыри сообщений:** Строгие прямоугольники с угловыми срезами. (Ответ 20)
- **Иконки:** Outline (тонкие контуры). (Ответ 21)
- **Модалки:** По центру экрана. Цвет рамки = статус. (Ответ 24)
- **Кнопки:** Primary, Secondary, Tertiary. Без скруглений. (Ответ 30)

### Стили
- **CSS Modules / Styled Components.**
- **Flat** — без теней, без Glassmorphism. (Ответ 26)
- **Темы:** Тёмная, Светлая, "Наша" (флаг РФ + драгметаллы). Синхронизация между устройствами.
- **Шрифт:** Google Fonts (Inter, Manrope). (Ответ 17)
- **Тени:** Flat — без теней. (Ответ 26)

### Бейджи уведомлений
- 1–9: число
- >9: точки
- >99: пустой квадрат с точкой в центре
- больше: закрашенный квадрат

### Состояния
- **Загрузка:** Skeletons. (Ответ 22)
- **Пустые состояния:** Тематические иллюстрации. (Ответ 23)
- **Скролл:** Бесконечный (infinite scroll). (Ответ 28)

---

## Навигация (Единая для всех узлов монорепо)

```
┌─────────────────────────────────────────────────────┐
│ [LOGO▼]  [Заголовок экрана (клик=обучение)]  [Действия▼]  [Маскот/Аватар▼] [Язык] [Тема] │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Левая    │                                          │
│ панель   │          Контентная область              │
│ (чаты/   │                                          │
│ список)  │                                          │
│          │                                          │
│ 1/3–1/4  │                                          │
│ экрана   │                                          │
│ (Web/    │                                          │
│ Desktop) │                                          │
│          │                                          │
│ Mobile:  │                                          │
│ сворачи- │                                          │
│ вается   │                                          │
│ влево    │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Левое меню
- **Web/Desktop:** Статичная панель, ширина 1/3–1/4 экрана.
- **Mobile:** Скрывается влево, сворачивается до ширины иконок (аватарок).
- **Содержимое:** Список чатов, поиск, архив, контакты (зависит от страницы).

### Верхняя панель
- **Логотип (слева):** Выпадающее меню — навигация по узлам монорепо, общие страницы.
- **Заголовок экрана (центр):** Клик → режим обучения (тултипы + справка).
- **Кнопки действий (справа от заголовка):** Выпадающее меню (зависит от экрана).
- **Правое меню:** Маскот (гость) / Аватарка (авторизованный). Выпадающее меню: страницы/действия, язык, тема.

---

## Аватарки — Двойная граница

```
Внутренняя граница (статус):
  🟢 Зелёная  — онлайн
  ⚪ Серая     — офлайн
  🔴 Красная   — занят (звонок/вручную)
  ⚪ Серая     — Не беспокоить (уведомления не доходят)

Внешняя граница (контекст):
  ⚪ Серая          — группа/бот/новый собеседник
  🟢 Светло-зелёная — в контактах
  🟢 Тёмно-зелёная  — в группе "Семья"
  ⚫ Чёрная         — ЧС/блокировка (сообщения не отправляются)
```

---

## Пузыри сообщений

```
Собеседник (слева):                    Я (справа):
┌────────────────────────┐             ┌────────────────────────┐
│ [дата/время] [метки]   │ ← шапка     │ [дата/время] [метки]   │
├────────────────────────┤             ├────────────────────────┤
│                        │             │                        │
│  Текст сообщения       │             │  Текст сообщения       │
│                        │             │                        │
│  [вложения ▼]          │             │  [вложения ▼]          │
│                        │             │                        │
├────────────────────────┘ ← срез      └────────────────────────┘ ← срез
│ [действия: 📋 ↩️ ⭐️ ...]│ ← левая     │ [действия: 📋 ↩️ ⭐️ ...]│ ← правая
└────────────────────────┘   граница    └────────────────────────┘   граница

Метки шапки: "Переслано", "Автоответ", "Реклама", "ИИ" (комбинируются, пиктограммы)
Вложения: множественные → сворачиваемая панель
Без скруглений!
```

---

## Страницы приложения (v1)

| # | Страница | Описание | Доступ |
|---|----------|----------|--------|
| 1 | **Чаты** | Список чатов + окно переписки | Авторизованные |
| 2 | **Контакты** | Список людей + кнопка "Пригласить" | Авторизованные |
| 3 | **Поиск** | Глобальный поиск (чаты, люди, файлы, медиа) | Авторизованные |
| 4 | **Архив** | Архивированные чаты | Авторизованные |
| 5 | **Профиль** | Личные настройки (аватар, имя, био, статус, тема, язык) | Авторизованные |
| 6 | **Публичный профиль** | Страница по ссылке (bio, avatar, группы) | Все |
| 7 | **Звонки** | История звонков (отдельная вкладка) | Авторизованные |
| 8 | **Правила** | Правила использования | Все |
| 9 | **Приглашения** | Создать/отправить/"мои приглашения" | Авторизованные |
| 10 | **Чат с поддержкой** | Встроенный чат с техподдержкой | Авторизованные |
| 11 | **О ботах** | Создание бота + документация API | Авторизованные |
| 12 | **О компании** | Информация о компании | Все |
| 13 | **О Balloo** | Информация о приложении (версия, лицензии) | Все |
| 14 | **Онбординг** | 3–4 экрана при первом входе | Новые пользователи |
| 15 | **Вложения чата** | Все вложения чата по категориям (медиа, аудио, файлы, ссылки, опросы) | Авторизованные |
| 16 | **Пожаловаться на сообщение** | Форма жалобы с выбором причины и комментарием | Авторизованные |
| 17 | **Ошибка 555 (бан)** | Экран блокировки аккаунта. Карточка инструкции по разбану (ID 55501), кнопка «Обжаловать бан» | Забаненные |
| 18 | **Обжалование бана (оверлей)** | Оверлей поверх всех экранов. Открывается при старте отсчёта обжалования. Таймер 72ч, форма, статус рассмотрения (0/4 подтверждений). Закрывается при решении | Забаненные |

---

## Режим обучения (Learning Mode)

- **Активация:** Клик по заголовку экрана.
- **Механика:** Тултипы + справка.
- **Авто-активация:** При первом заходе или при появлении новых функций, которые пользователь не видел.
- **Содержимое:** Пошаговое описание функций текущего экрана.

---

## Структура Feature-based

```
packages/web/src/features/
├── auth/
│   ├── components/       (LoginForm, RegisterForm, OAuthButtons, QRPairLogin)
│   ├── hooks/            (useAuth, useSession, usePairing)
│   ├── api/              (authApi.ts)
│   ├── types/            (auth.types.ts)
│   └── tests/            (auth.test.tsx)
├── devices/
│   ├── components/       (DeviceCard, DeviceDetailsPanel, DeviceStatsGrid, QRCodeDisplay, PairingTimer, PairingInstructions, RenameDeviceDialog, StopSessionButton)
│   ├── hooks/            (useDevices, usePairToken)
│   ├── api/              (devicesApi.ts)
│   ├── types/            (device.types.ts)
│   └── tests/            (devices.test.tsx)
├── accounts/
│   ├── components/       (AccountSwitcher, AccountCard, AccountStatsGrid, AccountAddButton, MultiAccountInfo, NotificationToggle)
│   ├── hooks/            (useAccounts, useAccountSwitch)
│   ├── api/              (accountsApi.ts)
│   ├── types/            (account.types.ts)
│   └── tests/            (accounts.test.tsx)
├── messaging/
│   ├── components/       (ChatList, ChatWindow, MessageBubble, AttachmentPanel, PollWidget, ChatAttachmentsPanel, AttachmentsTabs, AttachmentsSearch, MediaGrid, MediaItem, FileList, FileItem, LinkList, LinkItem, PollList, PollItem, ReportMessagePanel, QuotedMessage, ReportReasonList, ReportReason, ReportComment, ReportSuccess)
│   ├── hooks/            (useMessages, useWebSocket, useTyping, useAttachments, useReport)
│   ├── api/              (messagesApi.ts)
│   ├── types/            (message.types.ts)
│   └── tests/
├── groups/
│   ├── components/       (GroupList, GroupSettings, MemberList, RoleManager)
│   ├── hooks/            (useGroups, useGroupMembers)
│   ├── api/              (groupsApi.ts)
│   ├── types/            (group.types.ts)
│   └── tests/
├── calls/
│   ├── components/       (CallOverlay, CallControls, ParticipantGrid)
│   ├── hooks/            (useWebRTC, useCallState)
│   ├── api/              (callsApi.ts)
│   └── types/
├── profile/
│   ├── components/       (ProfileEditor, AvatarUploader, StatusPicker)
│   ├── hooks/            (useProfile)
│   └── api/
├── stories/
│   ├── components/       (StoryViewer, StoryCreator, StoryList)
│   ├── hooks/            (useStories)
│   └── api/
├── bans/
│   ├── components/       (BanErrorPage, InstructionCard, BanAppealOverlay, CountdownTimer, BanInfoCard, AppealForm, ReviewStatus, AppealResult)
│   ├── hooks/            (useBan, useBanAppeal, useBanWebSocket)
│   ├── api/              (bansApi.ts)
│   └── types/            (ban.types.ts)
├── notifications/
│   ├── components/       (NotificationBadge, NotificationList)
│   ├── hooks/            (useNotifications)
│   └── api/
└── settings/
    ├── components/       (ThemeSwitcher, LanguageSwitcher, DNDSettings)
    └── hooks/
```

---

## Интерактивы (создание в чате)

### Команды
- `/poll_(вопрос;选项1;选项2;...)` — опрос
- `/quiz_(вопрос;选项1;选项2;...;correct=2)` — квиз
- `/list_active_(пункт1;пункт2;...)` — активный список
- `/list_passive_(пункт1;пункт2;...)` — пассивный список
- `/personali_(пункт1;пункт2;...;multiple=false)` — персонали

При вводе `/` над полем сообщения появляется интерактивная подсказка с типами и параметрами.

### Создание кнопкой
- Кнопка "Интерактив" в панели ввода → выбор типа → форма создания.

---

## Состояния (Zustand)

```typescript
// stores/chatStore.ts
interface ChatStore {
  chats: Chat[]
  activeChatId: string | null
  messages: Record<string, Message[]>  // chatId → messages
  drafts: Record<string, string>       // chatId → draft text
  typingUsers: Record<string, string[]> // chatId → userIds
  
  setActiveChat: (chatId: string) => void
  addMessage: (chatId: string, message: Message) => void
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (chatId: string, messageId: string) => void
  setDraft: (chatId: string, text: string) => void
}

// stores/userStore.ts
interface UserStore {
  user: User | null
  isAuthenticated: boolean
  theme: 'dark' | 'light' | 'russian'
  language: string
  devices: Device[]
  
  login: (user: User) => void
  logout: () => void
  setTheme: (theme: string) => void
  setLanguage: (lang: string) => void
  renameDevice: (deviceId: string, newName: string) => void
  stopSession: (sessionId: string) => void
  stopAllOtherSessions: () => void
  pairDevice: (token: string) => void
}

// stores/callStore.ts
interface CallStore {
  activeCall: Call | null
  participants: CallParticipant[]
  isMuted: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
  
  startCall: (call: Call) => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
}

// stores/accountStore.ts
interface AccountStore {
  accounts: Account[]          // все подключённые аккаунты
  activeAccountId: string | null // активный аккаунт
  
  switchAccount: (accountId: string) => void
  addAccount: (account: Account) => void
  removeAccount: (accountId: string) => void
  toggleNotifications: (accountId: string) => void
  getActiveAccount: () => Account | null
}
```

---

## 🆕 Новые UI-спецификации (v1 — дополнение)

### Stories (`StoriesTray` + `StoryViewer`)
- **StoriesTray** — горизонтальная лента аватарок сторис над списком чатов.
  - Аватарки — **октагон с укороченными диагоналями** (`--octagon-clip-stories`): диагонали в 3 раза короче прямых сторон. НЕ заменяет основной `--octagon-clip` аватарок профиля.
  - **Переливающийся градиент** (`--story-gradient`) per-темы (dark/light/russian) вокруг непросмотренных сторис; анимация `@keyframes story-shimmer`.
  - Просмотренные сторис теряют градиент (статичная рамка статуса).
- **StoryViewer** — полноэкранный просмотрщик:
  - Прогресс-бар сверху (сегменты по количеству сторис у автора), автопродвижение.
  - Навигация: тап слева/справа (mobile), стрелки (desktop), свайп.
  - Футер: поле ответа → `POST /stories/:id/reply` (пересылка в чат `replyToChatId`).
  - Закрытие: свайп вниз / Esc / клик вне зоны.
- WS event `story.created` обновляет ленту в реальном времени.

### 2FA-настройки (`TwoFactorSetup`)
- Экраны: `1_01_30` (balloo.su), `1_08_11` (mobile), `1_09_09` (desktop).
- **Включение:** Запрос на отправку email-кода → `POST /auth/2fa/send-code` → ввод кода из email → `POST /auth/2fa/verify`.
- **Отключение:** подтверждение email-кодом.
- **Механика:** Сервер генерирует одноразовый код, отправляет на email пользователя. Backup-коды не нужны. TOTP/Google Authenticator не используется.

### Календарь command (`CalendarView`)
- Экран `1_03_22` (command.balloo.su).
- **Два режима:** месяц / неделя (переключатель).
- События: встречи (связь с `meetings`), дедлайны задач (`tasks`), корпоративные события.
- Клик по дню → список событий; клик по событию → переход к связанному объекту (встреча/задача).
- Навигация: свайп (mobile) / стрелки (desktop) между периодами.

### PollEditor (5 типов интерактивов)
- Экран `1_01_28` (balloo.su).
- **Типы:** опрос, квиз, активный список, пассивный список, персонали.
- Поля: вопрос, варианты ответов (добавление/удаление), настройки (анонимность, множественный выбор, правильный ответ для квиза, сообщение по выбору пункта для персонали).
- Превью в реальном времени. Создание через `POST /polls`.


### Юридические страницы (`PrivacyScreen`, `RulesScreen`, `CookiesScreen`)
- Маршруты: `/privacy`, `/rules`, `/cookies` — публичные, без авторизации, индексируемые (no `noindex`).
- Компоненты: `packages/web/src/screens/legal/PrivacyScreen.tsx`, `RulesScreen.tsx`, `CookiesScreen.tsx`.
- **PrivacyScreen** — политика конфиденциальности (152-ФЗ, Конституция РФ ст.23, ст.24). Содержит: данные оператора, собираемые данные, цели обработки, правовые основания, хранение и защита, права пользователя, cookie, третьи лица, контакты.
- **RulesScreen** — пользовательское соглашение (публичная оферта, 149-ФЗ, ГК РФ ст.437). Содержит: общие положения, предмет соглашения, регистрация, правила поведения, интеллектуальная собственность, ограничение ответственности, персональные данные, разрешение споров, изменение условий.
- **CookiesScreen** — политика использования cookie. Содержит: что такое cookie, категории (необходимые, функциональные, аналитические, сторонние), управление, хранение, передача третьим лицам, согласие.
- **Ссылки размещены:**
  - Левое меню (Sidebar) — пункты «Правила», «Конфиденциальность», «Cookies» (видны при развёрнутом sidebar).
  - Подвал LoginScreen — внизу страницы авторизации.
  - LegalCheckbox (RegisterScreen) — чекбокс согласия с ссылками на `/rules` и `/privacy`.
- **sitemap.xml** — `packages/web/public/sitemap.xml` содержит URL всех 6 доменов.
- **Дата обновления** указана в заголовке каждой страницы.

### Юридические страницы (, , )
- Маршруты: , ,  — публичные, без авторизации, индексируемые.
- Компоненты:  — PrivacyScreen, RulesScreen, CookiesScreen.
- Ссылки в: Sidebar (левое меню), LoginScreen (подвал), LegalCheckbox (регистрация).
- sitemap.xml:  — URL всех 6 доменов.


### Юридические страницы (PrivacyScreen, RulesScreen, CookiesScreen)
- Маршруты: /privacy, /rules, /cookies - публичные, без авторизации, индексируемые.
- Компоненты: packages/web/src/screens/legal/ - PrivacyScreen, RulesScreen, CookiesScreen.
- PrivacyScreen - политика конфиденциальности (152-ФЗ, Конституция РФ ст.23, ст.24).
- RulesScreen - пользовательское соглашение (публичная оферта, 149-ФЗ, ГК РФ).
- CookiesScreen - политика использования cookie (категории, управление, хранение).
- Ссылки размещены: Sidebar (левое меню), LoginScreen (подвал), LegalCheckbox (регистрация).
- sitemap.xml: packages/web/public/sitemap.xml - URL всех 6 доменов.

### Cookie Banner и утилиты (CookieBanner, cookieUtils)
- CookieBanner: `packages/web/src/components/ui/CookieBanner.tsx` — всплывающее уведомление внизу экрана.
- Показывается при первом визите, если выбор по cookie ещё не сделан (`hasCookieChoice()` = false).
- Кнопки: «Принять все» (acceptCookieConsent + initYandexMetrika) и «Только необходимые» (declineCookieConsent).
- Согласие хранится в cookie `balloo-cookie-consent` на 365 дней, значения: `accepted` (аналитика + сторонние) / `essential` (только необходимые).
- Утилиты: `packages/web/src/utils/cookieUtils.ts` — setCookie, getCookie, deleteCookie, hasCookieChoice, hasCookieConsent, hasAnalyticsConsent, hasThirdPartyConsent, acceptCookieConsent, declineCookieConsent.
- Подключён в App.tsx после RouterProvider.

### Яндекс.Метрика (consent-based аналитика)
- Утилита: `packages/web/src/utils/yandex-metrika.ts` — lazy-load скрипта `mc.yandex.ru/metrika/tag.js`.
- ID счётчика: env `VITE_YM_METRIKA_ID` (число; пусто = Метрика не подключается).
- **Consent-based загрузка:** скрипт подключается ТОЛЬКО после «Принять все» в CookieBanner либо при старте приложения, если согласие уже дано (`hasAnalyticsConsent()` в App.tsx).
- **Анонимизация IP:** параметр `ip: true` в `ym(..., 'init', ...)` (требование 152-ФЗ).
- Параметры init: clickmap, trackLinks, accurateTrackBounce; webvisor отключён (приватность).
- SPA-навигация: после init патчатся `history.pushState/replaceState` + `popstate`, на каждую смену маршрута отправляется `ym(id, 'hit', path)` (trackPageview).
- Cookie Метрики (`_ym_uid`, `_ym_isad`, `_ym_d`) ставятся только после загрузки скрипта.
- Описано в политике cookies (`CookiesScreen.tsx`, разделы 2.3, 6).

### Сторонние cookie (OAuth, ЮKassa) — согласие
- OAuth-провайдеры (Яндекс ID, VK ID, Mail.ru ID) и ЮKassa ставят временные cookie на своих внешних доменах.
- Согласие на сторонние cookie фиксируется в cookie `balloo-cookie-consent` (значение `accepted`) на домене `.balloo.su` — проверка через `hasThirdPartyConsent()`.
- CookieBanner информирует о сторонних сервисах в тексте баннера; детали — в `/cookies` (разделы 2.4, 5, 6).
- Срок жизни внешних cookie: сессия авторизации (OAuth) / сессия оплаты (ЮKassa).

### Footer (MainLayout)
- Footer в  — внизу каждого экрана основного приложения.
- Ссылки: Правила (/rules), Конфиденциальность (/privacy), Cookies (/cookies).
- Стили: серый фон (var(--bg-secondary)), серая линия сверху, размер 13px.
- Логотип/копирайт: 'Balloo Messenger © 2026'.
