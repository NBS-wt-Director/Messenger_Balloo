# Компонент: Users — Пользователи (админ)

## Описание
Компонент административной таблицы пользователей: поиск, список с аватаром, ID, статусом (активен/заблокирован), датой регистрации и действиями (профиль, бан/разбан).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `users` | `AdminUser[]` | Список пользователей | `[]` |
| `searchQuery` | `string` | Запрос поиска | `''` |
| `onSearchChange` | `(q: string) => void` | Изменение поиска | — |
| `onBan` | `(id: string) => void` | Забанить | — |
| `onUnban` | `(id: string) => void` | Разбанить | — |
| `onView` | `(id: string) => void` | Открыть профиль | — |

## Сущность AdminUser

```typescript
interface AdminUser {
  id: string;
  name: string;
  avatarUrl?: string;
  status: 'active' | 'banned';
  registeredAt: bigint;
}
```

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<table class="admin-users__table">
  <thead><tr><th>Пользователь</th><th>ID</th><th>Статус</th><th>Действия</th></tr></thead>
  <tbody>
    <tr class="admin-users__table__row">
      <td><div class="admin-users__table__name">Иван Иванов</div></td>
      <td>clxxx123</td>
      <td><span class="admin-users__table__status admin-users__table__status--active">Активен</span></td>
      <td><button onclick="onBan('clxxx123')">Бан</button></td>
    </tr>
  </tbody>
</table>
```

## Связанные экраны
- `users.html` (1_02_12) — экран пользователей
