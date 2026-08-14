# Компонент: Two Factor Desktop — Двухфакторная аутентификация (desktop)

## Описание
Компонент двухфакторной аутентификации для десктопных устройств: отображается в модальном окне с glassmorphism, ввод 6-значного кода, резервные коды.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `mode` | `'verify' \| 'setup'` | Режим: проверка или настройка | `'verify'` |
| `code` | `string[]` | Введённый код | `[]` |
| `backupCodes` | `string[]` | Резервные коды | `[]` |
| `resendCooldown` | `number` | Таймер повторной отправки (сек) | `30` |
| `onVerify` | `(code: string) => void` | Проверка кода | — |
| `onCancel` | `() => void` | Отмена | — |

## Стилизация

Использует дизайн-систему из `common.css`. Glassmorphism для модального окна.

## Пример использования

```html
<div class="two-factor-desktop">
  <div class="two-factor-desktop__icon">🔐</div>
  <div class="two-factor-desktop__title">Двухфакторная аутентификация</div>
  <div class="two-factor-desktop__code-inputs">
    <input class="two-factor-desktop__code-input" maxlength="1">
    <input class="two-factor-desktop__code-input" maxlength="1">
    <input class="two-factor-desktop__code-input" maxlength="1">
    <input class="two-factor-desktop__code-input" maxlength="1">
    <input class="two-factor-desktop__code-input" maxlength="1">
    <input class="two-factor-desktop__code-input" maxlength="1">
  </div>
</div>
```

## Связанные экраны
- `two-factor-desktop.html` (1_09_04) — десктопная 2FA
