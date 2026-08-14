# Донат (mobile/donate.html)

## Описание
Мобильная версия страницы доната. Адаптация web-экрана `balloo-su/donate.html`. Полная копия бизнес-логики: уровни поддержки, прогресс-бар, способы оплаты, топ доноров, кнопка «Мои донаты».

## Структура
- **Phone frame** (360×760px) с notch, statusbar, home-bar
- **Topbar** (обязательный): логотип с dropdown-навигацией (14 пунктов кликабельных), аватар пользователя, переключатели языка (🇷🇺 RU) и темы (🌙 Тёмная)
- **Content** (scrollable):
  - Hero (💚 + заголовок + описание)
  - Прогресс-бар цели месяца (67%, 134 000 ₽ из 200 000 ₽)
  - Уровни поддержки (4 card): Кофе (100 ₽), Спонсор (500 ₽/мес), Платиновый (5 000 ₽/мес), Своя сумма (input + OK)
  - Способы оплаты: Карта, СБП, Crypto, ЮMoney (chips)
  - "Почему важна" — 4 пункта
  - Топ доноров месяца (3 строки: 🥇🥈🥉)
  - Кнопка «Мои донаты» → `my-donates.html`
- **Tabbar** (нижняя навигация, 5 элементов): Чаты, Контакты, Сторис, Звонки, Настройки (активен Настройки)

## Дизайн-требования
- Дизайн-система: `common.css`
- Темы: dark, light, russian (переключатель в topbar)
- Язык: 20 языков (переключатель в topbar)
- Сенсорные кнопки (минимум 44px height)
- Вертикальный стек карточек
- Все кнопки имеют `onclick` (не пустые)
- Все пункты dropdown имеют `onclick="window.location.href='...'"`

## Навигация
- Dropdown: `../balloo-su/...` для web-экранов
- Tabbar: локальные ссылки в `mobile/` (chat.html, contacts.html, stories.html, calls-history.html, settings.html)
- Аватар → `profile.html` (локальный mobile профиль)

## Компоненты (React Native / Expo)
- `DonateProgressMobile` — прогресс-бар цели
- `DonateTierMobile` — карточка уровня поддержки
- `PaymentSheet` — способы оплаты
- `DonorRankingMobile` — топ доноров
- `MobileTopbar` — общий topbar с dropdown
- `MobileTabbar` — нижняя навигация

## API
- `GET /api/donate/tiers` — уровни поддержки
- `GET /api/donate/goal` — текущая цель и прогресс
- `GET /api/donate/donors/top` — топ доноров
- `POST /api/donate/payment` — создание платежа

## Технологии
- Expo / React Native
- In-app purchase (опционально)