# Тикет 1792311334 — Инструкция по созданию тикетов + инвентаризация MVP1

**Создан:** 18.10.2026 (unix 1792311334)
**Статус:** готов
**Источник:** инвентаризация после закрытия 8 тикетов

---

## Цель

Создать единый документ-памятку, чтобы не забыть правила создания тикетов и текущее состояние MVP1: скелеты, API, тесты.

---

## §1. Правила создания тикетов

### 1.1. Формат файла

```
tickets/active/<unix-timestamp>.md
```

Пример: `tickets/active/1792311334-ticket-creation-instructions.md`

### 1.2. Структура тикета

```markdown
# Тикет <unix> — <короткое название>

**Создан:** <дата> (unix <unix>)
**Статус:** в работе | готов | заблокирован
**Источник:** <кто/откуда>

## Цель
Чёткое описание задачи.

## Живое состояние
Что реально есть сейчас (команды: ls, grep, cat).

## Подзадачи
- [ ] 1. ...
- [ ] 2. ...

## Критерии готовности
Чек-лист что должно быть.

## Проблемы и решения

## Результат
```

### 1.3. Разбиение задач

- Каждая задача = один тикет в `tickets/active/<unix>.md`
- Закрытый тикет переносится: `tickets/Done/<ГГГГ-ММ-ДД>/<unix>.md`
- В тикете: каждый шаг отмечается `[ ]`/`[x]`/`[~]`/`[!]` по ходу выполнения
- Тикеты выполняются по очереди (режим "Дальше") — один в контексте

### 1.4. Атомарность

- Один тикет = **одна единица работы** (~15-30 минут)
- Не смешивать: скелет + API + тесты = 3 тикета
- Не смешивать: web + mobile + desktop = 3 тикета (если функционал одинаковый)

---

## §2. Золотое правило API

### 2.1. Единый API для одинакового функционала

**Экраны с одинаковым функционалом ДОЛЖНЫ использовать одинаковый API.**

Примеры:

| Функционал | API | Платформы |
|---|---|---|
| Авторизация (login) | `api.login(email, password)` | web, mobile, desktop |
| Создание группы | `api.createGroup(data)` | web, mobile, desktop |
| Отправка сообщения | `api.sendMessage(chatId, data)` | web, mobile, desktop |
| Загрузка голосового | `api.uploadFile(file, chatId)` + `api.sendMessage(chatId, {attachments})` | web, mobile, desktop |
| Просмотр чата | `api.getChatMessages(chatId)` | web, mobile, desktop |

### 2.2. Порядок создания тикетов

1. **Сначала web** — там API уже есть
2. **Затем mobile** — переиспользовать API из web
3. **Затем desktop** — переиспользовать API из web

**Никогда не писать новый API для mobile/desktop если есть web.**

### 2.3. Проверка

Перед созданием тикета для mobile/desktop:
```bash
grep -rn "api\.\w\+" packages/web/src/screens/<каталог> | head -5
```
Если API-вызов есть в web → использовать тот же в mobile/desktop.

---

## §3. Инвентаризация MVP1 скелетов

MVP1 = **78 принятых экранов** (см. `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` стр. 528-614).

### 3.1. Web (34 экрана MVP1)

**Реальный скелет (fake API):**

| ID | Экран | Проблема | Решение |
|---|---|---|---|
| `1_01_29` | ResetPasswordScreen | `new Promise(r => setTimeout(r, 1000))` | Заменить на `api.resetPassword()` |

**Остальные без API — нормальные:** статические текстовые страницы (Rules, About, FileViewer через props, EmptyChatState через store).

### 3.2. Mobile (24 экрана MVP1)

**13 скелетов — созданы 18.10.2026, только UI, нет API:**

