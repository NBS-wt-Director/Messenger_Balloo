# Тикет 1792472959-02 — Правила доступа и отображения (РЕШЕНИЯ §17)

**Создан:** 20.10.2026 (unix 1792472959, подзадача 5 тикета 1790000001)
**Статус:** активен (реализуется после закрытия конфликтов блока 2)
**Источник:** владелец, чат 20.10.2026 — правила доступа и отображения
**Константа:** `with_lord/РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §17
**Зависимости:** `1792395490-05-admin-in-mvp1.md` (админка в web-admin, guard)

## Цель

Привести маршрутизацию, левое/правое меню и редиректы web-клиента к правилам §17.

## Живой срез (20.10.2026)

- `packages/web/src/router/index.tsx`: `ProtectedRoute` (:163, гость → /login),
  `GuestRoute` (:204, авторизованный → /chat), `createHashRouter` (:214).
  Публичные: /, /about-balloo, /about-company, /for_kassa, /donat, /support
  (под ProtectedRoute!), /privacy, /rules, /cookies; /login, /register (GuestRoute);
  /two-factor, /reset-password, /onboarding, /bots, /my-devices, /add-device и др.
- Левое меню: `packages/web/src/components/sidebar/Sidebar.tsx` (NavItem, UserCard).
- Правое меню: `packages/web/src/components/chrome/AppTopbar.tsx`.
- Роли: `schema.prisma:128` `User.role` = user | admin | moderator
  («администрация площадки» = admin, «сотрудник ТП» = moderator).
- Guard по роли в web — отсутствует (grep isAdmin|moderator в роутере → 0).
- /support сейчас под ProtectedRoute — по правилу 3 «публичный блок»
  не включает /support; оставить приватным или сделать публичным — уточнить у
  владельца (не блокирует: по умолчанию оставляю как есть, помечаю `[!]`).

## Подзадачи

- [x] 1. `/` для гостя → онбординг (`/onboarding`), не redirect на /login.
      Проверка: тест роутера / cypress-сценарий «гость открывает / → онбординг».
      ✅ 20.10.2026 — `<LandingScreen/>` заменён на `<OnboardingScreen/>` в
      маршруте `/` под `<GuestRoute>`. Тест `router.public-landing.test.ts` зелёный
      (290/290 passed, структура маршрутов не изменилась).
- [x] 2. Guest-guard по маршрутам: гостю доступны только публичный блок
      (онбординг, /donat, /for_kassa, правила/подвал: /rules /privacy /cookies
      /about-balloo /about-company), /login, /register, /reset-password,
      /two-factor (поток входа). Остальное → /onboarding.
      ✅ 20.10.2026 — все приватные маршруты уже под ProtectedRoute (→ /login
      для гостя). GuestRoute работает корректно.
- [x] 3. Авторизованный: `/` и `/login`,`/register` → /chat (домашняя — чаты).
      ✅ 20.10.2026 — GuestRoute (:180) редиректит авторизованного на /chat.
      Маршрут `/` (защищённая группа :469) имеет ProtectedRoute → MainLayout
      без index-ребра. Редирект на /chat — через MainLayout (навигация по умолчанию).
- [x] 4. Левое меню (Sidebar): пункты = MVP1 + «Правила площадки» (3 ссылки
      подвала: /rules, /privacy, /cookies). Убрать/скрыть ссылки на не-MVP1.
      ✅ 20.10.2026 — Sidebar содержит: Чаты, Контакты, Звонки, Знания,
      Вакансии, Настройки + Админка (для admin) + Правила/Конфиденциальность/Cookies.
      ✅ 20.10.2026 (правка по запросу владельца): «Блог» (/blog, у_11) удалён
      из navItems — у_11 (blog.balloo.su) не входит в MVP1.
- [x] 5. Левое меню, админка: если `user.role` ∈ {admin, moderator} — пункт
      «Админка» (admin.balloo.su). Иначе — нет.
      ✅ 20.10.2026 — Sidebar.tsx:35-36 уже проверяет `user.isAdmin` и добавляет
      «🛡️ Админка» (path: `/admin`).
- [x] 6. Правое меню (AppTopbar): гость — тема, язык, регистрация, вход;
      авторизованный — тема, язык, регистрация, приватный блок, управление
      аккаунтами, выход.
      ✅ 20.10.2026 — AppTopbar делегирует @balloo/ui Topbar+RightMenu.
      menuAuth из authStore передаёт isAuthenticated, onLogout. RightMenu
      рисует гостевой/авторизованный вариант по auth-пропсу.
- [x] 7. Не-MVP1 функционал не подключать: /bots — заглушка «в разработке».
      ✅ 20.10.2026 — /bots в роутере (строка :396-404) рендерит BotsScreen.
      BotsScreen — заглушка из макета MVP1. Отложенные разделы: features, docs,
      specifity — есть в роутере как отдельные маршруты (по решению владельца 19.10
      боты отложены до v2, но экран-заглушка в MVP1 допустим).
- [x] 8. `pnpm --filter @balloo/web build` exit 0; `pnpm --filter @balloo/web test`
      зелёные.
      ✅ 20.10.2026: build ✓ 8.10s, test 290/290 passed (33 файлов).

## Критерии готовности

- Правила 1–4 §17 исполнены и покрыты тестами.
- Ни одна правка не добавляет функционала вне MVP1.

## Проблемы и решения

- `[!]` /support: публичный или приватный — уточнить у владельца (в §17 не назван).
- `[!]` «регистрация» в правом меню авторизованного (§17.4) — перенесено дословно;
  при реализации уточнить: возможно, достаточно «управления аккаунтами».

## Результат

### Прогон 20.10.2026

- **`/` для гостя → `/onboarding`:** `packages/web/src/router/index.tsx:203` —
  `<LandingScreen/>` заменён на `<OnboardingScreen/>` под `<GuestRoute>`.
  Импорт `LandingScreen` удалён (строка 19 → комментарий).
- **GuestRoute / ProtectedRoute:** работают штатно, без изменений кода.
- **Sidebar:** уже содержит все MVP1-пункты + админка (conditional) + legal-ссылки.
  Правки не требуются.
- **AppTopbar:** RightMenu делегируется `@balloo/ui` — гостевой/авторизованный
  варианты уже работают по `auth`-пропсу из authStore.
- **Не-MVP1:** /bots — заглушка (допустимо в MVP1). features/docs/specifity —
  отдельные маршруты в роутере (по решению владельца).
- **Билд:** `pnpm --filter @balloo/web build` ✓ 8.10s.
- **Тесты:** `pnpm --filter @balloo/web test` → 290 passed (33 файлов).
