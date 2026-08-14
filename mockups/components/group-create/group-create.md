# Компонент: Group Create — Создание группы

## Описание
Компонент формы создания группы. Содержит поля для названия, описания, загрузки аватара, выбора участников из списка и настроек прав.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `onCreate` | `(data: GroupData) => void` | Callback при создании | — |
| `onCancel` | `() => void` | Callback при отмене | — |
| `availableMembers` | `User[]` | Доступные участники для выбора | `[]` |
| `selectedMembers` | `string[]` | ID выбранных участников | `[]` |

## Сущность GroupData

```typescript
interface GroupData {
  name: string;
  description?: string;
  avatarUrl?: string;
  members: string[];  // userId[]
  adminOnly: boolean;
}
```

## События

| Событие | Описание |
|---|---|
| `groupCreated` | Группа создана |
| `groupCancel` | Создание отменено |
| `memberToggle` | Изменён список участников |

## Визуальные элементы

- **Аватар** — загрузка через октагон 72×72px, пунктирная рамка
- **Чипсы участников** — `--bg-tertiary`, с кнопкой удаления
- **Список участников** — строки с чекбоксами, выделение `--accent`
- **Чекбокс** — админ-права

## Стилизация

Использует дизайн-систему из `common.css`:
- Прямые углы, без border-radius
- CSS-переменные для всех цветов

## Пример использования

```html
<div class="group-create-form">
  <div class="avatar-upload">📷</div>
  <input class="form-input" type="text" placeholder="Название группы">
  <textarea class="form-input" placeholder="Описание"></textarea>
  <div class="member-chips">
    <div class="member-chip">Иван Иванов <span class="remove">✕</span></div>
  </div>
  <div class="checkbox-row">
    <input type="checkbox" id="admin-only" checked>
    <label for="admin-only">Только админ может отправлять</label>
  </div>
  <button class="btn btn--primary btn--block" onclick="onCreate()">Создать группу</button>
</div>
```

## Связанные экраны
- `group-create.html` (1_01_07) — экран создания группы
