# 🎫 TICKET: Часть 2 — Модальные окна, Slide-панели, Анимации

**Создан:** 20.07.2026
**Приоритет:** Высокий
**Блокер:** Нет (работает параллельно с Частью 1)
**Связанный файл:** `/home/ivan/Рабочий стол/voprosy_po_vsem_problemam.md`

---

## 📋 Контекст

Часть 1 (вкладки) завершена на 94%. Осталось:
- department-management.html — доделать табы
- Обновить индексы

**Часть 2** — это модалки, slide-панели и анимации для ~15 экранов.

---

## 🔧 ЗАДАЧИ ЧАСТИ 2

### A. Модальные окна (должны быть, но не показаны)

#### A1. balloo-su/chats.html — Основной чат
**Файл:** `mockups/balloo-su/chats.html`

Нужно добавить:
- [ ] **A1.1. Эмодзи-панель** — базовые смайлы (без категорий, категории на v2)
- [ ] **A1.2. Панель ответа на сообщение** — inline-панель над полем ввода (аватар + превью сообщения + поле ввода)
- [ ] **A1.3. Панель реакций** — floating-панель с эмодзи-реакциями (👍 ❤ 🔥 😂 😮 😢 🤮 👎)
- [ ] **A1.4. Панель пересылки** — модальное окно с поиском чатов и списком
- [ ] **A1.5. Выпадающее меню чата (⋮)** — добавить пункты: закрепить, заглушить, архив, экспорт, заблокировать
- [ ] **A1.6. Панель отложенного сообщения** — кнопка + модальное окно выбора даты/времени
- [ ] **A1.7. Контекстное меню сообщения** —长按/правый клик: ответить, копировать, реакцию, переслать, изменить, удалить, жалоба

#### A2. balloo-su/stories.html — Истории
**Файл:** `mockups/balloo-su/stories.html`

Нужно добавить:
- [ ] **A2.1. Правая панель историй** — список участников, кнопка «Ответить» с полем ввода, прогресс-бар просмотра, навигация (стрелки)
- [ ] **A2.2. Полноэкранный режим** — прогресс-бар сверху, свайп для перехода

#### A3. admin-balloo-su/blog-channels.html — Корпоративные каналы
**Файл:** `mockups/admin-balloo-su/blog-channels.html`

Нужно добавить:
- [ ] **A3.6. Подтверждение удаления канала** — с выбором что делать с оставшимися постами
- [ ] **A3.6. Просмотр статистики канала**

#### A4. admin-balloo-su/blog-categories.html — Категории и теги
**Файл:** `mockups/admin-balloo-su/blog-categories.html`

Нужно добавить:
- [ ] **A4.2. Модалка подтверждения удаления категории**
- [ ] **A4.3. Модалка подтверждения удаления тега**

#### A5. admin-balloo-su/features-flags.html — Feature Flags
**Файл:** `mockups/admin-balloo-su/features-flags.html`

Нужно добавить:
- [ ] **A5.1. Модалка «Выключить флаг»** — добавить детали: список затронутых пользователей, причина
- [ ] **A5.2. Модалка подтверждения удаления флага**

#### A6. admin-balloo-su/blog-review.html — Рецензирование блога
**Файл:** `mockups/admin-balloo-su/blog-review.html`

Нужно добавить:
- [ ] **A6.2. Модалка «Одобрить публикацию»** — НЕТ (не нужно)

---

### B. Модальные окна — частично показаны

#### B1. balloo-su/invites.html — Приглашения
**Файл:** `mockups/balloo-su/invites.html`
**Статус:** Уже обновлён в Части 1 ✅
- [ ] Модалка QR-кода — есть
- [ ] Модалка создания приглашения — есть

#### B2. admin-balloo-su/employees.html — Сотрудники
**Файл:** `mockups/admin-balloo-su/employees.html`
**Статус:** Уже обновлён в Части 1 ✅
- [ ] Модалка настроек сотрудника — есть
- [ ] Модалка увольнения — есть
- [ ] Модалка перемещения — есть
- [ ] Модалка создать отдел — есть

---

### C. Slide-панели (вложенные панели)

#### C1. balloo-su/chats.html — Основной чат
**Файл:** `mockups/balloo-su/chats.html`

Нужно добавить:
- [ ] **C1.1. Панель вложений** — полноэкранная панель (превью фото/видео, скачать, открыть в новой вкладке)
- [ ] **C1.2. Панель настроек сообщения** — slide-panel справа (закрепить, заглушить, экспорт, удалить)
- [ ] **C1.3. Панель отложенных сообщений** — отдельная панель со списком
- [ ] **C1.4. Панель быстрых реакций** — floating-панель с эмодзи

