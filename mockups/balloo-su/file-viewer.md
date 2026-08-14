# 1_01_33 — Просмотр файла/изображения (fullscreen viewer)

**ID:** `1_01_33`  
**Функция:** `0_01_21` — Просмотр файлов  
**Формат:** Модалка из чата (fullscreen overlay)  
**Файл:** `file-viewer.html`

---

## Описание

Полноэкранный просмотрщик файлов (изображений, видео, документов). Открывается по клику на миниатюру вложения в чате. Поддерживает навигацию между файлами, масштабирование, свойства файла.

---

## Структура

### Top Bar
- Логотип Balloo + навигация
- Заголовок: «Чаты»
- Аватар + язык/тема

### Sidebar
- Список чатов (упрощённый)

### Content (чат)
- Заголовок чата
- Сообщение с вложениями — миниатюры-шестиугольники (clip-path: hexagon)
- Клик по миниатюре → openViewer(index)

### Fullscreen Viewer (viewer-container)

#### Toolbar (top)
- Кнопка «✕ Закрыть» (также Esc)
- Имя файла + счётчик «1 / 3 · 240 КБ»
- Кнопки: 🔍 Масштаб, ℹ️ Свойства, 📥 Скачать, 📤 Переслать

#### Content (center)
- Основное изображение/превью (градиент-заглушка)
- Кнопки навигации: ‹ (prev) › (next)
- Боковая панель свойств (справа, slide-in)

#### Sidebar свойств (справа)
- ℹ️ Свойства файла
- Имя, тип, размер, разрешение, отправил, дата
- Кнопки: 📥 Скачать, 🗑 Удалить

#### Thumbnails strip (bottom)
- Миниатюры всех файлов в группе
- Активная миниатюра с outline var(--accent)
- Клик → openViewer(index)

---

## Дизайн-требования
- Fullscreen overlay: position fixed, inset 0, background rgba(0,0,0,0.92), z-index 600
- Toolbar: backdrop-filter blur(12px)
- Навигация: position absolute, left/right 16px, z-index 10
- Sidebar: width 320px, backdrop-filter blur(16px)
- Миниатюры: clip-path hexagon, transition opacity
- Активная миниатюра: outline 2px solid var(--accent)

---

## Взаимодействия
- Клик по миниатюре → openViewer(index) — показывает viewer
- ‹ › → prevImage() / nextImage()
- Esc → closeViewer()
- Стрелки ← → → prev/next
- + / = → toggleZoom() (100% ↔ 150%)
- ℹ️ → toggleSidebar()
- 📥 → downloadFile()
- 📤 → openModal('modal-forward')

---

## Данные файлов (массив files)
| # | Имя | Тип | Размер | Цвет |
|---|---|---|---|---|
| 1 | macos.png | PNG Image | 240 КБ | #2db84d → #1e9e3e |
| 2 | design.png | PNG Image | 1.2 МБ | #3b9eff → #1565c0 |
| 3 | demo.mp4 | MP4 Video | 15 МБ | #a855f7 → #7c3aed |

---

## API (предполагаемые)
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/files/{id}` | Получить файл |
| GET | `/api/files/{id}/download` | Скачать файл |
| DELETE | `/api/files/{id}` | Удалить файл |
| POST | `/api/files/{id}/forward` | Переслать файл |

---

## Технологии
- HTML5 + CSS3 (common.css)
- Vanilla JS (inline)
- Keyboard events (Escape, ArrowLeft, ArrowRight)
