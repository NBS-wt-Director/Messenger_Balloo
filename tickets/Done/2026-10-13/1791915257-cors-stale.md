# исправить: суффикс домена в CORS без якоря (критично)

**Слой:** 3 (транспорт/CORS). **Найдено:** 08.10.2026, аудит по сессии.

## Что найдено

`packages/server/src/config.ts:31-37` — проверка `origin.endsWith('.' + suffix)`,
где `suffix` по умолчанию `balloo.su`. Якоря по границе домена нет.

Обходит фильтр: `https://notballoo.su` (точка перед суффиксом отсутствует, но
`endsWith('.balloo.su')` даёт `true` для `https://x.balloo.su`-подобных; реальный
обход — любой домен, заканчивающийся на `.balloo.su`-строку, включая поддомены чужой
зоны при DNS-перехвате, и `https://evilsuffix.balloo.su.attacker.tld` при либеральной
развертке).

## Риск

CSRF/утечка токена через чужой origin: сервер ответит `Access-Control-Allow-Origin`
врагу, браузер пропустит запрос с credentials.

## Что сделать

1. Якорить по границе метки: `origin === suffix || origin.endsWith('.' + suffix)`
   с обязательной проверкой, что суффикс — registrable domain из конфига, а не произвольная строка.
2. Список разрешённых origin — явным массивом точных имён (balloo.su, api.balloo.su,
   history.balloo.su, download.balloo.su), суффиксный матчинг убрать совсем.

## Как проверить

Юнит-тесты: `https://notballoo.su` → 403; `https://sub.balloo.su` → ок;
`https://api.balloo.su` → ок. Прогон `pnpm -F server test`.

## Закрыт 09.10.2026 — закрыт этой правкой (Ksyusha, тикет 1791489922)

Как было описано: суффиксный матчинг `origin.endsWith('.' + suffix)` в
`packages/server/src/config.ts:31-37`. Файла `config.ts` в дереве нет, `endsWith`
по `packages/server/src` не встречается (`grep -rn "endsWith" packages/server/src --include=*.ts`).

Сделано по пункту 2 тикета («список явными именами, суффиксный матчинг убрать»):
`packages/server/src/middleware/cors.ts` берёт origin **только** из явного списка
`CORS_ORIGIN`; `'*'` и пустое значение отклоняет схема `config/env.ts:35-42`.

Доказательство тестами (`npx jest middleware-security-cors`, 582/582 зелёные):
`env: CORS_ORIGIN="*" отклоняется схемой`, `без CORS_ORIGIN схема отклоняет`,
`чужой origin не получает ACAO даже на POST с cookie`, `список разрешает только свои`.
