# Компонент: Manager Dashboard — Дашборд руководителя

## Описание
Компонент дашборда руководителя: метрики команды (сотрудники, задачи в работе, в ожидании) и канбан-доска задач.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `stats` | `DashboardStats` | Метрики команды | — |
| `kanban` | `KanbanBoard` | Доска задач | — |

## Сущность DashboardStats

```typescript
interface DashboardStats {
  teamMembers: number;
  tasksInProgress: number;
  tasksPending: number;
  tasksCompleted: number;
}
```

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="dashboard-stats">
  <div class="dashboard-stats__card">
    <div class="dashboard-stats__card__value">8</div>
    <div class="dashboard-stats__card__label">Сотрудников</div>
  </div>
</div>
```

## Связанные экраны
- `manager-dashboard.html` (1_03_02) — экран дашборда
