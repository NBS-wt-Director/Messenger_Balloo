# Тикет 1792160023 — Web: экран «Запись голосового» (1_01_39)

**Создан:** 16.10.2026 (unix 1792160023)
**Статус:** в работе
**Источник:** аудит → Н-27

## Цель

Создать React-компонент `VoiceMessageScreen` по макету `mockups/balloo-su/voice-message.html`.

## Живое состояние

- `packages/web/src/screens/voice-message/` — **ОТСУТСТВУЕТ**.
- `MessageBubble.tsx` содержит базовую логику голосовых сообщений (play/pause).
- Mobile-макет `mobile/voice-record.html` (1_08_23) — принят, но это мобильная версия.

## Подзадачи

- [x] 1. Прочитать `mockups/balloo-su/voice-message.html` и `voice-message.md`.
- [x] 2. Создать `packages/web/src/components/chat/VoiceMessageModal.tsx`.
- [x] 3. Подключить в ChatViewScreen (state + модалка + 🎤 в MessageInput).
- [x] 4. `vite build`.

**Команда проверки:**
```bash
cd packages/web && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Компонент создан, в роутере.
- `vite build` без ошибок.

## Проблемы и решения

_Заполняется по ходу._

## Результат

Компонент `VoiceMessageModal.tsx` создан в `packages/web/src/components/chat/`. 4 состояния (idle/recording/preview/sending), Web Audio API + MediaRecorder, waveform-визуализация, таймер, громкость, скорость воспроизведения, транскрипция. Подключён в ChatViewScreen через 🎤 кнопку в MessageInput.

```bash
pnpm --filter @balloo/web build → ✓ built in 7.58s (exit 0)
```
