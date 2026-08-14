# Компонент: Privacy Settings — Настройки приватности

## Описание
Компонент настроек приватности: управление видимостью номера телефона, даты рождения, ссылки, статуса, фотографии, а также настройками безопасности (2FA, запрос кода при входе).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `settings` | `PrivacySettings` | Текущие настройки | — |
| `onChange` | `(settings: PrivacySettings) => void` | Изменение настроек | — |

## Сущность PrivacySettings

```typescript
interface PrivacySettings {
  phoneVisible: 'nobody' | 'contacts' | 'all';
  birthdateVisible: 'self' | 'contacts' | 'all';
  linkVisible: 'all' | 'contacts';
  statusVisible: 'all' | 'contacts' | 'nobody';
  photoVisible: 'all' | 'contacts' | 'nobody';
  twoFactorEnabled: boolean;
  loginCodeRequired: boolean;
}
```

## События

| Событие | Описание |
|---|---|
| `settingsChange` | Настройки изменены |

## Визуальные элементы

- **Секции** — заголовок 12px uppercase, разделители `--border-color`
- **Селект** — `--bg-tertiary`, `--border-color`
- **Switch** — из common.css
- **Описание** — 12px, `--text-muted`

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы
- CSS-переменные
- Switch без border-radius

## Пример использования

```html
<div class="privacy-settings">
  <div class="privacy-settings__section">
    <div class="privacy-settings__section-title">Аккаунт</div>
    <div class="privacy-settings__row">
      <div>
        <div class="privacy-settings__row-label">Кто видит номер</div>
        <div class="privacy-settings__row-desc">Никто / Контакты / Все</div>
      </div>
      <select class="privacy-settings__select">
        <option>Никто</option>
        <option>Контакты</option>
        <option>Все</option>
      </select>
    </div>
  </div>
</div>
```

## Связанные экраны
- `privacy-settings.html` (1_01_14) — экран настроек приватности
