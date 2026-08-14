# Задание: Desktop — Обёртка окна (генеральный)

## Макет
`desktop/overview.html`

## Описание
Генеральный макет ПК-версии Balloo Messenger. Обёртка окна (Electron / Tauri) с кастомным titlebar, системными кнопками, меню, statusbar и tray-индикатором. Внутри — полноценный мессенджер.

## Структура окна

### Titlebar (40px, кастомный)
- **Левая часть**: иконка-октагон «B» + заголовок «Balloo Messenger — Чаты»
- **Меню**: Файл / Правка / Вид / Окно / Справка (нативное меню)
- **Системные кнопки**: ─ (свернуть) / ▢ (развернуть) / ✕ (закрыть, red hover)
- Drag region: весь titlebar (кроме кнопок и меню)

### Window body (600px высота)

#### Sidebar (320px)
- Поиск чатов
- Список чатов (4 шт.) с:
  - Аватары-октагоны с двойной рамкой (статус + контекст)
  - Имя, последнее сообщение
  - Typing indicator
  - Бейдж непрочитанных
  - Время

#### Chat content
- Topbar чата: аватар, имя, статус «● в сети», кнопки 🔍 📹 📞 ⚙
- Messages: sent (accent, bubble-sender) и recv (bg-tertiary, bubble-receiver)
  - Header с временем
  - Reactions
  - Action buttons (↩ 📋 😊 ✏)
  - Ticks (✓✓ read)
  - Auto-tag на сообщении
- Input area: 📎 + textarea + 😊 + ➤ (send)

### Statusbar (24px)
- ● Подключено · WebSocket
- 🔒 E2E шифрование
- 💾 Yandex Disk: 4.2 ГБ / 10 ГБ
- 📦 Кэш: 124 МБ
- v1.0.0-beta

### Tray-индикатор (floating, bottom-right)
- Октагон-иконка «B» (48×48px)
- Бейдж непрочитанных (3) — red круг
- Tooltip «Balloo — свёрнуто в tray»

## Технологии
- **Electron** (primary) или **Tauri** (lightweight alternative)
- `customTitleBarStyle` — скрытие нативного titlebar, `-webkit-app-region: drag`
- `Tray` API — иконка в системном трее
- `globalShortcut` — глобальные хоткеи
- `BrowserWindow` — управление окном
- `Notification` API — нативные уведомления ОС
- React 19 + Next.js для контента

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Без скруглений окна (кроме системных кнопок при необходимости)
- Titlebar: bg-tertiary, border-bottom
- Системные кнопки: 46×40px, close → red hover
- Statusbar: bg-tertiary, 11px, text-muted
- Tray: октагон-иконка с бейджем

## Глобальные хоткеи
- `Ctrl+K` — поиск
- `Ctrl+N` — новый чат
- `Ctrl+Shift+V` — звонок
- `Alt+Space` — показать/скрыть из tray
- `Ctrl+Shift+T` — переключить тему

## Системная интеграция
- Нативные уведомления ОС
- Tray icon с контекстным меню
- Auto-launch при старте ОС (опционально)
- Deep links: `balloo://chat/abc123`
- Badge на иконке (dock/taskbar)
- Spellcheck (нативный ОС)
