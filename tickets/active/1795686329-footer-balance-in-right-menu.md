# Тикет — Подвал: пункты меню в правом меню + экран «Баланс»

**Создан:** 26.11.2026
**Источник:** владелец (чат 26.11.2026)
**Связано:** `tickets/active/1795677854` (подвал), `tickets/active/1795677071` (платность MVP2, n+5 баллов)

## Требование владельца (дословно)

> нужно скопировать меню из копирайта в правое меню (как «о нас»).
> и добавить пользовательскому меню экран «баланс» (на кнопке отображаем
> состояние баланса пользователя)
>
> на нём пишем — «пока нет платных услуг значит пополнить баланс нет
> необходимости и возможности. когда тут что-то появится — мы вам сообщим.
> если вы хотите поддержать нас и ускорить этот момент — [поддержите нас]»
> только более привлекательно сформулируй.
>
> и всем пользователям зарегистрировавшимся до mvp3 на баланс зачисляем
> 555 баллов.

## Текущее состояние

| Факт | Где |
|---|---|
| Меню копирайта подвала (FOOTER_MENU_ITEMS) — 5 пунктов: О компании, Контакты, О Balloo, Другие проекты компании, Поддержать нас | `Footer.tsx:32-38` |
| Правое меню (общее) — RightMenu: язык, тема, поддержка/прайвас/прайвеси, логин/регистрация | `RightMenu.tsx:187-318` |
| Частное правое меню (PrivateRightMenu) — для авторизованных: Профиль, Контакты, Истории, Приглашения, Настройки, Аккаунты | `RightMenu.tsx:105-114` |
| Пункты правого меню задаются через `DEFAULT_ACCOUNT_ITEMS` (PrivateRightMenu) и `DEFAULT_LEGAL_ITEMS` (RightMenu) | `RightMenu.tsx:94-114` |
| Экраны «О компании» и «О Balloo» существуют, есть роуты `/about-company`, `/about-balloo` | `router/index.tsx:198-214` |
| Экран «Баланс» — отсутствует | grep `balance` по web → 0 |
| Модель баланса / баллов — отсутствует | grep `balance` и «балл» по schema → 0 |
| Есть Donation / PaymentConfig (донаты, СБП, ЮKassa) | `schema:988-1010`, `routes/payments.ts` |
| Платность вложений (MVP2) — n+5 баллов, n>15 | `1795677071`, `docs/05-frontend-spec.md:296` |
| Модель User имеет `createdAt: BigInt` (ms timestamp) | `schema:132` |
| Точки создания `User` при регистрации: email/пароль и OAuth | `authService.ts:265`, `authService.ts:1122` |
| i18n — 20 локалей, ключи строго типизированы в `TranslationKey` | `translations.ts:1-139` |
| i18n правило: каждая UI-строка — через `t('namespace.key')`, ключи в 20 языках | `AGENTS.md` п.22 |

## Что требуется

### Задача 1: Секция «О нас» в общем (глобальном) правом меню

**Решение владельца (26.11.2026):** в **общее** правое меню (`RightMenu`, триггер —
маскот 🐻, видно всем) добавляется **новая секция «О нас»** — **между секцией
«Тема» и секцией с техподдержкой/юр. пунктами**. В неё копируются пункты из меню
копирайта подвала (`FOOTER_MENU_ITEMS`, `Footer.tsx:32-38`).

Меню копирайта подвала (5 пунктов):

| Пункт | Ключ перевода | Путь | Иконка (предложение) |
|---|---|---|---|
| О компании | `menu.aboutCompany` (новый) | `/about-company` | 🏢 |
| Контакты | `footer.contacts` (новый; `menu.contacts` = «Контакты» приложения, не путать) | `/coming-soon?name=Контакты` | 📞 |
| О Balloo | `menu.aboutBalloo` (новый) | `/about-balloo` | ℹ️ |
| Другие проекты компании | `menu.otherProjects` (новый) | `/coming-soon?name=Другие%20проекты%20компании` | 🌐 |
| Поддержать нас | `menu.donate` (новый; `footer.donate` = «Донат» — не подходит по смыслу) | `/donat` | ❤️ |

Порядок секций в панели `RightMenu` после правки:

```
Язык / Language  →  Тема  →  ── divider ──  «О нас» (новая секция)
                     →  ── divider ──  юр. пункты (Техподдержка/Приватность/Правила)
                     →  ── divider ──  Аккаунт (Выйти / Вход+Регистрация)
```

**Реализация:**
- `RightMenu.tsx:269-271` — сразу после блока «Тема» (перед существующим
  `<div className="right-menu__divider" />` юр. секции) вставить:
  `<div className="right-menu__section-label">{t('menu.sectionAboutUs')}</div>` +
  5 пунктов по образцу рендера `legal.map(...)` (`RightMenu.tsx:274-285`).
- Новый массив `ABOUT_US_ITEMS: RightMenuItem[]` рядом с `DEFAULT_LEGAL_ITEMS` +
  экспорт (тест сверяет наличие ключей в словаре).
