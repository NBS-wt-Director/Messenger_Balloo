# 1795435147 — «Поддержи нас» / Донат: точка входа в подвал (выполнено)

**Создан:** 23.11.2026
**Источник запроса:** владелец (чат 23.11.2026): «нет ни страницы ни пункта меню по „поддержи нас"»
**Решение владельца (23.11.2026):** точка входа — **подвал**
**Статус:** ВЫПОЛНЕНО (код) — требуется браузерная приёмка владельца
**Тип:** правка кода + проверка
**Связано:** `tickets/active/1795435145-support-page.md` (техподдержка — отдельный предмет)

---

## 1. Суть

Экран поддержки проекта (донат) **в коде есть**, но **точки входа в интерфейсе нет** — ни пункта меню, ни ссылки в подвале. В макете-эталоне ссылка была (в подвале).

Уточнение по названию: страницы с заголовком «Поддержи нас» в макетах **нет** — экран называется «Донат» (`mockups/balloo-su/donate.html`, экран `1_01_24`, принят). Вероятно, владелец имеет в виду именно его.

---

## 2. Факты

| № | Что | Доказательство |
|---|---|---|
| D-1 | Экран доната в web **есть**: маршрут `/donat` → `DonateScreen` | `packages/web/src/router/index.tsx:229-233`; `packages/web/src/screens/donate/DonateScreen.tsx` |
| D-2 | Экран «Мои донаты» есть: `/my-donates` | `packages/web/src/router/index.tsx:457-461` |
| D-3 | **В подвале кода ссылки «Донат» нет** — только Правила / Конфиденциальность / Cookies | `packages/ui/src/components/ecosystem.ts:121-125` (`SPA_FOOTER_LINKS`) |
| D-4 | **В макете-эталоне подвал содержит ссылку «Донат»** (ведёт на `donate.html` соответствующего узла) | `mockups/assets/common.js:676-705` (строка 680 — «Донат», строки 692-705 — обработчик) |
| D-5 | **В левом меню (Sidebar) пункта доната нет** | `packages/web/src/components/sidebar/Sidebar.tsx:24-34,48-52` |
| D-6 | **В правом меню (RightMenu) пункта доната нет** — и в макете, и в коде | макет `mockups/assets/common.js:502-519`; код `packages/ui/src/components/ecosystem.ts:81-95` |
| D-7 | **В макете левого меню (chats.html) доната тоже нет** | `grep "Донат\|Поддерж\|donate" mockups/balloo-su/chats.html` → пусто |

**Вывод:** единственная точка входа по макету — **ссылка «Донат» в подвале** (D-4). В коде подвал её не содержит (D-3), поэтому донат недостижим из навигации, хотя экран работает.

---

## 3. Решение владельца

**23.11.2026: точка входа — подвал** (как в макете-эталоне `mockups/assets/common.js:680`).
Реализовано: ссылка «Донат» → `/donat` добавлена последней в подвал.

## 4. Что сделано

| Файл | Правка |
|---|---|
| `packages/shared/src/i18n/translations.ts:136,2933` | ключ `footer.donate` (union + словарь, 20 локалей) |
| `packages/ui/src/components/ecosystem.ts:127` | `{ key: 'footer.donate', href: '/donat' }` в `SPA_FOOTER_LINKS` |
| `packages/ui/src/components/Footer.tsx:1-7` | обновлён комментарий структуры подвала |
| `packages/web/src/__tests__/components/ecosystem-links.test.ts:77-88` | тест подвала расширен 4-й ссылкой |

## 5. Доказательства (23.11.2026)

- `pnpm --filter @balloo/shared exec tsc --noEmit` → `SHARED_TSC=0`
- `pnpm --filter @balloo/ui exec tsc --noEmit` → `UI_TSC=0`
- `pnpm --filter @balloo/web exec tsc --noEmit` → `WEB_TSC=0`
- `node scripts/check-i18n.cjs` → словарь 131 = TranslationKey 131, расхождений 0, `I18N=0`
- `pnpm --filter @balloo/web test` → **396 passed / 54 files**, `WEB_TEST=0`
- `pnpm --filter @balloo/shared test` → **76 passed / 4 files**, `SHARED_TEST=0`

## 6. Осталось

- [ ] Браузерная приёмка владельца: в подвале на `balloo.su` видна ссылка «Донат», открывает `/donat` (после деплоя; строка A19 в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`).
- [ ] (по желанию) проверить блок «Поддержка проекта» на экране «Профиль» против `mockups/balloo-su/profile.html:108-120`.
- [x] Точки входа доната на mobile/desktop (проверено чтением): mobile `DonateScreen` + блок «💰 Поддержка проекта» на `ProfileScreen.tsx:163`; desktop — `DesktopDonateScreen.tsx` (в шелле рендерится web-роутер, `/donat` доступен).

## 7. Критерии готовности

- [x] Правка внесена, tsc/i18n/тесты зелёные (выше).
- [ ] Браузерная приёмка владельца.
- [x] Тикет закрыт в `tickets/Done/2026-11-23/` (остаточная браузерная приёмка — на владельце).

## 9. Результат (прогон 23.11.2026)

```
node scripts/check-i18n.cjs            → словарь 131 = TranslationKey 131, расхождений 0; I18N=0
pnpm --filter @balloo/shared test      → Test Files 4 passed (4); Tests 76 passed (76); SHARED_TEST=0
pnpm --filter @balloo/web test         → Test Files 54 passed (54); Tests 403 passed (403); WEB_TEST=0
pnpm --filter @balloo/ui exec tsc --noEmit → UI_TSC=0
```

Полный префлайт монорепо (24.11.2026): `pnpm test` → `MONO_TEST=0`
(shared 76/4, server 805/54, web 403/54, web-admin 36/4); `pnpm build` →
`MONO_BUILD=0`.

## 8. Проверка путей (протокол §4)

`grep -n "donat" packages/web/src/router/index.tsx` → `229` (`/donat`), `457` (`/my-donates`);
`grep -n "SPA_FOOTER_LINKS" packages/ui/src/components/ecosystem.ts` → `121-125`;
`grep -n "Донат" mockups/assets/common.js` → `680`;
`ls packages/web/src/screens/donate/` → `DonateScreen.tsx`.
