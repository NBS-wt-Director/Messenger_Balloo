# Компонент: Message Editor — Редактор сообщения

## Описание
Компонент редактора сообщений в области ввода. Содержит панель форматирования (bold, italic, code, link, strikethrough), поле ввода с поддержкой multiline, превью ответа и счётчик символов.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `value` | `string` | Текст сообщения | `''` |
| `replyTo` | `ReplyInfo \| null` | Информация об ответе | `null` |
| `maxChars` | `number` | Макс. количество символов | `1024` |
| `mode` | `'write' \| 'edit'` | Режим редактора | `'write'` |
| `onSend` | `(text: string) => void` | Отправка сообщения | — |
| `onCancel` | `() => void` | Отмена | — |
| `onInput` | `(text: string) => void` | Изменение текста | — |
| `onReplyRemove` | `() => void` | Удаление ответа | — |

## Сущность ReplyInfo

```typescript
interface ReplyInfo {
  messageId: string;
  authorName: string;
  preview: string;
}
```

## События

| Событие | Описание |
|---|---|
| `messageSend` | Сообщение отправлено |
| `messageCancel` | Редактирование отменено |
| `messageInput` | Введён символ |
| `replyRemove` | Ответ убран |

## Визуальные элементы

- **Панель форматирования** — 5 кнопок по 32px, цвета `--text-muted` → `--text-primary` при hover
- **Активное форматирование** — цвет `--accent`
- **Превью ответа** — левая рамка `--accent`, фон `--bg-tertiary`
- **Счётчик** — 11px, `--text-muted`
- **Поле ввода** — `--bg-tertiary`, фокус → `--accent`

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы
- CSS-переменные для цветов
- Input-area layout

## Пример использования

```html
<div class="message-editor">
  <div class="message-editor__reply">
    <span class="message-editor__reply-author">Иван:</span>
    <span>Привет!</span>
    <span style="margin-left:auto;cursor:pointer;">✕</span>
  </div>
  <div class="message-editor__toolbar">
    <button class="message-editor__toolbar-btn" title="Жирный"><strong>B</strong></button>
    <button class="message-editor__toolbar-btn" title="Курсив"><em>I</em></button>
    <button class="message-editor__toolbar-btn" title="Код">{ }</button>
  </div>
  <textarea class="message-editor__field" placeholder="Написать сообщение..."></textarea>
  <div class="message-editor__footer">
    <span class="message-editor__chars">0 / 1024</span>
    <button class="btn btn--primary btn--sm" onclick="onSend()">Отправить</button>
  </div>
</div>
```

## Связанные экраны
- `message-editor.html` (1_01_09) — экран редактора сообщения
