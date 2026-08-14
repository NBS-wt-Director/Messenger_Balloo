# Список версий (history-balloo-su/version-list.html)

## Описание
Главная страница узла history.balloo.su — список всех версий с минимальной информацией по каждой. SSR для SEO. Планируемые (ещё не выпущенные) версии отображаются с пунктирной рамкой и статусом «В планах».

## Структура
- **Topbar**: логотип History, заголовок «История версий»
- **Content** (page-container):
  - Заголовок и подзаголовок
  - Tabs: Все / Релизы / В планах
  - Список карточек версий:
    - Каждая карточка: версия (chip), тип (мажорная/минорная/патч), статус (релиз/в планах), дата, иконка, краткое описание, стрелка →
    - Планируемые версии: пунктирная рамка (border-style: dashed), opacity 0.85, chip «📋 В планах», иконка 🔮
  - Ссылка на download.balloo.su

## Дизайн-требования
- Планируемые версии: `border-style: dashed; border-color: var(--border-strong); opacity: 0.85;`
- Chip «В планах»: жёлтый фон, `color: var(--warning)`
- Релизные версии: обычные карточки с card--hover
- SSR (Server-Side Rendering) для SEO

## Компоненты (React)
- `VersionList` — список версий
- `VersionCard` — карточка версии (минимальная инфо)
- `VersionTabs` — фильтры (Все / Релизы / В планах)

## API
- `GET /api/versions` — список всех версий (с пагинацией)
- `GET /api/versions?status=planned` — только планируемые
- `GET /api/versions?status=released` — только релизные

## Адаптивность
- Desktop: карточки на всю ширину
- Mobile: вертикальный стек

## Технологии
- React 19 / Next.js 15 (SSR, generateStaticParams)
