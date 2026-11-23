# Тикет 1795292000 — Единая шапка/подвал на всех экранах + активный заголовок

**Создан:** 22.11.2026
**Статус:** в работе

## Запрос владельца (приёмка после `ad86d1b`)

> - на всех экранах нужна шапка и подвал. одинаковые.
> - ошибка на экране историй.
>
> уточнения: «3. включаем. 1. б. как на чатах. для авторизованных и не
> авторизованных правые отдельные. если нет аватарки — логотип компании.
> кнопка заголовка активная (активация режима обучения, бегущая строка
> уведомления, после показа возвращается заголовок). адаптивная вёрстка.
> на всех экранах одна шапка.»

Расшифровка требований:

| № | Требование | Как реализуем |
|---|---|---|
| 1 | Одна шапка и один подвал на **всех** экранах (вкл. онбординг и оверлеи) | Единый `AppTopbar`+`AppFooter`; недостающие экраны оборачиваем `PageChrome` |
| 2 | Шапка «как на чатах»: заголовок раздела по центру, действия, правый блок | `AppTopbar` читает конфиг заголовка (контекст) + правый блок по авторизации |
| 3 | Правые блоки авторизованного и гостя — разные | auth: колокольчик + **частное меню** (аватар); гость: «Войти» + **общее меню** (маскот) |
| 3а | **Два правых меню** (уточнение владельца 22.11): частное (только авторизован, аватар/лого) и общее (всем, маскот, самое правое) | `PrivateRightMenu` + `RightMenu`; `Topbar` рендерит оба |
| 4 | Нет аватарки → логотип компании | триггер `PrivateRightMenu`: `avatarUrl ? <img> : /assets/logos/company-logo.png` |
| 5 | Кнопка заголовка активна: режим обучения + бегущая строка уведомления → возврат заголовка | `uiStore`: `learningMode`, `notice`; клик по заголовку; тикер на время показа |
| 6 | Адаптивная вёрстка | `chrome.css`: мобильные правила для заголовка/тикера |

## Разбор (найдено в коде)

- Шапка — единый компонент `Topbar` (`@balloo/ui`), обёртка `AppTopbar` (web).
  Подвал — `Footer` / `AppFooter`. Рамки: `MainLayout` (3 колонки) и
  `PageChrome` (одиночная страница).
- **Нет шапки/подвала вовсе:** `/invites`, `/bots`, `/my-devices`,
  `/my-donates`, `/onboarding`, `/active-call`, `/chats/:id/attachments`,
  `/messages/:id/report`, `/messages/:id/edit`, `/ban-appeal`.
- **Есть шапка, нет подвала:** `/support`, `/pair-scan`.
- **Заголовок жёстко «Чаты»** на всех экранах `MainLayout` (`MainLayout.tsx:82`),
  хотя `AppTopbar` умеет `title` — на `/contacts`, `/stories`, `/settings`
  заголовок неверный.
- **`onTitleClick` не используется нигде** — заголовок неактивен.
- Аватар в правом блоке при отсутствии `avatarUrl` рисует инициалы, а не
  логотип компании (`MainLayout.tsx:113`, `RightMenu.tsx:184`).
- Ошибка на Историях — уже исправлена в тикете `1795290222`
  (объектный ответ `/api/stories` ронял экран в ErrorBoundary).

## Шаги

- [x] 1. `uiStore` (web): `learningMode` + `notice` (бегущая строка)
- [x] 2. Заголовок раздела: `sectionTitleForPath` (MainLayout показывает раздел, а не «Чаты»)
- [x] 3. `AppTopbar`: правый блок по авторизации, фолбэк аватара — логотип компании
- [x] 4. `AppTopbar`: активная кнопка заголовка — режим обучения + тикер уведомления
- [x] 5. `MainLayout`: единая шапка с заголовком раздела (правый блок строит AppTopbar)
- [x] 6. Шапка+подвал: invites, bots, my-devices, my-donates, onboarding, support, pair-scan
- [x] 7. Шапка+подвал на оверлеях: active-call, attachments, report, message-editor, ban-appeal
- [x] 8. Адаптивная вёрстка (`chrome.css`, `design-system.css`)
- [x] 9. Тесты нового поведения
- [x] 10. Проверки: `tsc --noEmit`, `pnpm test:web`, `vite build`

