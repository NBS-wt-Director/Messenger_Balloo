# Компонент: Versions — Версии

## Описание
Компонент timeline истории версий: вертикальная линия с точками, номера версий, даты, описания и changelog.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `versions` | `Version[]` | Список версий | `[]` |
| `expandAll` | `boolean` | Развернуть все changelog | `false` |

## Сущность Version

```typescript
interface Version {
  version: string;
  date: bigint;
  description: string;
  changelog?: string[];
  archived?: boolean;
}
```

## Стилизация

Использует дизайн-систему из `common.css`. Timeline через `::before` псевдоэлемент.

## Пример использования

```html
<div class="versions-list">
  <div class="version-item">
    <div class="version-item__dot"></div>
    <div class="version-item__content">
      <div class="version-item__header">
        <span class="version-item__version">v2.4.0</span>
        <span class="version-item__date">23 июля 2026</span>
      </div>
      <div class="version-item__desc">Описание версии</div>
    </div>
  </div>
</div>
```

## Связанные экраны
- `version-list.html` (1_05_01) — экран истории версий
