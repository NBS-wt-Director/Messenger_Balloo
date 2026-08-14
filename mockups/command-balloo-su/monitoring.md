# Задание: command.balloo.su — Мониторинг продукта

## Макет
`command-balloo-su/monitoring.html`

## Описание страницы
Мониторинг продукта в реальном времени: статус системы, uptime, latency, RPS. График активных пользователей, статус сервисов, ресурсы серверов, алерты. Glassmorphism metric-cards.

## Структура страницы

### Topbar
- Логотип Command (C на info-цвете)
- Заголовок «Мониторинг продукта»
- Кнопка ↻ (обновить)
- Аватар сотрудника, язык, тема

### Sidebar (narrow)
- 🏠 Дашборд
- 📋 Задачи
- 👥 HR
- 📚 База знаний
- 🎯 Найм
- 📊 Мониторинг (active)

### Content
1. Заголовок «Мониторинг продукта» + подзаголовок «Дашборды в реальном времени • Prometheus • Grafana»
2. **Metric-cards** (4, glassmorphism):
   - Статус системы: ● (Все сервисы активны, accent)
   - Uptime: 99.7%
   - Avg. Latency: 45ms
   - RPS: 2.4k
3. **Карточка «Активные пользователи (Realtime)»**:
   - График DAU/MAU (chart-placeholder)
   - WebSocket: 1,023 подключений
4. **Карточка «Сервисы»** + **Карточка «Ресурсы серверов»** (side by side):
   - Сервисы: api.balloo.su (OK), ws.balloo.su (OK), postgres (OK), redis (OK), minio (HIGH/danger)
   - Ресурсы: CPU 62% (accent), RAM 78% (warning), DISK 45% (accent), SWAP 12% (accent) — progress bars
5. **Карточка «Алерты (последние 24ч)»**:
   - High CPU load — ws.balloo.su exceeded 90% (danger) — Ack
   - MinIO high usage — 78% of 2TB (danger) — Ack
   - Slow query — DB query > 500ms (warning) — Ack
   - Backup completed — 2.4GB (accent) — Ack

## Функционал
- **Метрики realtime** — статус, uptime, latency, RPS
- **График** — активные пользователи (DAU/MAU)
- **Сервисы** — статус (OK/HIGH/DOWN)
- **Ресурсы** — CPU, RAM, DISK, SWAP (progress bars)
- **Алерты** — список за 24ч, кнопка Ack
- **Обновить** — кнопка ↻

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Логотип Command — info-цвет
- Metric-cards — glassmorphism (bg-glass, backdrop-filter)
- Сервисы: status-dot + chip (OK=accent, HIGH=danger)
- Ресурсы: progress bars (accent/warning по уровню)
- Алерты: status-dot + bold текст + Ack кнопка

## Компоненты
- `CommandSidebar` — sidebar навигация
- `MetricCard` — карточка метрики (value, label, glassmorphism)
- `RealtimeChart` — график активных пользователей
- `ServicesList` — статус сервисов (dot + chip)
- `ServerResources` — ресурсы (CPU, RAM, DISK, SWAP progress bars)
- `AlertsList` — список алертов с Ack

## API
- `GET /api/v1/command/monitoring/summary` — статус, uptime, latency, RPS
- `GET /api/v1/command/monitoring/realtime` — активные пользователи
- `GET /api/v1/command/monitoring/services` — статус сервисов
- `GET /api/v1/command/monitoring/resources` — ресурсы серверов
- `GET /api/v1/command/monitoring/alerts` — алерты за 24ч
- `POST /api/v1/command/monitoring/alerts/:id/ack` — подтверждение алерта

## WebSocket
- `monitoring:metrics` — realtime обновление метрик
- `monitoring:alert` — новый алерт
- `monitoring:service_status` — изменение статуса сервиса

## Адаптивность
- Desktop: sidebar + content, двухколоночные карточки
- Mobile: sidebar → drawer, карточки подряд

## Технологии
- React 19 + Next.js
- Zustand: `commandStore` (monitoring, services, resources, alerts)
- Prometheus — сбор метрик
- Grafana — графики (embed / API)
- WebSocket: realtime обновления