- `ecosystem.ts` — в `rightMenuTargetsForHost()` добавить поле `aboutUs`
  (хост-осознанные цели: на чужих поддоменах — абсолютные hash-URL через
  `mainSiteUrl()`), прокинуть в `RightMenuProps.aboutItems`.
- i18n: новые ключи + 20 локалей (см. Шаг 1).
- В **частное** меню (`PrivateRightMenu`) эти пункты **не** добавляем —
  оно остаётся как есть + только пункт «Баланс» (Задача 2).

### Задача 2: Экран «Баланс»

Новый экран `/balance` для авторизованных пользователей.

#### 2a. Контент экрана

> **Заголовок:** Баллы Balloo
>
> **Текст (переработать привлекательно, но не выдумывать сверх сути):**
> У нас ещё нет платных услуг — пополнять баланс пока не нужно.
> Как только запустим монетизацию — сообщим вам первыми.
> А пока можете поддержать проект и ускорить этот момент:
> [Поддержать нас ❤️] → ссылка на `/donat`
>
> **На кнопке в частном правом меню:** отображение текущего баланса — `N баллов`
> (или `0 баллов` / `555 баллов` и т.д.)

#### 2b. Модель данных

**Вариант A (минимальный):** добавить `balancePoints Int @default(0)` в модель `User`.
- Плюс: просто, быстро, одно поле.
- Минус: нет истории начислений.

**Вариант B (рекомендованный):** отдельная модель `BalanceTransaction` (ledger) + вычисляемое поле `balance` через Prisma computed field или сервисный слой.
- Плюс: полный аудит, поддержка списаний (MVP2 платность вложений n+5 баллов).
- Минус: больше миграций.

> **Решение:** для MVP1 — **Вариант A** (поле на User). Ledger (B) — в MVP2 при запуске монетизации.

**Миграция:** `ALTER TABLE "User" ADD COLUMN "balancePoints" INTEGER NOT NULL DEFAULT 0`.

#### 2c. Начисление 555 баллов

**Решение владельца (26.11.2026):** «начисляем сразу по факту регистрации» —
никакой отсечки по дате MVP3 нет. Бонус = **555 баллов при регистрации**.

- **Новые пользователи** — `balancePoints: 555` в момент создания `User`
  (две точки создания, обе покрыть):
  - `authService.ts:265` — регистрация по email/паролю (`register()`);
  - `authService.ts:1122` — регистрация через OAuth-провайдер (первый вход).
- **Уже зарегистрированные** (все, кто есть в БД на момент выката миграции) —
  одноразовое начисление в миграции/seed: `UPDATE "User" SET "balancePoints" = 555`
  (идемпотентно: `WHERE "balancePoints" = 0`, повторный прогон ничего не меняет).
- Ledger/история начислений — MVP2 (см. 2b).

#### 2d. Показ баланса в правом меню

**Решение владельца (26.11.2026): только в частном меню.**

- В `PrivateRightMenu` (`DEFAULT_ACCOUNT_ITEMS`) → пункт «Баланс» с иконкой 💰,
  лейблом `N баллов` (склонение — см. Шаг 1), клик → `/balance`.
- В общем меню (`RightMenu`, маскот) баланс **не** показываем.
- Баланс читается из `User.balancePoints` через `GET /api/users/me` (или
  добавляется в существующий эндпоинт).
- Стейт: `authStore`/`userStore` → `balancePoints: number`, прокидывается
  `Topbar → PrivateRightMenu`.

### Задача 3: Роут и экран

- `packages/web/src/screens/balance/BalanceScreen.tsx` (новый)
- Роут `/balance` в `packages/web/src/router/index.tsx` — в приватной секции (требует авторизации)
- Стилизация в духе существующих экранов: `AppTopbar` + `AppFooter`, центрированный контент-блок

## План реализации

### Шаг 1: i18n — новые ключи

- [x] `TranslationKey` — добавлены: `menu.sectionAboutUs`, `menu.aboutBalloo`,
  `menu.otherProjects`, `menu.donate`, `menu.balance`, `points.one/few/many`,
  `balance.title`, `balance.yourBalance`, `balance.noServicesTitle`,
  `balance.noServicesBody`, `balance.supportTitle`, `balance.supportBody`.
  («О компании» и «Контакты» переиспользуют существующие `footer.about` и
  `menu.contacts` — тот же русский текст, 20 локалей.)
- [x] `translations.ts` — 20 локалей для каждого нового ключа
  (ru/tt/ba/ce/cv/av/dar/udm/lez/kbd/chm/os/sah/bua/uk/zh/hi/be/en/fr)
- [x] Склонение баллов: `packages/shared/src/i18n/plural.ts` — `pluralFormFor`,
  `pluralKeyFor` (ru/uk/be — тройная форма; остальные — общая)
- [x] Ключи `points.one` / `points.few` / `points.many` в 20 локалях
- [x] Юнит-тест `packages/shared/src/__tests__/plural.test.ts` (21 проверка)

