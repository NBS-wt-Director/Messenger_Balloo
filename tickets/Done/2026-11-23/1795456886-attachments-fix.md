# 1795456886 — Вложения: файлы не прикрепляются/не отображаются, нет текстовых вложений

**Создан:** 23.11.2026
**Источник запроса:** владелец (чат 23.11.2026): «надо починить вложения. файлы не прикрепляются, не отображаются. текстовых вложений ни форм, ни рендеренга.»
**Статус:** ВЫПОЛНЕНО (код) — требуется браузерная приёмка владельца
**Тип:** правка кода + тесты + прод-проверка
**Макеты:** `mockups/balloo-su/chats.html:244-255` (collapsible-вложения в пузыре), `mockups/balloo-su/attachment-panel.html`, `mockups/balloo-su/attachment-panel.md:14-17`, `mockups/balloo-su/file-viewer.html`, `mockups/balloo-su/chat-attachments.html`

---

## 1. Корневые причины (подтверждено чтением)

| № | Причина | Где |
|---|---|---|
| R1 | **Контракт вложений не совпадает.** Сервер отдаёт `attachments` (**массив**), клиент читает `message.attachment` (**один объект**) → вложение всегда `undefined` | сервер: `packages/server/src/services/messageService.ts:181-191`, `:362-372`; `packages/server/src/ws/handlers.ts:211-220`. Клиент: `packages/web/src/store/chatStore.ts:50-58`, `packages/web/src/components/chat/MessageBubble.tsx:127-144` |
| R2 | **Полноэкранный просмотрщик не подключён.** `MessageBubble` объявляет `onFileView` (`:21`), но `MessageListVirtual` его не принимает/не прокидывает, а `ChatViewScreen` не рендерит `<FileViewer>` вовсе | `packages/web/src/components/chat/MessageListVirtual.tsx:11-19,70-79`; `packages/web/src/screens/chat/ChatViewScreen.tsx` (нет `FileViewer`); `packages/web/src/components/chat/FileViewer.tsx` (файл есть, вызовов нет) |
| R3 | **Изображения не рендерятся** — статичная заглушка «🖼 Изображение» без `<img src>` | `packages/web/src/components/chat/MessageBubble.tsx:107-125` |
| R4 | **Тип сообщения всегда `file`** — картинка/видео/аудио тоже уходят как `file` | `packages/web/src/components/chat/AttachmentPanel.tsx:117` |
| R5 | **Нет рендера вложений-файлов и текстовых вложений** по макету: collapsible-блок `message__attachments` («📎 N вложений») не реализован; текстовое содержимое нигде не показывается | макет `mockups/balloo-su/chats.html:244-255`, CSS `mockups/assets/common.css:667-700`; в коде `grep "message__attachments" packages/` → нет |
| R6 | **Нет формы текстового вложения** — панель принимает только `FileList`; быстрые действия «Документ» фильтруют только pdf/doc/xls (нет txt/md/csv/json/log) | `packages/web/src/components/chat/AttachmentPanel.tsx:41-49` |

## 2. Что делаем

1. Тип `attachments: MessageAttachment[]` в `chatStore.MessageWithSender` (+ legacy `attachment` для совместимости).
2. `MessageBubble`: рендер массива вложений — изображение `<img>`, видео/аудио — плеер, файл — карточка; collapsible-блок «📎 N вложений» по макету; текстовое вложение — превью.
3. `MessageListVirtual` + `ChatViewScreen`: прокинуть `onFileView` и подключить `<FileViewer>`.
4. `AttachmentPanel`: тип сообщения по первому вложению (image/video/audio/file), расширить приём текстовых форматов.
5. `FileViewer`: для `text/*` показывать содержимое (превью), не только «Скачать».

## 3. Проверки (к запуску)

- [x] `pnpm --filter @balloo/web exec tsc --noEmit` → `WEB_TSC=0`
- [x] `pnpm --filter @balloo/web test` → **403 passed / 54 files**, `WEB_TEST=0` (добавлены/обновлены тесты `MessageBubble`, `AttachmentPanel`, `FileViewer`)
- [x] `pnpm --filter @balloo/web build` → `WEB_BUILD=0` (`index-CjkgL9oF.js`, `ChatViewScreen-DA3TMhwT.js`)
- [ ] Прод-приёмка владельца: прикрепить файл/картинку → видно в пузыре → открывается просмотрщик (после деплоя; строка A18 в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`)

## 4. Требует уточнения владельца

- «Форма текстового вложения»: имеется ли в виду (а) приём `.txt/.md/.csv` через панель, (б) ввод текста и отправка его как вложения-файла, (в) что-то ещё. Сейчас делаем (а) + рендер; (б) — по отдельному решению.

## 5. Что сделано (файлы)

| Файл | Правка |
|---|---|
| `packages/web/src/store/chatStore.ts` | тип `MessageAttachment[]` в `MessageWithSender`, legacy `attachment` помечен `@deprecated` |
| `packages/web/src/components/chat/MessageBubble.tsx` | `resolveAttachments()` (массив + legacy), рендер img/video/audio/карточка, collapsible «📎 N вложений», иконки |
| `packages/web/src/components/chat/MessageListVirtual.tsx` | прокинут проп `onFileView` |
| `packages/web/src/screens/chat/ChatViewScreen.tsx` | состояние `viewer`, `handleFileView`, рендер `<FileViewer>` |
| `packages/web/src/components/chat/AttachmentPanel.tsx` | тип сообщения по вложению (image/video/voice/file), приём текстовых форматов |
| `packages/web/src/components/chat/FileViewer.tsx` | превью содержимого `text/*` (fetch + `<pre>`) |
| `packages/web/src/styles/chat.css` | стили `.message__attachment-file*`, `.message__attachment-thumb--file` |

## 6. Результат (прогон 23.11.2026)

```
pnpm --filter @balloo/web exec tsc --noEmit      → WEB_TSC=0
pnpm --filter @balloo/web test                   → Test Files 54 passed (54); Tests 403 passed (403); WEB_TEST=0
pnpm --filter @balloo/web build                  → ✓ built in 8.00s; index-CjkgL9oF.js; WEB_BUILD=0
pnpm --filter @balloo/ui exec tsc --noEmit       → UI_TSC=0
pnpm --filter @balloo/shared exec tsc --noEmit   → SHARED_TSC=0
```

Исправлена собственная ошибка теста: ожидание `'2.0 КБ'` не совпадало с
`formatBytes` (для 2048 б даёт `'2 КБ'`) → тест приведён к факту.

## 7. Полный префлайт монорепо (24.11.2026)

Правки затрагивают `shared`/`ui`/`web` → проверен весь монорепо:

```
pnpm test    → MONO_TEST=0   (shared 76/4, server 805/54, web 403/54, web-admin 36/4)
pnpm build   → MONO_BUILD=0  (tsc + vite по всем пакетам)
check-i18n   → 0 расхождений; I18N=0
```
