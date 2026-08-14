# Компонент: Password Reset Desktop — Восстановление пароля (desktop)

## Описание
Компонент восстановления пароля для десктопных устройств: отображается в модальном окне с glassmorphism, 3 шага (email → код → новый пароль), индикатор сложности пароля.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `currentStep` | `number` | Текущий шаг (0-2) | `0` |
| `email` | `string` | Введённый email | `''` |
| `code` | `string[]` | Введённый код | `[]` |
| `password` | `string` | Новый пароль | `''` |
| `strength` | `'weak' \| 'medium' \| 'strong'` | Сложность пароля | — |
| `onNext` | `() => void` | Следующий шаг | — |
| `onBack` | `() => void` | Предыдущий шаг | — |
| `onReset` | `(password: string) => void` | Смена пароля | — |

## Стилизация

Использует дизайн-систему из `common.css`. Glassmorphism для модального окна.

## Пример использования

```html
<div class="password-reset-desktop">
  <div class="password-reset-desktop__title">Шаг 2: Код</div>
  <div class="password-reset-desktop__code-inputs">
    <input class="password-reset-desktop__code-input" maxlength="1">
    <input class="password-reset-desktop__code-input" maxlength="1">
    <input class="password-reset-desktop__code-input" maxlength="1">
    <input class="password-reset-desktop__code-input" maxlength="1">
    <input class="password-reset-desktop__code-input" maxlength="1">
    <input class="password-reset-desktop__code-input" maxlength="1">
  </div>
</div>
```

## Связанные экраны
- `password-reset-desktop.html` (1_09_03) — десктопное восстановление пароля
