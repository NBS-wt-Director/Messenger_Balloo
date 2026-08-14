# Компонент: Stories — Сторис

## Описание
Компонент сторис: панель с аватарками пользователей (с кольцом просмотра) и полноэкранный просмотрщик с прогресс-барами, навигацией и полем ответов.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `stories` | `StoryItem[]` | Список сторис | `[]` |
| `myStory` | `StoryItem \| null` | Моя история | `null` |
| `viewerOpen` | `boolean` | Открыт ли просмотрщик | `false` |
| `onCreate` | `() => void` | Создать сторис | — |
| `onView` | `(storyId: string) => void` | Открыть просмотр | — |
| `onClose` | `() => void` | Закрыть просмотрщик | — |

## Сущность StoryItem

```typescript
interface StoryItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  viewed: boolean;
  createdAt: bigint;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration?: number;  // seconds
}
```

## События

| Событие | Описание |
|---|---|
| `storyCreate` | Создание сторис |
| `storyView` | Просмотр начат |
| `storyClose` | Просмотр закрыт |
| `storyReply` | Ответ на сторис |

## Визуальные элементы

- **Кольцо** — `--octagon-clip-stories` (диагональные стороны в 3 раза короче), 64×64px
- **Непрочитано** — зелёное кольцо `--accent`
- **Прочитано** — полупрозрачное, `opacity: 0.5`
- **Прогресс** — полоски 2px, анимация 5 секунд
- **Просмотрщик** — полноэкранный оверлей с тёмным фоном

## Стилизация

Использует дизайн-систему из `common.css`:
- `--octagon-clip-stories` для сторис
- CSS-переменные

## Пример использования

```html
<div class="stories-bar">
  <div class="story-item" onclick="onCreate()">
    <div class="story-item__add">+</div>
    <div class="story-item__name">Ваша история</div>
  </div>
  <div class="story-item" onclick="onView('s1')">
    <div class="story-item__ring story-item__ring--border">
      <div class="story-item__avatar" style="background:var(--accent);color:#fff;">ИИ</div>
    </div>
    <div class="story-item__name">Иван</div>
  </div>
</div>
```

## Связанные экраны
- `stories.html` (1_01_16) — экран сторис
