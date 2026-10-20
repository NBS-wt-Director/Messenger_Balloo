# Тикет 1792311347 — Mobile: EmptyChatScreen — уточнить функционал

**Создан:** 18.10.2026 (unix 1792311347)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
EmptyChatScreen — UI-заглушка без API. Проверить нужен ли API (маскот Балунишка, кнопка "Начать чат").

## Живое состояние
- Файл: `packages/mobile-android/src/screens/EmptyChatScreen.tsx` (22 строки)
- Текущий код: только Text и View, нет кнопок, нет API
- API из web: `grep "api\.\w\+" packages/web/src/components/chat/EmptyChatState.tsx`

## Подзадачи
- [x] 1. Web `EmptyChatState.tsx` прочитан: `api.get('/api/users/contacts')` там нужен
      только для блока «последние контакты»; в мобильном макете этого блока нет
- [x] 2. API экрану не требуется; добавлены переходы действий по макету
- [x] 3. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- UI корректный
- build зелёный

## Проблемы и решения

Экран приведён к макету `mockups/mobile/empty-chat.md` (строки 21-29): было только
«💬 Начните переписку», стало «Чат пуст» + подсказка + три действия
(📎 файл → ChatAttachments, 🎤 голосовое → VoiceRecord, 📊 опрос → PollEditor)
+ карточка «Совет». Переходы идут в уже зарегистрированные экраны роутера.

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ cd packages/mobile-android && ./node_modules/.bin/tsc --noEmit --pretty false
0 ошибок (до правок в пакете — 77 строк ошибок)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)

$ pnpm --filter @balloo/desktop build
✓ built (tsc && vite build)

$ python3 scripts/api-endpoints-check.py
Клиентских путей: 184 / Серверных маршрутов: 250 / НЕ СОВПАДАЕТ: 18 (группа B, ждёт владельца)
```

Не проверялось: реальный прогон экранов в браузере/эмуляторе (нет запущенного
бэкенда с БД и нет Android-устройства на этой машине) — см. AGENTS.md §1.
