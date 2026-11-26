# Тикет 1795560008 — Голосовое: понятная ошибка при enterprise policy

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026, скрин 2)

## Симптом

При попытке записи голосового — «⚠ Permission denied». Никаких запросов на микрофон браузер не показывает.

## Диагноз

Это НЕ баг кода. Скриншот владельца показывает нативное Chrome-уведомление:

> «Запись видео и аудио запрещена. Ваша организация запретила использовать камеру, микрофон и удалённый рабочий стол на этой странице. Чтобы начать запись, обратитесь к системному администратору.»

Это **Chrome Enterprise Policy** (`AudioCaptureAllowed = false`). Браузер мгновенно возвращает `NotAllowedError` из `getUserMedia`, не показывая prompt. `navigator.permissions.query({name:'microphone'})` тоже вернёт `denied`.

Что в коде (`VoiceMessageModal.tsx:169-172`):
```ts
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Нет доступа к микрофону';
  setError(message);
}
```
Сообщение «Permission denied» — оригинальный текст Chrome, непонятный пользователю.

## План

- [x] 1. `VoiceMessageModal.tsx:169-172`: различать `err.name`:
  - `NotAllowedError` → «Браузер запретил доступ к микрофону. Возможные причины: (а) политика организации (Chrome Enterprise Policy), (б) запрет в настройках сайта. Обратитесь к системному администратору или разрешите микрофон для balloо.su в `chrome://settings/content/microphone`.»
  - `NotFoundError` → «Микрофон не найден.»
  - `NotReadableError` → «Микрофон занят другим приложением.»
- [x] 2. Перед `getUserMedia` — `navigator.permissions.query({name:'microphone'})` и если `state === 'denied'` — сразу показать сообщение, не вызывая getUserMedia.
- [x] 3. Проверки: `tsc --noEmit web`, `vitest web`, `vite build`.

## Примечание

На проде (balloo.su) и на dev (localhost:5173) код идентичен. Если владелец видит это на localhost — проблема в групповой политике Chrome на его машине, не в коде.

## Результат

**Сделано (`VoiceMessageModal.tsx`):**
- перед `getUserMedia` — `navigator.permissions.query({name:'microphone'})`; если `denied` — сразу понятное сообщение (политика организации / настройки сайта) без вызова getUserMedia;
- `catch` различает `err.name`: `NotAllowedError`/`SecurityError` → политика организации или запрет сайта; `NotFoundError` → микрофон не найден; `NotReadableError` → занят другим приложением; `OverconstrainedError`; fallback на `err.message`.

**Проверено:** tsc web EXIT 0; vitest web 404 passed; vite build OK.

**Важно:** скриншот владельца — это Chrome Enterprise Policy (`AudioCaptureAllowed=false`), код тут ни при чём. Теперь пользователь увидит объяснение вместо «Permission denied».
