# Задание: specifity.balloo.su — Данные (сущности БД)

## Макет
`specifity-balloo-su/data.html`

## Описание страницы
Каталог сущностей базы данных монорепо (75 таблиц), сгруппированный по доменам. Каждая сущность — таблица, Prisma-модель, описание, тип (Seed / Runtime). СУБД PostgreSQL 16, ORM Prisma, миграции Flyway. Полная схема — в `docs/03-database-schema.md`.

## Структура страницы

### Topbar
- Логотип Specifity + dropdown узлов
- Заголовок: «Данные · сущности БД»
- Переключатели языка и темы

### Sidebar (240px)
- Навигация по разделам specifity (активная — Данные, счётчик 75), поиск таблицы

### Content
1. **Заголовок экрана** — ID `1_10_06`, стек (PostgreSQL 16, Prisma, Flyway, Supabase)
2. **Фильтры** — Все (75) / Seed / Runtime
3. **Группы таблиц** (таблицы):
   - Auth & Users (6) — users, accounts, sessions, devices, pair_tokens, account_device_links
   - Chats & Messages (8) — chats, chat_members, messages, message_edits, message_reads, attachments, reactions, pinned_messages
   - Groups (3) — groups, group_members, group_roles
   - Polls / Quizzes / Lists (3) — polls, poll_options, poll_votes
   - Contacts & Blocklist (2) — contacts, blocked_users
   - Reports & Bans (3) — reports, bans, ban_appeals
   - Calls (WebRTC) (2) — calls, call_participants
   - Drafts & Notifications (2) — drafts, notifications
   - Stories (2) — stories, story_views
   - Invites (1) — invites
   - Bots (2) — bots, bot_tokens
   - Donate (3) — donations, donate_goals, donate_tiers
   - Support (2) — support_tickets, support_messages
   - Feature Flags & Admin (5) — feature_flags, announcements, audit_logs, admin_2fa_secrets, file_storage_stats
   - Departments & Employees (3) — departments, department_members, employees
   - Meetings (2) — meetings, meeting_protocols
   - Tasks & Sprints (2) — tasks, sprints
   - Knowledge Base (2) — knowledge_articles, knowledge_categories
   - Vacancies & Applications (4) — vacancies, vacancy_translations, applications, application_stages
   - HR (1) — hr_requests
   - Features / фич-реквесты (5) — features, feature_categories, feature_votes, feature_comments, feature_changelogs
   - Versions (3) — versions, version_changes, version_translations
   - Onboarding & Text Content (4) — onboarding_steps, onboarding_step_translations, text_pages, text_page_translations
   - Blog (11) — blog_channels, blog_channel_members, blog_posts, blog_post_translations, blog_categories, blog_category_translations, blog_tags, blog_post_tags, blog_reactions, blog_comments, blog_post_views
4. **Подвал** — ссылка на `docs/03-database-schema.md` + Prisma-схему

## Дизайн-требования
- Дизайн-система: `@balloo/shared` + `spec.css`
- Тип таблицы — badge: Seed (warning) / Runtime (accent)
- Таблицы — `.spec-table`, без border-radius
- Темы: dark, light, russian

## Компоненты
- `SpecSidebar` — общий
- `SpecPageHead` — заголовок
- `SpecFilterBar` — фильтры Seed/Runtime
- `SpecDataGroup` — группа таблиц (заголовок + таблица)
- `SpecDataRow` — строка (таблица, модель, описание, тип)
- `DataTypeBadge` — badge Seed / Runtime

## API
- `GET /api/v1/specifity/data` — каталог сущностей (группы, таблицы, модели, тип)
- `GET /api/v1/specifity/data/:table` — детали таблицы (колонки, индексы, связи)
- Данные из Prisma-схемы / `docs/03-database-schema.md`, SSG

## Адаптивность / мобильные взаимодействия
- Десктоп: sidebar + таблицы
- Мобильный: таблицы горизонтально-скроллируемые

## Технологии
- Next.js 14 + TypeScript (SSG)
- Данные из Prisma-схемы (`packages/server/prisma/schema.prisma`)
- Общий `SpecSidebar` (shared layout)
