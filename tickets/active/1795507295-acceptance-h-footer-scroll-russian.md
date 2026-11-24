# Тикет 1795507295 — Приёмка H (24.11): подвал, прокрутка, донат, тема «Русская»

**Создан:** 24.11.2026 13:01 (unix 1795507295)
**Статус:** в работе
**Источник запроса:** владелец (чат 24.11.2026, после деплоя `04f03a5`)

## Дословные требования владельца

1. «подвал не на всех экранах (донат и о компании)»
2. «название экрана донат = "поддержите нас"»
3. «https://balloo.su/#/about-balloo не работает прокрутка — ПЕРЕПРОВЕРЬ
   ПРОКРУТКУ НА ВСЕХ ЭКРАНАХ КОТОРЫЕ ВИДИТ ПОЛЬЗОВАТЕЛЬ»
4. «подвал: {copy (клик = меню из "о компании", "контакты(Позже)",
   "о balloo" (Позже), "другие проекты компании" (Позже) и "поддержать нас")},
   пустое пространство, {поддержка}, пустое пространство,
   {"Правила","Конфиденциальность","Cookies"}}. при этом по пустому пространству
   бегают точки по кругу. одна строчка. и спрашиваем, хочет ли пользователь
   использовать cook. ВЕЗДЕ ОДИН И ТОТ ЖЕ ПОДВАЛ! НА ВСЕХ ЭКРАНАХ ПОДВАЛ!»
5. «фон темы "Русская" везде одинаков и плитки, сколько раз повторять. градиент,
   малахитовый контейнер сообщений, золотые рамки.»

## 1. Диагноз (доказано чтением кода/макетов)

