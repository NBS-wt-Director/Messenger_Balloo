# Тикет 1795721513 — Двойные шапки/подвалы, кнопка панели, подсказка морзе

**Создан:** 27.11.2026 00:31 (unix 1795721513)
**Статус:** в работе
**Источник запроса:** владелец (чат 27.11.2026, скриншот экрана «Баллы Balloo»):
«проверь наличие двойных шапок и подвалов; нет кнопки скрыть/открыть левое
меню-панель; при наведении на морзе — всплывающая подсказка расшифровка»;
уточнение: «скрыть/открыть левую скрытую панель — на всех экранах где она есть».

## Что видно на скриншоте

1. **Две шапки**: глобальная (`AppTopbar` из `MainLayout`) + вторая
   (`AppTopbar` из `BalanceScreen`) — экран `balance` вложен в `MainLayout`,
   а сам ещё раз рисует шапку.
2. **Два подвала**: то же самое (`AppFooter` в `MainLayout` и в `BalanceScreen`).
3. **Левой панели нет и вернуть нечем**: `MainLayout` рендерит `{isSidebarOpen && <Sidebar />}` —
   при закрытой панели компонент исчезает вместе с кнопкой `◀/▶`.
4. **Морзе-тикер без подсказки**: `FooterMorseTicker` — `aria-hidden`, `title` нет.

## Подзадачи

- [x] 1. `MainLayout`: панель рендерится всегда на десктопе/планшете (свёрнутый рейл 64px);
      на мобиле — как раньше (панель на весь экран). `(!isMobile || isSidebarOpen) && <Sidebar />`
- [x] 2. `Topbar` (@balloo/ui): слот `leading` перед лого-меню.
- [x] 3. `AppTopbar`: кнопка `⟨`/`☰` с `aria-expanded`/`aria-controls="app-sidebar"`/`title`;
      пропы `onToggleSidebar`, `sidebarOpen`.
- [x] 4. `BalanceScreen`: собственные `AppTopbar`/`AppFooter` убраны; проверены все
      30 child-экранов `MainLayout` — других дублей нет (скрипт по списку роутера).
- [x] 5. `DocsScreen` (`/doc`) и `FeaturesListScreen` (`/features`): кнопка сворачивания
      их `.sidebar--narrow` в шапке; на мобиле по умолчанию закрыта.
- [x] 6. `GroupSettingsScreen` / `ChannelSettingsScreen`: **панель не тронута** —
      классов `page-layout`/`settings-sidebar` нет ни в одном CSS-файле
      (`grep -rn --include=*.css` → 0 совпадений), это обычный div в потоке,
      а не левая панель. Вынесено отдельной задачей (см. «Проблемы»).
- [x] 7. `FooterMorseTicker`: тултип `role="tooltip"` + `title` на тикере;
      текст расшифровки при наведении.
- [x] 8. `chrome.css`: `.topbar__leading`, `.topbar__sidebar-btn`,
      `.balloo-footer__ticker-wrap`, `.balloo-footer__morse-tip`.
- [x] 9. Проверка: `tsc --noEmit` shared/ui/web → exit 0; `vite build` web → exit 0
      (`index-DAOJoBfv.js`); `pnpm --filter @balloo/web test` → **57 файлов, 433 теста, 0 failed**.
- [ ] 10. Деплой web-образов + подтверждение владельца (скриншот).

## Критерии готовности

- На `/balance` и любом другом child-маршруте — одна шапка и один подвал.
- Кнопка «скрыть/открыть панель» доступна на всех экранах, где панель есть,
  в том числе когда панель свёрнута.
- Наведение на морзе-тикер показывает текст, который он кодирует.
- `tsc --noEmit` — exit 0; сборка web — exit 0.

## Проблемы и решения

1. **Тест `FooterMorseTicker` упал** после добавления тултипа:
   `expect(container.textContent).not.toContain('SOS')` — текст теперь есть в
   подсказке. Тест уточнён: букв нет внутри `.balloo-footer__ticker`, расшифровка
   живёт только в `[role="tooltip"]`; добавлен отдельный тест на подсказку.
2. **`page-layout` / `settings-sidebar` без стилей** — экраны настроек группы и
   канала не имеют левой панели как таковой (классы нигде не описаны в CSS).
   Отдельная задача, в этот тикет не входит.
3. **Рейл 64px и кнопка в панели**: при свёрнутой панели кнопка `◀` внутри неё
   переполняла рейл (20px лого + 34px кнопка при 48px доступной ширины) —
   кнопка скрыта при collapsed, переключение остаётся в шапке.

## Результат

Коммит `3070519` (пуш `3070519 main -> main`).

```
pnpm --filter @balloo/{shared,ui,web} exec tsc --noEmit   → EXIT=0, EXIT=0, EXIT=0
pnpm --filter @balloo/web exec vite build                 → ✓ built in 7.94s, index-DAOJoBfv.js
pnpm --filter @balloo/web test                            → Test Files 57 passed (57)
                                                            Tests 433 passed (433)
```

**Не проверено:** вид в браузере (нет браузера в этой сессии) — нужна приёмка
владельца после деплоя web-образов.
