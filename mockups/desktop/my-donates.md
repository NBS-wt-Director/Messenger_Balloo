# Мои донаты — Desktop (desktop/my-donates.html)

## Описание
Десктоп-адаптация экрана «Мои донаты» (`1_01_31`) в обёртке окна ПК. Все платформы.

## Структура
- **WindowFrame**: max 1000px, titlebar, topbar
- **Content**: page-container, сводка (3 колонки), таблица подписок, таблица истории, кнопка пожертвования

## Дизайн-требования
- Дизайн-система: common.css
- Window-frame обёртка
- Темы: dark, light, russian

## Компоненты (React)
- `DonateHistory` (десктоп-адаптация компонента balloo.su)

## API
- `GET /api/donate/me/history`
- `GET /api/donate/me/subscriptions`
- `DELETE /api/donate/subscriptions/:id`
- `GET /api/donate/me/receipts/:paymentId`

## Технологии
- Electron / Tauri
- React 19
