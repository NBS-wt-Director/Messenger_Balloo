# 1795435146 — Аудит: прод-узлы MVP1 и макеты против кода (мультитикет на подтверждение)

**Создан:** 23.11.2026
**Источник запроса:** владелец (чат 23.11.2026): «curlом и чтением html со всех узлов mvp1 поищи баги и несоответствие тз макетам. дай мне список на проверку и подтверждение»
**Статус:** [!] заблокирован решением владельца — список находок готов, требуется подтверждение (что чиним). Дублировано: `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` → G5.
**Метод:** read-only. Прод — `curl` (замер 23.11.2026). Код/макеты — чтение файлов. Ничего не менялось.

**Легенда критичности:** БЛОКЕР — ломает MVP1-сценарий; ВЫСОКАЯ — заметный дефект; СРЕДНЯЯ — расхождение с макетом; НИЗКАЯ — косметика/документ.
**Легенда уверенности:** подтверждено — есть файл:строка или вывод команды; вероятно — косвенные данные.

---

## 0. Прод-инфраструктура (замер `curl`, 23.11.2026)

| № | Находка | Доказательство | Крит. |
|---|---|---|---|
| P-1 | **`download.balloo.su` не отдаёт файлы.** `/win/BallooSetup.exe`, `/linux/Balloo.AppImage`, `/mac/Balloo.dmg` → `200 text/html` (SPA-заглушка, 1646 б); `/downloads/android/*.apk|aab` → `404`. Кнопки скачивания ведут в никуда | curl | БЛОКЕР |
| P-2 | `GET /api/downloads` → пустые списки `{"desktop":{"win":[],…}}`; клиент подставляет fallback-URL, которые тоже битые (см. P-1) | curl | ВЫСОКАЯ |
| P-3 | Ссылка «Документация API» на экране загрузок → `https://api.balloo.su/doc` → `404`; рабочая — `/docs` (200, 34 КБ) | curl; `packages/web/src/screens/download/DownloadScreen.tsx:437` | СРЕДНЯЯ |
| P-4 | `/robots.txt`, `/favicon.ico`, `/manifest.webmanifest` → отдают `index.html` (`text/html`); PWA-манифест нигде не подключён в `index.html` | curl | СРЕДНЯЯ |
| P-5 | `https://www.balloo.su` → `000` (http при этом 301 → `balloo.su`); `app.balloo.su`, `staging.balloo.su` → `000` | curl | СРЕДНЯЯ |
| P-6 | `history.balloo.su` и `download.balloo.su` отдают тот же бандль, что `balloo.su` (`index-B6MIL7kE.js`); контейнеры `web-history`/`web-download` собраны 20.11, но nginx на них не переключён | curl; признано в `tickets/Done/2026-11-20/1795160995-приёмка-меню-features-docs.md` | СРЕДНЯЯ |
| P-7 | `api.balloo.su/docs` → 200 (меню есть) — дефект 20.11 закрыт, **не баг** | curl | — |

---

## 1. у_01 — balloo.su

