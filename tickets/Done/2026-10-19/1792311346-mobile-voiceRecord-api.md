# Тикет 1792311346 — Mobile: VoiceRecordScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311346)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API отправки голосового сообщения.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/VoiceRecordScreen.tsx`
- Текущий код: `setTimeout(() => navigation?.goBack?.(), 1500)` — фейковая отправка
- API из web: `grep "api.*uploadFile\|sendMessage.*voice" packages/web/src/components/chat/VoiceMessageModal.tsx`

## Подзадачи
- [x] 1. Эталон: `packages/web/src/components/chat/VoiceMessageModal.tsx:246` (`uploadFile` + `sendMessage`)
- [x] 2. Импорт `api`; в `mobile/services/api.ts` у `sendMessage` добавлено поле `attachments`
- [x] 3. `setTimeout(… goBack, 1500)` заменён на `uploadFile` → `sendMessage(type: 'voice', attachments: [{ type: 'audio', … }])`
- [x] 4. Состояние `sending` + инлайн-ошибка с возвратом в `preview`
- [x] 5. Типы mobile-пакета: 0 ошибок tsc (в файле также починены `Animated.timing`
      без `useNativeDriver` и `padding: '12px 20px'` в StyleSheet)

## Критерии готовности
- API-вызов вместо setTimeout
- loading state
- build зелёный

## Проблемы и решения

Ограничение, зафиксированное честно: `expo-av` (или иной модуль записи) в
зависимостях `@balloo/mobile-android` отсутствует, поэтому экран не пишет звук сам
— он принимает готовый файл через `route.params.recording` (`{ uri, duration, mimeType }`).
Если файла нет, при отправке показывается явное сообщение, а не имитация успеха.
Запись с микрофона — отдельная задача (нужна нативная зависимость + права).

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