## Выполнено

**Два правых меню (`packages/ui/src/components/RightMenu.tsx`)**

Уточнение владельца 22.11.2026: правых меню ровно два, а маскоты в макетах —
лишь место для аватарки/логотипа компании в частном меню.

- `PrivateRightMenu` (ЧАСТНОЕ) — только авторизованному. Триггер: аватарка
  пользователя, нет — логотип компании. Панель: частные пункты приложения
  (Профиль/Контакты/Истории/Приглашения/Настройки/Аккаунты). В гостевом режиме
  не рендерится вовсе.
- `RightMenu` (ОБЩЕЕ) — для всех, САМОЕ ПРАВОЕ. Триггер: статичный маскот 🐻.
  Панель: язык, тема, юр. ссылки; авторизован → «Выйти», гость → «Вход»/«Регистрация».
- Общее поведение панели вынесено в `usePanelBehavior` (клик вне + Escape).
- Порядок в блоке: `[контент экрана] [частное] [общее]`.

**Единая шапка (`packages/ui/src/components/Topbar.tsx`, `packages/web/src/components/chrome/AppTopbar.tsx`)**
- `Topbar` рендерит оба меню: частное — при `auth.isAuthenticated`, общее — всегда.
- `AppTopbar` строит контент правого блока ПЕРЕД меню: авторизован — колокольчик,
  гость — кнопка «Войти»; в оба меню прокидывает `initials`/`avatarUrl`/`onLogout`.
- Явные маскоты `right` убраны с экранов 404/503/555/офлайн/логин/регистрация/
  2FA/сброс пароля/add-device — там теперь авто-блок.
- Активная кнопка заголовка: клик включает режим обучения и показывает
  бегущую строку уведомления; по окончании показа заголовок возвращается.

**Заголовок раздела**
- `packages/web/src/components/chrome/sectionTitles.ts` — `sectionTitleForPath`.
- `MainLayout` показывает раздел текущего маршрута (было «Чаты» на всех).

**Режим обучения и тикер**
- `packages/web/src/store/uiStore.ts` — `learningMode`, `notice`, `toggleLearningMode`,
  `setNotice`, `showNotice(message, durationMs)`.
- `packages/web/src/components/chrome/LearningHelp.tsx` — панель справки.
- `packages/ui/src/components/Topbar.tsx` — `title` теперь `ReactNode` (тикер).
- `packages/ui/src/styles/chrome.css` — `.topbar__login-btn`, `.topbar__ticker`
  (+ анимация, `prefers-reduced-motion`), мобильные правила.
- `packages/web/src/styles/design-system.css` — `.learning-help*`, `.onboarding` под шапку.

**Шапка+подвал на всех экранах**
- Обёрнуты `PageChrome`: invites, bots, my-devices, my-donates, onboarding,
  active-call, chat-attachments, report-message, message-editor, ban-appeal.
- Подвал добавлен: support, pair-scan.
- `PageChrome` контентная область — `position: relative` (оверлеи внутри неё,
  шапка/подвал не перекрываются); `BanAppealScreen` — `fixed` → `absolute`.

**Тесты**
- `packages/web/src/__tests__/components/AppTopbar.test.tsx` (7) — правый блок,
  два меню и их порядок, логотип-фолбэк частного меню, режим обучения, бегущая строка.
- `packages/web/src/__tests__/components/RightMenu.test.tsx` (14) — состав общего
  меню (гость/авторизован), триггер-маскот, поведение панели; отдельный блок
  `PrivateRightMenu` (пункты, переходы, аватар/логотип).
- `packages/web/src/__tests__/components/sectionTitles.test.ts` (12).
- `packages/web/src/__tests__/components/LoginScreen.test.tsx` — submit-кнопка
  ищется внутри `.auth-card` (в шапке гостя тоже есть «Войти»).

