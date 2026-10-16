# Тикет 1792124253 — Панель вложений (приёмка 1.1.12 → 6.36)

**Создан:** 16.10.2026 (unix 1792124253)
**Статус:** готов
**Источник запроса:** приёмка владельца 1.1.12 (16.10.2026) + правило 21

## Цель

Реализовать панель вложений `1_01_40` (выезжающая панель справа, 400px:
drag&drop зона, быстрые действия, недавние файлы, множественный выбор, отправка)
по принятому макету `mockups/balloo-su/attachment-panel.html` и заданию
`mockups/balloo-su/attachment-panel.md`; подключить её в чате вместо заглушки.

## Живое состояние на момент создания (проверено командами)

- Заглушка: `packages/web/src/screens/chat/ChatViewScreen.tsx:297` —
  `onAttachments={() => {}}` (кнопка 📎 ничего не делает);
- Компонента панели в web нет: `grep -rln "AttachmentPanel" packages/web/src/` → пусто;
- Загрузка файлов ЕСТЬ: `packages/web/src/services/api.ts:309` — `uploadFile`;
  роут сервера `packages/server/src/routes/upload.ts` существует;
- Схема данных: таблица `attachments` в `mockups/data_schema.json` есть.

## Подзадачи

- [x] 1. Макет и задание прочитаны. Выяснено (по роутам сервера и
      `mockups/data_schema.json`): эндпоинта `GET /api/files/recent` и сущности
      квоты хранилища **нет** — секции «Недавние» и «Хранилище» не реализованы
      (рисовать mock-карточки с выдуманными файлами запрещено §0.1); записано
      в шапке компонента. Быстрое действие «Скриншот» в макете — фейковый
      toast; заменено на реальное поведение: вставка из буфера **Ctrl+V**
      (panel `onPaste`), подсказка на плитке.
- [x] 2. `packages/web/src/components/chat/AttachmentPanel.tsx`: slide-in
      справа 400px (top 56, transition right 0.3s, backdrop rgba(0,0,0,.3)
      z-400), drop-зона (dragover/accent, drop→выбор, клик→input multiple),
      быстрые действия 3×2 с реальными accept-фильтрами (accept проставляется
      императивно — иначе фильтр из предыдущего рендера), footer «Выбрано: N»
      + чипы (клик убирает) + «Очистить» + «➤ Отправить», Esc/✕ закрывают.
      Отправка: `api.uploadFile(file, chatId)` → `api.sendMessage(chatId,
      {type:'file', content:'', attachments:[…]})` — форма attachments
      сверена с `messageService.SendMessageInput`.
- [x] 3. Интеграция в `ChatViewScreen.tsx`: состояние `attachmentPanelOpen`;
      заглушка `onAttachments={() => {}}` (была строка 297) → toggle панели;
      `MessageInput` получил опциональный `onAttachClick` (📎 открывает панель,
      без пропа — прежнее поведение); `onSent` → `refreshMessages` (повторный
      `GET /api/chats/:id/messages`).
- [x] 4. Тесты `AttachmentPanel.test.tsx` — 8 тестов: рендер, выбор+чип-удаление,
      drop, очистка, полный цикл отправки (upload с chatId → sendMessage с
      attachments → onSent/onClose), ошибка загрузки, Esc, ✕.
      `pnpm --filter @balloo/web test` → **28 файлов зелёные**.
- [x] 5. `pnpm --filter @balloo/web build` → exit 0 («✓ built in 7.91s»).

## Проблемы и решения (если возникли)

1. **Latent-баг клиента:** `api.uploadFile(file)` не слал `chatId`, а
   `uploadController.uploadMessageFile` требует его (400). Метод переведён на
   `uploadFile(file, chatId)` (других потребителей старой сигнатуры не было —
   grep).
2. Первый `build` поймал два tsc-а, оба — следствия тикета 1792124254:
   пропущенный третий потребитель `getBlockedUsers` (`ContactsScreen`) и
   сужение `never` в модалке. Исправлены, build зелёный.

## Результат

Панель вложений работает end-to-end: 📎 в шапке и в поле ввода чата открывает
панель, файлы (выбор/drop/Ctrl+V) загружаются на `POST /api/upload/file` и
уходят сообщением с `attachments[]`; после отправки список сообщений
перезагружается с сервера.

Изменённые/новые файлы:
- `packages/web/src/components/chat/AttachmentPanel.tsx` (новый);
- `packages/web/src/screens/chat/ChatViewScreen.tsx`;
- `packages/web/src/components/chat/MessageInput.tsx` (проп `onAttachClick`);
- `packages/web/src/services/api.ts` (`uploadFile(file, chatId)`,
  `sendMessage` c attachments);
- `packages/web/src/__tests__/components/AttachmentPanel.test.tsx` (новый, 8).

Выводы проверок 16.10.2026:

```text
$ pnpm --filter @balloo/web test
 Test Files  28 passed (28)
$ pnpm --filter @balloo/web build
✓ built in 7.91s   (exit 0)
```

Не сделано сознательно: «Недавние файлы», «Хранилище» (нет эндпоинта/сущности),
экспорт скриншота (заменено Ctrl+V).
