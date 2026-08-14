# Компонент: Employees — Сотрудники

## Описание
Компонент административной таблицы сотрудников: список с аватаром, именем, ролью, статусом (активен/неактивен), поиском и действиями.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `employees` | `Employee[]` | Список сотрудников | `[]` |
| `searchQuery` | `string` | Запрос поиска | `''` |
| `onSearchChange` | `(query: string) => void` | Изменение поиска | — |
| `onEdit` | `(id: string) => void` | Редактирование | — |

## Сущность Employee

```typescript
interface Employee {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'admin' | 'moderator' | 'employee';
  status: 'active' | 'inactive';
}
```

## События

| Событие | Описание |
|---|---|
| `employeeEdit` | Редактирование сотрудника |
| `searchChange` | Поиск изменён |

## Визуальные элементы

- **Таблица** — заголовки uppercase 12px, hover-эффект
- **Статус** — цветные бейджи
- **Поиск** — `--bg-tertiary`, `--border-color`

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<table class="employees-table">
  <thead><tr><th>Сотрудник</th><th>Роль</th><th>Статус</th></tr></thead>
  <tbody>
    <tr class="employees-table__row">
      <td><div class="employees-table__name">Иван Иванов</div></td>
      <td>Администратор</td>
      <td><span class="employees-table__status employees-table__status--active">Активен</span></td>
    </tr>
  </tbody>
</table>
```

## Связанные экраны
- `employees.html` (1_02_03) — экран сотрудников