| № | Находка | Макет → Код | Крит. |
|---|---|---|---|
| B-1 | «О компании» → ссылка `/#/command` (маршрута нет → 404; command вне MVP1) | `packages/web/src/screens/about/AboutCompanyScreen.tsx:64` | ВЫСОКАЯ |
| B-2 | Контакты → вкладка «Группы» — заглушка «в разработке (тикет #29)» | `mockups/balloo-su/contacts.md:26` → `packages/web/src/screens/contacts/ContactsScreen.tsx:252-256` | ВЫСОКАЯ |
| B-3 | В чате кнопки звонка/пересылки/экспорта PDF/блокировки — `console.log`-заглушки | `packages/web/src/screens/chat/ChatViewScreen.tsx:354-361,397-398` | ВЫСОКАЯ |
| B-4 | Нет ленты историй (`StoriesTray`) над списком чатов | `mockups/balloo-su/stories.md:10-13`; компонент не найден | СРЕДНЯЯ |
| B-5 | Поиск: табы «Чаты/Люди/Файлы/Медиа/Ссылки», наполняется только «Люди» | `packages/web/src/screens/search/SearchScreen.tsx:99-119` | СРЕДНЯЯ |
| B-6 | Донат: нет прогресса цели, 4 уровней, способов оплаты (карта/СБП/crypto/ЮMoney), топ-доноров | `mockups/balloo-su/donate.md:8-14` → `packages/web/src/screens/donate/DonateScreen.tsx:88-156` | СРЕДНЯЯ |
| B-7 | Создание сторис: нет шрифта/стикеров/срока (24ч/7д/30д)/разрешения ответов/черновика; лимит 50 МБ вместо 10 МБ | `mockups/balloo-su/story-create.md:11-16` → `packages/web/src/screens/stories/StoryCreateScreen.tsx:94,212-233` | СРЕДНЯЯ |
| B-8 | Приглашения: нет поля «Email приглашаемого» | `mockups/balloo-su/invites.md:30` → `packages/web/src/screens/invites/InvitesScreen.tsx:266-385` | СРЕДНЯЯ |
| B-9 | Контакты: нет детальной карточки (био, ДР, дата регистрации, кнопки 📞/📹, чипы) | `mockups/balloo-su/contacts.md:28-34` → `ContactsScreen.tsx:219-234` | СРЕДНЯЯ |
| B-10 | API-пути макета ≠ код (системно): 2FA (`/auth/2fa/setup`→`/api/auth/2fa/enable`), восстановление пароля (`/auth/password-reset/*`→`/api/auth/request-reset`), профиль (`PATCH /users/me`→`PUT /api/users/me`, `POST /users/me/avatar`→`POST /api/upload/avatar`), архив (`/chats/archived`→`/api/archive`), устройства (`DELETE /sessions/:id`→`DELETE /api/devices/:id`), контакты (`/contacts`→`/api/users/contacts`), уведомления, настройки | `packages/web/src/services/api.ts:178-188,228-232,236,255,411,679,918-919,948-953,1088` | СРЕДНЯЯ |
| B-11 | Группы/группы контактов: макет `/api/v1/groups/:id*`, код `/api/chats/:chatId`, `/api/users/contact-groups` | `mockups/balloo-su/group-settings.md:53-72` → `api.ts:898-938` | СРЕДНЯЯ |

## 2. у_00 — shared

| № | Находка | Доказательство | Крит. |
|---|---|---|---|
| C-1 | Экраны **403** и **500** есть в коде, но маршрутов `/403`, `/500` нет → недостижимы; `ErrorBoundary` показывает свою заглушку | `packages/web/src/pages/ForbiddenPage.tsx`, `pages/ServerErrorPage.tsx` — не импортируются; `router/index.tsx` — маршрутов нет | ВЫСОКАЯ |
| C-2 | 404: в макете две кнопки («← Назад» + «На главную»), в коде только «На главную» | `mockups/shared/error-404.md:21` → `packages/web/src/screens/shared/NotFoundScreen.tsx:56-67` | НИЗКАЯ |
| C-3 | Ban-appeal и 555: данные статичны, API `/api/v1/bans/*` не вызывается | `packages/web/src/screens/shared/BanAppealScreen.tsx:13-19,52-54`; `Error555Screen.tsx` | СРЕДНЯЯ |
| C-4 | Макеты требуют общие компоненты в `packages/shared/src/components/` — каталога нет | `mockups/shared/error-403.md:45`; `packages/shared/src/` | СРЕДНЯЯ |

## 3. у_02 — admin

| № | Находка | Макет → Код | Крит. |
|---|---|---|---|
| D-1 | Экран «Метрики» (Prometheus/Grafana/ELK) отсутствует; `/analytics` — другая страница (DAU/MAU/Retention) | `mockups/admin-balloo-su/metrics.md:26-68` → `packages/web-admin/src/App.tsx:140` | ВЫСОКАЯ |
| D-2 | «Версии»: код зовёт `/api/history/versions`, табы Все/Опубликованы/Черновики/Архив; макет — таблица+форма, `/api/admin/versions` | `mockups/admin-balloo-su/versions.md:15` → `packages/web-admin/src/screens/VersionsScreen.tsx:287,342` | ВЫСОКАЯ |
| D-3 | «Тексты»: макет — табы Онбординг/Правила/О компании/О Balloo + матрица переводов; код — плоский список `/api/knowledge/pages` | `mockups/admin-balloo-su/texts.md:36-99` → `TextsScreen.tsx:20-61` | ВЫСОКАЯ |
| D-4 | Вход админа (2FA/TOTP/QR) отсутствует — редирект на главный сайт | `mockups/admin-balloo-su/login.md:6-55` → `packages/web-admin/src/components/AdminGuard.tsx:12-33` | СРЕДНЯЯ |
| D-5 | Sidebar: 26 пунктов в коде vs 14 в макете | `packages/web-admin/src/components/AdminLayout.tsx:11-41` | СРЕДНЯЯ |
| D-6 | API: макет `/api/v1/admin/*`, код `/api/admin/*`; алерты захардкожены | `packages/web-admin/src/services/api.ts:601,628,664-667` | СРЕДНЯЯ |
| D-7 | Feature flags: нет обязательной причины выключения, даты повторного включения, notify | `mockups/admin-balloo-su/features-flags.md:4-15` → `FeatureFlagsScreen.tsx:381-395` | СРЕДНЯЯ |
| D-8 | «Пользователи»: нет кнопки «Сотрудник» (promote → роль) | `UsersScreen.tsx:642-705` | СРЕДНЯЯ |
| D-9 | Экраны `blog-review`/`blog-migrate`/`blog-stats` без маршрутов (blog вне MVP1 — возможно, норма) | `packages/web-admin/src/App.tsx:152-154` | НИЗКАЯ |

## 4. у_05 — history

| № | Находка | Макет → Код | Крит. |
|---|---|---|---|
| E-1 | API: макет `GET /api/versions` (+`?status=…`), код `/api/history/versions` | `mockups/history-balloo-su/version-list.md:28-30` → `api.ts:766` | ВЫСОКАЯ |
| E-2 | Список версий: макет — плоские карточки со стрелкой, код — вертикальный timeline | `HistoryTimeline.tsx:31-70` | СРЕДНЯЯ |
| E-3 | Донат: нет отдельной страницы узла history (общий `/donat`) | `router/index.tsx:229-237` | СРЕДНЯЯ |

## 5. у_06 — download

| № | Находка | Макет → Код | Крит. |
|---|---|---|---|
| F-1 | «Грустная карточка» платформы без образа (пунктир, `grayscale`, текст-извинение) отсутствует | `mockups/download-balloo-su/downloads.md:45-50` → `DownloadScreen.tsx:206-408` | ВЫСОКАЯ |
| F-2 | Особый Apple-текст-извинение («Мы — российская компания…») отсутствует | `downloads.md:50` → `DownloadScreen.tsx:336-384` | ВЫСОКАЯ |
| F-3 | Ссылка RuStore отсутствует (только Google Play) | `downloads.md:39,100` → `DownloadScreen.tsx:316-323` | ВЫСОКАЯ |
| F-4 | Боковая колонка платформ (главная `--accent` + «✓ Ваша платформа») не реализована — равные карточки | `downloads.md:26-34` → `DownloadScreen.tsx:206-242` | СРЕДНЯЯ |
| F-5 | PWA-плитка только в mobile-ряду (в макете — в обоих) | `downloads.md:34,43,75` → `DownloadScreen.tsx:386-407` | СРЕДНЯЯ |
| F-6 | Windows: recommended-пакет `.exe`, в макете основной `.msi` | `downloads.md:63` → `DownloadScreen.tsx:44` | СРЕДНЯЯ |
| F-7 | Тексты: баннер «Мы определили…» vs «Вы используете…»; дата «30 июля 2026» vs «16 июля»; «Что нового» vs «Предыдущие версии» | `downloads.md:21`; `downloads.html:169,301-304` → `DownloadScreen.tsx:187,423-431` | НИЗКАЯ |

## 6. у_08 — mobile (Android)

| № | Находка | Макет → Код | Крит. |
|---|---|---|---|
| G-1 | Нижняя навигация: 5 вкладок в макете (Чаты/Контакты/**Сторис**/**Звонки**/Настройки) vs 4 в коде (Чаты/Контакты/**Блог**/Настройки) | `mockups/mobile/settings.md:102-106` → `packages/mobile-android/app/(tabs)/_layout.tsx:22-57` | БЛОКЕР |
| G-2 | Многие экраны недостижимы: `main = expo-router/entry`, шим маппит только ChatView/Login/Register/ResetPassword/2FA/Main; остальные → Alert «Скоро»/«недоступен» | `packages/mobile-android/package.json:6`; `src/router/expoNavigation.ts:43-54` | БЛОКЕР |
| G-3 | Правое меню: нет языка/3 тем/приватности/техподдержки/правил/аккаунтов; полноэкранное вместо панели 320px | `mockups/mobile/right-menu.md:50-58` → `src/screens/HeaderMenuScreen.tsx:24-34` | ВЫСОКАЯ |
| G-4 | PollEditor: 1 тип vs 5 (Опрос/Квиз/Актив. список/Пассив. список/Персонали) | `mockups/mobile/poll-editor.md:21-41` → `PollEditorScreen.tsx:42-58` | ВЫСОКАЯ |
| G-5 | Donate: уровни 50/150/500/1000 ₽ vs Кофе 100/Спонсор 500/Платиновый 5000/«Своя сумма»; нет цели, оплаты, топ-доноров | `mockups/mobile/donate.md:11-16` → `DonateScreen.tsx:10-15` | ВЫСОКАЯ |
| G-6 | Настройки: «Устройства» только Windows PC; «Донаты» — одна кнопка; 2FA — Switch без API | `mockups/mobile/settings.md:61-91` → `SettingsScreen.tsx:266-273,328-359` | СРЕДНЯЯ |
| G-7 | Урезаны vs макет: MyDevices, AddDevice (QR), Archive (поиск/восстановление), ChatAttachments (вкладки Аудио/Опросы), ReportMessage (другие причины), MediaViewer, VoiceRecord (waveform/пауза), CallsHistory (кнопки звонка) | см. таблицу разбора (файлы `src/screens/*`) | СРЕДНЯЯ |
| G-8 | API-пути расходятся: донат `/api/donate/*`→`/api/payments/*`; «Мои донаты», устройства, контакты, профиль, опрос | `packages/mobile-android/src/services/api.ts:183,296,352,499,516,519,523,616,648` | СРЕДНЯЯ |
| G-9 | Лишние экраны вне 24 макетов: Blog (и вкладка «Блог»), ChannelView, Search, Hiring, Knowledge | `src/screens/{BlogScreen,ChannelViewScreen,SearchScreen,HiringScreen,KnowledgeScreen}.tsx` | НИЗКАЯ |

## 7. у_09 — desktop (Electron)

| № | Находка | Доказательство | Крит. |
|---|---|---|---|
| H-1 | **Desktop-экраны не подключены:** `DesktopApp.tsx` рендерит web-роутер (`@balloo/web/router`), все `Desktop*Screen` — мёртвый код | `packages/desktop/src/renderer/src/DesktopApp.tsx:7,18` | БЛОКЕР |
| H-2 | Экранов «Вход»/«Регистрация» нет в desktop | `packages/desktop/src/renderer/src/screens/index.ts` | БЛОКЕР |
| H-3 | Режимы окна (компактный/трей) не реализованы; компактный 380px невозможен (`minWidth: 900`) | `mockups/desktop/modes.md:20` → `packages/desktop/src/main/main.ts:36` | ВЫСОКАЯ |
| H-4 | Окно не frameless (`frame:false`/`titleBarStyle` нет) → двойной заголовок | `packages/desktop/src/main/main.ts:33-47` | ВЫСОКАЯ |
| H-5 | Deep links `balloo://…` не обрабатываются | `packages/desktop/src/main/main.ts` (нет `open-url`/`setAsDefaultProtocolClient`) | ВЫСОКАЯ |
| H-6 | Statusbar, tray-бейдж непрочитанных, глобальные хоткеи (`globalShortcut`, `Alt+Space`) — отсутствуют | `packages/desktop/src/main/main.ts:98-139` | СРЕДНЯЯ |
| H-7 | Урезаны vs макет: Settings (13 категорий→6 секций), Profile (10 секций→форма), NotificationSettings (8→6), Contacts (нет табов), MyDevices, AddDevice (QR), 2FA (verify вместо setup), MediaViewer, Chat (заглушка) | `mockups/desktop/*.md` → `src/renderer/src/screens/*` | ВЫСОКАЯ |
| H-8 | API-пути расходятся (устройства `/sessions`, архив `/chats?archived`, донаты `/api/donate/*`, жалоба `/chats/:id/report`) | `packages/web/src/services/api.ts:718-725,948-953,968-977,1103-1104` | СРЕДНЯЯ |
| H-9 | Аватары: макет-кит — октагон (`clip-path`), код — круглые (`border-radius:50%`) | `mockups/assets/common.css:315-347` → `DesktopContactsScreen.tsx:62` и др. | НИЗКАЯ |

## 8. Системные (сквозные)

| № | Находка | Крит. |
|---|---|---|
| S-1 | Почти во **всех** `.md`-макетах заявлен стек «React 19 + Next.js 15 (SSR)», фактически — React 18 + Vite, SPA, hash-роутер. Примеры: `mockups/balloo-su/chats.md:127`, `mockups/admin-balloo-su/dashboard.md:79`, `mockups/history-balloo-su/version-list.md:20,37`, `mockups/desktop/overview.md:57` | НИЗКАЯ (документ) |
| S-2 | Макеты обещают префикс `/api/v1/...` и ряд путей (`/api/versions`, `/api/blocklist`, `/api/settings/notifications`, `/api/donate/*`), код использует `/api/...` без `v1` и другие пути | СРЕДНЯЯ |
| S-3 | `.md`-макеты перечисляют отсутствующие в проекте стек/компоненты (`Hono`, `uWebSockets`, `expo-secure-store`, `expo-image-picker`, `MobileChatScreen` и др.) | НИЗКАЯ |

---

## 9. Не считаю багами (проверено, чтобы не тратить время владельца)

- **features/docs в лого-меню** (`packages/ui/src/components/ecosystem.ts:72,75`) — **решение владельца 13.11.2026**, зафиксировано в `tickets/Done/2026-11-20/1795160995-приёмка-меню-features-docs.md`.
- **`api.balloo.su/docs`** работает (200, меню есть) — дефект закрыт 20.11.
- **history/download отдают общий SPA** — признано отдельным решением владельца (P-6).
- **iOS-код отсутствует** — iOS вне MVP1.

---

## 10. Что нужно от владельца

Отметить номера, которые **чиним** (например: «P-1, P-2, B-1, C-1, G-1, G-2, H-1»). После этого:
- каждый подтверждённый пункт разбивается на атомарный тикет `tickets/active/<unix>.md` с проверяемым критерием;
- пункты «расхождение .md ↔ код» (S-1, S-3) — либо привести макеты к факту, либо код к макету (решение владельца);
- прод-пункты (P-1…P-6) — батчи деплоя/nginx, в `with_lord/`.

## 11. Критерии готовности

- Владелец подтвердил список «чиним / не чиним».
- Подтверждённые пункты разбиты на атомарные тикеты с доказательствами.
- Тикет закрыт в `tickets/Done/2026-11-23/`.

## 12. Оговорки

- Прод-замеры сделаны 23.11.2026 read-only (`curl`); состояние прода меняется — перед правками перепроверять.
- Находки по коду — сверка чтением (файл:строка); фактический рендер в браузере не проверялся (кроме прод-кодов).
- Разбор вели по узлам MVP1: у_00, у_01, у_02, у_05, у_06, у_08, у_09. Вне MVP1 (у_03 command, у_04 features, у_07 docs, у_10 specifity, у_11 blog) — не разбирались.
