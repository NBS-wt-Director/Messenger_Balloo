# Компонент: Media Viewer Desktop — Просмотр медиа (desktop)

## Описание
Компонент полноэкранного просмотра медиа для десктопных устройств: навигация стрелками, кнопки скачать/поделиться/закрыть, поле комментария.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `media` | `MediaItem[]` | Массив медиа | `[]` |
| `currentIndex` | `number` | Текущий индекс | `0` |
| `onClose` | `() => void` | Закрыть | — |
| `onNavigate` | `(index: number) => void` | Навигация | — |
| `onDownload` | `() => void` | Скачать | — |
| `onShare` | `() => void` | Поделиться | — |

## Стилизация

Использует дизайн-систему из `common.css`. Полноэкранный оверлей с полупрозрачным чёрным фоном.

## Пример использования

```html
<div class="media-viewer-desktop">
  <div class="media-viewer-desktop__header">
    <div class="media-viewer-desktop__back">← Назад</div>
    <div class="media-viewer-desktop__actions">
      <div class="media-viewer-desktop__action-btn">⬇</div>
      <div class="media-viewer-desktop__action-btn">↗</div>
      <div class="media-viewer-desktop__action-btn">✕</div>
    </div>
  </div>
  <div class="media-viewer-desktop__content">🖼</div>
</div>
```

## Связанные экраны
- `media-viewer-desktop.html` (1_09_01) — десктопный просмотрщик
