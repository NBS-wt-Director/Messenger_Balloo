# а-06 — docs/01: обновить header, ADR, roadmap

**Слой:** документация. **Из тикета 1791697090, шаги 1-5.**

## Что сделать

1. `docs/01-architecture-decisions.md`: обновить header (дата/HEAD), стек (web-features, число пакетов).
2. Добавить ADR: feedback modal + lazy-load router + security-правки октября (CORS fail-fast, pre-hash, JTI).
3. Roadmap v1: дописать features.balloo.su (отдельный SPA), feedback modal, lazy-load router; статус поддоменов.
4. `docs/project-report.md`: актуализировать коммиты/HEAD/маршруты.

## Как проверить

`head -25 docs/01-architecture-decisions.md` — свежая дата.
`grep -c "ADR-" docs/01-architecture-decisions.md` → ≥5.
`pnpm --filter @balloo/web build` зелёный.
