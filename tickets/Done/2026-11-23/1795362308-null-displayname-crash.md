# Тикет 1795362308 — крах ErrorBoundary: displayName null у контакта

**Создан:** 22.11.2026 20:37 (unix 1795362308)
**Статус:** в работе
**Источник запроса:** вывод консоли владельца при приёмке этапа H деплоя 24975f7

## Симптом

`https://balloo.su/#/chat` → белый экран «Что-то пошло не так» (ErrorBoundary):

```text
TypeError: Cannot read properties of null (reading 'split')
    at EmptyChatState.tsx:184:34
    at Array.map (<anonymous>)
    at k (EmptyChatState.tsx:163:37)
Component stack: at k (ChatViewScreen-lBP5lg57.js) ... at main ... at j (MainLayout-DLmwAlg7.js)
```

## Причина

`User.displayName` в Prisma — **nullable** (`packages/shared/prisma/schema.prisma:127`:
`displayName String? @db.VarChar(100)`), `username` тоже nullable (строка 123).
`GET /api/users/contacts` (`userService.getContacts:941-948`) отдаёт поле как есть,
без фолбэка. Клиентские компоненты печатают инициалы через цепочку

```ts
contact.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
```

что на `null` падает с TypeError → ErrorBoundary гасит весь экран чатов.

**Не связано с деплоем 24975f7** (rate-limit): диф `c42b69a..24975f7` не трогал ни один
из затронутых файлов (проверено `git diff --stat c42b69a 24975f7`). Деплой лишь
допустил пользователя до экрана вместо прежнего выброса на /login по 429.

Тот же паттерн найден grep'ом в **трёх** местах (все потребляют `/api/users/contacts`):

| Файл | Строки | Что падает |
|---|---|---|
| `components/chat/EmptyChatState.tsx` | 62, 177, 183-188, 194 | `displayName.toLowerCase()` в фильтре, `alt=`, инициалы, заголовок |
| `screens/channels/CreateChannelScreen.tsx` | 139-140, 610, 616-621, 628 | то же |
| `screens/groups/CreateGroupScreen.tsx` | 148, 512, 516 | то же |

Фолбэк уже есть в `components/sidebar/UserCard.tsx:14` (`user.displayName || user.username || 'User'`)
и в `screens/stories/StoriesScreen.tsx:73` (`... || s.user?.username || 'Пользователь'`) —
там краха нет, там данные нормализуются на входе.

## Решение

Единый null-safe хелпер + применение во всех трёх местах. Никаких миграций и правок БД:
данные с `displayName = null` легальны по схеме, их нужно корректно отображать.

## Подзадачи

- [x] 1. `packages/web/src/utils/display.ts`: `displayNameOf(user)` → `displayName || username || 'Пользователь'`;
      `initialsOf(name)` → `??` при пустом, иначе первые буквы слов (макс. 2), без падения на null/пустой строке
- [x] 2. Тест `__tests__/utils/display.test.ts` — 17 тестов (null / пустая строка / пробелы / одно слово / кириллица / 2 слова)
- [x] 3. `EmptyChatState.tsx`: фильтр, `alt`, инициалы, заголовок — через хелпер; тип `displayName: string | null`
- [x] 4. `CreateChannelScreen.tsx`: то же
- [x] 5. `CreateGroupScreen.tsx`: то же + `@username` выводится только когда username есть
- [x] 6. Проверки: `tsc --noEmit` exit 0 + vitest web **51 файла / 387 тестов** + `vite build` ✓ built in 9.76s
- [x] 7. Деплой (web-контейнер) — батчи D2/G2 (`853da64`) и C3–G3 (`65b4606`),
      23.11.2026: бандль `index-BMWJl9HD.js` (док-во: тик. `1795357403`)

## Регрессия-тест

`packages/web/src/__tests__/components/EmptyChatState.nullname.test.tsx` (3 теста):
контакт `{displayName: null, username: 'vasya'}` рендерит «vasya»/«V»;
`{null, null}` → «Пользователь»/«П»; обычное имя → «Иван Петров»/«ИП».
До правки этот же вход давал TypeError и уводил экран в ErrorBoundary.

## Критерии готовности

- `/api/users/contacts` с контактом `{displayName: null, username: 'vasya'}` рендерит
  «vasya» и инициалы «V», экран не падает;
- `{displayName: null, username: null}` → «Пользователь» / «??»;
- поиск по контактам не падает на null-имени;
- tsc/vitest/build зелёные.

## Проблемы и решения

- Соблазн «починить данными» (проставить displayName в проде) отвергнут: поле остаётся
  nullable по схеме, любой OAuth-новый пользователь снова даст null. Лечение — на клиенте.

## Результат

(заполняется по ходу)
