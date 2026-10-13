# P2 — Инфо-поддомены: download, history, docs, blog (1790480787-06)

**Приоритет:** 2 (после P1)
**Создана:** 2026-10-08
**Источник:** тикет 1790480787-06.md

## Цель

Создать 4 пакета-сборки на `@balloo/ui`: web-download, web-history, web-docs, web-blog.

## Факты

- Пакеты `web-download`, `web-history`, `web-docs`, `web-blog` **не существуют** (`ls packages/`)
- Экраны живут внутри `packages/web`: `DownloadScreen`, `HistoryScreen`, `DocsScreen`, `screens/blog-landing/*` (6 экранов)
- `@balloo/ui` готов и используется web
- Макеты: `mockups/download-balloo-su/` (2), `history-balloo-su/` (3–4), `docs-balloo-su/` (1), `blog-balloo-su/` (6)

## Что нужно сделать

1. `packages/web-download` — по `mockups/download-balloo-su/` (статическая сборка)
2. `packages/web-history` — по `mockups/history-balloo-su/` (changelog)
3. `packages/web-docs` — Swagger UI + спека (проверить `/api/docs.json` или сгенерировать)
4. `packages/web-blog` — перенос `screens/blog-landing/*` (6 экранов) на API
5. Четыре Dockerfile по образцу `Dockerfile.web`
6. `pnpm build` зелёный в каждом

## Критерий готовности

- 4 пакета собираются (`tsc --noEmit` чисто)
- Каждый сайт открывается локально, контент = макет
- Темы (dark/light/russian) и языки работают

## Как отмечать этапы

- Каждый пакет: `[x]` после `tsc --noEmit` → 0 ошибок + `pnpm build` → exit 0
- Скриншот сверки с макетом — в «Результат»

## Результат
