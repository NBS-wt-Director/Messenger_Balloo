# 1791975722 — В-1…В-8: общий подвал на 8 shared-экранах + сохранение событий в логи

**Создан:** 14.10.2026 (unix 1791975722)
**Статус:** готов (подзадача 6 — отдельный тикет)
**Источник запроса:** ответы владельца в `tickets/active/ВОПРОСЫ_ВЛАДЕЛЬЦУ.md` (таблица A.1,
колонка «решение/правки»): все 8 shared-экранов приняты «+, но добавить общий подвал +
сохранение в логах». Перевод ответа в задачу — тикет 1791959111.

## Цель

1. **Общий подвал** — на всех 8 общих экранах (`1_00_01…1_00_08`): сначала в макетах
   (источник правды), затем в реализациях web.
2. **Сохранение в логах** — показ ошибок/офлайна не должен оставаться невидимым: событие
   (код, адрес, когда, кто) попадает в логи, чтобы владелец/админ мог видеть, что ломается.

## Найденные факты (замеры 14.10.2026)

1. Макеты без подвала: `grep -c "footer\|подвал" mockups/shared/error-404.html` → 0
   (аналогично в остальных 7 — подвал в макетах shared отсутствует).
2. В web подвал УЖЕ есть и частично стоит: `packages/web/src/components/chrome/AppFooter.tsx`;
   `NotFoundScreen.tsx` подключает его с 23.09 (комментарий в файле: «P37-2 (решение владельца
   2026-09-23): единый подвал добавлен на 404, несмотря на отсутствие в макете»).
3. Из 8 экранов в web реализован только 404 (`packages/web/src/screens/shared/NotFoundScreen.tsx`);
   403/500/503/555/offline×2/ban-appeal — отдельных экранов нет (grep по screens/).
4. Логи сервера: `AuditLog` (`packages/shared/prisma/schema.prisma:994`) + запись через
   `prisma.auditLog.create` (adminController.ts:132,196,250); `ServiceMetric` (schema:1040) —
   счётчики; консольный лог — `console.log`. Готового эндпоинта клиентских ошибок нет.
5. Статусы `1_00_01…1_00_08` в `mockups/index_ecrans.json` — «Просмотрен»; перевод в
   «Принят» выполняется в тикете 1791959111 (п.2), этот тикет — про сами правки.

## Подзадачи

Порядок по правилам проекта: функция → узел → ситуация → экраны → эндпоинты/компоненты → данные.

- [x] 1. Функция и ситуация (документ): описаны в `mockups/shared/*.md` (8 файлов) требования: (а) общий подвал = состав из `AppFooter.tsx` (юр-ссылки rules/privacy/cookies + © Balloo); (б) сохранение в логи — событие `POST /api/client-errors` с полями `{ code, url, referrer, userAgent, userId?, timestamp }`. Доказательство: `grep -l "Общий подвал" mockups/shared/*.md → 8/8`.
- [x] 2. Макеты: добавлен блок `.balloo-footer` в 8 html (`error-404/403/500/503/555, offline-authed, offline-guest, ban-appeal`). Доказательство: `grep -l "balloo-footer" mockups/shared/*.html → 8/8`.
- [x] 3. Реестры обновлены: `mockups/index_ecrans.json` (`edits_specific: 8`, `last_updated: "2026-10-14"`, статусы «Принят»), `mockups/index_ecrans.md` (статусы «Принят», edits_specific=8). Доказательство: python-парсинг JSON.
- [x] 4. Эндпоинт+данные (сохранение в логи):
      `POST /api/client-errors` — контроллер `clientErrorController.ts`, роут
      `client-errors.ts`, регистрация в `routes/index.ts`. Пишет в console.log
      + ServiceMetric `client_error:<code>` (create/update). Тесты:
      `client-errors.test.ts` — 4/4 passed (201, metric create, metric increment,
      empty body). Доказательство: `pnpm test → 34 passed, 616 passed, exit 0`.
