# Экран: Сторис — Desktop

**ID:** `1_09_04`  
**Узел:** `у_09` — desktop  
**Файл макета:** `mockups/desktop/stories.html`

---

## Описание

Десктопная версия экрана «Сторис» — stories tray в sidebar + empty state в content + full-screen story viewer с right-panel.

## Структура

- **Titlebar** — кастомный, с меню и системными кнопками
- **Боковая панель** — stories tray (горизонтальная) + список чатов с индикаторами сторис
- **Контент** — empty state с подсказкой
- **Story Viewer** — full-screen overlay с progress-bar, content, right-panel (текст, действия, реакции, витрина)
- **Statusbar** — статус подключения, версия

## Компоненты (Electron / Tauri)

| Компонент | Описание |
|---|---|
| `DesktopStoriesTray` | Горизонтальная лента сторис в sidebar |
| `DesktopStoryViewer` | Full-screen просмотрщик историй |
| `DesktopStoryRightPanel` | Правая панель вьювера (текст, действия, реакции, витрина) |

## API

### WebSocket
- `user:status` — обновление статуса пользователя (для сторис)
- `message:new` — новый ответ на сторис

### HTTP эндпоинты
- `GET /stories` — список доступных сторис
- `GET /stories/:userId` — сторис конкретного пользователя
- `POST /stories` — создание сторис
- `DELETE /stories/:id` — удаление сторис
- `POST /stories/:id/reply` — ответ на сторис
- `POST /stories/:id/react` — реакция на сторис

## Бизнес-логика

### JavaScript-функции
- `openStoryViewer()` — открыть full-screen viewer
- `closeStoryViewer()` — закрыть viewer
- `openStoryCreate()` — переход к созданию сторис
- `openCall(type)` — открыть звонок
- `prevStory()` — предыдущая история (slide-left)
- `nextStory()` — следующая история (slide-right)

### Навигация
- Создание сторис → `group-create.html`
- «💬 Написать» → `balloo-su/chats.html?author=МА`
- «🚩 Пожаловаться» → `report-message.html?context=story`
