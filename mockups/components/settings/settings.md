# Компонент: Settings — Настройки приложения

## Описание
Компонент меню настроек приложения. Список разделов с иконками, названиями и стрелками навигации. Включает основной раздел настроек и опасную зону (выход).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `items` | `SettingsItem[]` | Элементы меню | — |
| `onNavigate` | `(key: string) => void` | Навигация в раздел | — |

## Сущность SettingsItem

```typescript
interface SettingsItem {
  key: string;
  icon: string;
  label: string;
  value?: string;  // дополнительное значение (язык, тема)
  danger?: boolean; // опасное действие
  divider?: boolean; // разделитель перед элементом
}
```

## События

| Событие | Описание |
|---|---|
| `navigate` | Навигация в раздел настроек |

## Визуальные элементы

- **Иконка** — 36×36px, `--bg-tertiary`, рамка `--border-color`
- **Название** — 15px, `--text-primary`
- **Значение** — 13px, `--text-secondary`
- **Стрелка** — 12px, `--text-muted`
- **Разделитель** — 1px `--border-color`
- **Опасные действия** — цвет `--danger`

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы
- CSS-переменные
- Hover-эффект через opacity

## Пример использования

```html
<div class="settings-menu">
  <div class="settings-menu__item" onclick="onNavigate('notifications')">
    <div class="settings-menu__icon">🔔</div>
    <div class="settings-menu__label">Уведомления</div>
    <div class="settings-menu__chevron">›</div>
  </div>
  <div class="settings-menu__item">
    <div class="settings-menu__icon">🔒</div>
    <div class="settings-menu__label">Приватность</div>
    <div class="settings-menu__chevron">›</div>
  </div>
</div>
```

## Связанные экраны
- `settings.html` (1_01_15) — экран настроек приложения
