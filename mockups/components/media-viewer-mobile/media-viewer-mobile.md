# Компонент: Media Viewer Mobile — Просмотр медиа (mobile)

## Описание
Компонент полноэкранного просмотра медиа для мобильных устройств: фото/видео с навигацией, кнопками поделиться и действиями.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `media` | `MediaItem[]` | Массив медиа | `[]` |
| `currentIndex` | `number` | Текущий индекс | `0` |
| `onClose` | `() => void` | Закрыть просмотрщик | — |
| `onShare` | `() => void` | Поделиться | — |
| `onNavigate` | `(index: number) => void` | Навигация | — |

## Стилизация

Использует дизайн-систему из `common.css`. Полноэкранный оверлей с чёрным фоном.

## Пример использования

```html
<div class="media-viewer-mobile">
  <div class="media-viewer-mobile__header">
    <div class="media-viewer-mobile__back">←</div>
    <div class="media-viewer-mobile__count">1 / 5</div>
  </div>
  <div class="media-viewer-mobile__content">🖼</div>
</div>
```

## Связанные экраны
- `media-viewer-mobile.html` (1_08_02) — мобильный просмотрщик
