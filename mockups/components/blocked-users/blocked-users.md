# Компонент: Blocked Users — Заблокированные пользователи

## Описание
Компонент отображения и управления списком заблокированных пользователей. Позволяет просматривать список, видеть ID пользователя и разблокировать одним нажатием.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `blockedUsers` | `BlockedUser[]` | Массив заблокированных пользователей | `[]` |
| `onUnblock` | `(userId: string) => void` | Callback при разблокировке | — |
| `searchQuery` | `string` | Текущий запрос поиска | `''` |
| `onSearchChange` | `(query: string) => void` | Callback при изменении поиска | — |

## Сущность BlockedUser

```typescript
interface BlockedUser {
  id: string;           // cuid
  name: string;
  avatarUrl?: string;
  blockedAt: bigint;    // Unix timestamp
  reason?: string;
}
```

## События

| Событие | Описание |
|---|---|
| `userUnblocked` | Пользователь разблокирован |
| `searchChange` | Изменён запрос поиска |

## Визуальные элементы

- **Аватар** — октагон с чёрным фоном (`--ctx-blocked`), серый внутренний бордер (`--status-offline`)
- **Кнопка разблокировки** — контурная кнопка с цветом `--accent`
- **Пустое состояние** — центрированный текст `--text-muted`

## Стилизация

Использует дизайн-систему из `common.css`:
- Карточки с `--bg-tertiary` и `--border-color`
- Без скруглений (прямые углы)
- Аватарки — октагон с двойной рамкой

## Пример использования

```html
<div class="blocked-list">
  <div class="blocked-item">
    <div class="avatar avatar--md avatar--bordered avatar--status-offline avatar--ctx-blocked">
      <div class="avatar__inner"><span>МП</span></div>
    </div>
    <div class="blocked-item__info">
      <div class="blocked-item__name">Михаил П.</div>
      <div class="blocked-item__id">ID: clxxx123</div>
    </div>
    <div class="blocked-item__action" onclick="onUnblock('clxxx123')">Разблокировать</div>
  </div>
</div>
```

## Связанные экраны
- `blocked-users.html` (1_01_03) — экран заблокированных пользователей
