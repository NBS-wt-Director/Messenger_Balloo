# Компонент: Notification Settings Desktop — Настройки уведомлений (desktop)

## Описание
Компонент настроек уведомлений для десктопных устройств: отображается в модальном окне с glassmorphism, включает общие настройки, звук и тихий час с полями времени.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `settings` | `NotifSettingsDesktop` | Текущие настройки | — |
| `onChange` | `(settings: NotifSettingsDesktop) => void` | Изменение настроек | — |

## Сущность NotifSettingsDesktop

```typescript
interface NotifSettingsDesktop {
  pushEnabled: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
  quietHours: { start: string; end: string };
}
```

## Стилизация

Использует дизайн-систему из `common.css`. Glassmorphism для модального окна.

## Пример использования

```html
<div class="notif-settings-desktop">
  <div class="notif-settings-desktop__section">
    <div class="notif-settings-desktop__section-title">Общие</div>
    <div class="notif-settings-desktop__row">
      <div class="notif-settings-desktop__row-label">Push-уведомления</div>
      <label class="switch"><input type="checkbox" checked><span class="switch__slider"></span></label>
    </div>
  </div>
</div>
```

## Связанные экраны
- `notification-settings-desktop.html` (1_09_02) — десктопные уведомления
