# Донат (download-balloo-su/donate.html)

## Описание
Страница доната на узле загрузок. Контекст: пользователь скачал приложение и может поддержать проект.

## Структура
- **Topbar**: логотип Download, заголовок «Поддержать проект»
- **Content**: hero, прогресс цели, уровни поддержки (3 карточки), способы оплаты, причины поддержать, ссылка на downloads.html

## Компоненты (React)
- `DonateProgress`, `DonateTier`, `PaymentMethods` (общие с balloo-su)

## API
- Единое API: те же endpoints, что и в balloo-su
- `POST /api/donate/track-source` — фиксация источника (download.balloo.su)

## Технологии
- React 19 / Next.js 15 (SSR)
