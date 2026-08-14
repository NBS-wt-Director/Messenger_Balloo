# Задание: docs.balloo.su — API Documentation

## Макет
`docs-balloo-su/api-docs.html`

## Описание страницы
Документация API Balloo Messenger в стиле Swagger / OpenAPI 3.0. REST + WebSocket.

## Структура страницы

### Topbar
- Логотип API Docs (иконка D на info-цвете)
- Переключатели языка и темы

### Layout: Sidebar + Content

#### Sidebar (240px)
- Поиск по endpoint
- Дерево навигации по группам:
  - 📖 Обзор
  - 🔐 Auth (5 endpoints)
  - 💬 Messages (4 endpoints)
  - 👥 Chats (3 endpoints)
  - 📞 Calls (3 endpoints)
  - 🔌 WebSocket (events)
  - 🤖 Bots (2 endpoints)

#### Content (max-width 960px)
1. **Заголовок** «📖 API Documentation» + чипы OpenAPI 3.0 / v1.0.0-beta
2. **Базовый URL**: `https://api.balloo.su/v1` + `wss://balloo.su/ws`
3. **Секция Auth**:
   - `POST /auth/login` — тело запроса (JSON), ответ 200 (JSON), кнопки «Попробовать» / «Копировать curl»
4. **Секция Messages**:
   - `GET /messages` — query-параметры (таблица)
5. **Секция WebSocket**:
   - URL: `wss://balloo.su/ws?token=`
   - Таблица CLIENT → SERVER events
   - Таблица SERVER → CLIENT events
6. **Коды ошибок** (таблица: 400/401/403/404/429/500)

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- HTTP-методы цветными chip: GET (info), POST (accent), PUT (warning), DELETE (danger)
- JSON-блоки с моноширинным шрифтом (Fira Code), подсветка синтаксиса
- Таблицы параметров и событий
- Кнопки «Попробовать» (interactive API tester) и «Копировать curl»

## Компоненты
- `ApiSidebar` — дерево навигации по endpoint
- `EndpointCard` — карточка endpoint с запросом/ответом
- `JsonBlock` — блок JSON с подсветкой синтаксиса
- `HttpMethodChip` — цветной chip метода
- `TryItButton` — интерактивный тестер
- `WebSocketEvents` — таблицы событий WS

## API спецификация
- OpenAPI 3.0 YAML-файл
- Swagger UI или Redoc для рендеринга
- Автогенерация из TypeScript типов (tsoa / nestia)
- Версионирование: /v1/, /v2/

## Endpoints (кратко)
- Auth: login, register, oauth, refresh, logout
- Messages: list, send, edit, delete
- Chats: list, create, get
- Calls: initiate, accept, end
- WebSocket: message:send, typing, presence, reaction, call:incoming