| № | Факт | Доказательство |
|---|---|---|
| D1 | Ровно 5 экранов используют `minHeight:'100vh'` без собственного скролл-контейнера: AboutBalloo, AboutCompany, Donate, ForKassa, Support | `grep -rln "minHeight: '100vh'" packages/web/src/screens` → 5 файлов |
| D2 | `body`/`#root` имеют `overflow:hidden; height:100vh` — прокрутку обязан давать контейнер экрана | `global.css:19-35` |
| D3 | На этих экранах контент длиннее вьюпорта → уезжает вниз за экран, скролла нет, `AppFooter` не виден. Это **один корень** для жалоб «нет подвала» и «нет прокрутки» | структура экранов: `<div minHeight:100vh>Topbar + content(flex:1) + Footer</div>` |
| D4 | Макет-эталон так не делает: `about-company.html:17` — `.content.overflow-y-auto > .page-container--narrow`; `donate.html:30` — `.page-container` внутри скролл-контента | mockups/balloo-su/*.html |
| D5 | В web есть готовый класс `.page-container { flex:1 1 auto; min-height:0; overflow-y:auto; max-width:960px }` и `--narrow` (640) | `design-system.css:615-629` |
| D6 | Заголовок доната: topbar `title="Донаты"`, h1 «Поддержать Balloo»; в макете topbar «Поддержать проект», h1 «Поддержите Balloo» | `DonateScreen.tsx:67,79-81`; `donate.html:25,34` |
| D7 | Cookie-баннер уже есть и спрашивает согласие | `App.tsx:25`, `CookieBanner.tsx` |
| D8 | Подвал — единый компонент `@balloo/ui/Footer`, используется всеми сайтами | `packages/ui/src/components/Footer.tsx` |

## 2. План

- [ ] 1. Скролл+подвал: 5 экранов (D1) → `height:100vh` + скролл-контейнер
      (`.page-container`/inline `overflow-y:auto; min-height:0`)
- [ ] 2. Донат: заголовок → «Поддержите нас»
- [x] 3. Подвал по п.4: копирайт-меню (О компании / Контакты(Позже) / О Balloo(Позже)
      / Другие проекты(Позже) / Поддержать нас), «Поддержка», правовой блок,
      декоративные «бегущие точки», одна строка
- [x] 4. Тема «Русская»: градиент фона на всех экранах, золотые рамки,
      малахитовые пузыри сообщений
- [x] 5. Проверки: tsc --noEmit, vitest web, vite build, e2e Cypress
- [ ] 6. Деплой web (батчи D–G) + приёмка H владельца

## Что изменено

| Файл | Правка |
|---|---|
| `screens/about/AboutBallooScreen.tsx` | `minHeight:100vh` → `height:100vh` + `.page-container--narrow` |
| `screens/about/AboutCompanyScreen.tsx` | то же |
| `screens/donate/DonateScreen.tsx` | то же + заголовок «Поддержите нас» (topbar и h1) |
| `screens/landing/ForKassaScreen.tsx` | то же (`.page-container`, maxWidth 800) |
| `screens/support/SupportScreen.tsx` | гостевая ветка: `height:100vh` + `.page-container--narrow` |
| `screens/legal/{Privacy,Rules,Cookies}Screen.tsx` | скроллится только контент, шапка/подвал фиксированы |
| `packages/ui/components/Footer.tsx` | новая структура: меню по copyright, «Поддержка», точки, правовой блок |
| `packages/ui/components/ecosystem.ts` | `SPA_FOOTER_LINKS` → только Правила/Конфиденциальность/Cookies |
| `packages/ui/styles/chrome.css` | стили меню подвала, бегущие точки (keyframes), мобильная адаптация |
| `layouts/MainLayout.tsx` | убран `onCopyrightClick` (клик открывает меню) |
| `components/ui/CookieBanner.tsx` | баннер поднят над подвалом (`bottom: 36`) |
| `styles/themes.css` (web + ui) | тема «Русская»: малахитовые пузыри + золотые рамки |
| `cypress/e2e/footer-scroll.cy.ts` | новый e2e: подвал/скролл/тема (18 проверок) |
| `__tests__/components/ecosystem-links.test.ts` | правовой блок = 3 ссылки |

## Критерии готовности

- прокрутка работает на всех экранах, подвал виден везде и одинаков;
- донат называется «Поддержите нас»;
- тема «Русская»: градиент/золото/малахит по описанию;
- tsc 0, тесты зелёные, build 0.

## Проблемы и решения

- П.4 содержит неоднозначные детали («пустое пространство», «точки по кругу»).
  Реализовано по буквальному описанию; расхождения — вынесены владельцу.
- «Плитки» в п.5 не имеют эталона в макетах (grep «малахит»/«плитк» по mockups —
  только download/OAuth). **Требует уточнения у владельца.**
- Cookie-баннер (`fixed; bottom:0`) перекрывал подвал до выбора согласия —
  поднят на 36px (высота подвала), теперь подвал виден всегда.
- `/doc`, `/spec` — узловые экраны со своей раскладкой (спиннер/сплит-панель):
  скролл внутри панелей; проверены отдельно (подвал + скролл-контейнер).

## Уточнения владельца (24.11.2026, второй проход)

1. **«Плитки»** = баблы (пузыри) сообщений «и тому подобное» — подтверждено,
   реализовано как малахитовые пузыри + золотые рамки в теме «Русская».
2. **Пункты меню подвала должны быть активны**, неготовые — вести на заглушку
   «Экран в разработке» с извинением (вместо неактивного «(Позже)»).

### Реализация уточнения 2

| Файл | Что |
|---|---|
| `screens/shared/ComingSoonScreen.tsx` | новый экран-заглушка: 🐻, «Экран в разработке», имя запрошенного экрана (`?name=`), текст с извинением, кнопка возврата, единые шапка/подвал |
| `router/index.tsx` | маршрут `/coming-soon` (публичный) |
| `packages/ui/components/Footer.tsx` | `FOOTER_MENU_ITEMS` — все пункты ссылки; «Контакты» и «Другие проекты компании» → `/coming-soon?name=…` (encodeURIComponent), «О компании»/«О Balloo»/«Поддержать нас» → рабочие экраны; ссылки хост-осознанные (`mainSiteUrl`) |
| `cypress/e2e/footer-scroll.cy.ts` | проверка: 5 активных ссылок в меню, «Позже» отсутствует; заглушка открывается |

## Результат

Проверено запуском (команды и вывод):

```text
pnpm --filter @balloo/ui exec tsc --noEmit   → EXIT 0
pnpm --filter @balloo/web exec tsc --noEmit  → EXIT 0
pnpm --filter @balloo/web exec vitest run    → 54 файла, 404 теста, 0 failed
pnpm --filter @balloo/web build              → ✓ built in 7.44s (index-Ba7CYrO4.js)
xvfb-run cypress run --spec cypress/e2e/footer-scroll.cy.ts → 19 passing, 0 failing
```

Cypress (реальный браузер, dev http://localhost:5173) подтвердил на 11 страничных
экранах (about-balloo, about-company, donat, for_kassa, support, privacy, rules,
cookies, features, history, download): `.balloo-footer` виден + контент скроллится;
на /doc и /spec — подвал + скролл-контейнер; меню подвала открывается, в нём
5 активных ссылок (без «Позже»); неготовые пункты ведут на заглушку
«Экран в разработке»; донат = «Поддержите нас»; тема «Русская» — `data-theme=russian`,
`--app-bg` содержит градиент, фон `.message__bubble` — градиент (малахит);
cookie-баннер не перекрывает подвал.

Деплой — батчи D–G, приёмка H — за владельцем.

## Деплой 397477e (батчи D–G, вывод сервера 24.11.2026 ~14:30 МСК)

```text
git fetch origin            → 04f03a5..397477e  main -> origin/main
git log --oneline -1        → 397477e (HEAD -> main) feat(web,ui): пункты меню подвала…
docker compose build web    → Image balloo/web:local Built (87.4s);
                              шаги COPY ui/web и vite build (13.8s) — НЕ CACHED
up -d --no-deps --force-recreate web → balloo-web Started (10.8s)
etag                        → "6b055971-66e" (было 6b0534cf-66e) ✓
бандль                      → index-C7z_n3XL.js (был index-CCwYx2io.js) ✓
coming-soon в index-бандле  → 1 ✓
message__attachments        → 1 (чанк ChatViewScreen) ✓
API                         → running ✓
```

**Замечание к команде G:** `grep -c 'Поддержите нас'` по index-бандлу дал 0 —
маркер искался не в том файле: DonateScreen — ленивый чанк. Проверено напрямую
на проде (curl, 24.11.2026):

| Маркер | Где на проде | Результат |
|---|---|---|
| «Поддержите нас» | `chunks/DonateScreen-PXUaASzz.js` | 1 ✓ |
| «Экран в разработке» + «Приносим извинения» | `chunks/ComingSoonScreen-7iP21ia2.js` | 1 + 1 ✓ |
| `balloo-footer__menu`, `balloo-footer__dots`, «Другие проекты компании» | `index-C7z_n3XL.js` | 1, 1, 1 ✓ |
| Малахит `linear-gradient(135deg,#0b6e4ff0,#17a673e0,…)` + `border-color:var(--border-strong)` | `styles/index-dhylnDOA.css`, селектор `[data-theme=russian] .message__bubble` | 1 ✓ |
| `page-container` (скролл контейнер) | `styles/index-dhylnDOA.css` | 1 ✓ |

**Итог: батчи D–G подтверждены выводом сервера и curl к проду. Осталось H —
браузерная приёмка владельца** (подвал+прокрутка на экранах, меню по copyright,
заглушка «Контакты», донат «Поддержите нас», тема «Русская» в чате).
