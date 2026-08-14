# Компонент: Group Settings — Настройки группы

## Описание
Компонент настроек группы: отображение информации о группе, управление участниками, правами доступа, названием, описанием и ссылкой. Содержит зону действий с предупреждением (покинуть группу).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `group` | `GroupInfo` | Информация о группе | — |
| `onEditName` | `(name: string) => void` | Изменение названия | — |
| `onEditDesc` | `(desc: string) => void` | Изменение описания | — |
| `onAddMember` | `() => void` | Добавить участника | — |
| `onLeave` | `() => void` | Покинуть группу | — |
| `onDelete` | `() => void` | Удалить группу | — |

## Сущность GroupInfo

```typescript
interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  members: MemberInfo[];
  inviteLink?: string;
  adminOnly: boolean;
  createdAt: bigint;
}

interface MemberInfo {
  userId: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: bigint;
}
```

## События

| Событие | Описание |
|---|---|
| `groupEditName` | Название изменено |
| `groupEditDesc` | Описание изменено |
| `groupAddMember` | Запрошено добавление участника |
| `groupLeave` | Пользователь покинул группу |
| `groupDelete` | Группа удалена |

## Визуальные элементы

- **Хедер** — аватар lg, название 18px, количество участников
- **Секции** — заголовок 12px uppercase `--text-muted`, строки с лейблом и значением
- **Зона опасностей** — красная кнопка с рамкой

## Стилизация

Использует дизайн-систему из `common.css`:
- Секции разделены `--border-color`
- Прямые углы

## Пример использования

```html
<div class="group-settings">
  <div class="group-settings__header">
    <div class="avatar avatar--lg avatar--bordered">
      <div class="avatar__inner"><span>КТ</span></div>
    </div>
    <div class="group-settings__header__info">
      <div class="group-settings__header__name">Команда</div>
      <div class="group-settings__header__members">5 участников · 2 онлайн</div>
    </div>
  </div>
  <div class="group-settings__section">
    <div class="group-settings__section-title">Общие</div>
    <div class="group-settings__row">
      <span class="group-settings__row-label">Название</span>
      <span class="group-settings__row-value">Команда</span>
    </div>
  </div>
  <button class="group-settings__danger-btn">Покинуть группу</button>
</div>
```

## Связанные экраны
- `group-settings.html` (1_01_08) — экран настроек группы