#### C2. balloo-su/profile.html — Профиль
**Файл:** `mockups/balloo-su/profile.html`

Нужно добавить:
- [ ] **C2.1. Панель редактирования аватара** — slide-panel (загрузить фото / камера / сгенерировать / удалить)
- [ ] **C2.2. Панель управления аккаунтами** — slide-panel с деталями каждого аккаунта + кнопка выхода + модалка подтверждения + кнопка добавить
- [ ] **C2.3. Панель блокировки пользователей** — slide-panel со списком заблокированных + кнопка разблокировать

#### C3. balloo-su/settings.html — Настройки
**Файл:** `mockups/balloo-su/settings.html`
**Статус:** Уже обновлён в Части 1 ✅

Нужно добавить:
- [ ] **C3.1. Панель выбора языка** — slide-panel с группами языков (русские/дружественные/остальные), упоминание что в v2 будет больше
- [ ] **C3.2. Панель переключения тем** — slide-panel с превью всех 3 тем, упоминание что в v2 будет больше

#### C4. mobile/chat.html — Мобильный чат
**Файл:** `mockups/mobile/chat.html`

Нужно добавить:
- [ ] **C4.1. Панель вложений** — slide-up панель (фото/видео/документ/геолокация/контакт)
- [ ] **C4.2. Панель эмодзи** — только базовые смайлы
- [ ] **C4.3. Панель ответов/реакций** — slide-up панель (ответить, реакция, переслать, удалить)

#### C5. mobile/settings.html — Мобильные настройки
**Файл:** `mockups/mobile/settings.html`

Нужно добавить:
- [ ] **C5.1. Панель выбора языка** — slide-up панель
- [ ] **C5.2. Панель темы** — карточки с превью тем

#### C6. command-balloo-su/knowledge-base.html — База знаний
**Файл:** `mockups/command-balloo-su/knowledge-base.html`
**Статус:** Уже обновлён в Части 1 ✅

Нужно добавить:
- [ ] **C6.1. Панель просмотра статьи** — expand-аккордеон (не slide-panel) ✅ уже есть
- [ ] **C6.2. Панель поиска** — slide-up панель с фильтрами по категории/тегам/дате ✅ уже есть

---

### D. Анимации (CSS transitions, animations, keyframes)

#### D1. balloo-su/chats.html — Основной чат
**Файл:** `mockups/balloo-su/chats.html`

Нужно добавить в common.css:
- [ ] **D1.1. Анимация появления сообщений** — slide-up + fade-in
- [ ] **D1.2. Анимация «печатает...»** — bounce-анимация трёх точек
- [ ] **D1.3. Анимация реакций** — scale + bounce
- [ ] **D1.4. Плавный скролл** — scroll-behavior: smooth
- [ ] **D1.5. Hover на сообщениях** — background transition

#### D2. balloo-su/profile.html — Профиль
**Файл:** `mockups/balloo-su/profile.html`

Нужно добавить в common.css:
- [ ] **D2.1. Hover на карточках** — box-shadow + transform scale
- [ ] **D2.2. Анимация переключения аккаунтов** — slide/fade transition
- [ ] **D2.3. Анимация переключения тем** — fade transition (150ms)

#### D3. admin-balloo-su/bans.html — Баны
**Файл:** `mockups/admin-balloo-su/bans.html`
**Статус:** Обновлён в Части 1 ✅

- [ ] **D3.1. Анимация переключения табов** — НЕТ
- [ ] **D3.2. Анимация появления карточек банов** — НЕТ

#### D4. mobile/chat.html — Мобильный чат
**Файл:** `mockups/mobile/chat.html`

Нужно добавить в common.css:
- [ ] **D4.1. Анимация появления сообщений** — НЕТ
- [ ] **D4.2. Анимация отправки** — slide-out справа
- [ ] **D4.3. Анимация «печатает...»** — bounce точек
- [ ] **D4.4. Анимация swipe для удаления** — swipe left

#### D5. balloo-su/stories.html — Истории
**Файл:** `mockups/balloo-su/stories.html`

Нужно добавить в common.css:
- [ ] **D5.1. Анимация прогресс-бара** — linear animation 5 секунд
- [ ] **D5.2. Анимация перехода между историями** — slide transition
- [ ] **D5.3. Анимация появления историй** — scale-in

#### D6. Общие анимации (все экраны)
**Файл:** `mockups/assets/common.css`

