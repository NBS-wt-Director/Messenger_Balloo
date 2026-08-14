# Компонент: Features Mgmt — Управление фичами

## Описание
Компонент административной таблицы фич-реквестов: название, статус (активна/черновик/архив), количество голосов, действия.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `features` | `Feature[]` | Список фич | `[]` |
| `onAdd` | `() => void` | Добавить фичу | — |
| `onEdit` | `(id: string) => void` | Редактировать | — |

## Сущность Feature

```typescript
interface Feature {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'archived';
  votes: number;
  createdAt: bigint;
}
```

## События

| Событие | Описание |
|---|---|
| `featureAdd` | Добавлена фича |
| `featureEdit` | Редактирование |

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<table class="features-mgmt__table">
  <thead><tr><th>Название</th><th>Статус</th><th>Голосов</th></tr></thead>
  <tbody>
    <tr class="features-mgmt__table__row">
      <td class="features-mgmt__table__name">Тёмная тема</td>
      <td><span class="features-mgmt__table__status features-mgmt__table__status--active">Активна</span></td>
      <td>1 247</td>
    </tr>
  </tbody>
</table>
```

## Связанные экраны
- `features-mgmt.html` (1_02_05) — экран управления фичами
