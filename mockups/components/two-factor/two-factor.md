# Компонент: Two Factor — Двухфакторная аутентификация

## Описание
Компонент двухфакторной аутентификации: ввод 6-значного кода из приложения-аутентификатора, настройка 2FA с QR-кодом, резервные коды.

## Props / Атрибуте

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `mode` | `'verify' \| 'setup'` | Режим: проверка или настройка | `'verify'` |
| `codeLength` | `number` | Длина кода | `6` |
| `onVerify` | `(code: string) => void` | Проверка кода | — |
| `onSetup` | `(qrCode: string) => void` | Настройка 2FA | — |
| `onCancel` | `() => void` | Отмена | — |

## Сущность TwoFactorState

```typescript
interface TwoFactorState {
  mode: 'verify' | 'setup';
  code: string[];
  qrCode?: string;
  backupCodes: string[];
  resendCooldown: number; // seconds
}
```

## События

| Событие | Описание |
|---|---|
| `codeVerify` | Код проверен |
| `codeResend` | Запрошена повторная отправка |
| `twoFactorSetup` | 2FA настроена |
| `twoFactorDisable` | 2FA отключена |

## Визуальные элементы

- **Иконка** — октагон 64×64px, зелёный фон
- **Код-инпуты** — 6 инпутов по 48×56px, 1 цифра каждый
- **Резервные коды** — моноширинный шрифт, формат XXXX-XXXX-XXXX
- **Таймер** — обратный отсчёт для повторной отправки

## Стилизация

Использует дизайн-систему из `common.css`:
- `--octagon-clip` для иконки
- CSS-переменные для цветов
- Прямые углы

## Пример использования

```html
<div class="two-factor__code-inputs">
  <input class="two-factor__code-input" maxlength="1">
  <input class="two-factor__code-input" maxlength="1">
  <input class="two-factor__code-input" maxlength="1">
  <input class="two-factor__code-input" maxlength="1">
  <input class="two-factor__code-input" maxlength="1">
  <input class="two-factor__code-input" maxlength="1">
</div>
<div class="two-factor__resend">
  Повторная отправка через <strong>30</strong> сек
</div>
```

## Связанные экраны
- `two-factor.html` (1_01_18) — экран двухфакторной аутентификации
