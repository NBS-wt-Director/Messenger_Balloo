# Журнал аудита (admin-balloo-su/audit-log.html)

## Описание
Журнал действий администраторов. Только чтение. Фильтры по adminId, action, target, периоду. Виртуализированная таблица для больших объёмов.

## Структура
- **Topbar**: логотип Admin, заголовок «Журнал аудита»
- **Sidebar**: навигация админ-панели (Журнал аудита активно)
- **Content**:
  - Фильтры (adminId, действие, цель, период С/По)
  - Виртуализированная таблица (время, админ, действие, цель, IP, детали)
  - Счётчик показанных/всего записей

## Дизайн-требования
- Дизайн-система: common.css
- Цвета действий: ban — danger, verify — info, suspend — warning, transfer — accent
- Темы: dark, light, russian

## Компоненты (React)
- `AuditLogTable` — виртуализированная таблица с фильтрами

## API
- `GET /admin/audit-logs` — журнал с фильтрами (?adminId, ?action, ?target, ?from, ?to)

## Сущности данных
- `audit_logs` — adminId, action, target, before (Json), after (Json), ip, createdAt. Поля достаточны для фильтров.

## Технологии
- React 19 / Next.js 15
- Виртуализация: react-window / @tanstack/react-virtual
