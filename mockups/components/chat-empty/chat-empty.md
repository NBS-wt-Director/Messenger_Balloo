# Компонент: Chat Empty — Пустой чат

## Описание
Компонент отображения пустого состояния чата. Показывает приветственное сообщение, анимацию и подсказку пользователю. Поддерживает разные сценарии: личный чат и группа.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `chatType` | `'private' \| 'group' \| 'channel'` | Тип чата | `'private'` |
| `chatName` | `string` | Название чата / имя контакта | — |
| `participantCount` | `number` | Количество участников (для групп) | — |
| `animationIcon` | `string` | Иконка-анимация | `'💬'` |
| `hint` | `string` | Подсказка внизу | `'Сообщения шифруются end-to-end'` |

## Сущность ChatState

```typescript
interface ChatState {
  isEmpty: boolean;
  chatType: 'private' | 'group' | 'channel';
  chatName: string;
  participantCount?: number;
}
```

## События

| Событие | Описание |
|---|---|
| `chatFirstMessage` | Пользователь начал первое сообщение |

## Визуальные элементы

- **Анимация** — 120×120px, октагон, фон `--bg-glass`, рамка `--border-color`, иконка 48px
- **Заголовок** — 18px, `--text-primary`, `font-weight: 700`
- **Подзаголовок** — 14px, `--text-secondary`, 2 строки
- **Подсказка** — 12px, `--text-muted`

## Стилизация

Использует дизайн-систему из `common.css`:
- `--octagon-clip` для анимации
- CSS-переменные тем
- Прямые углы

## Пример использования

```html
<div class="empty-chat-demo">
  <div class="empty-chat-demo__animation">💬</div>
  <div class="empty-chat-demo__title">Начните диалог</div>
  <div class="empty-chat-demo__subtitle">Это начало вашей истории сообщений.<br>Напишите первое сообщение!</div>
  <div class="empty-chat-demo__hint">Сообщения шифруются end-to-end</div>
</div>
```

## Связанные экраны
- `empty-chat.html` (1_01_05) — экран пустого чата
