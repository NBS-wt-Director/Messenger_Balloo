# Задание: specifity.balloo.su — Компоненты (каталог)

## Макет
`specifity-balloo-su/components.html`

## Описание страницы
Каталог UI-компонентов монорепо (React / React Native): ~241 компонент (183 частных + 58 глобальных). Карточки по узлам с chip-списками компонентов. Глобальные компоненты — в `packages/shared/src/components/`, частные — в фич-фолдерах узлов. Фильтр по узлам.

## Структура страницы

### Topbar
- Логотип Specifity + dropdown узлов
- Заголовок: «Компоненты · каталог»
- Переключатели языка и темы

### Sidebar (240px)
- Навигация по разделам specifity (активная — Компоненты, счётчик 241), поиск компонента

### Content
1. **Заголовок экрана** — ID `1_10_07`, общее кол-во, расположение (shared vs частные)
2. **Фильтры по узлам** — Все (241), Shared (58), balloo, admin, command, specifity, blog
3. **Сетка карточек компонентов** (по узлам):
   - shared (7 глобальных) — ErrorScreen, OfflineScreen, MarkdownRenderer, Pagination ...
   - balloo.su (33) — ChatList, ChatWindow, MessageBubble, ProfileEditor ...
   - admin (44) — AdminLoginForm, TOTPInput, DashboardStats, ReportQueue ...
   - command (30) — SSOLogin, EmployeeDashboard, HRModule, VacancyList ...
   - features (8), history (6), download (5), docs (5)
   - mobile (15) — MobileChat, SwipeableMessage, TabBar, DrawerNav ...
   - desktop (10) — DesktopWindow, TitleBar, TrayIcon, GlobalHotkeyHandler ...
   - specifity (24) — SpecSidebar, SpecPageHead, SpecSplitView, SpecLinkedItem ...
   - blog (17) — BlogFeedPage, BlogPostCard, CommentTree, ChannelPage ...
4. **Подвал** — ссылка на `mockups/index.html` (раздел Компоненты) + каталог компании

## Дизайн-требования
- Дизайн-система: `@balloo/shared` + `spec.css`
- Карточки — glass, сетка auto-fill minmax(300px, 1fr)
- Глобальные компоненты — accent chip (`comp-chip--global`), частные — обычный chip
- Счётчик в заголовке карточки — accent badge
- Без border-radius
- Темы: dark, light, russian

## Компоненты
- `SpecSidebar` — общий
- `SpecPageHead` — заголовок
- `SpecFilterBar` / `SpecFilter` — фильтры по узлам
- `SpecCompCard` — карточка узла (заголовок + счётчик + chip-список)
- `SpecCompChip` — chip компонента (с модификатором `--global`)

## API
- `GET /api/v1/specifity/components` — каталог компонентов (узел, имя, тип global/private)
- `GET /api/v1/specifity/components/:node` — компоненты конкретного узла
- Данные из `index_ecrans.json` (поле `components_*`) + каталога компании, SSG

## Адаптивность / мобильные взаимодействия
- Десктоп: сетка карточек 300px+
- Планшет: 2 колонки
- Мобильный: 1 колонка, chip-списки с переносом

## Технологии
- Next.js 14 + TypeScript (SSG)
- Данные из `index_ecrans.json` + `/general_files/components/`
- Общий `SpecSidebar` (shared layout)
