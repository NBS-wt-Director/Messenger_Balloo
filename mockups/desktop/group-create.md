# 1_09_16 — Создание группы (Desktop)

**ID:** `1_09_16`
**Функция:** `0_09_03` — Групповые чаты
**Формат:** Desktop window
**Файл:** `group-create.html`

---

## Описание

Окно создания группы в desktop-приложении. Форма с названием, описанием, выбором участников, генерацией аватара группы.

---

## Структура

### Window Frame (900px, window chrome)
- Title bar: «Balloo Messenger — Создать группу»
- Sidebar (240px): навигация по разделам настроек
- Content: форма создания группы

### Content (форма)
1. **Название группы** — text input (max 100)
2. **Описание** — textarea (max 500)
3. **Аватар группы** — градиентная генерация + кнопка перегенерации
4. **Участники** — список контактов с чекбоксами, поиск
5. **Кнопка «Создать группу»** — primary

### Status Bar
- Статус подключения, версия

---

## Дизайн-требования
- Window frame: max-width 900px, shadow-glass
- Sidebar: 240px, bg-tertiary, border-right
- Cover preview: 120px, gradient
- Avatar gradient: 3-color linear-gradient

---

## Взаимодействия
- Ввод названия → валидация (не пустое)
- Выбор контактов → чекбоксы, счётчик
- Генерация аватара → клик на regen-btn
- Создание → POST /api/chats с type=group

---

## API
| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/chats` | Создать группу (type=group) |
| GET | `/api/users/contacts` | Список контактов |

---

## Технологии
- React + TypeScript
- Balloo Web API (api.createGroup)
- CSS variables (common.css)
