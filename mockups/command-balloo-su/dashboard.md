# Задание: command.balloo.su — Дашборд сотрудника

## Макет
`command-balloo-su/dashboard.html`

## Описание страницы
Дашборд сотрудника: задачи, PR, спринт, метрики продукта (DAU/MAU/Retention/NPS), новости компании. Sidebar с навигацией по разделам портала.

## Структура страницы

### Topbar
- Логотип Command (C на info-цвете) с dropdown навигацией
- Заголовок «Дашборд»
- Аватар сотрудника, язык, тема

### Sidebar (narrow)
- 🏠 Дашборд (active)
- 📋 Задачи (badge: 5)
- 👥 HR
- 📚 База знаний
- 🎯 Найм
- 📊 Мониторинг

### Content
1. Заголовок «Дашборд сотрудника» + приветствие
2. **Карточки статистики** (3):
   - Активных задач: 5 (2 — сегодня, accent)
   - Pull Requests: 3 (Ожидают ревью, info)
   - Спринт: 8/12 (66% завершено, warning)
3. **Карточка «Мои задачи»**:
   - Срочно (danger chip): «Завершить макеты мобильного приложения» — Сегодня
   - В работе (warning): «Ревью PR #234 — WebSocket重构» — Завтра
   - Бэклог (info): CI/CD для admin, документация API, миграция БД
4. **Карточка «Метрики продукта»**:
   - DAU: 1 023 (+8%, accent)
   - MAU: 12 345 (+12%, accent)
   - Retention 7-day: 42% (-2%, warning)
   - NPS: 67 (+5, accent)
5. **Карточка «Новости компании»**:
   - Релиз v1.0.0-beta — 38 экранов готовы
   - Новый дизайнер в команде
   - Миграция на Kubernetes

## Функционал
- **Статистика** — задачи, PR, спринт-прогресс
- **Задачи** — список с приоритетами (Срочно / В работе / Бэклог)
- **Метрики** — DAU, MAU, Retention, NPS с дельтами
- **Новости** — лента корпоративных новостей
- **Навигация** — sidebar по разделам портала

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Логотип Command — info-цвет
- Карточки статистики — крупные цифры (28px, 800 weight)
- Задачи: chip приоритета (danger/warning/info) + текст + дедлайн
- Метрики: значение + chip дельты (accent/warning)

## Компоненты
- `CommandSidebar` — sidebar навигации
- `DashboardStats` — сетка статистики (задачи, PR, спринт)
- `TaskList` — список задач с приоритетами
- `ProductMetrics` — метрики продукта (DAU, MAU, Retention, NPS)
- `NewsFeed` — лента новостей компании

## API
- `GET /api/v1/command/dashboard` — данные дашборда (задачи, PR, спринт)
- `GET /api/v1/command/tasks` — мои задачи
- `GET /api/v1/command/metrics` — метрики продукта
- `GET /api/v1/command/news` — новости компании

## WebSocket
- `command:task_updated` — обновление задачи
- `command:news` — новая новость

## Безопасность
- SSO / OAuth для входа сотрудников
- Доступ только для сотрудников

## Адаптивность
- Desktop: sidebar + content
- Mobile: sidebar → drawer

## Технологии
- React 19 + Next.js
- Zustand: `commandStore` (dashboard, tasks, metrics, news)
- Интеграция: GitHub API (PR), Jira (задачи), Mixpanel (метрики)
