# Компонент: Bots Mgmt — Управление ботами

## Описание
Компонент административной таблицы ботов. Отображает список ботов с аватаром, статусом, количеством команд, датой создания и действиями (редактировать, удалить).

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `bots` | `Bot[]` | Список ботов | `[]` |
| `onAdd` | `() => void` | Добавить бота | — |
| `onEdit` | `(botId: string) => void` | Редактировать бота | — |
| `onDelete` | `(botId: string) => void` | Удалить бота | — |

## Сущность Bot

```typescript
interface Bot {
  id: string;
  name: string;
  avatarUrl?: string;
  status: 'online' | 'offline';
  commands: number;
  createdAt: bigint;
}
```

## События

| Событие | Описание |
|---|---|
| `botAdd` | Добавлен новый бот |
| `botEdit` | Запрошено редактирование |
| `botDelete` | Бот удалён |

## Визуальные элементы

- **Таблица** — заголовки uppercase 12px, строки с hover-эффектом
- **Статус** — бейджи с цветовой кодировкой
- **Аватар бота** — октагон 36×36px с эмодзи 🤖
- **Действия** — контурные кнопки

## Стилизация

Использует дизайн-систему из `common.css`:
- CSS-переменные
- Прямые углы
- Hover-эффекты

## Пример использования

```html
<table class="bots-table">
  <thead>
    <tr><th>Бот</th><th>Статус</th><th>Команды</th><th>Создан</th><th>Действия</th></tr>
  </thead>
  <tbody>
    <tr class="bots-table__row">
      <td><div class="bots-table__name">🤖 SupportBot</div></td>
      <td><span class="bots-table__status bots-table__status--online">Онлайн</span></td>
      <td>24</td>
      <td>12.01.2026</td>
      <td><div class="bots-table__actions"><button class="bots-table__action-btn">Ред.</button></div></td>
    </tr>
  </tbody>
</table>
```

## Связанные экраны
- `bots.html` (1_02_01) — экран управления ботами
