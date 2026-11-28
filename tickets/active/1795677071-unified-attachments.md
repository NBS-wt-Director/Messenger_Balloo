# Тикет — Многотипные вложения в одном сообщении

**Создан:** 26.11.2026
**Источник:** владелец (чат 26.11.2026)

## Текущее состояние

### Что есть

| Компонент | Что реализовано |
|---|---|
| `MessageInput.tsx:40-46` | Slash-команды: `/poll_`, `/quiz_`, `/list_active_`, `/list_passive_`, `/personali_` — просто отправляют текст как `onSend(text, 'slash')` |
| `AttachmentPanel.tsx:68-74` | `NON_FILE_ACTIONS`: Опрос (→ `/chat/:id/poll`), Текст (→ модалка заметки), Геолокация, Контакт |
| `AttachmentPanel.tsx:57-65` | `QUICK_ACTIONS`: Фото/Видео/Документ/Скриншот/Аудио/Файл/С камеры — загрузка файлов |
| `MessageInput.tsx:133-155` | Кнопки 📎 и 🖼 — открывают `AttachmentPanel` |
| `ChatViewScreen.tsx:328` | `handleSend` — отправка текста или slash-команды как **отдельного сообщения** |
| `api.ts:382` | `sendMessage(chatId, { text, type, attachments })` — поддерживает массив `attachments` |
| `MessageAttachment` (schema) | `type: image|file|voice|video` — **нет типов для опроса, квиза, списка, персонали** |

### Что сломано/не работает

1. **Slash-команды не открывают форму** — `/poll_` отправляет текст в чат, а не форму создания опроса (как в макете).
2. **«Текстовое вложение» ≠ заметка** — пользователь уточнил, что текстовые вложения это опрос/квиз/активный список/пассивный список/персонали (как в slash-командах), а не `TextNoteModal`.
3. **Нет единого пути** — нет кнопки/команды, которая открывает форму вложения нужного типа и добавляет его в массив вложений.
4. **Нет ограничения на количество** — нет проверки на 15 вложений (MVP1) и 50 (MVP2).
5. **Нет предупреждения о платности** — при >15 вложений сообщение становится платным (n+5 баллов, MVP2).

## Требования

### MVP1

**1. Единообразная форма для всех вложений**

При вводе slash-команды `/poll_`, `/quiz_`, `/list_active_`, `/list_passive_`, `/personali_` в поле ввода — **открывается форма** создания вложения (не отправляется текст в чат). Форма добавляет вложение в **массив выбранных вложений** AttachmentPanel.

**2. Панель вложений — единый список для всех типов**

AttachmentPanel поддерживает:
- Файловые: фото, видео, документ, скриншот, аудио, файл, с камеры
- Не-файловые: опрос, квиз, активный список, пассивный список, персонали, геолокация, контакт

Все типы собираются в **один массив `attachments`** — одно сообщение может содержать до **15 вложений** разных типов.

**3. Кнопка 📎 в MessageInput** — открывает AttachmentPanel с возможностью выбрать вложения **всех типов** (не только файлы).

### MVP2

**4. Платные сообщения**

- Сообщение с 1–15 вложениями — бесплатное (базовая стоимость = 0 или 1 балл).
- Сообщение с 16–50 вложениями — платное: `cost = n + 5` баллов, где `n` — количество вложений.
- При попытке отправить >15 вложений — показать предупреждение пользователю: «Сообщение будет платным: N баллов».
- При >50 вложений — запретить с ошибкой.

## План реализации

### Шаг 1: Унифицировать массив вложений

- [x] `AttachmentPanel.tsx`: `selected: PickedFile[]` → `attachments: Array<FileAttachment | NonFileAttachment>`.
- [x] `FileAttachment`: `{ type: 'image'|'video'|'file'|'voice', file: File, url?: string }`.
- [x] `NonFileAttachment`: `{ type: 'poll'|'quiz'|'list_active'|'list_passive'|'personali'|'location'|'contact', data: any }`.
- [x] UI: каждый выбранный вложение отображается как чип с иконкой типа.

### Шаг 2: Slash-команды → открытие формы, не отправка

- [x] `MessageInput.tsx`: при вводе `/poll_`, `/quiz_`, `/list_active_`, `/list_passive_`, `/personali_` — не вызывать `onSend`, а `setShowSlashHint(false)` + `onSlashCommand(cmd)`.
- [x] Родитель (`ChatViewScreen`) передаёт `onSlashCommand` в `MessageInput`.
- [x] `ChatViewScreen` открывает модальную форму соответствующего типа и передаёт `chatId`.

