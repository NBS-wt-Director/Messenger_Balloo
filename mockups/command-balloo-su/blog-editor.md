# Задание: command.balloo.su — Редактор статьи

## Макет
`command-balloo-su/blog-editor.html`

## Описание страницы
Редактор статьи блога. Выбор канала (где сотрудник автор), обложка, заголовок, анонс, Markdown-редактор, категория, теги, локализация. Кнопки: сохранить черновик, отправить на ревью.

## Структура страницы

### Topbar
- Логотип Command, заголовок «Редактор статьи», кнопки: предпросмотр, сохранить, отправить на ревью

### Sidebar (narrow)
- Навигация портала, Мои статьи (active)

### Content (page-container)
1. **Навигация** — ← Мои статьи + кнопки действий
2. **Заголовок** + chip «Черновик»
3. **Выбор канала** — select (каналы, где сотрудник автор)
4. **Обложка** — drag-and-drop загрузка
5. **Заголовок** — input (крупный)
6. **Анонс** — textarea (до 300 символов)
7. **Markdown-редактор** — toolbar (B, I, H, ссылка, изображение, код, цитата, список) + textarea
8. **Категория + теги** — select + input
9. **Локализация** — таблица переводов (6 языков)
10. **Кнопки** — сохранить черновик / отправить на ревью / удалить

## Функционал
- **Markdown-редактор** — toolbar кнопки вставляют разметку
- **Загрузка обложки** — drag-and-drop, MinIO/Yandex Disk
- **Сохранить черновик** — статус `draft`
- **Отправить на ревью** — статус `pending_review`
- **Локализация** — добавить перевод для каждого из 6 языков
- **Предпросмотр** — как будет выглядеть после публикации

## Дизайн-требования
- Markdown-редактор — monospace textarea, toolbar над ней
- Загрузка обложки — dashed border, drag-and-drop
- Кнопки — primary (отправить), secondary (сохранить), tertiary (удалить)

## Компоненты
- `BlogEditorPage` — страница редактора
- `MarkdownEditor` — редактор Markdown с toolbar
- `CoverUploader` — загрузка обложки
- `TranslationTable` — таблица локализаций

## API
- `POST /api/blog/posts` — создать черновик (указание `channelId`)
- `PUT /api/blog/posts/:id` — обновить черновик
- `POST /api/blog/posts/:id/submit` — отправить на ревью
- `DELETE /api/blog/posts/:id` — удалить черновик
- `POST /api/blog/posts/:id/media` — загрузить медиа

## Адаптивность
- Desktop: sidebar + content
- Mobile: sidebar скрывается, редактор на весь экран

## Технологии
- React 19 + Next.js
- Markdown-редактор (react-markdown / @uiw/react-md-editor)
- Загрузка файлов: MinIO / Yandex Disk
