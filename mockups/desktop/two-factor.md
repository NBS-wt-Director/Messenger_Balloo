# Настройка 2FA — Desktop (desktop/two-factor.html)

## Описание
Десктоп-адаптация экрана настройки 2FA (`1_01_30`) в обёртке окна ПК. Все платформы.

## Структура
- **WindowFrame**: max 1000px, titlebar, topbar
- **Content**: page-container--narrow, статус-карточка, QR+секрет, ввод кода, backup-коды (3 колонки), перегенерация, отключение

## Дизайн-требования
- Дизайн-система: common.css
- Window-frame обёртка
- Темы: dark, light, russian

## Компоненты (React)
- `TwoFactorSetup` (десктоп-адаптация компонента balloo.su)

## API
- `POST /auth/2fa/setup`
- `POST /auth/2fa/verify`
- `DELETE /auth/2fa`
- `POST /auth/2fa/backup-codes/regenerate`

## Технологии
- Electron / Tauri
- React 19
