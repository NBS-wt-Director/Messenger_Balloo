# Компонент: Attachment Panel — Панель вложений

## Описание
Компонент панели вложений, отображаемой в области ввода сообщений. Содержит сетку иконок для выбора типа вложения: фото, видео, файлы, геолокация, контакты, опросы, аудио, голосовые сообщения.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `visible` | `boolean` | Видимость панели | `false` |
| `onSelect` | `(type: AttachmentType) => void` | Callback при выборе типа вложения | — |
| `onClose` | `() => void` | Callback при закрытии | — |
| `chatType` | `'private' \| 'group' \| 'channel'` | Тип чата (влияет на доступные вложения) | `'private'` |

## Типы вложений

```typescript
type AttachmentType =
  | 'photo'
  | 'video'
  | 'file'
  | 'location'
  | 'contact'
  | 'poll'
  | 'audio'
  | 'voice';
```

## События

| Событие | Описание |
|---|---|
| `attachmentSelect` | Выбран тип вложения |
| `attachmentClose` | Панель закрыта |

## Визуальные элементы

- **Сетка 4 колонки** — CSS Grid, 4 равные колонки
- **Иконки** — 44×44px, фон `--bg-tertiary`, рамка `--border-color`
- **Фото/Видео** — занимают 2 колонки (`grid-column: span 2`), зелёный фон
- **Метка** — 11px, цвет `--text-secondary`

## Стилизация

Использует дизайн-систему из `common.css`:
- Glassmorphism для фона панели
- CSS-переменные для цветов
- Hover-эффекты через `--bg-hover`

## Пример использования

```html
<div class="attachment-panel" id="attachment-panel">
  <div class="attachment-panel__grid">
    <div class="attachment-panel__item attachment-panel__photo" onclick="onSelect('photo')">
      <div class="attachment-panel__icon">📷</div>
      <div class="attachment-panel__label">Фото</div>
    </div>
    <!-- ... остальные items ... -->
  </div>
</div>
```

## Связанные экраны
- `attachment-panel.html` (1_01_02) — экран панели вложений
