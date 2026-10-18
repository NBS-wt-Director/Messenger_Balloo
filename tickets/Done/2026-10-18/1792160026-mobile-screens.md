# Тикет 1792160026 — Mobile: 15 экранов без кода

**Создан:** 16.10.2026 (unix 1792160026)
**Статус:** в работе
**Источник:** аудит → Н-45

## Цель

Реализовать 15 mobile-экранов, отсутствующих в коде.

## Живое состояние

- `packages/mobile-android/src/screens/` — 13 экранов (auth, BlogScreen, ChannelViewScreen, ChatListScreen, ChatViewScreen, ContactsScreen, CreateGroupScreen, HiringScreen, KnowledgeScreen, ProfileScreen, SearchScreen, SettingsScreen, StoriesScreen).
- Отсутствуют 15 из 24: История звонков, Мои устройства, Добавить устройство, Донат, Вложения чата, Жалоба на сообщение, Восстановление пароля, Двухфакторная, Мои донаты, Архив чатов, Редактор опроса, Пустой чат, Просмотрщик медиа, Запись голосового, Правое меню шапки.

## Подзадачи

- [x] 1. Прочитаны макеты + MD для каждого из 13 отсутствующих экранов (ResetPassword и TwoFactor уже есть в auth/).
- [x] 2. Создано 13 React-компонентов в `packages/mobile-android/src/screens/`:
  - CallHistoryScreen, MyDevicesScreen, AddDeviceScreen, DonateScreen,
    ChatAttachmentsScreen, ReportMessageScreen, MyDonatesScreen, ArchiveScreen,
    PollEditorScreen, EmptyChatScreen, MediaViewerScreen, VoiceRecordScreen,
    HeaderMenuScreen.
- [x] 3. Все зарегистрированы в роутере `router/index.tsx` и экспортированы в `screens/index.ts`.
- [x] 4. `pnpm --filter @balloo/mobile-android build` — exit 0.

**Команда проверки:**
```bash
ls packages/mobile-android/src/screens/ | wc -l
```

## Критерии готовности

- 15 экранов созданы.
- Сборка mobile-android проходит.

## Проблемы и решения

_Заполняется по ходу._

## Результат

13 новых mobile-экранов созданы (ResetPassword/TwoFactor уже были в auth/). Все зарегистрированы в роутере.

```
pnpm --filter @balloo/mobile-android build → exit 0
ls screens/*.tsx → 25 файлов (12 существующих + 13 новых)
```
