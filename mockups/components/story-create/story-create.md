# Компонент: Story Create — Создание сторис

## Описание
Компонент создания сторис: превью с возможностью загрузки фото/видео, панель инструментов (текст, рисунок, стикер, фильтр, музыка) и кнопка камеры.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `media` | `MediaData \| null` | Загруженные медиа | `null` |
| `tools` | `StoryTool[]` | Доступные инструменты | — |
| `onPublish` | `(data: StoryData) => void` | Публикация | — |
| `onSaveDraft` | `(data: StoryData) => void` | Сохранить черновик | — |
| `onCancel` | `() => void` | Отмена | — |

## Сущность StoryData

```typescript
interface StoryData {
  media: { url: string; type: 'image' | 'video' };
  text?: string;
  stickers?: { emoji: string; x: number; y: number }[];
  filters?: string[];
  music?: { url: string; start: number; end: number };
}
```

## События

| Событие | Описание |
|---|---|
| `storyPublish` | Сторис опубликована |
| `storyDraft` | Черновик сохранён |
| `storyCancel` | Создание отменено |
| `cameraOpen` | Открыта камера |

## Визуальные элементы

- **Превью** — 360px высота, фон `--bg-tertiary`
- **Кнопка камеры** — октагон 44×44px, зелёный `--accent`
- **Инструменты** — иконки 36×36px
- **Кнопки** — `btn--primary`, `btn--secondary`

## Стилизация

Использует дизайн-систему из `common.css`:
- `--octagon-clip` для кнопки камеры
- CSS-переменные

## Пример использования

```html
<div class="story-create">
  <div class="story-create__preview">
    📷
    <div class="story-create__camera-btn" onclick="onCamera()">📷</div>
  </div>
  <div class="story-create__tools">
    <div class="story-create__tool-btn" title="Текст">T</div>
    <div class="story-create__tool-btn" title="Рисунок">✏</div>
    <div class="story-create__tool-btn" title="Стикер">😊</div>
  </div>
  <div class="story-create__footer">
    <button class="btn btn--secondary btn--sm">Черновик</button>
    <button class="btn btn--primary btn--sm" onclick="onPublish()">Опубликовать</button>
  </div>
</div>
```

## Связанные экраны
- `story-create.html` (1_01_17) — экран создания сторис
