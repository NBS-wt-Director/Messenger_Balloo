# Тикет №68 — Нормализация мультитикета + доработка status.html

**ID:** 68  
**Статус:** todo  
**Группа:** Meta  
**Зависит от:** [Нет]  
**Цель:** Привести главный мультитикет к формату 1 сессия = 1 шаг и переработать status.html для чтения состояния из файлов проекта  
**Входные файлы:** 
- `tickets/balloo-implementation.md` — главный мультитикет (66 тикетов)
- `tickets/balloo-status.json` — источник данных статуса
- `status.html` — HTML-панель статуса
- `api-services-guide.md` — справочник API-сервисов

**Изменяемые файлы:**
- `tickets/balloo-implementation.md` — нормализация шаблона всех 66 тикетов
- `status.html` — полная переработка: чтение из JSON, аккордеоны, фильтры, статистика, подпись машины
- `api-services-guide.md` — обновление списка сервисов
- `README.md` — добавление раздела правил посессионного выполнения

**Что отложено в v2+:**
- Автоматическое сканирование файлов для обновления статуса (нужен бэкенд)
- WebSocket real-time обновление status.html
- Интеграция status.html с админ-панелью (admin.balloo.su/status)

**Что нужно сделать:**

## Шаг 1 — Нормализация шаблона тикетов в balloo-implementation.md

В текущем файле `tickets/balloo-implementation.md` определён шаблон тикета (строки 64-92), но тикеты №1-12 не полностью ему соответствуют, а тикеты №13-66 вообще отсутствуют (заглушка "полный мультитикет содержит все 66 тикетов").

Для каждого из 66 тикетов обеспечить единую структуру:

```markdown
### ТИКЕТ №X — Название

**ID:** X  
**Статус:** todo  
**Группа:** [Название блока]  
**Зависит от:** [номер тикета или []]  
**Цель:** [Кратко]  
**Входные файлы:** [Список]  
**Изменяемые файлы:** [Список]  
**Что отложено в v2+:** [Список]  

#### Что нужно сделать
[Пошагово]

#### Acceptance criteria
- [ ] Критерий 1
- [ ] Критерий 2

#### Проверка
```bash
# Команды
```

#### Handoff в следующую сессию
[Текст]
```

**Действия:**
1. Обновить тикеты №1-12: добавить недостающие поля (Входные файлы, Изменяемые файлы, v2+, Acceptance criteria, Проверка, Handoff)
2. Сгенерировать тикеты №13-66 на основе блоков, указанных в `balloo-status.json` и `DEFAULT_PROJECT_DATA` в status.html
3. Каждый сгенерированный тикет должен содержать:
   - Описание блока (из DEFAULT_PROJECT_DATA)
   - Пошаговые инструкции для каждого подтикета
   - Acceptance criteria (минимум 3-5)
   - Проверку (bash-команды)
   - Handoff в следующую сессию

**Список блоков и тикетов:**
| Блок | Тикеты | Описание |
|---|---|---|
| Подготовка | 1-2 | PDF-материалы + API-справочник |
| Инфраструктура | 3-5 | Монорепо + Docker + Shared |
| База данных | 6-12 | Prisma schema (81 таблица) + seed |
| Бэкенд | 13-23 | Server: auth, chats, WebSocket, API |
| Web | 24-34 | React + Vite: 41 экран |
| Mobile | 35-38 | React Native + Expo: Android + iOS |
| Desktop | 39-40 | Electron: 23 экрана |
| Admin | 41-47 | Dashboard, users, bans, blog, metrics |
| Command | 48-53 | HR, knowledge, chat, tasks, blog |
| Сервисы | 54-59 | Features, History, Download, Docs, Blog, Specifity |
| Ошибки + Лендинг | 60-61 | Shared error pages + landing |
| Деплой | 62-64 | Docker prod, nginx, SSL, скрипты |
| Мониторинг + Финал | 65-66 | Prometheus, тесты, документация |

## Шаг 2 — Добавить глобальные правила посессионного выполнения

В начало `README.md` (или в начало `balloo-implementation.md` перед тикетами) добавить раздел:

```markdown
## Правила выполнения

1. **Одна сессия = один тикет**, если пользователь не запросил иначе
2. **Автопереход** — если вызван завершённый тикет → автоматически выбирается ближайший следующий todo
3. **TDD** — тесты → код → проверка совместимости → ревью читаемости → обновление документации
4. **Фиксация** — после завершения тикета фиксируются: изменённые файлы, команды проверки, краткий итог, completed_at, completed_by_machine, completed_by_session
5. **v2+ отложенные задачи** — всё, что перенесено в v2+, записывается в `deferred-to-v2.md`
6. **Обновление статуса** — после каждого тикета синхронно обновляются:
   - Главный `.md`-реестр (`balloo-implementation.md`)
   - JSON-источник (`balloo-status.json`)
   - `status.html` (логика чтения обновляется автоматически при пересборке JSON)
```

