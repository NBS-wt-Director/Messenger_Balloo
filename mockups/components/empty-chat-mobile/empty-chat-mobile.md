# Компонент: Empty Chat Mobile — Пустой чат (mobile)

## Описание
Компонент пустого состояния чата для мобильных устройств. Оптимизирован для экранов 375×812px.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `chatName` | `string` | Имя контакта | — |
| `chatType` | `'private' \| 'group'` | Тип чата | `'private'` |
| `animationIcon` | `string` | Иконка анимации | `'💬'` |

## Стилизация

Использует дизайн-систему из `common.css`. Адаптировано для мобильных экранов.

## Пример использования

```html
<div class="empty-chat-mobile">
  <div class="empty-chat-mobile__animation">💬</div>
  <div class="empty-chat-mobile__title">Начните диалог</div>
  <div class="empty-chat-mobile__subtitle">Напишите первое сообщение!</div>
</div>
```

## Связанные экраны
- `empty-chat-mobile.html` (1_08_01) — мобильный пустой чат
