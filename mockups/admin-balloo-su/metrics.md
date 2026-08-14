# Задание: admin.balloo.su — Метрики (Grafana)

## Макет
`admin-balloo-su/metrics.html`

## Описание страницы
Системные метрики: uptime, latency, RPS, алерты. Графики нагрузки (CPU/RAM/Network). Логи (ELK Stack). Prometheus targets. Glassmorphism metric-cards.

## Структура страницы

### Topbar
- Логотип Admin (A на warning-цвете)
- Заголовок «Метрики»
- Аватар админа, язык, тема

### Sidebar (narrow)
- 📊 Дашборд
- 👤 Пользователи
- 🚩 Жалобы
- 🔨 Баны
- 📈 Метрики (active)
- 🎛️ Feature Flags
- 📁 Файлы

### Content
1. Заголовок «Метрики» + подзаголовок «Prometheus + Grafana • ELK Stack • Системные метрики»
2. **Metric-cards** (4, glassmorphism):
   - Uptime: 99.7%
   - Avg. Latency: 45ms
   - RPS: 2.4k
   - Активных алертов: 8
3. **Карточка «Нагрузка сервера»**:
   - График CPU (Last 24h) — chart-placeholder
   - График RAM (Last 24h)
   - Сетевой трафик (Last 24h)
4. **Карточка «Логи (ELK Stack)»**:
   - Поиск по логам
   - Список: ERROR (danger) / WARN (warning) / INFO (info) + текст + время
5. **Карточка «Prometheus Targets»**:
   - Таблица: target, status (UP/DOWN), last scrape, error
   - api.balloo.su, ws.balloo.su, postgres, minio

## Функционал
- **Метрики** — realtime uptime, latency, RPS, алерты
- **Графики** — CPU, RAM, Network (Grafana embed)
- **Логи** — поиск и просмотр (ELK Stack)
- **Prometheus targets** — статус скрейпов

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Metric-cards — glassmorphism (bg-glass, backdrop-filter)
- Chart-placeholder — bg-tertiary, центрированный
- Логи: chip уровня (ERROR=danger, WARN=warning, INFO=info)
- Prometheus targets: chip UP=accent, DOWN=danger

## Компоненты
- `AdminSidebar` — sidebar навигации
- `MetricCard` — карточка метрики (value, label, glassmorphism)
- `ServerLoadCharts` — графики CPU/RAM/Network
- `LogsViewer` — просмотр логов с поиском (ELK)
- `LogEntry` — элемент лога (уровень, текст, время)
- `PrometheusTargetsTable` — таблица targets

## API
- `GET /api/v1/admin/metrics/summary` — uptime, latency, RPS, алерты
- `GET /api/v1/admin/metrics/charts?type=cpu|ram|network` — данные графиков
- `GET /api/v1/admin/logs?q=...` — поиск по логам (ELK)
- `GET /api/v1/admin/prometheus/targets` — статус targets

## Безопасность
- 2FA для админа
- Логи не содержат содержимое чатов
- Все действия логируются

## Адаптивность
- Desktop: sidebar + content, графики
- Mobile: sidebar → drawer, графики подряд

## Технологии
- React 19 + Next.js
- Zustand: `adminStore` (metrics, logs, targets)
- Prometheus — сбор метрик
- Grafana — графики (embed iframe / API)
- ELK Stack — логи (Elasticsearch + Logstash + Kibana)
