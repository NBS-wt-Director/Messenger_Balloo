# Компонент: Candidate Interview — Карточка кандидата

## Описание
Компонент карточки кандидата для портала сотрудников: информация о кандидате, стадия воронки, заметки интервьюера, кнопки принятия решения.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `candidate` | `Candidate` | Данные кандидата | — |
| `notes` | `string` | Заметки интервьюера | `''` |
| `onAccept` | `() => void` | Принять кандидата | — |
| `onReject` | `() => void` | Отклонить | — |
| `onReschedule` | `() => void` | Перенести интервью | — |

## Сущность Candidate

```typescript
interface Candidate {
  id: string;
  name: string;
  avatarUrl?: string;
  position: string;
  experience: string;
  salary: string;
  technologies: string[];
  interviewDate: bigint;
  stage: 'screening' | 'interview' | 'offer';
}
```

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="candidate-card">
  <div class="candidate-card__header">
    <div class="avatar avatar--lg"><div class="avatar__inner"><span>АП</span></div></div>
    <div>
      <div class="candidate-card__header__name">Анна Петрова</div>
      <div class="candidate-card__header__role">Frontend-разработчик</div>
    </div>
  </div>
</div>
```

## Связанные экраны
- `candidate-interview.html` (1_03_01) — экран кандидата
