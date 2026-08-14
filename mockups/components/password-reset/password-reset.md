# Компонент: Password Reset — Восстановление пароля

## Описание
Компонент многошагового восстановления пароля: 3 шага — ввод email/телефона, ввод кода подтверждения, установка нового пароля с индикатором сложности.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `currentStep` | `number` | Текущий шаг (0-2) | `0` |
| `onNext` | `() => void` | Переход к следующему шагу | — |
| `onBack` | `() => void` | Возврат на предыдущий шаг | — |
| `onReset` | `(password: string) => void` | Сброс пароля | — |

## Сущность ResetState

```typescript
interface ResetState {
  step: 0 | 1 | 2;
  email: string;
  code: string[];
  password: string;
  passwordConfirm: string;
  strength: 'weak' | 'medium' | 'strong';
}
```

## События

| Событие | Описание |
|---|---|
| `resetEmail` | Запрос на отправку кода |
| `resetCodeVerify` | Проверка кода |
| `resetPassword` | Смена пароля |
| `resetResend` | Повторная отправка кода |

## Визуальные элементы

- **Шаг 1** — поле email/телефон, кнопка отправки
- **Шаг 2** — 6 инпутов для кода (по 1 цифре), таймер повторной отправки
- **Шаг 3** — поля пароля, индикатор сложности (3 уровня: weak/medium/strong), кнопка смены

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы
- CSS-переменные
- Индикатор сложности — полоска 4px с цветовой кодировкой

## Пример использования

```html
<!-- Шаг 2: Код -->
<div class="password-reset">
  <div class="form-label">Код из письма</div>
  <div class="code-inputs">
    <input class="code-input" maxlength="1">
    <input class="code-input" maxlength="1">
    <input class="code-input" maxlength="1">
    <input class="code-input" maxlength="1">
    <input class="code-input" maxlength="1">
    <input class="code-input" maxlength="1">
  </div>
  <button class="btn btn--primary btn--block">Проверить</button>
</div>
```

## Связанные экраны
- `password-reset.html` (1_01_13) — экран восстановления пароля
