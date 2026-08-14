# Внутренний чат (command-balloo-su/internal-chat.html)

## Описание
Корпоративный внутренний чат для сотрудников. Каналы по отделам, личные сообщения, slash-команды. Использует ту же дизайн-систему, что и основной мессенджер.

## Структура
- **Topbar**: логотип Command, заголовок «Внутренний чат», кнопка нового чата, аватар
- **Sidebar**: поиск чатов, список каналов (#разработка, #общий, #дизайн, #инфраструктура) и DM
- **Content**: messages (пузыри сообщений), input-area с slash-командами

## Дизайн-требования
- Сообщения: октагон-пузыри (bubble-sender, bubble-receiver)
- Аватарки: октагон с двойной рамкой
- Slash-команды: /deploy, /status, /standup
- Typing indicator

## Компоненты (React)
- `ChatSidebar` — список каналов и DM
- `MessageList` — список сообщений
- `MessageBubble` — пузырь сообщения
- `SlashCommands` — подсказки slash-команд
- `TypingIndicator` — индикатор набора

## API (WebSocket events)
- `WS: message:send` — отправка сообщения
- `WS: message:receive` — получение сообщения
- `WS: typing:start` / `typing:stop` — индикатор набора
- `GET /api/channels` — список каналов
- `GET /api/channels/:id/messages` — история сообщений

## Технологии
- WebSocket (Hono + uWebSockets.js)
- React 19
