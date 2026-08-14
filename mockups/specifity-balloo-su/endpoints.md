# Задание: specifity.balloo.su — Эндпоинты (API каталог)

## Макет
`specifity-balloo-su/endpoints.html`

## Описание страницы
Каталог REST API-эндпоинтов и WebSocket events монорепо, сгруппированный по доменам. Каждый эндпоинт — метод, путь, описание, уровень доступа (RBAC). Ссылка на полную интерактивную документацию (docs.balloo.su, OpenAPI 3.0).

## Структура страницы

### Topbar
- Логотип Specifity + dropdown узлов
- Заголовок: «Эндпоинты · API каталог»
- Переключатели языка и темы

### Sidebar (240px)
- Навигация по разделам specifity (активная — Эндпоинты), поиск endpoint

### Content
1. **Заголовок экрана** — ID `1_10_05`, базовый URL, WebSocket URL
2. **Фильтры доступа** — Public / JWT / Bot / Admin
3. **Группы эндпоинтов** (таблицы):
   - Auth (`/auth`) — register, login, oauth, refresh, logout, session
   - Devices & Sessions (`/devices`) — list, delete, pair-token, pair/confirm
   - Accounts (`/accounts`) — list, switch, add (мультиаккаунт)
   - Users & Contacts (`/users`) — me, contacts, block
   - Chats & Messages (`/chats`) — messages, reactions, mute, export
   - Calls (`/calls`) — initiate, accept, end (WebRTC)
   - Admin (`/admin`) — reports, bans, appeals (модерация)
   - Specifity (`/specifity`) — overview, nodes, screens, endpoints, data, components
4. **WebSocket Events** — таблица client→server / server→client
5. **Подвал** — ссылка на docs.balloo.su + `docs/04-api-websocket-spec.md`

## Дизайн-требования
- Дизайн-система: `@balloo/shared` + `spec.css`
- Методы — цветные badge: GET (accent), POST (info), PATCH (purple), DELETE (danger)
- Доступ — badge: Public / JWT / Bot / Admin
- Таблицы — `.spec-table`, без border-radius
- Темы: dark, light, russian

## Компоненты
- `SpecSidebar` — общий
- `SpecPageHead` — заголовок
- `SpecFilterBar` — фильтры доступа
- `SpecEndpointGroup` — группа эндпоинтов (заголовок + таблица)
- `SpecEndpointRow` — строка (метод, путь, описание, доступ)
- `ApiMethodBadge` — badge метода (GET/POST/PATCH/DELETE)
- `ApiAccessBadge` — badge доступа (Public/JWT/Bot/Admin)
- `SpecWsEventTable` — таблица WebSocket events

## API
- `GET /api/v1/specifity/endpoints` — каталог эндпоинтов (группы, методы, пути, доступ)
- `GET /api/v1/specifity/websocket-events` — список WS events
- Данные из `docs/04-api-websocket-spec.md` / OpenAPI-схемы, SSG

## Адаптивность / мобильные взаимодействия
- Десктоп: sidebar + таблицы
- Мобильный: таблицы горизонтально-скроллируемые

## Технологии
- Next.js 14 + TypeScript (SSG)
- Данные из OpenAPI-схемы + `docs/04-api-websocket-spec.md`
- Общий `SpecSidebar` (shared layout)
