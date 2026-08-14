# Компонент: Notification Settings — Настройки уведомлений

## Описание
Компонент настроек уведомлений: переключатели для push-уведомлений, звука, вибрации, показа текста в push, выбор звука по умолчанию и настройка тихого часа.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `settings` | `NotifSettings` | Текущие настройки | — |
| `onChange` | `(settings: NotifSettings) => void` | Изменение настроек | — |

## Сущность NotifSettings

```typescript
interface NotifSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  soundType: 'default' | 'quiet' | 'loud';
  quietHours: { start: string; end: string }; // '23:00', '08:00'
}
```

## События

| Событие | Описание |
|---|---|
| `settingsChange` | Настройки изменены |

## Визуальные элементы

- **Switch** — компонент из common.css, без border-radius (скруглённый)
- **Селект** — `--bg-tertiary`, `--border-color`
- **Секции** — заголовок 12px uppercase `--text-muted`
- **Описание** — 12px, `--text-muted`

## Стилизация

Использует дизайн-систему из `common.css`:
- Switch из common.css
- CSS-переменные для цветов
- Прямые углы для всех кроме switch

## Пример использования

```html
<div class="notif-settings">
  <div class="notif-settings__section">
    <div class="notif-settings__section-title">Общие</div>
    <div class="notif-settings__row">
      <div>
        <div class="notif-settings__row-label">Уведомления</div>
        <div class="notif-settings__row-desc">Push-уведомления</div>
      </div>
      <label class="switch"><input type="checkbox" checked><span class="switch__slider"></span></label>
    </div>
  </div>
</div>
```

## Связанные экраны
- `notification-settings.html` (1_01_12) — экран настроек уведомлений
