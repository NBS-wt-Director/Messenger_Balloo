# Мой отдел (command-balloo-su/my-department.html)

## Описание
Страница отдела текущего сотрудника. Команда, метрики, прогресс спринта, задачи отдела.

## Структура
- **Topbar**: логотип Command, заголовок «Мой отдел»
- **Sidebar**: навигация портала (с активным «Мой отдел»)
- **Content**:
  - Заголовок с названием отдела
  - Статистика (сотрудников, активных задач, PR, спринт)
  - Список участников отдела с аватарками, должностями, статусами
  - Прогресс спринта (progress bar)
  - Таблица текущих задач отдела

## Компоненты (React)
- `DepartmentHeader` — заголовок отдела
- `DepartmentMembers` — список участников
- `SprintProgress` — прогресс спринта
- `DepartmentTasks` — таблица задач

## API
- `GET /api/departments/me` — мой отдел
- `GET /api/departments/:id/members` — участники отдела
- `GET /api/departments/:id/tasks` — задачи отдела
- `GET /api/departments/:id/sprint` — прогресс спринта

## Технологии
- React 19