| ID | Экран | Строки | API из web |
|---|---|---|---|
| `1_08_03` | CallHistoryScreen | 39 | `api.getCalls()` |
| `1_08_05` | MyDevicesScreen | 30 | `api.getDevices()` |
| `1_08_06` | AddDeviceScreen | 27 | `api.addDevice(data)` |
| `1_08_07` | DonateScreen | 40 | `api.donate(amount)` |
| `1_08_08` | ChatAttachmentsScreen | 47 | `api.getChatAttachments(chatId)` |
| `1_08_09` | ReportMessageScreen | 42 | `api.reportMessage(data)` |
| `1_08_14` | MyDonatesScreen | 29 | `api.getMyDonates()` |
| `1_08_16` | ArchiveScreen | 28 | `api.getArchivedChats()` |
| `1_08_20` | PollEditorScreen | 37 | `api.createPoll(chatId, data)` |
| `1_08_21` | EmptyChatScreen | 22 | — (статический) |
| `1_08_22` | MediaViewerScreen | 34 | `api.getMediaItems(chatId)` |
| `1_08_23` | VoiceRecordScreen | 56 | `api.uploadFile(file, chatId)` |
| `1_08_24` | HeaderMenuScreen | 37 | — (навигация) |

**1 скелет — файл отсутствует:**

| ID | Экран | Решение |
|---|---|---|
| `1_08_01` | Overview | Используется ChatListScreen (главный экран мобильного) |

**11 экранов с API — работают:** Auth (Login, Register, ResetPassword, TwoFactor), ChatView, Profile, Settings, Contacts, Stories, CreateGroup.

### 3.3. Desktop (21 экран MVP1)

**8 скелетов — созданы 18.10.2026, только UI, нет API:**

| ID | Экран | Строки | API из web |
|---|---|---|---|
| `1_09_01` | DesktopOverviewScreen | 90 | — (статический) |
| `1_09_02` | DesktopModesScreen | 86 | — (настройки окна) |
| `1_09_04` | DesktopAddDeviceScreen | 93 | `api.addDevice(data)` |
| `1_09_06` | DesktopChatAttachmentsScreen | 126 | `api.getChatAttachments(chatId)` |
| `1_09_10` | DesktopMyDonatesScreen | 104 | `api.getMyDonates()` |
| `1_09_11` | DesktopChatScreen | 46 | — (обёртка ChatView) |
| `1_09_18` | DesktopSettingsScreen | 87 | — (локальные настройки) |
| `1_09_20` | DesktopNotificationSettingsScreen | 66 | — (локальные настройки) |
| `1_09_21` | DesktopMediaViewerScreen | 198 | `api.getMediaItems(chatId)` |

**12 экранов с API — работают.**

---

## §4. Покрытие тестами

Всего: **290 тестов (33 файла)** на 455 811 строк.

### 4.1. Отдельные тест-файлы (16 экранов):

```
LoginScreen.test.tsx
ChatList.test.tsx
MessageBubble.test.tsx
MessageInput.test.tsx
AttachmentPanel.test.tsx
Avatar.test.tsx
Button.test.tsx
RightMenu.test.tsx
FileViewer.test.tsx
accounts.test.tsx
archive.test.tsx
blockedUsers.test.tsx
calls.test.tsx
channel-invites.test.tsx
DonateScreen.test.tsx
empty-chat.test.tsx
```

### 4.2. Smoke-тесты (~20 экранов):

```
screens.smoke.test.tsx — ChatView, CreateGroup, StoryCreate, и др. (~13 тестов)
screens2.smoke.test.tsx — Profile, Settings, Bots, и др. (~18 тестов)
admin.smoke.test.tsx — 16 admin-экранов
```

### 4.3. НЕ покрыты тестами (~62 экрана):

Из 78 MVP1 — **62 экрана без тестов**.

Приоритет покрытия (ядро мессенджера):
1. Auth (Login, Register, TwoFactor) — есть ✅
2. Chat (ChatList, ChatView, MessageBubble, MessageInput) — есть ✅
3. Groups/Channels — частично
4. Messages — частично
5. Всё остальное — нет ❌

---

## §5. Приоритеты работы

### Приоритет 1: Фикс fake API
- ResetPasswordScreen — заменить setTimeout на реальный API

### Приоритет 2: Подключить API к скелетам
1. Mobile 13 скелетов — 13 тикетов (по одному на экран)
2. Desktop 8 скелетов — 8 тикетов (по одному на экран)

