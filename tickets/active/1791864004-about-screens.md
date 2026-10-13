# Тикет 1791864004 — Экраны «О Balloo» (1_01_17) и «О компании» (1_01_16)

**Создан:** 2026-10-13 (unix 1791864004)
**Статус:** в работе
**Приоритет:** P1 (MVP1)
**Источник:** реестр `mockups/index_ecrans.json` (оба экрана status «Принят»), `docs/02-requirements-checklist.md` вопрос 4 («Да, полноценная страница с логотипом и историей версий»)
**Связан с:** 1791864003 (octagon-логотип B и ссылки на скачивание)

## Цель

Реализовать два принятых, но не написанных экрана узла `у_01 balloo.su` (MVP1):
- `1_01_17` «О Balloo» — эталон `mockups/balloo-su/about-balloo.html` + `about-balloo.md`;
- `1_01_16` «О компании» — эталон `mockups/balloo-su/about-company.html` + `about-company.md`.

## Факты (сняты 13.10.2026)

1. Реестр: `index_ecrans.json` → `у_01`: `1_01_17` «О Balloo» status **«Принят»**, `1_01_16` «О компании» status **«Принят»**.
2. Код: `find packages/web/src -iname "*about*"` → только `AboutSettingsScreen` (вкладка в настройках, `SettingsScreen.tsx:737`) — это НЕ полноэкранные экраны.
3. Роутер `packages/web/src/App.tsx`: маршрутов `/about*` **нет** (есть `/privacy`, `/rules`, `/cookies` — по образцу которых делаются).
4. `MainLayout.tsx:130`: `onCopyrightClick={() => navigate('/')}` — по комментарию `Footer.tsx` («в макетах — about») клик по copyright должен вести на «О Balloo».
5. MD-файлы экранов упоминают Next.js/SSR — **устарело**: стек проекта — React 19 + Vite SPA (hash-роутер). SSR не делать, делать статичные SPA-экраны (как `RulesScreen`/`PrivacyScreen`).
6. `AboutSettingsScreen` содержит устаревшие данные: версия захардкожена `1.0.0 (сборка 2026.07.18)`, ссылка `help@balloo.su` ведёт на `#`.

## Что нужно сделать

### Экран «О Balloo» (`/about-balloo`)

По `about-balloo.md`: карточки — Версия (актуальная, из `package.json`/константы), Технологии, Лицензии, Ссылки (Скачать `/download`, История версий, API docs, Фичи, Правила `/rules`, О компании `/about-company`), Дорожная карта (v1/v2). `AppTopbar` + `AppFooter`, `page-container--narrow`.

### Экран «О компании» (`/about-company`)

По `about-company.md`: карточка описания (октагон-логотип B), Контакты (email info@balloo.su, поддержка `/support`), Команда (ссылка на command-портал), Юридическая информация (ИНН/ОГРН — **заглушка до данных владельца**, см. with_lord).

### Проводка

- Роуты в `App.tsx` рядом с `/privacy` (тот же паттерн layout).
- `MainLayout.tsx:130` — `onCopyrightClick` → `navigate('/about-balloo')`.
- Ссылка «О Balloo» из `AboutSettingsScreen` → на новый экран (или оставить вкладку, добавив переход — решить по макету: полноэкранный экран первичен).

## Подзадачи

- [ ] 1. Прочитать эталоны `mockups/balloo-su/about-balloo.html` и `about-company.html` (структура, карточки, тексты).
- [ ] 2. `packages/web/src/screens/about/AboutBallooScreen.tsx` — по эталону, AppTopbar+AppFooter.
- [ ] 3. `packages/web/src/screens/about/AboutCompanyScreen.tsx` — по эталону; ИНН/ОГРН — пометка «данные уточняются» до ответа владельца.
- [ ] 4. Роуты `/about-balloo`, `/about-company` в `App.tsx` (паттерн `/privacy`).
- [ ] 5. `MainLayout.tsx:130` — copyright → `/about-balloo`.
- [ ] 6. `pnpm --filter @balloo/web build` → exit 0.
- [ ] 7. i18n: проверить, что заголовки/подписи через ключи илиconsistent с паттерном legal-экранов (Rules/Privacy — как принято в проекте).
- [ ] 8. Браузерная проверка обоих экранов в 3 темах — [!] владелец (dev-сервер недоступен в этой сессии без БД).

## Критерии готовности

- Оба файла экранов существуют, зарегистрированы в роутере.
- Контент 1:1 с MD-эталонами (кроме SSR — не делаем, Vite SPA; и ИНН/ОГРН — заглушка).
- Клик по copyright в подвале ведёт на `/about-balloo`.
- `pnpm --filter @balloo/web build` → exit 0 (вывод).
- [!] Скриншоты в 3 темах — от владельца.

## Проблемы и решения

- MD-эталон упоминает Next.js/SSR — устаревшие сведения, реальны Vite SPA. Решено: статичные экраны по образцу legal-страниц.
- ИНН/ОГРН и email info@balloo.su — юр. данные: в `about-company.md` они не заполнены. До данных владельца — видимая заглушка.

## Результат

(заполняется по итогам)
