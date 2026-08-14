# Компонент: Donations — Донаты (админ)

## Описание
Компонент административного просмотра донатов: статистика (всего собрано, транзакций, ожидание) и таблица транзакций.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `stats` | `DonateStats` | Статистика | — |
| `transactions` | `DonateTx[]` | Список транзакций | `[]` |
| `onFilter` | `(filter: Filter) => void` | Фильтрация | — |

## Сущность DonateStats

```typescript
interface DonateStats {
  totalAmount: number;
  totalTransactions: number;
  pendingCount: number;
}
```

## События

| Событие | Описание |
|---|---|
| `filterChange` | Фильтр изменён |
| `transactionClick` | Транзакция выбрана |

## Визуальные элементы

- **Статистика** — 3 карточки в ряд, сумма `--accent`, 24px
- **Таблица** — заголовки uppercase, строки с hover
- **Статусы** — цветные бейджи

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="admin-donations__stats">
  <div class="admin-donations__stat">
    <div class="admin-donations__stat__value">12 450 ₽</div>
    <div class="admin-donations__stat__label">Всего собрано</div>
  </div>
</div>
```

## Связанные экраны
- `donate.html` (admin) — экран донатов в админ-панели
