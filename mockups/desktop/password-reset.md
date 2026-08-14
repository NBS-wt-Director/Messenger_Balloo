# Восстановление пароля — Desktop (desktop/password-reset.html)

## Описание
Десктоп-адаптация экрана восстановления пароля (`1_01_29`) в обёртке окна ПК (Electron/Tauri). Все платформы.

## Структура
- **WindowFrame**: max 1000px, titlebar (traffic-light dots), topbar
- **AuthContainer**: auth-card с иконкой, полем email, кнопкой, баннером подтверждения email

## Дизайн-требования
- Дизайн-система: common.css
- Window-frame обёртка (titlebar с dots)
- Темы: dark, light, russian

## Компоненты (React)
- `PasswordResetForm` (десктоп-адаптация компонента balloo.su)

## API
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`
- `POST /auth/email-verify/send`
- `GET /auth/email-verify/:token`

## Технологии
- Electron / Tauri
- React 19
