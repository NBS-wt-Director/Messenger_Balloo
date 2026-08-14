# Компонент: Texts — Тексты (админ)

## Описание
Компонент административного управления локализацией: таблица текстовых ключей, языков и переводов.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `texts` | `TextEntry[]` | Список текстовых записей | `[]` |
| `onEdit` | `(key: string, lang: string) => void` | Редактировать перевод | — |

## Сущность TextEntry

```typescript
interface TextEntry {
  key: string;       // e.g. 'onboarding.welcome.title'
  lang: string;      // e.g. 'RU', 'EN', 'ZH'
  value: string;
  updatedAt: bigint;
}
```

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<table class="admin-texts__table">
  <thead><tr><th>Ключ</th><th>Язык</th><th>Текст</th></tr></thead>
  <tbody>
    <tr class="admin-texts__table__row">
      <td class="admin-texts__table__key">onboarding.welcome.title</td>
      <td><span class="admin-texts__table__lang">RU</span></td>
      <td>Добро пожаловать в Balloo!</td>
    </tr>
  </tbody>
</table>
```

## Связанные экраны
- `texts.html` (1_02_11) — экран текстов
