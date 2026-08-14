# Экран: Сторис — Mobile

**ID:** `1_08_03`
**Узел:** `у_08` — mobile
**Файл макета:** `mockups/mobile/stories.html`
**Web-источник:** `mockups/balloo-su/stories.html`

---

## Описание

Мобильная версия экрана «Сторис». Трей сторис (октагон-аватары) + полноэкранный просмотрщик с прогресс-барами, навигацией и полем ответа. TTL 24 часа. Бизнес-логика 1:1 с web-версией.

## Структура

- **Phone-frame** (360×760px) с notch, statusbar, home-bar
- **Topbar** (обязательный) — логотип Balloo с dropdown, заголовок «Сторис», аватар, lang/theme toggle
- **Stories tray** — горизонтальный скролл аватаров-октагонов:
  - «+» — создание сторис (story-avatar--add, accent-фон)
  - Непросмотренные — цветные октагоны
  - Просмотренные — story-avatar--viewed (opacity 0.6)
- **Чат-лист** — компактный список чатов (как в web)
- **Tabbar** — Сторис активна

## Story Viewer (полноэкранный)

- **Progress bars** — 3 сегмента (по количеству сторис пользователя)
- **Header** — аватар-октагон, имя, время «2 часа назад», кнопка ✕
- **Content** — фрейм сторис на весь экран, стрелки навигации ‹ ›
- **Footer** — поле ответа «Ответить на сторис...», кнопка ➤, счётчик просмотров 👁

## Бизнес-логика (из web)

- `openStoryViewer()` — открыть просмотрщик
- `closeStoryViewer()` — закрыть
- `openStoryCreate()` — создание сторис
- `prevStory()` / `nextStory()` — навигация
- Ответ на сторис → отправка в чат автора
- Реакции на сторис
- TTL 24 часа

## Компоненты (React Native / Expo)

| Компонент | Описание |
|---|---|
| `MobileStoriesScreen` | Экран сторис |
| `StoriesTray` | Горизонтальный скролл аватаров |
| `StoryViewer` | Полноэкранный просмотрщик |
| `StoryProgressBars` | Прогресс-бары |

## API

См. `mockups/balloo-su/stories.html` — те же эндпоинты и WebSocket events.

## Дизайн-требования

- Октагон-аватары (clip-path: var(--octagon-clip-stories))
- Story viewer: чёрный фон, белые элементы
- Без border-radius
- 3 темы: dark, light, russian
