# Задание: Desktop — Режимы окна

## Макет
`desktop/modes.html`

## Описание
Макет трёх режимов окна ПК-приложения Balloo: развёрнутый, компактный и tray. С таблицей горячих клавиш и системной интеграцией.

## Режимы

### 1. Развёрнутый режим (по умолчанию)
- Полноценное окно с sidebar (280px) + content
- Titlebar с macOS-style точками (red/yellow/green) + системными кнопками
- Sidebar: поиск + список чатов (3 шт.)
- Content: заголовок чата + сообщения (sent/recv мини-пузыри) + input
- Высота: 480px
- Хоткей: `Ctrl+Shift+F` (fullscreen toggle)

### 2. Компактный режим
- Узкое окно (380px шириной)
- Sidebar 64px — только иконки (💬 👥 📞 🔍 ⚙ + аватар)
- Content: чат с мини-сообщениями
- Высота: 560px
- Хоткей: `Ctrl+Shift+C`

### 3. Tray-режим
- Окно скрыто, иконка в системном трее
- Popup (320px) при клике на tray-иконку:
  - Header: октагон-логотип «B» + «Balloo» + «3 непрочитанных»
  - Список последних чатов (3 шт.) с аватарами и превью
  - Footer: кнопки «Развернуть» (primary) + «Выйти» (tertiary)
- Хоткей: `Alt+Space`

## Таблица горячих клавиш

| Комбинация | Действие | Режим |
|---|---|---|
| Ctrl+K | Глобальный поиск | Любой |
| Ctrl+N | Новый чат | Развёрнутый/Компактный |
| Ctrl+Shift+V | Начать звонок | Развёрнутый/Компактный |
| Ctrl+Shift+C | Компактный режим | Развёрнутый |
| Ctrl+Shift+F | Полноэкранный режим | Развёрнутый |
| Alt+Space | Показать/скрыть (tray) | Tray/Любой |
| Ctrl+Shift+T | Переключить тему | Любой |
| Ctrl+, | Настройки | Развёрнутый/Компактный |

## Системная интеграция
- Нативные уведомления ОС (Notification API)
- Tray icon с бейджем непрочитанных
- Auto-launch при старте ОС (опционально)
- Deep links: `balloo://chat/abc123`
- Badge на иконке в dock/taskbar
- Spellcheck (нативный ОС)

## Технологии
- Electron `BrowserWindow.setBounds()` для изменения размера
- `Tray` + `Menu.buildFromTemplate()` для tray-popup
- `globalShortcut.register()` для хоткеев
- `app.setLoginItemSettings()` для auto-launch
- React 19 для контента внутри окна

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- macOS-style titlebar точки (red/yellow/green)
- Мини-пузыри сообщений с clip-path октагон
- Tray popup: glassmorphism (bg-glass + blur)
- Секции с заголовками и описаниями
- Таблицы с border-bottom разделителями
