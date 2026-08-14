# Задание: balloo.su — Чаты

## Макет
`balloo-su/chats.html`

## Описание страницы
Главный экран мессенджера. Список чатов (sidebar) + окно активного чата (content). Поддерживает текст, markdown, реакции, вложения, опросы, голосовые, пересылку, редактирование, историю изменений, AI-теги, slash-команды, звонки (overlay).

## Структура страницы

### Topbar
- Логотип Balloo с расширенным dropdown (узлы + разделы)
- Заголовок «Чаты» (клик → режим обучения)
- Кнопки: ✏ (новый чат), 📹 (видеозвонок), 📞 (аудиозвонок)
- Аватар → `profile.html`, язык, тема

### Sidebar — Список чатов
- Поиск чатов и людей
- Список чатов с аватарами-октагонами:
  - Активный чат (accent-bg), индикатор «печатает...»
  - Групповой чат (chip контекста)
  - Чат с непрочитанными (badge)
  - Заблокированный пользователь (text-muted, «??»)
  - DND-статус (🔇)
  - СМИ-группа (chip «СМИ»)
  - Корпоративная группа (chip «КОРП»)
  - Прочитанный чат

### Content — Окно чата
1. **Chat header** — аватар, имя, статус, кнопки 📞 📹 ⋮ (меню: закрепить, заглушить, в архив, экспорт PDF, заблокировать)
2. **Messages**:
   - Date separator (chip с датой)
   - Receiver: reply-quote, markdown-body, вложения (collapsible), реакции, действия (↩ 📋 😊 📤 🚩)
   - Sender: markdown, действия (↩ 📋 😊 ✏ 🗑), edit history (diff), msg-ticks (✓✓ read)
   - Poll widget — вопрос, варианты с барами, проценты, мета (анонимный, можно переслать)
   - AI-тег (🤖 ИИ) + auto-ответ (⚙ Автоответ)
   - Voice message — waveform, play, duration, speed 1.5x
   - Typing indicator (dots)
3. **Input area**:
   - Slash-commands hint: `/poll_`, `/quiz_`, `/list_active_`, `/list_passive_`, `/personali_`
   - Кнопки: 📎 (файл), 🖼 (фото/видео), 🎤 (голосовое), 📊 (интерактив), 😊 (эмодзи)
   - Textarea + кнопка отправки ➤

### Modal: New Chat
- Поиск человека
- Список контактов
- Кнопка «👥 Создать группу» → `group-create.html`

### Call Overlay
- Header: аватар, имя, таймер, chip «Низкая скорость», кнопка «Свернуть»
- Participants: видео-блоки (speaking indicator), PiP
- Controls: mute 🎤, video 📹, screen 🖥, hangup 📞

## Функционал
- **Отправка сообщений** — текст с markdown, slash-команды для интерактивов
- **Реакции** — клик на эмодзи, подсчёт
- **Ответ/пересылка** — reply-quote, forward-tag
- **Редактирование** — edit history с diff (old/new)
- **Вложения** — collapsible, превью-thumbnail
- **Опросы/квизы/списки/персонали** — slash-команды
- **Голосовые** — запись, waveform, скорость воспроизведения
- **AI-автоответ** — тег 🤖 ИИ + ⚙ Автоответ
- **Звонки** — overlay с WebRTC, mute/video/screen/hangup
- **Новый чат** — модалка с поиском и созданием группы
- **Меню чата** — закрепить, заглушить, архив, экспорт PDF, блокировка

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Аватары-октагоны с двойной рамкой (контекст + статус)
- Пузыри без скруглений: sender (accent), receiver (серый)
- Угловой срез пузыря — 45° на самом кончике (4% от размера)
- Пиктограммы действий — на противоположном от среза углу:
  - Sender (срез справа внизу) → действия слева внизу
  - Receiver (срез слева внизу) → действия справа внизу
- Reactions — chips с эмодзи и счётчиком
- msg-ticks: ✓✓ (delivered / read)
- Slash-commands hint — выпадающий список
- Call overlay — glassmorphism, speaking indicator

## Компоненты
- `ChatList` — sidebar со списком чатов
- `ChatListItem` — элемент списка (аватар, имя, последнее сообщение, badge)
- `ChatHeader` — хедер чата (аватар, имя, статус, меню)
- `MessageBubble` — пузырь сообщения (sender/receiver)
- `MessageReply` — quote-блок ответа
- `MessageAttachments` — collapsible вложения
- `MessageReactions` — реакции
- `MessageActions` — кнопки действий (↩ 📋 😊 📤 ✏ 🗑 🚩)
- `PollWidget` — опрос (варианты, бары, проценты)
- `VoiceMessage` — голосовое (waveform, play, speed)
- `EditHistory` — история изменений с diff
- `SlashCommandHint` — подсказки slash-команд
- `InputArea` — поле ввода с кнопками
- `NewChatModal` — модалка нового чата
- `CallOverlay` — overlay звонка

## API
- `GET /api/v1/chats` — список чатов
- `GET /api/v1/chats/:id/messages` — история сообщений (пагинация)
- `POST /api/v1/chats/:id/messages` — отправка сообщения
- `PATCH /api/v1/messages/:id` — редактирование
- `DELETE /api/v1/messages/:id` — удаление
- `POST /api/v1/chats/:id/messages/:id/reactions` — реакция
- `POST /api/v1/chats/:id/polls` — создание опроса
- `POST /api/v1/chats/:id/voice` — отправка голосового
- `POST /api/v1/chats/:id/files` — загрузка вложения
- `POST /api/v1/chats/:id/messages/:id/forward` — пересылка
- `GET /api/v1/chats/:id/export` — экспорт в PDF

## WebSocket
- `chat:message` — новое сообщение
- `chat:typing` — индикатор печатает
- `chat:reaction` — реакция добавлена/удалена
- `chat:edit` — сообщение отредактировано
- `chat:delete` — сообщение удалено
- `chat:read` — статус прочтения
- `chat:poll_vote` — голос в опросе
- `call:incoming` — входящий звонок
- `call:state` — изменение состояния звонка

## Адаптивность
- Desktop: sidebar + content (двухпанельный)
- Mobile: одна панель, переключение список ↔ чат
- Desktop: окно приложения с sidebar

## Технологии
- React 19 + Next.js
- Zustand: `chatStore` (chats[], activeChat, messages[])
- WebSocket: realtime сообщения, статусы
- WebRTC: звонки (медиа-стримы)
- Markdown: react-markdown
- Оффлайн-кэш: SQLite (сообщения, очередь отправки)