## Шаг 3 — Переписать status.html

Текущий `status.html` (1309 строк) читает данные из `balloo-status.json` через `fetch()`, но также активно использует `localStorage` для ручного редактирования и сохранения состояния. Нужно:

### 3.1. Убрать localStorage полностью

- Удалить `saveState()`, `loadState()`, `localStorage.setItem/getItem`
- Убрать кнопку "Ручное редактирование" (в текущей фазе — не нужно)
- Убрать экспорт/импорт прогресса (заменить на скачивание/загрузку JSON-файла)
- Убрать кнопку "Сбросить всё"

### 3.2. Чтение данных из balloo-status.json

- При загрузке страницы — `fetch('tickets/balloo-status.json')`
- Парсинг `tickets[].status`, `tickets[].completedAt`, `tickets[].completedByMachine`, `tickets[].completedBySession`, `tickets[].changedFiles`, `tickets[].verificationCommands`, `tickets[].resultSummary`, `tickets[].deferredToV2`, `tickets[].handoff`
- Группировка тикетов по `tickets[].group`
- Если JSON не загружен — показать ошибку "Не удалось загрузить данные статуса. Проверьте, что файлы проекта доступны."

### 3.3. Аккордеоны для завершённых тикетов

- Завершённые тикеты (status === 'done') — **свёрнуты** по умолчанию
- В заголовке завершённого тикета отображать:
  - Номер, название, дата/время завершения (`completedAt`)
  - Подпись машины (`completedByMachine`)
- При клике — раскрыть аккордеон со деталями:
  - `resultSummary` — что сделано
  - `changedFiles` — изменённые файлы (список)
  - `verificationCommands` — команды проверки
  - `deferredToV2` — что отложено в v2+
  - `handoff` — handoff в следующую сессию

### 3.4. Незавершённые и текущие этапы

- `in_progress` — отображаются **открытыми**, визуально выделяются (подсветка, иконка ⚡)
- `todo` — отображаются открытыми, следующий todo тикет подсвечивается как активный
- `blocked` — отображаются с предупреждением (красная рамка, иконка ⛔)
- `skipped` — отображаются серым, зачёркнутым текстом

### 3.5. Фильтры

Реализовать фильтры по статусам:
- Все / Todo / In progress / Done / Blocked / Skipped

### 3.6. Глобальная статистика

Отображать:
- Всего тикетов
- Завершено
- В работе
- Заблокировано
- Пропущено
- Осталось дней (рассчитать на основе estimatedDays и прогресса)

### 3.7. Подпись машины

Формат: `HOSTNAME / VSCode-Kodacode` или `HOSTNAME / session-YYYY-MM-DD-HH-MM`
Fallback: `unknown-host / manual-session`

Так как HTML работает в браузере и не может получить hostname напрямую:
- Пытаться получить через `navigator.userAgent`
- Форматировать из `completedByMachine` в JSON
- Fallback: `unknown-host / manual-session`

### 3.8. Глобальная статистика по блокам

Для каждого блока показывать:
- Название и иконку
- Прогресс-бар (завершённые / всего)
- Статус блока (Готово / В процессе / Ожидание)

### 3.9. Стилизация

- Сохранить текущую тёмную тему (dark)
- Сохранить CSS-переменные из `common.css`
- Аккордеоны с плавной анимацией (CSS transition)
- Текущий активный тикет — подсветка синим (info)
- Завершённые — зелёная галочка, свёрнуты
- Заблокированные — красная рамка

## Шаг 4 — Обновить api-services-guide.md

Заменить весь список сторонних сервисов на строго утверждённый:

### Авторизация
- Yandex ID
- VK ID
- Mail.ru ID

### Платежи
- ЮMoney

### Хранение/CDN
- Яндекс.Диск
- MinIO (self-hosted)

### Email
- Self-hosted (Postfix/Docker Mailserver)

### Push/Realtime
- Custom (на базе собственного WebSocket)

### Мониторинг
- Prometheus + Grafana

### Аналитика
- Yandex.Metrica

### Прочее
- Self-hosted решения

**Строгий запрет зафиксировать в начале файла и в комментариях кода:**
- Cloudflare
- Firebase Cloud Messaging
- Google OAuth
- UptimeRobot
- Sentry
- SendPulse

