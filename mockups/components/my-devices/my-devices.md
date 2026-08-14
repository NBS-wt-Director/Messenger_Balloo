# Компонент: My Devices — Мои устройства

## Описание
Компонент отображения и управления списком активных сессий/устройств. Показывает текущее устройство, историю подключений и позволяет отозвать доступ.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `devices` | `Device[]` | Список устройств | `[]` |
| `onRevoke` | `(deviceId: string) => void` | Отзыв доступа | — |
| `onRevokeAll` | `() => void` | Отзвать все устройства | — |

## Сущность Device

```typescript
interface Device {
  id: string;
  name: string;          // e.g. "Windows PC — Chrome"
  type: 'desktop' | 'mobile' | 'tablet' | 'web';
  os: string;
  browser?: string;
  ip?: string;
  city?: string;
  country?: string;
  lastActive: bigint;    // Unix timestamp
  isCurrent: boolean;
}
```

## События

| Событие | Описание |
|---|---|
| `deviceRevoke` | Устройство отозвано |
| `deviceRevokeAll` | Все устройства отозваны |

## Визуальные элементы

- **Текущее устройство** — зелёная левая рамка (`--accent`), бейдж «Текущее»
- **Иконка типа** — 24px, эмодзи для типа устройства
- **Статус** — бейдж с фоном и цветом
- **Кнопка отзыва** — контурная красная кнопка

## Стилизация

Использует дизайн-систему из `common.css`:
- Карточки с `--bg-tertiary`
- Без скруглений
- CSS-переменные

## Пример использования

```html
<div class="device-list">
  <div class="device-item device-item--current">
    <div class="device-item__icon">💻</div>
    <div class="device-item__info">
      <div class="device-item__name">Windows PC — Chrome</div>
      <div class="device-item__detail">Москва, Россия · Сейчас</div>
    </div>
    <div class="device-item__status device-item__status--current">Текущее</div>
  </div>
  <div class="device-item">
    <div class="device-item__icon">📱</div>
    <div class="device-item__info">
      <div class="device-item__name">iPhone 15 — Balloo App</div>
      <div class="device-item__detail">Москва · 2 ч назад</div>
    </div>
    <div class="device-item__action" onclick="onRevoke('dev123')">Отзыв</div>
  </div>
</div>
```

## Связанные экраны
- `my-devices.html` (1_01_10) — экран моих устройств