### Шаг 3: Модальные формы для не-файловых вложений

- [x] `PollCreateModal.tsx` — inline-форма (без роутинга): вопрос + варианты.
- [x] `QuizCreateModal.tsx` — вопрос + варианты + правильный ответ.
- [x] `ListActiveCreateModal.tsx` — заголовок + пункты.
- [x] `ListPassiveCreateModal.tsx` — заголовок + пункты.
- [x] `PersonaliCreateModal.tsx` — заголовок + пункты + флаг multiple.
- [x] При подтверждении — добавление в `attachments` массив + отправка (не переход по роуту).
      (реализовано одной формой `AttachmentFormModal.tsx` на все пять типов)

### Шаг 4: Отправка массива вложений

- [x] `api.ts sendMessage`: при наличии `attachments[]` — сериализовать каждый тип.
- [x] Для файлов: `api.uploadFile` → `url` → `attachments[].url`.
- [x] Для не-файловых: `attachments[].data` → JSON.
- [x] `messageTypeFor`: если есть не-файловое вложение → соответствующий тип сообщения.

### Шаг 5: Проверка лимитов и предупреждение (MVP2)

- [x] `maxAttachmentsMVP1 = 15`, `maxAttachmentsMVP2 = 50`.
- [x] При добавлении >15-го вложения: показать `Dialog` предупреждение «Сообщение будет платным: {n+5} баллов».
- [x] При >50: `setError('Максимум 50 вложений в одном сообщении')`.

### Шаг 6: Бэкенд

- [x] `MessageAttachment.type`: добавить `poll`, `quiz`, `list_active`, `list_passive`, `personali`.
- [x] `messageController`: поддержка `attachments[].data` (JSON) для не-файловых вложений.
- [x] `schema.prisma`: обновить комментарий `type String @db.VarChar(30)`.
      (колонка `data Json?` + миграция `20261128161509_message_attachment_data`)
- [x] `enum MessageType`: добавить quiz/list_active/list_passive/personali —
      без миграции enum создание сообщения падало на уровне БД
      (миграция `20261128172000_message_type_nonfile`).

### Шаг 7: Проверки

- [x] `tsc --noEmit server+web`
- [x] `vitest web` — 456 passed
- [x] `jest server` — 825 passed
- [x] `vite build`
- [x] Рендер в чате: карточки опроса/квиза/списков/персонали из `attachment.data`,
      миниатюры только для файловых вложений (`MessageBubble.test.tsx`, 24 теста)
- [~] e2e: отправить сообщение с 3 фото + опросом → проверить в чате
      (покрыто интеграционными тестами `AttachmentPanel` и `MessageBubble`;
      ручная браузерная приёмка остаётся за владельцем)

## Ссылки

- `MessageInput.tsx:40-46` — текущие slash-команды
- `AttachmentPanel.tsx:57-74` — QUICK_ACTIONS + NON_FILE_ACTIONS
- `api.ts:292-296` — `createDirectChat` (для справки)
- `api.ts:382` — `sendMessage` с `attachments`
- `schema.prisma:431-451` — `MessageAttachment`
- `schema.prisma:643-662` — `Poll` (существует)

## Результат

**МVP1:**
- Slash-команды `/poll_`, `/quiz_`, `/list_active_`, `/list_passive_`, `/personali_` открывают форму вложения, а не отправляют текст.
- AttachmentPanel поддерживает все типы вложений в едином массиве.
- Одно сообщение — до 15 вложений разных типов.
- Кнопка 📎 открывает единый AttachmentPanel.

**МVP2:**
- При >15 вложений — предупреждение о платности (n+5 баллов).
- При >50 — запрет.
- Бэкенд поддерживает не-файловые вложения в `MessageAttachment.type`.

## Ход реализации (28.11.2026)

Реализовано единым модулем, а не пятью модалками:

