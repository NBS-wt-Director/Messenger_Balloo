# Статус сервиса (admin-balloo-su/service-status.html)

## Описание
Мониторинг узлов Balloo в реальном времени. Перенесён из отдельного узла status.balloo.su (у_12 не создан) в админ-панель как экран `1_02_26`. Показывает статус узлов, задержку, аптайм, активные инциденты, историю инцидентов, создание инцидентов.

## Структура
- **Topbar**: логотип Admin, заголовок «Статус сервиса», общий индикатор
- **Sidebar**: навигация админ-панели (Статус сервиса активно)
- **Content**:
  - Сетка статусов узлов (8 узлов: balloo, admin, command, features, history, download, docs, blog) с real-time индикаторами (status-dot, задержка, аптайм)
  - Активные инциденты (карточки с серьёзностью, затронутыми узлами, временем)
  - Форма создания инцидента (заголовок, описание, серьёзность, узлы)
  - История инцидентов (таблица: инцидент, серьёзность, узлы, начало/конец, статус)

## Дизайн-требования
- Дизайн-система: common.css
- status-dot: online (accent), degraded/busy (warning), down (danger)
- Темы: dark, light, russian
- Real-time обновление каждые 30 секунд (WebSocket / polling)

## Компоненты (React)
- `ServiceStatusDashboard` — real-time индикаторы узлов + инциденты

## API
- `GET /admin/status` — текущий статус узлов (real-time)
- `GET /admin/status/incidents` — история инцидентов
- `POST /admin/status/incidents` — создать инцидент
- `PUT /admin/status/incidents/:id` — обновить/закрыть инцидент

## Сущности данных
- `service_status_incidents` — title, body, severity, affectedNodes (Json), startsAt, endsAt, status, createdByAdminId, createdAt, updatedAt
- `service_status_snapshots` — nodeId, status (up/degraded/down), latencyMs, checkedAt (time-series)

## Технологии
- React 19 / Next.js 15
- Health-check воркеры (cron) пишут в `service_status_snapshots`
- WebSocket: `status.update` для real-time пуша в дашборд
