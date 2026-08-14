# Компонент: Feature Flags — Флаги фич

## Описание
Компонент управления feature flags: список фич с переключателями и индикаторами окружения (production, staging, dev).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `flags` | `FeatureFlag[]` | Список флагов | `[]` |
| `onToggle` | `(flagId: string, enabled: boolean) => void` | Переключение флага | — |

## Сущность FeatureFlag

```typescript
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  environments: {
    production: boolean;
    staging: boolean;
    development: boolean;
  };
}
```

## События

| Событие | Описание |
|---|---|
| `flagToggle` | Флаг переключён |

## Визуальные элементы

- **Строка** — `--bg-tertiary`, рамка `--border-color`
- **Switch** — из common.css
- **Окружение** — бейджи с цветовой кодировкой (зелёный/жёлтый/синий)

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="feature-flag-row">
  <div class="feature-flag-row__info">
    <div class="feature-flag-row__name">🤖 AI Chat</div>
    <div class="feature-flag-row__desc">AI-ассистент в чате</div>
    <div class="feature-flag-row__env feature-flag-row__env--staging">Staging: ВКЛ</div>
  </div>
  <label class="switch"><input type="checkbox" checked><span class="switch__slider"></span></label>
</div>
```

## Связанные экраны
- `features-flags.html` (1_02_04) — экран feature flags