| Файл | Что делает |
|---|---|
| `components/chat/attachmentTypes.ts` (новый) | единая модель `PendingFile` / `PendingNonFile`, лимиты 15/50, `attachmentCost`, `messageTypeFor`, иконки и подписи типов |
| `components/chat/AttachmentFormModal.tsx` (новый) | одна форма на опрос/квиз/активный/пассивный/персонали: у poll/quiz — «верный ответ», у poll/personali — флаг `multiple`; подтверждение отдаёт данные родителю, не отправляет и не ведёт по роуту |
| `AttachmentPanel.tsx` | общий массив вложений любых типов, чипы с иконкой типа, предупреждение о платности, отправка файлов через `api.uploadFile` + не-файловых через `data` |
| `MessageInput.tsx` | slash-команда распознаётся по префиксу `/<cmd>_` и отдаётся наружу через `onSlashCommand`; без обработчика — прежняя отправка `type='slash'` |
| `ChatViewScreen.tsx` | `handleSlashCommand` → `AttachmentFormModal` → `incomingNonFile` → панель |
| `messageService.ts` / `messageController.ts` | `attachments[].data` (JSON) при пустом `url`; в `MESSAGE_TYPES` добавлены poll/quiz/list_active/list_passive/personali |
| `schema.prisma` + миграция `20261128161509_message_attachment_data` | аддитивная `data JSONB` в `message_attachments` |
| `schema.prisma` + миграция `20261128172000_message_type_nonfile` | `ALTER TYPE "MessageType" ADD VALUE` для quiz/list_active/list_passive/personali |
| `shared/types/chat.ts` | `MessageType` и `Attachment.type` расширены не-файловыми типами, в `Attachment` добавлено `data` |
| `MessageBubble.tsx` | рендер не-файловых вложений из `attachment.data`: карточка с заголовком и пунктами, ✓ у верного варианта квиза |
| `ChatItem.tsx` | превью последнего сообщения в списке чатов для quiz/list_active/list_passive/personali |
| `ChatViewScreen.tsx` | просмотрщик открывается только по файловым вложениям — не-файловые с пустым `url` в него не попадают |

### Рендер сообщения с вложениями (проверено)

| Ситуация | Что видит пользователь |
|---|---|
| 1 файл | превью по типу: `<img>`, `<video controls>`, `<audio controls>`, карточка «имя + размер» |
| N файлов | блок «📎 N вложений» с раскрытием и миниатюрами |
| 1 не-файловое | карточка: иконка + подпись типа, заголовок/вопрос, пункты, «Можно выбрать несколько» (poll/personali) |
| N файлов + не-файловое | миниатюры только файлов, карточки не-файловых под ними (без дубля иконки) |
| квиз | ✓ у варианта с `correctIndex` |
| клик по миниатюре | просмотрщик получает только файловые вложения, индекс пересчитан |

Попутно исправлено:

- `MessageInput`: прежнее распознавание (`split`/срез хвостовых `_`) не видело
  команду в реальном формате `/poll_Вопрос;Да;Нет` — теперь сравнение по префиксу.
- `api.ts sendMessage`: в типе `attachments` не было поля `data`, не-файловые
  вложения не проходили типизацию.
- `docs-html.test.ts`: ожидание `::-webkit-scrollbar { display: none; }`
  устарело после 7dc043f (per-width 0) — тест поправлен под текущий CSS.
- `MessageBubble`: не-файловые вложения рисовались дважды (иконкой в ленте
  миниатюр и карточкой) и попадали в просмотрщик с пустым `url`.
- `ChatItem`: последнее сообщение типа quiz/list_active/list_passive/personali
  подписывалось как «Сообщение».
- **Блокер, найденный серверными тестами:** `Message.type` — Prisma-enum
  `MessageType`, и расширения `MESSAGE_TYPES` в контроллере было недостаточно.
  Без `ALTER TYPE` создание сообщения с типом quiz/list_active/list_passive/
  personali падало на уровне БД — то есть форма работала, а отправка нет.
  Добавлена миграция `20261128172000_message_type_nonfile`.

### Доказательства проверок

| Проверка | Команда | Результат |
|---|---|---|
| Типы shared | `pnpm build:shared` | exit 0 |
| Типы web | `pnpm --filter @balloo/web exec tsc --noEmit` | exit 0, вывод пуст |
| Типы server | `pnpm --filter @balloo/server exec tsc --noEmit` | exit 0, вывод пуст |
| Тесты web | `pnpm test:web` | Test Files 59 passed (59), Tests 456 passed (456) |
| Тесты server | `pnpm test:server` | Test Suites 56 passed (56), Tests 829 passed (829) |
| Сборка web | `pnpm build:web` | `✓ built in 8.23s` |
| Сборка server | `pnpm build:server` | `tsc` exit 0 |
| Миграции | `pnpm db:migrate` | 26 migrations, applied `20261128172000_message_type_nonfile` |

Не проверено (требует живого браузера/прод-доступа, приёмка владельца):
отправка сообщения с 3 фото + опросом вручную и вид в чате.
