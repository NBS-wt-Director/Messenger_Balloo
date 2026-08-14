# Компонент: Channel Create — Создание канала

## Описание
Компонент формы создания канала. Содержит поля для названия, описания, выбора типа канала, загрузки аватара и настроек разрешений.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `onCreate` | `(data: ChannelData) => void` | Callback при создании | — |
| `onCancel` | `() => void` | Callback при отмене | — |
| `initialData` | `Partial<ChannelData>` | Предзаполненные данные | — |

## Сущность ChannelData

```typescript
interface ChannelData {
  name: string;
  description?: string;
  avatarUrl?: string;
  type: 'public' | 'private';
  allowComments: boolean;
}
```

## События

| Событие | Описание |
|---|---|
| `channelCreated` | Канал создан |
| `channelCancel` | Создание отменено |

## Визуальные элементы

- **Аватар** — загрузка через октагон 72×72px, пунктирная рамка `--border-strong`
- **Поля ввода** — `--bg-tertiary`, `--border-color`, фокус → `--accent`
- **Селект** — стилизованный select с опциями в тёмной теме
- **Чекбокс** — акцентный цвет `--accent`
- **Кнопка** — `btn--primary`, полная ширина

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы, без border-radius
- Glassmorphism не используется (форма на сплошном фоне)
- CSS-переменные для всех цветов

## Пример использования

```html
<div class="channel-create-form">
  <div class="avatar-upload" title="Загрузить аватар">📷</div>
  <input class="form-input" type="text" placeholder="Название канала">
  <textarea class="form-input" placeholder="Описание"></textarea>
  <select class="form-select">
    <option>Публичный</option>
    <option>Приватный</option>
  </select>
  <div class="checkbox-row">
    <input type="checkbox" id="allow-comments" checked>
    <label for="allow-comments">Разрешить комментарии</label>
  </div>
  <button class="btn btn--primary btn--block" onclick="onCreate()">Создать канал</button>
</div>
```

## Связанные экраны
- `channel-create.html` (1_01_04) — экран создания канала