### Доказательства

```
pnpm --filter @balloo/ui  exec tsc --noEmit   → exit 0
pnpm --filter @balloo/web exec tsc --noEmit   → exit 0
pnpm --filter @balloo/web exec vitest run     → Test Files 47 passed, Tests 354 passed
pnpm --filter @balloo/web exec vite build     → ✓ built in 7.92s
```

### Деплой

- Изменения только в `packages/web` и `packages/ui` (собирается в web-образ).
- Сервер не менялся; миграций нет (`packages/shared/prisma` не трогали).
- Нужен пересбор/перезапуск **только `web`**.
- **Задеплоено:** входит в прод-диапазон до `65b4606` (батчи 22–23.11.2026);
  бандль прода `index-BMWJl9HD.js` содержит `learning-help`/частное меню
  (`balloo-private-menu-btn`). Приёмка — на владельце.

### Не вошло (на решение владельца)

- Источник бегущей строки: публичного эндпоинта объявлений нет (`/api/admin/announcements`
  — только админ). Сейчас тикер показывает сообщение режима обучения; для реальных
  уведомлений нужен публичный эндпоинт (задача владельцу).

## Дополнение: ErrorBoundary «Что-то пошло не так» после деплоя (22.11, вечер)

**Симптом (скриншот владельца):** `balloo.su` (маршрут `/`) показывает фолбэк
ErrorBoundary «Что-то пошло не так / Произошла непредвиденная ошибка при
рендеринге компонента», без шапки и подвала.

**Проверка прода (read-only):**

- бандл прода — наша сборка (`balloo-private-menu-btn`, `learning-help` в
  `assets/index-DaZeFBCP.js`); все 71 чанк из `__vite__mapDeps` отдаются 200;
- `index.html`/`sw.js` — `cache-control: no-cache`, хешированные ассеты — `immutable`;
- прогон Cypress (electron, блокировка внешних шрифтов/Метрики) по 13 маршрутам
  прода в чистом профиле: **ошибок нет**, экраны рендерятся (онбординг, вход,
  приглашения, боты, устройства, донаты, обжалование, pair-scan).

**Причина (воспроизведена локально):** динамический импорт чанка падает
(чанк старой сборки удалён с сервера, а вкладка получила `index.html` прежней
сборки — например, SW отдал кэш в момент перезапуска контейнера). Имитация 404
на чанк даёт **ровно тот же экран**:

```
CONSOLE.ERROR: TypeError: Failed to fetch dynamically imported module: .../OnboardingScreen-*.js
EVENT: vite:preloadError
BODY: ⚠️ / Что-то пошло не так / Произошла непредвиденная ошибка при рендеринге компонента. / Обновить страницу
```

Без перезагрузки экран не восстанавливается — у пользователя нет выхода, кроме
кнопки.

**Исправление:**

- `packages/web/src/utils/preloadErrorGuard.ts` — подписка на `vite:preloadError`
  (Vite шлёт его при ошибке динамического импорта): вкладка перезагружается и
  получает свежий `index.html` + актуальные чанки. Кулдаун 10 с (sessionStorage)
  защищает от цикла, если чанк отсутствует по-настоящему.
- `packages/web/src/main.tsx` — установка guard до рендера приложения.
- `packages/web/src/__tests__/utils/preloadErrorGuard.test.ts` — 4 теста
  (перезагрузка, кулдаун, повтор после кулдауна, недоступный sessionStorage).

**Проверка исправления (Cypress, живой бандл):** первый запрос чанка — 404,
дальше — нормальный ответ: вкладка перезагрузилась сама (`HITS: 2`),
ErrorBoundary не показан.

```
pnpm --filter @balloo/ui  exec tsc --noEmit   → exit 0
pnpm --filter @balloo/web exec tsc --noEmit   → exit 0
pnpm --filter @balloo/web exec vitest run     → Test Files 48 passed, Tests 358 passed
pnpm --filter @balloo/web exec vite build     → ✓ built
```