## Шаг 5 — Обновить контракт работы со статусами

Зафиксировать в `balloo-implementation.md` (раздел "Правила выполнения"):

> После выполнения любого тикета синхронно обновляются:
> 1. Главный `.md`-реестр (`balloo-implementation.md`) — статус тикета
> 2. JSON-источник (`balloo-status.json`) — статус, completedAt, completedByMachine, changedFiles и т.д.
> 3. `status.html` — логика чтения обновляется автоматически при пересборке JSON (не требует ручного обновления)

---

#### Acceptance criteria
- [ ] Все 66 тикетов в `balloo-implementation.md` имеют единый шаблон со всеми полями (статус, зависит от, цель, входные/изменяемые файлы, acceptance criteria, проверка, v2+, handoff)
- [ ] В начале документа есть раздел с правилами посессионного выполнения и автопереходом к следующему тикету
- [ ] `status.html` читает данные из `balloo-status.json`, а не из localStorage
- [ ] В `status.html` реализованы аккордеоны для завершённых тикетов с отображением даты/времени и подписи машины
- [ ] В раскрытом аккордеоне видны: что сделано, файлы, команды проверки, v2+, handoff
- [ ] Реализованы фильтры по статусам (Все / Todo / In progress / Done / Blocked / Skipped)
- [ ] Глобальная статистика: всего тикетов, завершено, в работе, заблокировано, осталось дней
- [ ] Текущий тикет визуально выделен, незавершённые открыты, завершённые свёрнуты
- [ ] `api-services-guide.md` содержит только утверждённый список сервисов
- [ ] Все запрещённые сервисы удалены из `api-services-guide.md`
- [ ] Решение не использует внешние зависимости для статуса (чистый HTML/JS + JSON)
- [ ] localStorage полностью удалён из `status.html`

#### Проверка
```bash
# Проверка формата тикетов в мультитикете
grep -c "^### ТИКЕТ №" tickets/balloo-implementation.md
# Должно быть 66

# Проверка наличия всех полей в каждом тикете
grep -c "**ID:**" tickets/balloo-implementation.md
# Должно быть 66

grep -c "**Статус:**" tickets/balloo-implementation.md
# Должно быть 66

# Проверка status.html на отсутствие localStorage
grep -c "localStorage" status.html
# Должно быть 0

# Проверка api-services-guide на отсутствие запрещённых сервисов
grep -c "Cloudflare\|Firebase\|Google OAuth\|UptimeRobot\|Sentry\|SendPulse" api-services-guide.md
# Должно быть 0 (только в разделе "Запрещённые сервисы" — упоминания допустимы)
```

#### Handoff в следующую сессию
Мультитикет нормализован, status.html переписан, api-services-guide обновлён. Переходить к тикету №1 — создание PDF-материалов для проекта.

---

## 📊 Текущее состояние файлов (справка для AI)

### balloo-implementation.md
- Строка 1-678
- Определяет шаблон тикета (строки 64-92)
- Содержит тикеты №1-12 (неполные)
- Строка 614: заглушка "Это первые 13 тикетов из 66"
- Блоки определены в прогресс-баре (строки 618-634)

### balloo-status.json
- Строка 1-201
- Содержит 12 тикетов (№1-12)
- Поля: id, title, status, group, dependsOn, completedAt, completedByMachine, completedBySession, changedFiles, verificationCommands, resultSummary, deferredToV2, handoff, details
- `completedTickets: 0`, `totalTickets: 66`

### status.html
- Строка 1-1309
- Содержит DEFAULT_PROJECT_DATA с 66 тикетами (строки 604-782)
- Есть `loadStatusFromJSON()` — чтение из JSON
- Но также есть `saveState()`/`loadState()` с localStorage (строки 891-918)
- Нет аккордеонов для завершённых тикетов
- Фильтры реализованы (строки 560-567, 1279-1297)
- Подпись машины: `getMachineSignature()` возвращает `unknown-host / session-...`

### api-services-guide.md
- Строка 1-173
- Содержит: Yandex ID, Mail.ru ID, VK ID, ЮMoney, Яндекс.Диск, MinIO, Custom, Prometheus+Grafana, Self-hosted, Yandex.Metrica
- Раздел "Запрещённые сервисы" есть (строки 165-173)
- Почти соответствует утверждённому списку, но есть лишние разделы: "Custom (Собственная реализация)" в CDN, "Custom (Self-hosted)" в push, "ELK Stack" в мониторинге, "Telegram Bot", "Matomo", "Mail.ru for Business", "Тинькофф Эквайринг", "ЮKassa", "Yandex Object Storage", "Selectel"
