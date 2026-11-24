# 1795497139 — Убрать узел command из левой панели (Sidebar)

**Создан:** 24.11.2026
**Источник:** владелец (ответы G4-2b в `G4-G5-вопросы-владельцу.md`)
**Статус:** ВЫПОЛНЕНО (код) — браузерная приёмка на владельце
**Тип:** правка UI (Sidebar)
**Решение владельца:** «из левой панели убери всё, что связано с узлом command»

---

## 1. Суть

В левой панели (Sidebar) есть пункты, относящиеся к узлу command (у_03 — Портал сотрудников):
- **Знания** (`/knowledge`) — база знаний, экраны `1_03_04`
- **Вакансии** (`/hiring`) — найм/вакансии, экраны `1_03_05`/`1_03_07`

Нужно убрать эти пункты из Sidebar.

---

## 2. Факты

| № | Что | Доказательство |
|---|---|---|
| F-1 | «Знания» → command-экран `1_03_04` (`knowledge-base.html`) | `docs/07-nodes-guide-human.md:353` |
| F-2 | «Вакансии» → command-экраны `1_03_05`/`1_03_07` | `docs/07-nodes-guide-human.md:354,356-357` |
| F-3 | Пункты в Sidebar: `Sidebar.tsx:31-32` | `navItems` массив |
| F-4 | Маршруты: `router/index.tsx:593-633` (knowledge/hiring) | 11 маршрутов knowledge + 6 hiring |
| F-5 | Код экранов существует: `packages/web/src/screens/knowledge/` (3 файла), `packages/web/src/screens/hiring/` (6 файлов) | `ls` |
| F-6 | Admin-ссылка в Sidebar вставляется после `navItems` по индексу `/hiring` | `Sidebar.tsx:36-45` |

---

## 3. Что сделать

### 3.1. Убрать пункты из Sidebar

`packages/web/src/components/sidebar/Sidebar.tsx:24-34`:

Было:
```ts
const navItems = [
  { icon: '💬', label: 'Чаты', path: '/chat' },
  { icon: '👥', label: 'Контакты', path: '/contacts' },
  { icon: '📷', label: 'Истории', path: '/stories' },
  { icon: '📨', label: 'Приглашения', path: '/invites' },
  { icon: '📞', label: 'Звонки', path: '/calls' },
  { icon: '📚', label: 'Знания', path: '/knowledge' },   // ← убрать
  { icon: '💼', label: 'Вакансии', path: '/hiring' },    // ← убрать
  { icon: '⚙️', label: 'Настройки', path: '/settings' },
];
```

Стало:
```ts
const navItems = [
  { icon: '💬', label: 'Чаты', path: '/chat' },
  { icon: '👥', label: 'Контакты', path: '/contacts' },
  { icon: '📷', label: 'Истории', path: '/stories' },
  { icon: '📨', label: 'Приглашения', path: '/invites' },
  { icon: '📞', label: 'Звонки', path: '/calls' },
  { icon: '⚙️', label: 'Настройки', path: '/settings' },
];
```

### 3.2. Поправить индекс вставки админки

`packages/web/src/components/sidebar/Sidebar.tsx:36-45`:
Admin вставляется по индексу пути `/hiring` — после удаления этого пути нужно изменить на `/settings`.

```ts
if (user.isAdmin) {
  const adminIndex = navItems.findIndex((i) => i.path === '/settings');
  navItems.splice(adminIndex >= 0 ? adminIndex : navItems.length, 0, {
    icon: '🛡️',
    label: 'Админка',
    path: '/admin',
  });
}
```

---

## 4. Проверки (к запуску)

- [ ] `pnpm --filter @balloo/web exec tsc --noEmit` → 0
- [ ] `pnpm --filter @balloo/web test` → 0 failed
- [ ] `pnpm --filter @balloo/web build` → 0

---

## 5. Связанные

- `tickets/active/1795435146-audit-mockups-vs-code-prod.md` — B-9, B-10 (расхождения с макетами)
- `docs/07-nodes-guide-human.md:350-371` — узел command (у_03)

## 6. Результат (прогон 24.11.2026)

Правка внесена в `packages/web/src/components/sidebar/Sidebar.tsx`:
- Убраны пункты `Знания` (`/knowledge`) и `Вакансии` (`/hiring`) из `navItems`.
- Индекс вставки админки изменён с `/hiring` на `/settings` (`Sidebar.tsx:39`).
- Обновлён шапочный комментарий.

```
pnpm --filter @balloo/web exec tsc --noEmit → WEB_TSC=0
pnpm --filter @balloo/web test              → 403 passed / 54 files (на этом шаге)
pnpm build (монорепо)                       → MONO_BUILD=0
```

Маршруты/экраны knowledge/hiring НЕ удалялись (только точка входа из Sidebar) —
это осознанно: правка минимальна, экраны остаются доступны по прямой ссылке.
