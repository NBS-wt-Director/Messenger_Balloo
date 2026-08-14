# Задание: balloo.su — О Balloo

## Макет
`balloo-su/about-balloo.html`

## Описание страницы
Информация о приложении Balloo: версия, технологии, лицензии, ссылки, дорожная карта. SSR для SEO.

## Структура страницы

### Topbar
- Логотип Balloo с dropdown навигацией
- Заголовок «О Balloo»
- Маскот 🦊, язык, тема

### Content (narrow)
1. Заголовок «О Balloo Messenger»
2. **Карточка версии**:
   - Версия: 1.0.0 (v1) + chip «Актуальная»
   - Описание: кроссплатформенный (Web, Desktop, iOS, Android)
3. **Карточка «Технологии»**:
   - Next.js 15, PostgreSQL 16, Prisma, WebSocket (Hono + uWebSockets), Expo, Electron, Docker, Kubernetes
4. **Карточка «Лицензии»**:
   - MIT License, Google Fonts (Open Font License), React (MIT), Next.js (MIT), Expo (MIT)
5. **Карточка «Ссылки»**:
   - ⬇️ Скачать приложение → `../download-balloo-su/downloads.html`
   - 📜 История версий → `../history-balloo-su/changelog.html`
   - 📚 API документация → `../docs-balloo-su/api-docs.html`
   - 💡 Предложить функцию → `../features-balloo-su/list.html`
   - 📋 Правила → `rules.html`
   - 🏢 О компании → `about-company.html`
6. **Карточка «Дорожная карта»**:
   - v1 (текущая): чаты, группы, звонки, OAuth, мультиязычность
   - v2 (план): Госуслуги, SMS, E2EE, подразделы чатов, Premium

## Функционал
- **Просмотр информации** — статичная страница
- **Ссылки** — переход на скачивание, changelog, API docs, фичи, правила, о компании
- **SSR** — для SEO

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Карточки — glassmorphism
- Chip «Актуальная» — accent
- Ссылки-список (list__item с кликом)
- page-container--narrow

## Компоненты
- `AboutBallooPage` — статичная страница
- `VersionCard` — карточка версии
- `TechList` — список технологий
- `LicenseList` — список лицензий
- `LinksList` — список ссылок
- `RoadmapCard` — дорожная карта (v1 / v2)

## API
- `GET /api/v1/app/info` — информация о приложении (версия, технологии, лицензии)

## Адаптивность
- Desktop: page-container--narrow
- Mobile: полный экран

## Технологии
- React 19 + Next.js (SSR для SEO)
- Статичный контент
