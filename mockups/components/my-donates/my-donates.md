# Компонент: My Donates — Мои донаты

## Описание
Компонент отображения истории донатов пользователя. Показывает общую сумму поддержанных средств, список транзакций со статусами и датами.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `donates` | `Donate[]` | История донатов | `[]` |
| `totalAmount` | `number` | Общая сумма (₽) | `0` |
| `onRefresh` | `() => void` | Обновить данные | — |

## Сущность Donate

```typescript
interface Donate {
  id: string;
  amount: number;        // rubles
  currency: string;      // 'RUB'
  date: bigint;          // Unix timestamp
  status: 'success' | 'pending' | 'failed';
  tier?: string;         // название тира (basic, premium и т.д.)
  message?: string;
}
```

## События

| Событие | Описание |
|---|---|
| `donateRefresh` | Запрошено обновление данных |

## Визуальные элементы

- **Общая сумма** — 24px, `--accent`, `font-weight: 800`
- **Карточки транзакций** — `--bg-tertiary`, сумма `--accent`
- **Статусы** — бейджи с цветами (зелёный/жёлтый)

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы
- CSS-переменные

## Пример использования

```html
<div class="donate-total">
  <span class="donate-total__label">Всего поддержано</span>
  <span class="donate-total__value">1 250 ₽</span>
</div>
<div class="donate-list">
  <div class="donate-item">
    <div class="donate-item__icon">💚</div>
    <div class="donate-item__info">
      <div class="donate-item__amount">500 ₽</div>
      <div class="donate-item__date">15 июля 2026</div>
    </div>
    <div class="donate-item__status donate-item__status--success">Оплачено</div>
  </div>
</div>
```

## Связанные экраны
- `my-donates.html` (1_01_11) — экран моих донатов
