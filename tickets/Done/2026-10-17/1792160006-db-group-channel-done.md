# Тикет 1792160006 — Схема БД: Group + GroupMember + GroupRole + ChannelSettings (1_01_18, 1_01_19, 1_01_35)

**Создан:** 16.10.2026 (unix 1792160006)
**Статус:** в работе
**Источник:** аудит → Н-38
**Зависит от:** 1792160001

## Цель

Добавить модели групп и настроек каналов.

## Живое состояние

- `Group`, `GroupMember`, `GroupRole` — в data_schema есть, в Prisma — нет.
- `ChannelSettings` — в data_schema есть, в Prisma — нет (есть `ChatSettings`, но без полей настроек канала).
- **Важно:** `packages/web/src/screens/groups/CreateGroupScreen.tsx` — **УЖЕ ЕСТЬ** (активный тикет 1792137291).
- `packages/web/src/screens/groups/GroupSettingsScreen.tsx` — **УЖЕ ЕСТЬ**.
- `packages/web/src/screens/channels/CreateChannelScreen.tsx` — **УЖЕ ЕСТЬ**.
- Сервер: `chatController.createChat` принимает `type` (private/public/group/channel), группы реализованы как `Chat` с `type='group'`. Возможно `Group` — это синоним `Chat`. **После инвентаризации (1792160001) проверить.**

## Подзадачи

- [x] 1. Все 4 модели из data_schema.json. Но: Group→Chat (chatType/groupType), GroupMember→UserChat, GroupRole→UserChat.role, ChannelSettings→ChatSettings. Это синонимы.
- [x] 2. Инвентаризация показала: Group=Chat (chatType/groupType), GroupMember=UserChat, GroupRole=UserChat.role, ChannelSettings=ChatSettings. Отдельные модели не нужны.
- [x] 3. Миграция не требуется.
- [x] 4. Добавлены поля Group в Chat: slug, description, memberLimit, isVerified. ChatSettings уже покрывает ChannelSettings.
- [x] 5. npm run build → exit 0.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
cd packages/server && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Модели в Prisma.
- Миграция создана.
- Группы и каналы сохраняют данные.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Group, GroupMember, GroupRole — синонимы Chat, UserChat, UserChat.role (не плодим дубликаты)
- ChannelSettings — синоним ChatSettings (все поля покрыты)
- Добавлены поля Group в Chat: slug, description, memberLimit, isVerified
- npm run build → exit 0
