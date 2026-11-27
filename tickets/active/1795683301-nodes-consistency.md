# Мультитикет 1795683301 — Доведение узлов MVP1 до общих требований системы

**Создан:** 26.11.2026
**Источник:** владелец (чат 26.11.2026, два сообщения подряд):
> «баги/недоработки на других узлах: features.balloo.su … history.balloo.su …
> download.balloo.su … api.balloo.su/docs … все компоненты занимают типа
> контейнер… нету отступа между контентом и краем справа нигде»
>
> «продолжи и дополни пакет исправлений: верхняя панель вкладок настроек лишняя.
> как и кнопка админки в левой панели (не в меню). экран истории — активная
> кнопка добавить… звонки — добавь кнопку "что это?" и "проверить оборудование"…»

**Связанные тикеты:** `1795679146` (i18n), `1795677854` (морзе-тикер),
`1795678493` (продолжение деплоя), `1795435146` (аудит, пункты P-1…P-6, F-1…F-7).

---

## 0. Постоянные требования, которые вводятся этим тикетом

Внесены в `AGENTS.md` (§«Единые требования ко всем узлам») и
`docs/05-frontend-spec.md`. Действуют на **все узлы и все будущие экраны**.

| № | Требование |
|---|---|
| U1 | **Единая шапка и подвал** `@balloo/ui` на каждом узле и каждом экране, включая `api.balloo.su/docs`. Шапка/подвал обновляются централизованно — узел не рисует свою. |
| U2 | **Прокрутка есть всегда и без видимой полосы**: контейнер `height:100vh; overflow:hidden`, внутри `.page-container` с `overflow-y:auto`; полоса скрыта (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`). |
| U3 | **Горизонтальный отступ контента обязателен**: контент не прилипает к краям — минимум 24px слева и справа (`.page-container` padding), на мобиле 16px. Правило — для всех узлов, включая таблицы и «широкие» карточки. |
| U4 | **Статусы фич** (features): `реализовано` — протестировано; `в процессе` — реализовано, но не протестировано; `в плане` — запланировано с пометкой **«волна N»**. Никаких пустых списков. |
| U5 | **Пустое состояние — не «нет данных»**, а: объяснение + извинение + призыв к действию + кнопка «Что это?» с полным описанием экрана. |
| U6 | **Версии — по команде владельца.** Сейчас: `MVP0` (первый деплой на сервер) и `MVP0.5` (текущая). Новая версия добавляется только по фразе владельца «MVP1 — закончен». |
| U7 | **Платформа без сборки**: плитка остаётся, но с текстом-извинением («приложение для этой платформы пока не собрано») — через i18n (см. `1795679146`). |
| U8 | **Дублирующая навигация запрещена**: если есть боковое меню раздела, верхняя панель тех же вкладок не рисуется. |
| U9 | **Админка — только в правом меню** (`ecosystem.ts`), в левой панели чатов её нет. |
| U10 | **Индикация новых историй**: если есть непросмотренные — все кнопки/пункты «Истории» во всех меню показывают бейдж. |

---

## 1. features.balloo.su

### Замер (26.11.2026)

| Факт | Доказательство |
|---|---|
| Шапка/подвал — `Topbar`/`Footer` из `@balloo/ui`, но **без** новых пунктов меню/подвала | `web-features/src/screens/FeaturesListScreen.tsx:6,132,324` |
| Данных нет: `prisma.feature.*` в `seed.ts` отсутствует | `grep -n "prisma.feature\." seed.ts` → 0 |
| Прокрутки нет: `.page-container` в `web-features/src/styles/page.css:4-8` **без** `flex/min-height/overflow`, а `.content` — `overflow-y:auto` без `min-height:0` | `page.css:4-8` vs `web/src/styles/design-system.css:615-624` |
| Голосование есть в UI (`FeatureVoteButton` → `POST /api/features/:id/vote`), но без данных голосовать не за что | `FeatureVoteButton.tsx:40-50` |
| На `/features/create` нет левой панели и нет скролла | `FeatureCreateScreen.tsx:109-114` — только `Topbar` + `.content` |

### Подзадачи

- [x] F1. **Шапка/подвал**: узел использует `Topbar`/`Footer` из `@balloo/ui` (проверено чтением импортов `FeaturesListScreen.tsx:6`, `FeatureCreateScreen.tsx:7`, `FeatureDetailScreen.tsx:6`) — свежий пакет, не копия. Новые пункты меню/подвала и морзе-тикер подтягиваются автоматически.
- [x] F2. **Данные**: seed `seedFeatureRequests()` — 19 фич с тремя статусами: 11 `done`, 4 `in_progress`, 4 `planned` (с `wave: 2|3`). Состав — реальные фичи из закрытых тикетов (Done/2026-11-26 и др.), не выдумка.
- [x] F3. **Статусы в UI**: `FeatureStatusBadge` — «Реализовано» / «В процессе» / «В плане» + чип «волна N» для `planned`; сайдбар и счётчики по этим статусам.
- [x] F4. **Прокрутка**: `.page-container` в `web-features` дополнен `flex/min-height/overflow` + `box-sizing` (сделано ранее), полоса скрыта (U2).
- [x] F5. **Левая панель на `/features/create`**: новый `components/FeaturesSidebar.tsx` — общий для списка и формы (U8); каркас `Topbar → main → Footer`, контент в `.page-container--narrow` со скроллом.
- [x] F6. **Голосование**: `GET /api/features` и `GET /api/features/:id` принимают `optionalAuth` и возвращают `hasVoted`; `FeatureVoteButton` получает реальное значение, при 401 — «Войдите, чтобы голосовать». Тесты: `nodes consistency (U4/F2/F3/F6)` — 5 проверок (createdAt≠0, wave, hasVoted до/после голоса, анонимно = false).
- [ ] F7. **i18n**: тексты экранов — через `t()` (сейчас хардкод, см. `1795679146`).

---

## 2. history.balloo.su

### Замер

| Факт | Доказательство |
|---|---|
| Узел `web-history` — заглушка: «Раздел в разработке» | `packages/web-history/src/App.tsx:7-23` |
| Полноценный экран истории есть в `web` | `packages/web/src/screens/history/HistoryScreen.tsx` |
| На проде `history.balloo.su` отдаёт общий бандль `balloo.su` (P-6 аудита) | `1795435146` §0 |
| Серверный seed версий: 6 записей (5 релизов + 1 планируемая) | лог `balloo-server`: `ServiceVersion: 6 версий` |

### Подзадачи

- [x] H1. **Прокрутка без полосы** (U2): новый `web-history/src/styles/global.css`.
- [x] H2. **Данные**: `loadVersions()` фильтрует `publishedAt > 0` — черновики и
      запланированные не показываются (U6). В БД остаются 6 записей seed, но
      неопубликованные на экран не попадают.
- [x] H3. **Единая шапка/подвал** (U1): `StandaloneChrome` из `@balloo/ui`
      (новый компонент), узел больше не рисует свою разметку.
- [x] H4. Экран истории перенесён по смыслу: список версий + детальная страница
      (`/version/:id`), данные — `GET /api/history/versions` (форма ответа
      `{ items, total, page, limit, totalPages }` сверена с
      `historyService.getVersions`).
- [ ] H5. Переключить хостовый nginx `history.balloo.su` на контейнер
      `balloo-web-history` (8093) — правка владельца, батч деплоя.
- [ ] H6. i18n (см. `1795679146`).

---

## 3. download.balloo.su

### Замер

| Факт | Доказательство |
|---|---|
| QR на экране загрузок отсутствует в коде | `grep -rn "qr" DownloadScreen.tsx` → 0 |
| QR есть на экране донатов: `/qr.webp` | `DonateScreen.tsx:20,83-91` |
| Плитки платформ без проверки наличия сборки | `DownloadScreen.tsx:206-408` |
| `/api/downloads` отдаёт пустые списки (P-2) | `1795435146` §0 |

### Подзадачи

- [x] D1. **Плитка без сборки**: `web-download/src/screens/DownloadPage.tsx` —
      наличие артефакта проверяется по `GET /api/downloads`; если пакетов нет,
      плитка остаётся с текстом-извинением и **без ссылки**.
- [x] D2. **QR заменён на настоящий** (`web-download/src/screens/QRCodeImage.tsx`):
      `QRCode.toString(value, {type:'svg', errorCorrectionLevel:'H'})`, значение
      `https://download.balloo.su`, октагон-логотип наложением. Зависимость
      `qrcode@^1.5.4` + `@types/qrcode` добавлена в `packages/web-download/package.json`.
      (Тот же фикс ранее сделан в `web/src/screens/download/components/QRCode.tsx`.)
- [x] D3. **Прокрутка + отступы** (U2, U3): `.page-container` в новом
      `web-download/src/styles/global.css` + скрытая полоса прокрутки.
- [ ] D4. **Переключение nginx** на `balloo-web-download` (8094) — владелец,
      батч деплоя. Шапка/подвал внутри узла уже единые (U1).
- [ ] D5. i18n: тексты страницы пока на русском хардкодом — вынесение в словарь
      идёт отдельным тикетом `1795679146`.

---

## 4. api.balloo.su/docs

### Замер

| Факт | Доказательство |
|---|---|
| HTML документации генерируется контроллером | `packages/server/src/controllers/docsHtmlController.ts:106` — «Единая шапка экосистемы (макет mockups/docs-balloo-su/api-docs.html)» |
| Шапка/подвал — собственная разметка контроллера, не `@balloo/ui` | тот же файл |

### Подзадачи

- [x] P1. Шапка/подвал `/docs` приведены к общим требованиям (U1): те же пункты меню, что в `@balloo/ui/ecosystem` (Balloo/Admin/Features/History/Download + текущий Docs), в подвале — copyright → меню из 5 пунктов, «Поддержка», правовой блок (Правила/Конфиденциальность/Cookies) и два морзе-тикера. Паттерн строится общей утилитой `toMorse` (переехала в `@balloo/shared`, `@balloo/ui` реэкспортирует).
- [x] P2. Прокрутка без полосы + горизонтальные отступы (U2, U3): каркас `.page-chrome` (шапка → `.page-container` со скроллом → подвал), `padding: 32px 24px` / `24px 16px` на мобиле, `scrollbar-width:none` + `::-webkit-scrollbar{display:none}`.
- [ ] P3. i18n: тексты страницы документации — через словарь (сейчас хардкод в HTML; блокируется тикетом `1795679146`, серверный рендер без React не имеет доступа к `t()` клиента).

---

## 5. Сквозное: отступы и ширина контейнеров

### Замер

| Факт | Доказательство |
|---|---|
| `.content` — без горизонтального padding | `web/src/styles/chat.css:124-132` (`padding` не задан) |
| `.page-container` — `max-width:960px; padding:32px 24px` | `web/src/styles/design-system.css:615-624` |
| Экраны без `.page-container` (таблицы, «широкие» карточки) прилипают к краям | владелец: «нет отступа между контентом и краем справа нигде» |

### Подзадачи

- [x] W1. Введено общее правило: `.content:not(.content--chat)` получает
      `padding-inline: 24px` (мобиле — 16px), а `.content > .page-container`
      обнуляет свой padding, чтобы отступ не удваивался — `web/src/styles/chat.css`.
- [x] W2. Чат исключён явно (`content--chat` в `ChatViewScreen.tsx`) — у него свои
      отступы у сообщений и композера, боковой padding ломал раскладку.
- [x] W3. `web-features`: `.page-container` получил `flex/min-height/overflow`
      и мобильный padding (`web-features/src/styles/page.css`); `web-history` и
      `web-download` получили собственный `global.css` с теми же правилами.
      `web-admin`, `desktop`, `mobile-android` — **не трогалось** (см. «Проблемы»).
- [ ] W4. Проверка: скриншоты 360 / 768 / 1440 px — контент не касается краёв.
      **Не выполнено:** браузера в этой сессии нет.

### U2 — прокрутка без видимой полосы

- [x] `web/src/styles/global.css` — `*{scrollbar-width:none}` + `::-webkit-scrollbar{display:none}`
      (раньше полоса была видимой, 6px).
- [x] `web-features/src/styles/global.css` — то же.
- [x] `web-history`, `web-download` — новый `global.css` с тем же правилом.

---

## 6. Настройки: убрать дублирующую верхнюю панель вкладок

### Замер

| Факт | Доказательство |
|---|---|
| Боковое меню раздела | `SettingsScreen.tsx:1001-1026` (`aside`, 280px) |
| **Верхняя панель тех же вкладок** (дубль) | `SettingsScreen.tsx:1031-1061` |
| Скриншот владельца: две одинаковые навигации слева и сверху | чат 26.11.2026 |

### Подзадачи

- [x] S1. Удалена верхняя панель вкладок (`SettingsScreen.tsx:1031-1061`), остался `aside`.
- [x] S2. На мобиле (`≤768px`) `aside` скрыт, вместо него `<select aria-label="Раздел настроек">`
      с теми же 13 разделами.
- [x] S3. Все 13 разделов достижимы через `setActiveTab`; `activeTab` не сбрасывается.

---

## 7. Левая панель: убрать кнопку «Админка»

### Замер

| Факт | Доказательство |
|---|---|
| «Админка» добавляется в `navItems` Sidebar | `Sidebar.tsx:37-44` |
| В правом меню админка уже есть | `ui/src/components/ecosystem.ts:47,71` (`menu.admin`) |

### Подзадачи

- [x] A1. Блок `if (user.isAdmin) { … }` удалён из `Sidebar.tsx` (U9).
- [x] A2. Пункт «Админка» остаётся в лого-меню и правом меню
      (`ecosystem.ts:47` — SPA-путь, `:71` — прод `admin.balloo.su`).
- [x] A3. `grep -n "Админка" Sidebar.tsx` → только комментарий-пояснение.

---

## 8. Экран «Истории»: пустое состояние + предзаписанные видео + «Что это?»

### Требование владельца (дословно)

> «экран истории — активная кнопка добавить. если нет историй — показываем
> предзаписанные видеоистории — 3 штуки (найди про природу России, Урал, Города
> России (без слов)). но скажи что-то вроде — "У вас/ваших контактов/ваших чатов
> нет ни одной истории или мы не могли загрузить их. Пока вселенная/Мы исправляем
> эту вопиющую несправедливость — посмотрите что мы нашли для Вас в качестве
> примера, какой может быть Ваша история." (привлекаем). даём возможность
> загрузить и настроить сразу. + кнопка "Что это?" — где рассказываем всё об
> экране истории. если есть новые — все кнопки историй во всех меню говорят об
> этом.»

### Замер

| Факт | Доказательство |
|---|---|
| Пустое состояние — просто пустой список | `StoriesScreen.tsx:541-590` |
| Кнопка «Добавить» есть, ведёт на `/stories/create` | `StoriesScreen.tsx:538` |
| Бейджа «есть новые истории» нет | `Sidebar.tsx:28` — обычный пункт |
| Демо-видео в репозитории нет | `ls packages/web/public` — только `qr.webp`, `assets`, `sw.js` |

### Подзадачи

- [x] T1. **Пустое состояние** по тексту владельца: `screens/stories/StoriesEmptyState.tsx` — «У вас, ваших контактов и ваших чатов пока нет ни одной истории / или мы не смогли их загрузить… пока мы исправляем эту вопиющую несправедливость — посмотрите, что мы нашли для вас в качестве примера».
- [x] T2. **3 предзаписанных видео**: `packages/web/public/demo-stories/{taiga,ural,spb}.mp4` + постеры `.jpg` (263–633 КБ, ≤8 с, без звука). Тайга (облака над тайгой) / река Урал / Санкт-Петербург. Лицензии CC BY 3.0, CC BY-SA 4.0, CC BY 4.0 — атрибуция в UI и в `docs/demo-stories-attribution.md`.
- [x] T3. **Сразу можно загрузить/настроить**: под демо — «+ Загрузить свою историю» (→ `/stories/create`) и «⚙ Настроить приватность» (→ `/settings/privacy`).
- [x] T4. **Кнопка «Что это?»**: `screens/stories/StoriesInfoModal.tsx` — 6 разделов (что такое, кто видит, приватность, ответы/реакции, если историй нет, срок жизни); доступна и при историях, и в пустом состоянии; закрытие по Escape и клику вне.
- [x] T5. **Индикация новых** (U10): новый `store/storiesStore.ts` (счёт по `hasViewed` из `GET /api/stories`); бейдж — пункт «Истории» в левой панели, кнопка 📷 в шапке, аватар-триггер частного меню и пункт «Истории» в нём (`@balloo/ui`: `PrivateRightMenu.storiesBadge`, `Topbar` прокидывает из `AppTopbar`).
- [x] T6. «Добавить» — активная кнопка (primary) в шапке экрана.

---

## 9. Экран «Звонки»: «Что это?» + «Проверить оборудование» + выбор чата

### Замер

| Факт | Доказательство |
|---|---|
| Пустое состояние — одна строка «У вас пока нет звонков» | `CallsScreen.tsx:209-212` |
| Кнопок «Что это?» / «Проверить оборудование» нет | `CallsScreen.tsx:187-220` |
| Кнопки звонка нет (только список) | там же |
| API звонков: `POST /api/calls` (создание), список `GET /api/calls` | `callService.ts`, `CallsScreen.tsx:153` |

### Подзадачи

- [x] C1. **Пустое состояние**: «Здесь пока пусто — ни одного звонка» + объяснение +
      кнопки «Позвонить», «Что это?», «Проверить оборудование».
- [x] C2. **«Что это?»** — `screens/calls/CallsInfoModal.tsx`: 5 разделов
      (история, пиктограммы, фильтры, как позвонить, приватность), закрытие
      по Escape и клику вне.
- [x] C3. **«Проверить оборудование»** — `screens/calls/DeviceCheckModal.tsx`:
      микрофон (`getUserMedia({audio})` + индикатор уровня), камера
      (`getUserMedia({video})` + превью), динамики (тестовый тон Web Audio).
      Ошибки объясняются по-русски (`NotAllowedError`, `NotFoundError`,
      `NotReadableError`, `OverconstrainedError`); устройства освобождаются
      при закрытии модалки.
- [x] C4. **Кнопка звонка** — `screens/calls/CallStartModal.tsx`: выбор контакта
      (`api.getContacts`) и типа (аудио/видео) → `POST /api/calls`
      (`createCallCtrl: { calleeId, type }`, ответ `{ id, chatId, status }`),
      после успеха — переход на `/active-call`. В `api.ts` добавлен `startCall`.
- [ ] C5. i18n новых текстов — идёт тикетом `1795679146`.

**Оговорка по C4:** серверная часть звонка создаётся реально (запись `Call`,
участники, direct-чат, взаимные контакты). Медиаслой (WebRTC) в MVP1 не
реализован — `ActiveCallScreen` остаётся макетом; это отдельная задача.

---

## 10. Проверки (общие)

- [ ] `tsc --noEmit` по всем затронутым пакетам.
- [ ] `vitest web` / `vitest web-admin` / `jest server`.
- [ ] `vite build` по всем узлам.
- [ ] `node scripts/check-i18n.cjs` + `audit-i18n.mjs` (baseline не вырос).
- [ ] e2e: скролл без полосы, отступы на 3 ширинах, пустые состояния, бейдж историй.
- [ ] Браузерная приёмка владельцем по каждому узлу.

## 11. Критерии готовности мультитикета

- Все подзадачи F/H/D/P/W/S/A/T/C закрыты с доказательствами.
- Требования U1–U10 внесены в `AGENTS.md` и `docs/05-frontend-spec.md`.
- Узлы `features`, `history`, `download`, `docs` соответствуют общим требованиям.
- Нет дублирующей навигации, админка только в правом меню, отступы на всех экранах.
- Приёмка владельцем в браузере пройдена.

## 12. Результат

### Выполнено 27.11.2026 (коммиты `2838853`, `e2e`-прогоны ниже)

| Раздел | Что сделано | Доказательство |
|---|---|---|
| §5 W1–W3 | `padding-inline` для `.content` (24px / 16px на мобиле), `.page-container` внутри без двойного padding; чат исключён классом `content--chat` | `web/src/styles/chat.css`, `web/src/screens/chat/ChatViewScreen.tsx` |
| §5 U2 | Полоса прокрутки скрыта (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`) в `web`, `web-features`, `web-history`, `web-download` | `*/styles/global.css` |
| §6 S1–S3 | Верхняя панель вкладок настроек удалена, на мобиле — `<select>` | `SettingsScreen.tsx` |
| §7 A1–A3 | «Админка» убрана из левой панели, осталась в правом/лого-меню | `Sidebar.tsx`, `ecosystem.ts:47,71` |
| §9 C1–C4 | Пустое состояние, «Что это?», «Проверить оборудование», кнопка звонка | `screens/calls/{CallsInfoModal,DeviceCheckModal,CallStartModal}.tsx`, `api.startCall` |
| §2 H1–H4 | `web-history` больше не заглушка: единые шапка/подвал (`StandaloneChrome`), реальные версии с API, скролл и отступы | `packages/web-history/src/{App.tsx,main.tsx,styles/global.css}`, `packages/ui/src/components/StandaloneChrome.tsx` |
| §3 D1–D3 | `web-download` больше не заглушка: плитки платформ, состояние «не собрано» без битой ссылки, настоящий QR (`qrcode`), RuStore/Google Play | `packages/web-download/src/{App.tsx,screens/*,lib/*,styles/global.css}` |
| §1 F4 | `.page-container` в `web-features` получил `flex/min-height/overflow` и мобильный padding | `web-features/src/styles/page.css` |

**Проверки (прогон 27.11.2026):**

```
tsc --noEmit  web-history / web-download / web-features / ui / web   → exit 0 (пустой вывод)
vite build    web-history  → ✓ built in 1.95s  (index-L1cNJLfa.js)
vite build    web-download → ✓ built in 2.14s  (index-BrHxeDpj.js)
vite build    web-features → ✓ built in 1.99s  (index-CXiokqbV.js)
vite build    web          → ✓ built in 8.84s  (index-TxwsA2D2.js)
vitest web                 → 57 файлов, 433 теста, 0 failed
node scripts/check-i18n.cjs → словарь 151 / TranslationKey 151, расхождений 0
```

### Выполнено 27.11.2026, второй заход (features / истории / docs)

| Раздел | Что сделано | Доказательство |
|---|---|---|
| §1 F1–F3, F5–F6 | seed 19 фич (11 done / 4 in_progress / 4 planned с волнами), миграция `wave`, бейдж «волна N», общая левая панель `FeaturesSidebar` для списка и формы, `hasVoted` из API | `prisma/seed.ts:seedFeatureRequests`, `migrations/20261127120000_feature_request_wave`, `web-features/src/components/FeaturesSidebar.tsx`, `featureService.ts` (`getFeatures`/`getFeature` + `userId`) |
| §8 T1–T6 | пустое состояние по тексту владельца, 3 демо-ролика (1.6 МБ, без звука), «Загрузить свою историю»/«Настроить приватность», модалка «Что это?», бейдж новых историй во всех меню, активная кнопка «Добавить» | `web/src/screens/stories/{StoriesEmptyState,StoriesInfoModal,demoStories}.tsx`, `web/public/demo-stories/*`, `web/src/store/storiesStore.ts`, `ui/src/components/{RightMenu,Topbar}.tsx`, `ui/src/styles/chrome.css` |
| §4 P1–P2 | `/docs`: единая шапка (пункты ecosystem), подвал как в `@balloo/ui/Footer` (copyright→меню 5 пунктов, «Поддержка», правовой блок, 2 морзе-тикера), скролл без полосы, отступы 24/16 px | `server/src/controllers/docsHtmlController.ts`; `toMorse` вынесен в `shared/src/utils/morse.ts` |
| §9 C4 | кнопка «Позвонить» (`CallStartModal`) + `api.startCall` | коммит `96011e6` |

**Проверки (прогон 27.11.2026):**

```
tsc --noEmit  shared / server / ui / web / web-features  → exit 0
vite build    web          → ✓ built in 8.54s (index-BT-1pVP-.js)
vite build    web-features → ✓ built in 1.99s (index-CeDB5jP7.js)
vite build    web-history  → ✓ built in 1.92s (index-CnpRSwEJ.js)
vite build    web-download → ✓ built in 2.12s (index-DC5aKJuW.js)
vite build    web-admin    → ✓ built in 2.37s
vitest shared  → 5 файлов, 97 тестов, 0 failed
vitest web     → 58 файлов, 440 тестов, 0 failed
vitest web-admin → 4 файла, 36 тестов, 0 failed
jest server    → 56 наборов, 825 тестов, 0 failed
prisma migrate deploy → применено (20261127120000_feature_request_wave)
prisma db seed        → FeatureRequest: 19 фич
```

### Осталось (не сделано — честно)

| Раздел | Почему |
|---|---|
| §1 F7, §2 H6, §3 D5, §4 P3 — i18n новых текстов | идёт тикетом `1795679146` (словарь + 20 локалей) |
| §2 H5, §3 D4 — переключение хостового nginx на `balloo-web-history` (8093) / `balloo-web-download` (8094) | правка владельца на сервере |
| §5 W4 — скриншоты 360/768/1440 | браузера в сессии нет |
| `web-admin`, `desktop`, `mobile-android` (отступы) | не начиналось |

Тикет остаётся в `active/` до браузерной приёмки владельцем.