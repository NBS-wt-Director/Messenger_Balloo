# Компонент: Metrics — Метрики

## Описание
Компонент дашборда метрик: карточки KPI с значениями и процентом изменения, столбчатая диаграмма активности.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `kpis` | `KPI[]` | Ключевые показатели | `[]` |
| `chartData` | `number[]` | Данные для диаграммы | `[]` |
| `period` | `string` | Период (week/month/year) | `'week'` |

## События

| Событие | Описание |
|---|---|
| `periodChange` | Период изменён |

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="metrics-grid">
  <div class="metrics-grid__card">
    <div class="metrics-grid__card__value">12 450</div>
    <div class="metrics-grid__card__label">Пользователей</div>
    <div class="metrics-grid__card__change metrics-grid__card__change--up">↑ 12%</div>
  </div>
</div>
```

## Связанные экраны
- `metrics.html` (1_02_08) — экран метрик
