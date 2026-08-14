# Компонент: Time Off — Отпуска и отсутствие

## Описание
Компонент управления отпусками: баланс дней, список заявок с типами (отпуск/больничный/удалёнка) и статусами (ожидание/одобрено/отклонено).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `balance` | `TimeOffBalance` | Баланс дней | — |
| `requests` | `TimeOffRequest[]` | Список заявок | `[]` |

## Сущность TimeOffBalance

```typescript
interface TimeOffBalance {
  total: number;
  used: number;
  remaining: number;
}
```

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="time-off-balance">
  <div class="time-off-balance__card">
    <div class="time-off-balance__card__value">24</div>
    <div class="time-off-balance__card__label">Осталось дней</div>
  </div>
</div>
```

## Связанные экраны
- `time-off.html` (1_03_03) — экран отпусков
