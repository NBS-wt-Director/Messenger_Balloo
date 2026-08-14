# Экран: Чаты — Desktop

**ID:** `1_09_01`  
**Узел:** `у_09` — desktop  
**Файл макета:** `mockups/desktop/chat.html`

---

## Описание

Десктопная версия экрана «Чаты» — полный функционал из web-источника (`balloo-su/chats.html`). Структура окна: titlebar + window-body (sidebar 320px + content) + statusbar. Обязательный topbar с dropdown навигацией.

## Структура

- **Titlebar** — кастомный, с меню и системными кнопками
- **Боковая панель** — список чатов (320px) с поиском, кнопкой «Новая группа», кнопкой «Звонки» с бейджем
- **Контент** — заголовок чата, сообщения, input-area, модалки
- **Statusbar** — статус подключения, E2E, версия

## Компоненты (Electron / Tauri)

| Компонент | Описание |
|---|---|
| `DesktopChatList` | Список чатов в sidebar |
| `DesktopChatWindow` | Основное окно чата с сообщениями |
| `DesktopCallOverlay` | Оверлей видеозвонка |
| `DesktopAttachmentsPanel` | Панель вложений (fullscreen) |
| `DesktopMessageSettings` | Slide-panel настроек сообщения |
| `DesktopScheduledMessages` | Slide-panel отложенных сообщений |
| `DesktopQuickReactions` | Floating панель быстрых реакций |
| `DesktopPollEditor` | Slide-panel редактора опросов/квизов |

## API

### WebSocket
- **native Node.js** (не Hono+uWebSockets). Подключение `ws://balloo.su/ws?token=<JWT>`
- WS event `2fa.required`: payload `{userId, methods: ["email"]}` (не `["totp"]`)
- Все WS события: message:new, call:invite, call:join, call:leave, chat:typing, message:read, user:status

### HTTP эндпоинты
- `GET /chats` — пагинация, infinite scroll
- `GET /chats/:id/messages` — пагинация по 100
- `POST /chats/:id/messages` — отправка сообщения
- `POST /chats/:id/messages/:msgId/reactions` — реакции
- `POST /chats/:id/report` — жалоба на сообщение
- `POST /attachments/upload` — лимит 15 МБ без облака, 1 ГБ с облаком
- `POST /attachments/cloud` — Yandex Disk + Mail.ru Cloud

## Бизнес-логика

### JavaScript-функции
- `openCall(type)` — открыть оверлей видеозвонка / аудиозвонка
- `closeCall()` — закрыть оверлей звонка
- `toggleMute()` — вкл/выкл микрофон
- `toggleVideo()` — вкл/выкл камеру
- `toggleScreen()` — демонстрация экрана
- `openPollEditor()` / `closePollEditor()` — редактор опросов
- `openStoryCreate()` — переход к созданию сторис
- `votePoll(pollId, optionIndex)` — голосование в опросе
- `editMessage(msgId)` — inline-редактирование сообщения
- `insertEmoji(emoji)` — вставка эмодзи
- `toggleEmojiPanel()` — показать/скрыть панель эмодзи
- `openReplyPanel(msgId)` / `closeReplyPanel()` — панель ответа
- `openQuickReactions()` / `addReactionQuick(emoji)` — быстрые реакции
- `openScheduledPanel()` / `closeScheduledPanel()` — отложенные сообщения
- `openAttachmentsPanel()` / `closeAttachmentsPanel()` — панель вложений
- `openMessageSettings()` / `closeMessageSettings()` — настройки сообщения
- `showContextMenu(e)` / `hideContextMenu()` — контекстное меню
- `addReaction(msgId, emoji)` — добавление реакции
- `copyMessage()` — копирование текста
- `selectHint(cmd, field)` — slash-команды
- `toggleAttachments(msgId)` — раскрыть вложения сообщения
- `sendMessage()` — отправка сообщения
- `toggleDropdown(id)` — переключение dropdown
- `openModal(id)` / `closeModal(id)` — управление модалками

### Навигация
- «👥 Новая группа» → `group-create.html`
- «📞 Звонки» → `calls-history.html`
- «📎 Вложения чата» → `chat-attachments.html`
- «🚩 Жалоба» → `report-message.html`
- «💬 Написать» → `chat.html`
- «📤 Экспорт в PDF» — действие
- «📦 В архив» — действие
- «🚫 Заблокировать» — действие
- «👥 Создать группу» (в модалке) → `group-create.html`
- Создание сторис → `stories.html`
