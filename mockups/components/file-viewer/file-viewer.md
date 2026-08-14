# Компонент: File Viewer — Просмотр файла

## Описание
Компонент просмотра файлов и изображений. Поддерживает изображения, документы, PDF и другие форматы. Отображает превью, метаданные файла и действия (скачать, поделиться, закрыть).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `file` | `FileInfo` | Информация о файле | — |
| `onClose` | `() => void` | Callback при закрытии | — |
| `onDownload` | `() => void` | Callback при скачивании | — |
| `onShare` | `() => void` | Callback при шеринге | — |
| `fullscreen` | `boolean` | Полноэкранный режим | `false` |

## Сущность FileInfo

```typescript
interface FileInfo {
  name: string;
  size: number;          // bytes
  mimeType: string;
  url: string;
  width?: number;        // для изображений
  height?: number;       // для изображений
  uploadedAt: bigint;    // Unix timestamp
}
```

## События

| Событие | Описание |
|---|---|
| `fileClose` | Файл закрыт |
| `fileDownload` | Скачивание начато |
| `fileShare` | Шеринг открыт |
| `fileFullscreen` | Полноэкранный режим |

## Визуальные элементы

- **Хедер** — название файла, размер, кнопки действий
- **Превью** — область 300px+ для отображения контента
- **Метаданные** — тип, размер, размеры (для изображений)
- **Футер** — кнопки действий

## Стилизация

Использует дизайн-систему из `common.css`:
- Glassmorphism для оверлея
- CSS-переменные для всех цветов
- Прямые углы

## Пример использования

```html
<div class="file-viewer">
  <div class="file-viewer__header">
    <div>
      <span class="file-viewer__name">photo.jpg</span>
      <span class="file-viewer__size">2.4 MB</span>
    </div>
    <div class="file-viewer__actions">
      <button class="file-viewer__action-btn" onclick="onDownload()">⬇</button>
      <button class="file-viewer__action-btn" onclick="onShare()">↗</button>
      <button class="file-viewer__action-btn" onclick="onClose()">✕</button>
    </div>
  </div>
  <div class="file-viewer__preview file-viewer__preview--image"></div>
  <div class="file-viewer__info">
    <span>1920 × 1080</span><span>JPEG</span><span>2.4 MB</span>
  </div>
</div>
```

## Связанные экраны
- `file-viewer.html` (1_01_06) — экран просмотра файла
