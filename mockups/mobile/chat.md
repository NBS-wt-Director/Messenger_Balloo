# Экран: Чат — Mobile

**ID:** `1_08_01`
**Узел:** `у_08` — mobile
**Файл макета:** `mockups/mobile/chat.html`
**Web-источник:** `mockups/balloo-su/chats.html`

---

## Описание

Мобильная версия полного чата. Сообщения (с октагон-пузырями), реакции, ответы, опросы, голосовые сообщения, AI-теги, поле ввода с командами, модалки (new-chat, forward, scheduled), call-overlay, attachments-panel, poll-editor. Бизнес-логика 1:1 с web-версией.

## Структура

- **Phone-frame** (360×780px) с notch, statusbar, home-bar
- **Topbar** (обязательный) — логотип Balloo с dropdown навигацией (пути `../balloo-su/...`), заголовок «Мария Андреева», аватар, lang/theme toggle
- **Chat header** — кнопка «←», аватар, имя + статус «в сети», кнопки 📞 📹 ⋮ (dropdown: вложения, закрепить, заглушить, архив, экспорт, блокировать)
- **Messages** (scrollable) — все типы сообщений из web:
  - Receiver с reply (пересланное, markdown, реакции, actions)
  - Sender (markdown, edit, ticks ✓✓ read)
  - Poll widget (голосование, проценты, мета)
  - Sender AI message (теги 🤖 ИИ, ⚙ Автоответ, ticks delivered)
  - Receiver voice message (waveform, play, speed 1.5x)
  - Sender attachment (📎 3 вложения)
  - Typing indicator
- **Reply panel** — inline над полем ввода (автор + текст + ✕)
- **Input area** — 📎, textarea (placeholder с `/` для команд), 😊, 📊, ➤ (send)
- **Tabbar** — Чаты активна

## Модальные окна и панели (из web)

- **modal-new-chat** — поиск человека, список, «Создать группу»
- **modal-forward** — пересылка сообщения (поиск, список чатов)
- **modal-scheduled** — отложенное сообщение (datetime, повтор)
- **call-overlay** — видеозвонок (header, participants, controls)
- **attachments-panel** — вложения (загрузить, фото, видео, документы, файлы)
- **poll-editor-overlay** — создание опроса/квиза (тип, вопрос, варианты)

## Бизнес-логика (JS-функции из web)

- `openCall(type)` / `closeCall()` / `toggleMute()` / `toggleVideo()` / `toggleScreen()`
- `toggleEmojiPanel()` / `openPollEditor()` / `closePollEditor()`
- `openAttachmentsPanel()` / `closeAttachmentsPanel()`
- `sendMessage()` — отправка (очистка поля)
- `openReplyPanel(msgId)` / `closeReplyPanel()`
- `votePoll()` — голосование в опросе
- Long-press → контекстное меню (ответить/копировать/реакция/переслать/удалить/жалоба)

## Компоненты (React Native / Expo)

| Компонент | Описание |
|---|---|
| `MobileChatScreen` | Экран чата |
| `MessageBubble` | Пузырь сообщения (октагон clip-path) |
| `PollWidget` | Виджет опроса |
| `VoiceMessage` | Голосовое сообщение с waveform |
| `ReplyPanel` | Панель ответа |
| `ChatInputArea` | Поле ввода с командами |
| `CallOverlay` | Оверлей звонка |
| `ForwardModal` | Модалка пересылки |
| `PollEditorOverlay` | Редактор опросов |

## API

См. `mockups/balloo-su/chats.html` — те же эндпоинты и WebSocket events.

## Мобильные взаимодействия

- **Long-press** на сообщение → контекстное меню
- **Swipe right** на сообщение → ответить
- **Swipe left** на чат в списке → архивировать/удалить
- **Pull-to-refresh** — обновление сообщений

## Дизайн-требования

- Дизайн-система: `mockups/assets/common.css`
- Пузыри: clip-path bubble-sender / bubble-receiver (без скруглений)
- Аватары — октагон, двойная рамка
- 3 темы: dark, light, russian
- Шрифт: Inter / Manrope