Нужно добавить в common.css:
- [ ] **D6.1. Hover на кнопках** — color + background transition (150ms)
- [ ] **D6.2. Hover на карточках** — box-shadow + subtle scale
- [ ] **D6.3. Hover на строках таблиц** — background color transition
- [ ] **D6.4. Анимация открытия/закрытия модалок** — overlay fade-in + modal scale-in (222ms)
- [ ] **D6.5. Анимация открытия/закрытия slide-панелей** — slide from right (222ms)
- [ ] **D6.6. Skeleton shimmer** — для карточек/таблиц
- [ ] **D6.7. Spinner** — для мелких элементов
- [ ] **D6.8. Toast уведомления** — slide-down (222ms)

---

## 🔧 ЗАДАЧИ ПОСЛЕ ЧАСТИ 2

### P0. Доделать department-management.html
**Файл:** `mockups/command-balloo-su/department-management.html`
**Проблема:** Табы были переименованы, но контент не переключается корректно.
**Решение:** Полностью переписать файл с правильной структурой tab-group.

### P1. Обновить индексы
**Файлы:**
- `mockups/index.html` — обновить карточки экранов, количество экранов, статусы
- `mockups/index_ecrans.json` — обновить метаданные, статусы, last_updated
- `mockups/index_ecrans.md` — обновить сводную таблицу

### P2. Обновить MD-документацию
**Файлы:**
- `mockups/balloo-su/group-settings.md`
- `mockups/balloo-su/invites.md` (создать новый)
- `mockups/balloo-su/settings.md`
- `mockups/admin-balloo-su/bans.md`
- `mockups/admin-balloo-su/employees.md`

### P3. Обновить docs/
**Файлы:**
- `docs/04-api-websocket-spec.md` — новые endpoints
- `docs/03-database-schema.md` — новые таблицы

---

## 📁 Список всех файлов для работы

### Обновляемые HTML-файлы:
1. `mockups/balloo-su/chats.html`
2. `mockups/balloo-su/stories.html`
3. `mockups/balloo-su/profile.html`
4. `mockups/admin-balloo-su/blog-channels.html`
5. `mockups/admin-balloo-su/blog-categories.html`
6. `mockups/admin-balloo-su/features-flags.html`
7. `mockups/admin-balloo-su/blog-review.html`
8. `mockups/command-balloo-su/department-management.html`
9. `mockups/mobile/chat.html`
10. `mockups/mobile/settings.html`

### Обновляемые CSS/JS:
11. `mockups/assets/common.css` — анимации (D1-D6)
12. `mockups/assets/common.js` — вспомогательные функции

### Индексы:
13. `mockups/index.html`
14. `mockups/index_ecrans.json`
15. `mockups/index_ecrans.md`

### MD-документация:
16. `mockups/balloo-su/group-settings.md`
17. `mockups/balloo-su/invites.md` (новый)
18. `mockups/balloo-su/settings.md`
19. `mockups/admin-balloo-su/bans.md`
20. `mockups/admin-balloo-su/employees.md`

---

## 🎯 Рекомендуемый порядок работы

1. **department-management.html** — починить табы (быстро, 15 мин)
2. **common.css** — добавить все анимации (D1-D6) (1 час)
3. **chats.html** — модалки + slide-панели (2 часа)
4. **stories.html** — правая панель + полноэкранный режим (30 мин)
5. **profile.html** — slide-панели (30 мин)
6. **admin-balloo-su/blog-channels.html** — доп модалки (30 мин)
7. **admin-balloo-su/blog-categories.html** — модалки удаления (15 мин)
8. **admin-balloo-su/features-flags.html** — модалка выключения (15 мин)
9. **mobile/chat.html** — slide-up панели (45 мин)
10. **mobile/settings.html** — slide-up панели (20 мин)
11. Индексы (30 мин)
12. MD-документация (1 час)

**Общее время:** ~5-6 часов

---

## 📝 Ссылки на контекст

- Главный AGENTS.md: `mockups/../AGENTS.md`
- Файл с вопросами: `/home/ivan/Рабочий стол/voprosy_po_vsem_problemam.md`
- Дизайн-система: `mockups/assets/common.css`
- Схема данных: `mockups/data_schema.json`
- Seed-данные: `mockups/pre_filled_data.json`

---

## ✅ Критерии завершения тикета

- [ ] department-management.html работает (табы переключаются)
- [ ] Все модалки из Части 2 добавлены
- [ ] Все slide-панели из Части 2 добавлены
- [ ] Все анимации из Части 2 добавлены в common.css
- [ ] Индексы (index.html, index_ecrans.json, index_ecrans.md) обновлены
- [ ] MD-документация обновлена для всех изменённых экранов
- [ ] voprosy_po_vsem_problemam.md обновлён (все решённые вопросы удалены)