### Шаг 2: База данных

- [x] Миграция `packages/shared/prisma/migrations/20261126120000_user_balance_points/`
  - `ALTER TABLE "users" ADD COLUMN "balancePoints" INTEGER NOT NULL DEFAULT 0`
  - `UPDATE "users" SET "balancePoints" = 555 WHERE "balancePoints" = 0`
- [x] `schema.prisma` — `User { balancePoints Int @default(0) }`
- [x] `prisma generate` + `migrate deploy` (локальная БД — применено)

### Шаг 3: Начисление 555 при регистрации

- [x] `authService.ts` (email/пароль) — `balancePoints: REGISTRATION_BONUS`
- [x] `authService.ts` (OAuth) — `balancePoints: REGISTRATION_BONUS`
- [x] `serviceController.ts` (service API create user) — `balancePoints: REGISTRATION_BONUS`
- [x] Константа `REGISTRATION_BONUS = 555` — `packages/shared/src/constants/points.ts`
- [x] `balancePoints` в ответах login/2FA/register/OAuth

### Шаг 4: Сервер — баланс в /me

- [x] `GET /api/users/me` — возвращает `balancePoints` (`userService.getMe`)

### Шаг 5: Меню — секция «О нас» (общее) и «Баланс» (частное)

- [x] `RightMenu.tsx` — `DEFAULT_ABOUT_ITEMS` + рендер между «Темой» и юр. секцией
- [x] `ecosystem.ts` — `rightMenuTargetsForHost()` → поле `aboutUs` через `mainSiteUrl()`
- [x] `RightMenuProps.aboutItems` + `Topbar.tsx` — прокинуто
- [x] `DEFAULT_ACCOUNT_ITEMS` (частное) — `{ key: 'menu.balance', to: '/balance', icon: '💰' }`
- [x] `PrivateRightMenu` — значение `N баллов` (склонение) + `.right-menu__item-value`
- [x] Тест `RightMenu.test.tsx`: секция «О нас», пункт «Баланс» → `/balance`

### Шаг 6: Экран BalanceScreen

- [x] `BalanceScreen.tsx` — текст + кнопка «Поддержать нас» → `/donat`
- [x] Роут `/balance` в приватной секции роутера
- [x] Хост-осознанный URL `/donat` через `mainSiteUrl()`

### Шаг 7: Проверки

- [x] `tsc --noEmit` (shared, ui, web, server) — 0 ошибок
- [x] `jest` (server) — 806/54
- [x] `vitest` (web) — 409/55
- [x] `vitest` (shared) — 97/5
- [ ] `vite build` — будет в финальном прогоне
- [x] `pnpm db:migrate` — миграция применена

## Критерии готовности

- В **общем** правом меню (маскот, `RightMenu`) — новая секция «О нас» с 5 пунктами
  (О компании / Контакты / О Balloo / Другие проекты / Поддержать нас),
  между блоком «Тема» и юр. блоком.
- В **частном** правом меню (аватарка, `PrivateRightMenu`) — пункт «Баланс 💰»
  с лейблом `N баллов` (правильное склонение).
- Экран `/balance` содержит текст «платных услуг пока нет, пополнять не нужно;
  сообщим при запуске; хотите ускорить — поддержите нас» + кнопка «Поддержать нас»
  (ведёт на `/donat`).
- Новый пользователь при регистрации (email или OAuth) получает `balancePoints = 555`.
- Все пользователи в БД (до выката) — `balancePoints = 555` (миграция).
- `GET /api/users/me` возвращает `balancePoints`.
- tsc/тесты/build зелёные.

## Решения владельца (26.11.2026)

| # | Вопрос | Ответ |
|---|---|---|
| 1 | Куда добавлять пункты из копирайта | В **общее** правое меню (`RightMenu`), новая секция «О нас» между «Тема» и техподдержкой |
| 2 | Отсечка «до MVP3» | Нет отсечки — **начисляем сразу по факту регистрации** (все зарегистрированные уже + новые при регистрации) |
| 3 | Склонение «балл» | **Да**, делать функцию склонения в i18n |
| 4 | Где показывать баланс | **Только в частном меню** (`PrivateRightMenu`) |

## Результат

**Выполнено 26.11.2026** (код + миграция + тесты). Доказательства:
`tsc --noEmit` shared/ui/web/server — 0; `vitest shared` 97/5; `vitest web`
409/55 (включая новые тесты «О нас» и «Баланс»); `jest server` 806/54;
`prisma migrate deploy` — применено.

Изменённые файлы: `schema.prisma`, миграция `20261126120000_user_balance_points`,
`shared/{index,constants/points,i18n/plural,i18n/translations}`, `server/{userService,
authService,serviceController}`, `ui/{RightMenu,Topbar,ecosystem,styles/chrome.css}`,
`web/{authStore,AppTopbar,router,screens/balance/BalanceScreen,RightMenu.test}`.
