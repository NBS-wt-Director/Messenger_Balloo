# Объявления (admin-balloo-su/announcements.html)

## Описание
CRUD глобальных объявлений и баннеров. Объявления показываются пользователям в топбаре/баннерах с фильтром по аудитории (все/сотрудники/админы) и периоду.

## Структура
- **Topbar**: логотип Admin, заголовок «Объявления»
- **Sidebar**: навигация админ-панели (Объявления активно)
- **Content**:
  - Кнопка «+ Создать»
  - Форма редактора (заголовок, текст, аудитория, период, isDismissible)
  - Таблица активных и запланированных объявлений (редактировать/удалить)

## Дизайн-требования
- Дизайн-система: common.css
- Темы: dark, light, russian

## Компоненты (React)
- `AnnouncementsEditor` — форма CRUD объявлений

## API
- `GET /admin/announcements` — список
- `POST /admin/announcements` — создать
- `GET /admin/announcements/:id` — детали
- `PUT /admin/announcements/:id` — обновить
- `DELETE /admin/announcements/:id` — удалить

## Сущности данных
- `announcements` — добавлено поле `createdByAdminId` (FK → users)

## Технологии
- React 19 / Next.js 15
- Действия админа логируются в `audit_logs`
