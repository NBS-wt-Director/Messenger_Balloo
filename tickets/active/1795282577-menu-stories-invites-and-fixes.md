# Тикет 1795282577 — Кнопки «Истории»/«Приглашения» + фикс чатов, контактов и аватарок

**Создан:** 21.11.2026
**Статус:** в работе

## Запрос владельца

> в главной панели нужно создать кнопку на истории и приглашения. так же в правое меню
> перепроверь, соответствуют истории и приглашения макетам и тз
> так же нужно проверить почему не открываются чаты и нет никого в контактах и не загружаются аватарки

## Разбор причин (найдено в коде)

| Симптом | Причина | Файл |
|---|---|---|
| Чаты не открываются | `MainLayout` рендерит `<ChatList />` без `onChatSelect`; клик только пишет `activeChatId` в стор, но не делает `navigate('/chat/:id')`. `ChatViewScreen` читает `chatId` из URL → остаётся пустой экран | `packages/web/src/layouts/MainLayout.tsx`, `components/chat/ChatList.tsx` |
| Нет никого в контактах | `GET /api/users/contacts` затенён маршрутом `GET /api/users/:username` (объявлен выше) → отдаёт публичный профиль с username=`contacts` (404), клиент получает ошибку и рисует «Нет контактов» | `packages/server/src/routes/users.ts` |
| Не загружаются аватарки (в контактах) | `ContactsScreen` при наличии `avatarUrl` рисует пустой `<span>` и НЕ рисует `<img>` — аватар не отображается никогда | `packages/web/src/screens/contacts/ContactsScreen.tsx` |
| Не загружаются аватарки (загруженные) | URL аватаров = `${CDN_BASE_URL}/…` = `https://cdn.balloo.su` (502/403 — известный дефект, задача владельцу C1). Код не при чём | инфра |

## Шаги

- [x] 1. Topbar: проп `actions` (область `.topbar__actions`) в `@balloo/ui` + проброс в `AppTopbar`
- [x] 2. `MainLayout`: кнопки «📷 Истории» → `/stories` и «📨 Приглашения» → `/invites` в шапке
- [x] 3. `RightMenu`: пункты «Истории»/«Приглашения» в секции «Аккаунт» + ключи i18n
- [x] 4. Фикс открытия чата: `ChatList onChatSelect` → `navigate('/chat/' + id)`
- [x] 5. Фикс контактов: перенести `/contacts` выше `/:username` в `routes/users.ts`
- [x] 6. Фикс аватарок контактов: `<img>` в `ContactsScreen`
- [x] 7. Аудит историй/приглашений vs макеты и ТЗ (см. ниже)
- [x] 8. Тесты: серверный (контакты не затенены), web (ChatList onChatSelect)
- [x] 9. Проверка: `tsc --noEmit` (server, web, shared), `pnpm test:server`, `pnpm test:web`, `vite build`

## Аудит: приглашения

| Пункт | Макет `invites.md` | ТЗ `1795270823` | Реализация |
|---|---|---|---|
| Способ | email-приглашения | **ссылка `/join/:code`** | ссылка ✅ (по ТЗ) |
| Табы | 2 («Мои»/«Создать») | +3-я «Я присоединил к Balloo» | 3 таба ✅ (по ТЗ) |
| Выбор групп | GroupCombobox (multi-select) | список групп | чекбокс-список ⚠️ (не combobox) |
| Галочка «в контакты» | — | обязательна | есть ✅ |
| Текст приглашения | — | обязателен | есть ✅ |
| Модалка ✏ в шапке | есть | — | нет ⚠️ |

**Вывод:** по ТЗ реализация соответствует (ссылка, 3 таба, контакты, текст).
Отличия от старого макета ожидаемы — ТЗ заменило email-флоу на ссылки.
Остаточные расхождения: комбобокс групп (сейчас чекбоксы) и модалка быстрого создания.

## Аудит: истории

| Пункт | Макет `stories.md` | Реализация |
|---|---|---|
| Трей `StoriesTray` над списком чатов | обязателен | **нет** (только отдельный экран `/stories`) |
| Октагон `--octagon-clip-stories` | обязателен | не подтверждено |
| Полноэкранный `StoryViewer` (прогресс, свайп) | обязателен | частично (inline в `StoriesScreen`) |
| Создание `story-create` | есть | есть (`StoryCreateScreen`) |

**Вывод:** истории НЕ соответствуют макету: нет трея над списком чатов и
полноэкранного просмотрщика как отдельного компонента. Отдельный экран `/stories`
+ кнопка в шапке — минимальный доступ; полноценный трей — отдельная задача.

## Выполнено

- `packages/ui/src/components/Topbar.tsx` — проп `actions` → `.topbar__actions`
- `packages/web/src/components/chrome/AppTopbar.tsx` — проброс `actions`
- `packages/web/src/layouts/MainLayout.tsx` — кнопки Истории/Приглашения + `ChatList onChatSelect`
- `packages/web/src/components/sidebar/Sidebar.tsx` — пункты «Истории»/«Приглашения»
  в левой навигации (вставка «Админки» — по `findIndex`, не по числу)
- `packages/ui/src/components/ecosystem.ts`, `RightMenu.tsx` — пункты «Истории»/«Приглашения»
- `packages/shared/src/i18n/translations.ts` — ключи `menu.stories`, `menu.invites`
- `packages/server/src/routes/users.ts` — `/contacts` объявлены выше `/:username`
- `packages/web/src/screens/contacts/ContactsScreen.tsx` — `<img>` для аватарок
- Тесты: `users.test.ts` (+3), `ChatList.test.tsx` (+1)

### Доказательства

```
tsc --noEmit (shared, ui, web, server) — exit 0
node scripts/check-i18n.cjs → словарь 130 = TranslationKey 130, расхождений 0
web:  Test Files 44 passed, Tests 333 passed
server: 52 passed / 1 flaky (features.test.ts) — в изоляции 22/22; ws-room.test.ts
        в изоляции 25/25 (полный прогон роняет их по контеншну тестовой БД — KODA.md)
vite build (web) — ✓ built in 8.20s
```

### Деплой

- Запушено: `adcffe3..a480a62` (5 коммитов), ветка `main`.
- Миграций нет: `packages/shared/prisma` не менялся (схема без дрейфа 22/22).
- Батчи D–H для сервера выданы владельцу (SSH у ассистента нет).
- Статус: **ждёт выполнения батчей владельцем**.
