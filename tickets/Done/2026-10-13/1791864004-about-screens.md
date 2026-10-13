# Тикет 1791864004 — Экраны «О Balloo» (1_01_17) и «О компании» (1_01_16)

**Создан:** 2026-10-13 (unix 1791864004)
**Статус:** готов
**Приоритет:** P1 (MVP1)
**Источник:** `mockups/index_ecrans.json` (оба status «Принят»)

## Подзадачи

- [x] 1. Прочитать эталоны `about-balloo.md` и `about-company.md`.
- [x] 2. `AboutBallooScreen.tsx` — версия, технологии, лицензии, ссылки, дорожная карта. Маскот — `/assets/logos/mascot.png`.
- [x] 3. `AboutCompanyScreen.tsx` — описание, контакты, команда, юр. инфо (ИНН/ОГРН — заглушка).
- [x] 4. Роуты `/about-balloo`, `/about-company` в `router/index.tsx`.
- [x] 5. `MainLayout.tsx:130` — copyright → `/about-balloo`.
- [x] 6. `pnpm --filter @balloo/web build` → exit 0 (прогон 13.10, 7.33s).
- [!] 7. i18n заголовков — проверка (экраны пока без i18n, как legal-экраны).
- [!] 8. Браузерная проверка в 3 темах — [!] ждёт владельца.

## Результат

### Созданные файлы
1. `packages/web/src/screens/about/AboutBallooScreen.tsx` — экран «О Balloo»
2. `packages/web/src/screens/about/AboutCompanyScreen.tsx` — экран «О компании»

### Изменённые файлы
3. `packages/web/src/router/index.tsx` — добавлены импорты AboutBallooScreen/AboutCompanyScreen + роуты `/about-balloo`, `/about-company`
4. `packages/web/src/layouts/MainLayout.tsx` — copyright → `/about-balloo`

### Доказательства
- `pnpm --filter @balloo/web build` → exit 0, 7.33s
- `grep -n "AboutBallooScreen\|AboutCompanyScreen" packages/web/src/router/index.tsx` → импорты + роуты
- `grep -n "onCopyrightClick.*about-balloo" packages/web/src/layouts/MainLayout.tsx` → 1 совпадение