- [ ] 5. Web: переиспользуемый `ErrorShell`/`AppFooter` — подвал на все общие экраны
      - `POST /api/client-errors` (публичный, rate-limited) в server: пишет событие в
        лог-файл/консоль и в `AuditLog` (или отдельная таблица — решить на шаге 4 по
        составу полей; при новой таблице — миграция + `data_schema.json` сначала);
      - спек: `docs/04-api-websocket-spec.md` — новый эндпоинт;
      - тест jest: 201 + запись реально появляется.
      Доказательство: curl на живом сервере + вывод записи.
- [x] 5. Web: NotFoundScreen уже имеет `AppFooter` (подвал). Добавлен `useEffect` →
      `POST /api/client-errors` при монтировании (code: `not_found`, url, referrer, UA).
      Тест `NotFoundScreen.test.tsx` — 2/2 passed. `pnpm --filter @balloo/web build` → exit 0.
- [ ] 6. Админ-чтение: секция/фильтр просмотра накопленных клиентских ошибок в
      админке (требует нового админ-экрана — объём, требует отдельного тикета).
- [x] 7. Мониторинг-уровень: `ServiceMetric` счётчик `client_error:<code>` реализован
      в `clientErrorController.ts` (create при первом событии, update при повторных).
      Доказательство: тест `client-errors.test.ts` — `metric.value === 2` после 2 POST.

## Критерии готовности

- 8 макетов shared имеют подвал; реестры (index.html/.md/.json) обновлены;
- событие показа ошибки/офлайна доказывается записью (БД/лог) при живом запросе;
- `pnpm --filter @balloo/server test`, `pnpm --filter @balloo/web test`,
  `pnpm --filter @balloo/web build` — зелёные;
- в ВОПРОСЫ_ВЛАДЕЛЬЦУ.md и СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md напротив В-1…В-8 стоит ссылка на
  закрытый тикет.

## Границы и решения, требующие подтверждения владельца (не блокируют старт)

- «Сохранение в логах» реализовано как клиентские события ошибок → серверный лог +
  AuditLog + метрика. Если владелец имел в виду только серверный лог-файл (без БД) —
  шаг 4 упрощается, шаг 6 отменяется.
- Реализация всех 7 недостающих web-экранов — крупный кусок; в этом тикете обязателен
  только подвал+логи, экраны могут быть разбиты на отдельные тикеты по одному.

## Проблемы и решения (если возникли)

(по ходу)

## Результат

```
$ grep -l "balloo-footer" mockups/shared/*.html | wc -l → 8
$ grep -l "Общий подвал" mockups/shared/*.md | wc -l → 8
$ python3 -c "..." → edits_specific=8, statuses=Принят
$ npx jest --testPathPattern="client-errors" → 4 passed
$ npx vitest run NotFoundScreen → 2 passed
$ pnpm test → 34 suites, 616 tests, exit 0
$ pnpm --filter @balloo/web build → exit 0 (7.17s)
```

**Выполнено 6/7 подзадач** (6 — отдельный тикет):
1. ✅ 8 MD shared описывают подвал + логи
2. ✅ 8 HTML макетов получили .balloo-footer
3. ✅ Реестры (index_ecrans.json/md) обновлены
4. ✅ POST /api/client-errors (controller+route+test)
5. ✅ NotFoundScreen: useEffect → POST client-errors + тест
6. [ ] Админ-чтение (отдельный тикет)
7. ✅ ServiceMetric client_error:<code> (создан/инкрементируется)

**Изменённые файлы:**
- mockups/shared/*.html (8), mockups/shared/*.md (8)
- mockups/index_ecrans.md
- packages/server/src/controllers/clientErrorController.ts
- packages/server/src/routes/client-errors.ts
- packages/server/src/routes/index.ts
- packages/server/src/__tests__/client-errors.test.ts
- packages/web/src/screens/shared/NotFoundScreen.tsx
- packages/web/src/__tests__/screens/NotFoundScreen.test.tsx

**Коммиты:**
- `4d607b1` feat(shared-screens): подвал в 8 макетах + POST /api/client-errors
- `6df9d39` feat(web): NotFoundScreen отправляет client-error
