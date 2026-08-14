# Донат (desktop/donate.html)

## Описание
Десктоп-версия страницы доната в оконной рамке приложения.

## Структура
- Window frame с titlebar (системные кнопки)
- Topbar внутри окна
- Content: hero, прогресс, уровни (4 колонки), VIP-уровень, способы оплаты

## Дизайн-требования
- Window frame (titlebar с traffic-light кнопками)
- Контент внутри окна приложения

## Компоненты (React / Electron / Tauri)
- `DonateProgress`, `DonateTier`, `PaymentMethods` (общие)

## API
- Единое API для всех узлов

## Технологии
- Electron / Tauri
- React 19
