# 1_01_40 — Панель вложений (drag & drop)

**ID:** `1_01_40`  
**Функция:** `0_01_05` — Отправка сообщений  
**Формат:** Выезжающая панель справа  
**Файл:** `attachment-panel.html`

---

## Описание

Slide-in панель справа (width 400px) для drag & drop файлов и быстрой отправки вложений в чат. Drag & drop зона, быстрые действия, недавние файлы, выбор нескольких файлов, отправка.

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
- Сообщение: «Отправляй файлы через панель вложений 📎»
- Input area: кнопка 📎 (accent color) → toggleAttachmentPanel()

### Slide-in Panel (attachment-panel) — right side

#### Header
- 📎 Вложения (font-bold 16px)
- Кнопка ✕ (закрыть)

#### Body (scrollable)
1. **Drag & Drop Zone**
   - 📁 иконка 40px
   - «Перетащите файлы сюда»
   - «или нажмите для выбора»
   - «Макс. 2 ГБ на файл · JPG, PNG, PDF, MP4, OGG...»
   - onclick → file input

2. **Быстрая отправка** (grid 3x2)
   - 🖼 Фото
   - 🎥 Видео
   - 📄 Документ
   - 📸 Скриншот
   - 🎵 Аудио
   - 📦 Файл

3. **Недавние файлы** (3 карточки)
   - macos.png (240 КБ, сегодня)
   - spec.pdf (340 КБ, вчера)
   - demo.mp4 (15 МБ, 15.07)

4. **Хранилище**
   - 847 МБ из 2 ГБ
   - Progress bar 42%

#### Footer (selected files) — показывается при выборе
- 📎 Выбрано: N
- Кнопка «Очистить»
- Список файлов (chips, кликабельные для удаления)
- ➤ Отправить в chat

---

## Дизайн-требования
- Panel: position fixed, top 56px, right -400px → 0, width 400px, transition right 0.3s ease
- Backdrop: rgba(0,0,0,0.3), z-index 400
- Drag zone: border dashed var(--border-strong), hover: var(--accent) + background rgba(45,184,77,0.06)
- Quick actions: grid 3 columns, card--hover
- Recent files: card padding 10px, hexagon thumbnail 40px
- Selected chips: style="cursor:pointer"

---

## Взаимодействия
- toggleAttachmentPanel(): open/close panel + backdrop
- handleDragOver: border var(--accent), bg rgba accent
- handleDragLeave: reset styles
- handleDrop: handleFileSelect(e.dataTransfer.files)
- handleFileSelect(files): add to selectedFiles[], updateSelectedList()
- clearSelected(): selectedFiles = [], update
- sendSelected(): togglePanel → showToast('Отправка...') → showToast('Файлы отправлены')
- Chip click: remove file from selectedFiles

---

## API (предполагаемые)
| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/messages/attach` | Отправить вложение |
| GET | `/api/files/recent` | Недавние файлы |
| POST | `/api/files/upload` | Загрузить файл |

---

## Технологии
- HTML5 + CSS3 (common.css)
- Vanilla JS (inline)
- Drag & Drop API
- File API (FileList)
