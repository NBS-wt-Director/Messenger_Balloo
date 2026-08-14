# Компонент: Groups Mgmt — Управление группами

## Описание
Компонент административной таблицы групп: название, количество участников, тип (публичная/приватная), действия.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `groups` | `Group[]` | Список групп | `[]` |
| `onAdd` | `() => void` | Добавить группу | — |
| `onEdit` | `(id: string) => void` | Редактировать | — |

## События

| Событие | Описание |
|---|---|
| `groupAdd` | Добавлена группа |
| `groupEdit` | Редактирование |

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<table class="admin-groups__table">
  <thead><tr><th>Группа</th><th>Участники</th><th>Тип</th></tr></thead>
  <tbody>
    <tr class="admin-groups__table__row">
      <td><div class="admin-groups__table__name">👥 Команда</div></td>
      <td>15</td>
      <td><span class="admin-groups__table__status admin-groups__table__status--public">Публичная</span></td>
    </tr>
  </tbody>
</table>
```

## Связанные экраны
- `groups-mgmt.html` (1_02_07) — экран управления группами
