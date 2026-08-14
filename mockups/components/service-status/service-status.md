# Компонент: Service Status — Статус сервиса

## Описание
Компонент мониторинга статусов сервисов: общий статус с пульсирующим индикатором, список подсервисов с аптаймом и статусом (OK / Maintenance / Error).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `services` | `Service[]` | Список сервисов | `[]` |
| `overallStatus` | `'ok' \| 'warning' \| 'error'` | Общий статус | `'ok'` |

## Сущность Service

```typescript
interface Service {
  name: string;
  uptime: string;
  status: 'ok' | 'warning' | 'error';
}
```

## Стилизация

Использует дизайн-систему из `common.css`. Пульсирующий индикатор через `@keyframes pulse`.

## Пример использования

```html
<div class="service-status__overall">
  <div class="service-status__overall__dot"></div>
  <div>
    <div class="service-status__overall__text">Все системы работают</div>
    <div class="service-status__overall__sub">Аптайм: 99.98%</div>
  </div>
</div>
```

## Связанные экраны
- `service-status.html` (1_02_10) — экран статуса сервиса
