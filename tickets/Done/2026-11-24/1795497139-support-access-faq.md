# 1795497139 — Поддержка доступна всем: FAQ + почта для незарегистрированных

**Создан:** 24.11.2026
**Источник:** владелец (ответ G4-3 в `G4-G5-вопросы-владельцу.md`)
**Статус:** ВЫПОЛНЕНО (код) — браузерная приёмка на владельце
**Тип:** правка маршрутов (ProtectedRoute) + UI (FAQ)
**Решение владельца:** «поддержка доступна всем, раздел FaQ, не зарегистрированным — поддержка через почту»

---

## 1. Суть

Маршрут `/support` сейчас под `ProtectedRoute` — гость не может открыть страницу поддержки.
Нужно:
1. Снять `ProtectedRoute` с `/support` → доступ всем.
2. Добавить раздел **FAQ** на страницу поддержки.
3. Для незарегистрированных — показать ссылку на почту (поддержка через email).

---

## 2. Факты

| № | Что | Доказательство |
|---|---|---|
| F-1 | `/support` под `ProtectedRoute` | `packages/web/src/router/index.tsx:253-259` |
| F-2 | Экран `SupportScreen` есть | `packages/web/src/screens/support/SupportScreen.tsx` |
| F-3 | Серверный чат поддержки есть | `packages/server/src/routes/support.ts:13-19` |
| F-4 | Статичный автоответ `AUTO_REPLY_GREETING` | `packages/server/src/services/supportService.ts:13-15` |
| F-5 | Правое меню: пункт «🛠️ Техподдержка» для всех | `packages/ui/src/components/ecosystem.ts:82` |

---

## 3. Что сделать

### 3.1. Снять `ProtectedRoute` с `/support`

`packages/web/src/router/index.tsx:253-259`:

Было:
```ts
{
  path: '/support',
  element: (
    <ProtectedRoute>
      <SupportScreen />
    </ProtectedRoute>
  ),
},
```

Стало:
```ts
{
  path: '/support',
  element: <SupportScreen />,
},
```

### 3.2. Добавить раздел FAQ на экран поддержки

`packages/web/src/screens/support/SupportScreen.tsx`:
- Добавить секцию FAQ с распространёнными вопросами/ответами.
- Для незарегистрированных пользователей — показать блок «Нет аккаунта? Напишите нам: help@balloo.su».

Макет-эталон: `mockups/balloo-su/support.html` — нужно проверить, есть ли FAQ в макете.

### 3.3. Почта для незарегистрированных

В `SupportScreen` добавить логику:
- Если `!user` (гость) → показать блок с email `help@balloo.su` и кнопкой «Написать на почту».
- Если `user` → показать обычный чат поддержки.

---

## 4. Проверки (к запуску)

- [ ] `pnpm --filter @balloo/web exec tsc --noEmit` → 0
- [ ] `pnpm --filter @balloo/web test` → 0 failed
- [ ] `pnpm --filter @balloo/web build` → 0
- [ ] Прод-приёмка: гость открывает `/support` → видит FAQ + email; авторизованный → видит чат

---

## 5. Связанные

- `tickets/active/1795435145-support-page.md` — S-5 (ProtectedRoute на /support)
- `tickets/active/1795497139-support-sidebar-footer.md` — точки входа в поддержку (sidebar, footer)
- `tickets/deferred/1795435148-ai-support-mvp3.md` — ИИ-поддержка (отложено в MVP3)

## 6. Результат (прогон 24.11.2026)

Фактический состав правок:
- `packages/web/src/router/index.tsx:251-261` — с `/support` снят `ProtectedRoute`
  (остались `ErrorBoundary` + `Suspense`). Маршрут доступен всем.
- `packages/web/src/screens/support/SupportScreen.tsx`:
  - константы `SUPPORT_EMAIL = 'help@balloo.su'` и `FAQ_ITEMS` (4 вопроса);
  - `load()` раньше выходит, если `!user` (гость не дёргает чат-API → нет 401);
  - ветка `if (!user)`: рендер FAQ (`<details>`-аккордеон) + блок «Напишите нам»
    со ссылкой `mailto:help@balloo.su`; вместо чата.
  - авторизованный видит чат как раньше.
- `packages/web/src/__tests__/screens/support.test.tsx` — мок `authStore` сделан
  управляемым (`authState`), добавлен тест «гость видит FAQ и ссылку на почту».

```
pnpm --filter @balloo/web exec tsc --noEmit → WEB_TSC=0
pnpm --filter @balloo/web test              → 404 passed / 54 files (+1 новый тест гостя)
pnpm build (монорепо)                       → MONO_BUILD=0
pnpm test (монорепо)                        → MONO_TEST=0 (shared 76, server 805, web 404, admin 36)
```

Остаток на владельце: браузерная приёмка — гость открывает `/support` без редиректа
на вход, видит FAQ + почту; авторизованный видит чат (строка A20 в
`with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`).