### Приоритет 3: Тесты
- Начать с ядра: chat, messages, groups

---

## §6. Шаблон атомарного тикета

```markdown
# Тикет <unix> — <платформа>: <экран> — подключить API

**Создан:** <дата>
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API к экрану `<экран>` на платформе `<платформа>`.

## Живое состояние
- Файл: `packages/<платформа>/src/screens/<Экран>.tsx`
- Текущий код: [useState([])] — пустой массив, useEffect с пустым колбэком
- API из web: `api.<метод>(...)`

## Подзадачи
- [ ] 1. Прочитать API из web: `grep -n "api\.\w\+" packages/web/src/screens/<каталог>`
- [ ] 2. Добавить import api в экран
- [ ] 3. Заменить useState([]) на useEffect с API-вызовом
- [ ] 4. Добавить обработку ошибок и loading
- [ ] 5. Проверка сборки

## Критерии готовности
- [ ] API-вызов в useEffect
- [ ] Loading state
- [ ] Error handling
- [ ] `pnpm --filter @balloo/<платформа> build` зелёный

## Результат
_заполняется после выполнения_
```

---

## §7. Полезные команды

```bash
# Найти API-вызовы в web
grep -rn "api\.\w\+" packages/web/src/screens/<каталог>

# Проверить скелеты (useState([]), useEffect без API)
grep -n "useState<.*>\(\[\]\)\|setInterval.*setElapsed\|setTimeout.*navigate" packages/<платформа>/src/screens/*.tsx

# Проверить покрытие тестами
ls packages/web/src/__tests__/screens/ packages/web/src/__tests__/components/

# Сборка
pnpm --filter @balloo/<платформа> build

# Тесты
pnpm --filter @balloo/<платформа> test
```

---

## Результат

Создан единый документ-памятка. Все правила, инвентаризация, приоритеты зафиксированы.

### Созданные атомарные тикеты

| Unix | Платформа | Экран | Тип |
|---|---|---|---|
| 1792311335 | Web | ResetPasswordScreen | Fake API → реальный |
| 1792311336 | Mobile | CallHistoryScreen | Подключить API |
| 1792311337 | Mobile | MyDevicesScreen | Подключить API |
| 1792311338 | Mobile | AddDeviceScreen | Подключить API |
| 1792311339 | Mobile | DonateScreen | Подключить API |
| 1792311340 | Mobile | ChatAttachmentsScreen | Подключить API |
| 1792311341 | Mobile | ReportMessageScreen | Подключить API |
| 1792311342 | Mobile | MyDonatesScreen | Подключить API |
| 1792311343 | Mobile | ArchiveScreen | Подключить API |
| 1792311344 | Mobile | PollEditorScreen | Подключить API |
| 1792311345 | Mobile | MediaViewerScreen | Подключить API |
| 1792311346 | Mobile | VoiceRecordScreen | Подключить API |
| 1792311347 | Mobile | EmptyChatScreen | Проверить UI |
| 1792311348 | Mobile | HeaderMenuScreen | Проверить UI |
| 1792311349 | Desktop | DesktopAddDeviceScreen | Подключить API |
| 1792311350 | Desktop | DesktopChatAttachmentsScreen | Подключить API |
| 1792311351 | Desktop | DesktopMyDonatesScreen | Подключить API |
| 1792311352 | Desktop | DesktopMediaViewerScreen | Подключить API |
| 1792311353 | Desktop | DesktopOverviewScreen | Проверить UI |
| 1792311354 | Desktop | DesktopModesScreen | Проверить UI |
| 1792311355 | Desktop | DesktopChatScreen | Проверить обёртку |
| 1792311356 | Desktop | DesktopSettingsScreen | Проверить UI |
| 1792311357 | Desktop | DesktopNotificationSettingsScreen | Проверить UI |

**Итого: 23 атомарных тикета**
- Web: 1 тикет (fake API fix)
- Mobile: 13 тикетов (11 API + 2 UI check)
- Desktop: 9 тикетов (4 API + 5 UI check)

**Порядок выполнения:** 1792311335 → 1792311336 → ... → 1792311357
