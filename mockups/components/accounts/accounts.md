# Компонент: Accounts — Мультиаккаунт

## Описание
Компонент управления множественными аккаунтами пользователя. Позволяет переключаться между аккаунтами, добавлять новые и удалять существующие. Отображается в topbar как переключатель и в виде полного списка в модальном окне или отдельном экране.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `accounts` | `Account[]` | Массив аккаунтов | `[]` |
| `currentAccountId` | `string` | ID текущего активного аккаунта | — |
| `maxAccounts` | `number` | Максимальное количество аккаунтов | `5` |
| `onSwitch` | `(accountId: string) => void` | Callback при переключении аккаунта | — |
| `onAdd` | `() => void` | Callback при добавлении аккаунта | — |
| `onRemove` | `(accountId: string) => void` | Callback при удалении аккаунта | — |

## Сущность Account

```typescript
interface Account {
  id: string;          // cuid
  name: string;
  phone: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'busy' | 'dnd';
  lastActive: bigint;  // Unix timestamp
}
```

## События

| Событие | Описание |
|---|---|
| `accountSwitch` | Аккаунт переключён |
| `accountAdd` | Запрошено добавление аккаунта |
| `accountRemove` | Запрошено удаление аккаунта |
| `accountEdit` | Запрошено редактирование аккаунта |

## Визуальные элементы

- **Аватарка** — октагон (`--octagon-clip`) с двойной рамкой (контекст + статус)
- **Кнопка добавления** — октагон зелёного цвета с символом `+`
- **Список** — карточки с фоном `--bg-tertiary`, активный аккаунт выделен рамкой `--accent`
- **Действия** — иконки редактирования (✏) и удаления (🗑)

## Стилизация

Использует дизайн-систему из `common.css`:
- CSS-переменные темы (--bg-primary, --accent и т.д.)
- Clip-path для аватарок и кнопки добавления
- Glassmorphism для модальных окон

## Пример использования

```html
<div class="accounts-switcher">
  <div class="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
    <div class="avatar__inner"><span>ИИ</span></div>
  </div>
  <div class="avatar avatar--sm avatar--bordered avatar--status-offline avatar--ctx-new">
    <div class="avatar__inner"><span>АК</span></div>
  </div>
  <div class="add-btn" onclick="onAdd()">+</div>
</div>
```

## Связанные экраны
- `accounts.html` (1_01_01) — экран мультиаккаунтов
