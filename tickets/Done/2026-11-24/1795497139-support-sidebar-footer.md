# 1795497139 — Добавить поддержку в подвал и левую панель (решение G4-2)

**Создан:** 24.11.2026
**Источник:** владелец (ответы G4-2 в `G4-G5-вопросы-владельцу.md`)
**Статус:** ВЫПОЛНЕНО (код) — браузерная приёмка на владельце
**Тип:** правка UI (Sidebar + Footer) + i18n + тесты
**Решение владельца:** добавить пункт «Поддержка» в подвал и в левую панель (Sidebar)

---

## 1. Суть

Пункт «Поддержка» сейчас только в правом меню (`ecosystem.ts:82`, `SPA_LEGAL_ITEMS`).
Нужно добавить точки входа в **подвал** и **левую панель (Sidebar)**.

---

## 2. Факты

| № | Что | Доказательство |
|---|---|---|
| F-1 | Экран `SupportScreen` и маршрут `/support` есть | `packages/web/src/router/index.tsx:253` |
| F-2 | Пункт правого меню «🛠️ Техподдержка» есть | `packages/ui/src/components/ecosystem.ts:82` (`SPA_LEGAL_ITEMS`) |
| F-3 | В подвале кода ссылки «Поддержка» нет | `packages/ui/src/components/ecosystem.ts:121-128` (`SPA_FOOTER_LINKS`: Правила/Конфиденциальность/Cookies/Донат) |
| F-4 | В левом меню (Sidebar) пункта «Поддержка» нет | `packages/web/src/components/sidebar/Sidebar.tsx:24-34` (navItems) |
| F-5 | Ссылка «Донат» в подвале уже есть (тик. 1795435147) | `ecosystem.ts:127` |
| F-6 | Ссылка «О компании» в подвале — **нет** | `ecosystem.ts:121-128` — только Правила/Конфиденциальность/Cookies/Донат |

---

## 3. Что сделать

### 3.1. Подвал — добавить пункт «Поддержка»

`packages/ui/src/components/ecosystem.ts:121-128`:
```ts
export const SPA_FOOTER_LINKS: FooterLink[] = [
  { key: 'footer.rules', href: '/rules' },
  { key: 'footer.privacy', href: '/privacy' },
  { key: 'footer.cookies', href: '/cookies' },
  { key: 'footer.donate', href: '/donat' },
  // → добавить:
  { key: 'footer.support', href: '/support' },
];
```

### 3.2. Подвал — добавить пункт «О компании»

`packages/ui/src/components/ecosystem.ts:121-128`:
```ts
  // → добавить:
  { key: 'footer.about', href: '/about-company' },
```

Маршруты уже есть: `packages/web/src/router/index.tsx:209-213` (`path: '/about-company'` → `AboutCompanyScreen`).

### 3.3. Левая панель (Sidebar) — добавить пункт «Поддержка»

`packages/web/src/components/sidebar/Sidebar.tsx:24-34`:
```ts
const navItems = [
  { icon: '💬', label: 'Чаты', path: '/chat' },
  { icon: '👥', label: 'Контакты', path: '/contacts' },
  { icon: '📷', label: 'Истории', path: '/stories' },
  { icon: '📨', label: 'Приглашения', path: '/invites' },
  { icon: '📞', label: 'Звонки', path: '/calls' },
  { icon: '📚', label: 'Знания', path: '/knowledge' },
  { icon: '💼', label: 'Вакансии', path: '/hiring' },
  { icon: '🎧', label: 'Поддержка', path: '/support' },  // ← добавить
  { icon: '⚙️', label: 'Настройки', path: '/settings' },
];
```

---

## 4. i18n

`packages/shared/src/i18n/translations.ts:133-136` (union):
```ts
| 'footer.rules'
| 'footer.privacy'
| 'footer.cookies'
| 'footer.donate'
| 'footer.support'   // ← добавить
| 'footer.about';    // ← добавить
```

Словари (20 локалей) — добавить значения:
- ru: «Поддержка» / «О компании»
- en: «Support» / «About company»
- остальные — аналогично по структуре существующих footer-ключей.

---

## 5. Проверки (к запуску)

- [ ] `pnpm --filter @balloo/web exec tsc --noEmit` → 0
- [ ] `pnpm --filter @balloo/ui exec tsc --noEmit` → 0
- [ ] `pnpm --filter @balloo/shared exec tsc --noEmit` → 0
- [ ] `node scripts/check-i18n.cjs` → 0 расхождений
- [ ] `pnpm --filter @balloo/web test` → 0 failed
- [ ] `pnpm --filter @balloo/web build` → 0

---

## 6. Связанные

- `tickets/active/1795435147-donate-entry.md` — донат уже в подвале
- `tickets/active/1795435145-support-page.md` — техподдержка: общий аудит

## 7. Результат (прогон 24.11.2026)

Фактический состав правок:
- `packages/shared/src/i18n/translations.ts` — union + словарь `footer.support`, `footer.about` (20 локалей).
- `packages/ui/src/components/ecosystem.ts:121-128` — `SPA_FOOTER_LINKS` = Правила | Конфиденциальность | Cookies | Поддержка | О компании | Донат.
- `packages/ui/src/components/Footer.tsx` — обновлён комментарий структуры.
- `packages/web/src/components/sidebar/Sidebar.tsx` — добавлен пункт `🎧 Поддержка` → `/support`.
- `packages/web/src/__tests__/components/ecosystem-links.test.ts` — тест подвала расширен до 6 ссылок.

Примечание: пункт «О компании» ведёт на существующий `/about-company`
(`router/index.tsx:209` → `AboutCompanyScreen`), а не на битый `/#/command` (пункт G5-13).

```
node scripts/check-i18n.cjs                   → словарь 133 = TranslationKey 133, 0 расхождений; I18N=0
pnpm --filter @balloo/shared exec tsc --noEmit → SHARED_TSC=0
pnpm --filter @balloo/ui exec tsc --noEmit     → UI_TSC=0
pnpm --filter @balloo/web exec tsc --noEmit    → WEB_TSC=0
pnpm --filter @balloo/web test                 → 404 passed / 54 files
pnpm build (монорепо)                          → MONO_BUILD=0
```
