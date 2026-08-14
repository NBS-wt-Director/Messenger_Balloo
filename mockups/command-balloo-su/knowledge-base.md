# 1_03_04 — База знаний (command-balloo-su/knowledge-base.html)

## Описание
Корпоративная база знаний с инструкциями, гайдами, changelog и внутренними документами.

## Структура
- **Topbar**: логотип Command, заголовок "База знаний"
- **Sidebar**: навигация (Dashboard, Chat, Meetings, Tasks, My dept, Departments, HR, Knowledge Base active, Hiring, Monitoring, Vacancies, Why us)
- **Content**:
  - Строка поиска с расширенными фильтрами (slide-up панель по категориям/тегам/дате)
  - Вкладки: Инструкции / Гайды / Changelog / Документы
  - Карточки с фильтрами по тегам, сортировкой, индикаторами "новое"/"обновлено"
  - Прогресс изучения (прочитано/всего)

## Вкладка "Инструкции"
- Фильтр по тегам
- Сортировка (по дате/популярности)
- Индикатор "новое" / "обновлено"
- Прогресс изучения (прочитано/всего)

## Вкладка "Гайды"
- Фильтр по тегам
- Прогресс изучения

## Вкладка "Changelog"
- Фильтр по типам (фичи/исправления/улучшения)
- Навигация между версиями (prev/next)
- Ссылка на полный релиз-нот

## Вкладка "Документы"
- Карточки внутренних документов (шаблоны, регламенты)
- Категории документов
- Поиск по документам
- Скачивание документов

## Панель просмотра статьи
- Expand-аккордеон (не slide-panel)

## Панель поиска
- Slide-up панель с фильтрами по категории/тегам/дате

## Дизайн-требования
- common.css, glassmorphism, темы
- card--hover эффекты

## Компоненты
- `KnowledgeSidebar` — sidebar навигации
- `KnowledgeTabs` — табы (Инструкции/Гайды/Changelog/Документы)
- `KnowledgeCard` — карточка статьи
- `ProgressIndicator` — прогресс изучения
- `SearchFilters` — slide-up панель фильтров поиска

## API
- `GET /api/v1/kb/articles?category=&tags=&sort=date` — статьи
- `GET /api/v1/kb/articles/:id` — статья по ID
- `GET /api/v1/kb/changelog` — changelog
- `GET /api/v1/kb/documents` — документы
- `POST /api/v1/kb/articles/read` — отметить как прочитанное

## WebSocket
- `kb:article_updated` — статья обновлена
- `kb:new_article` — новая статья

## Адаптивность
- Desktop: sidebar + content
- Mobile: sidebar → drawer

## Технологии
- React 19 + Next.js
- Zustand: `kbStore` (articles, documents, progress)
