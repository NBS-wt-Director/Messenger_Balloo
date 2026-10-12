# mvp1-06 — history.balloo.su и download.balloo.su: проверить фактическую отдачу (не «вынос в пакет»)

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов к работе (код-часть), TLS — блокировка владельца
**Кто:** Ksyusha (проверка сборок и маршрутов) + владелец (сертификат)
**Почему увеличивает MVP1:** `PROJECT_DOCUMENTATION.md` §17 ставит history и
download по 40% с формулировкой «нет отдельного пакета», а §17 п.3-4 требует
«вынести из web». Замеры показывают, что отдельный пакет для MVP1 **не требуется** —
требуется рабочий домен. Оценку 40% это меняет только после проверки отдачей.

## Найденные факты (замеры 12.10.2026)

1. Экраны живут в web и они не по 2 штуки:
   `packages/web/src/screens/history/` → `HistoryScreen.tsx`,
   `HistoryTimeline.tsx`, `VersionDetailScreen.tsx`, `CompareScreen.tsx`, `index.ts`;
   `packages/web/src/screens/download/` → `DownloadScreen.tsx`,
   `DownloadProgressScreen.tsx`, `components/`, `index.ts`.
2. Nginx уже включает оба поддомена в общий web-блок:
   `docker/prod/nginx-production.conf:105-106` и `:177-178` —
   `docs.balloo.su download.balloo.su features.balloo.su history.balloo.su`
   в одном `server_name`. Отдельных root'ов для них нет → их отдаёт тот же SPA.
   **Вывод: «вынести в отдельный пакет» для MVP1 не нужно, нужно чтобы домен
   отвечал.**
3. Отдача сейчас сломана на TLS (read-only `curl` этой сессии):
   `https://history.balloo.su` → `SSL: no alternative certificate subject name
   matches target host name 'history.balloo.su'`, `subject: CN=alpha.balloo.su`;
   `https://download.balloo.su` → та же ошибка. DNS ведёт на `188.73.176.34`.
   Для сравнения `https://balloo.su` → HTTP 200,
   `https://api.balloo.su/health` → HTTP 401 (норма, `auth_basic`).
4. В `tickets/active/1790480787-06.md` (от 27.09) план «четыре сайта отдельными
   сборками» — противоречит п.2; этот тикет фиксирует фактическое состояние,
   старый тикет не выполнять без решения владельца (admin/command — вне MVP1).

## Подзадачи

- [ ] 1. Найти маршруты в роутере web: `grep -rn "history\|download" packages/web/src/App.tsx
      packages/web/src/routes* 2>/dev/null` — записать реальные path'ы
      (роутер hash, `AGENTS.md` §Деплой п.1) в «Проблемы и решения».
- [ ] 2. Проверить, что экраны отдаются в ПРОИЗВЕДЁННОЙ сборке:
      `pnpm --filter @balloo/web build` (exit 0, прогон 12.10.2026) +
      локальный `vite preview` + `curl` по пути экрана. Зафиксировать HTTP-коды.
- [ ] 3. Проверить данные: какие эндпоинты дёргают эти экраны
      (`grep -rn "api.get\|axios" packages/web/src/screens/history packages/web/src/screens/download`),
      и что они отвечают на живом API (`curl https://api.balloo.su/api/...`
      read-only, с учёткой — только если есть тестовый токен; без учётки
      фиксировать 401 как факт, не как баг).
- [ ] 4. TLS/SAN — записать пунктом в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md`
      (перевыпустить сертификат с `history.balloo.su`, `download.balloo.su`,
      `cdn.balloo.su` — там уже есть похожий пункт 16 про `features`, добавить
      недостающие имена). Проверка от владельца: `curl -I https://history.balloo.su` → 200.
- [ ] 5. Обновить оценку в `PROJECT_DOCUMENTATION.md` §17 только по факту:
      строки history/download менять после п.2-3, с указанием команды-доказательства.

## Критерии готовности

- В «Результат»: реальные path'ы экранов, HTTP-коды из preview, список эндпоинтов
  с ответами.
- Пункт TLS в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` создан.
- Никаких новых пакетов `web-history`/`web-download` без решения владельца.

## Результат

(по ходу)
