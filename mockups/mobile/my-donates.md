# Мои донаты — Mobile (mobile/my-donates.html)

## Описание
Мобильная адаптация экрана «Мои донаты» (`balloo-su/my-donates.html`). Полная копия бизнес-логики: сводка, активные подписки с отпиской, история пожертвований со статусами и чеками, кнопка нового пожертвования.

## Структура
- **Phone frame** (360×760px) с notch, statusbar, home-bar
- **Topbar** (обязательный): логотип с dropdown-навигацией (14 пунктов кликабельных), аватар пользователя, переключатели языка (🇷🇺 RU) и темы (🌙 Тёмная)
- **Content** (scrollable):
  - Заголовок: «💰 Мои донаты»
  - Сводка (3 card): Всего пожертвовано (12 400 ₽), Активные подписки (2), Уровень (VIP ⭐)
  - Активные подписки: VIP (1 000 ₽/мес, Карта, 01.08.2026) + Спонсор (500 ₽/мес, СБП, 03.08.2026), каждая с кнопкой «Отписаться»
  - История пожертвований (6 строк): дата, сумма, тип, способ, статус (chip: Успешно/В обработке/Отклонено), чек (PDF)
  - Кнопка «Сделать новое пожертвование» → `donate.html`
- **Tabbar** (нижняя навигация, 5 элементов): Чаты, Контакты, Сторис, Звонки, Настройки (активен Настройки)

## Дизайн-требования
- Дизайн-система: `common.css`
- Темы: dark, light, russian (переключатель в topbar)
- Язык: 20 языков (переключатель в topbar)
- Сенсорные кнопки (минимум 44px height)
- Статусы цветные: chip--accent (Успешно), chip--warning (В обработке), chip--danger (Отклонено)
- Все кнопки имеют `onclick` (не пустые)

## Навигация
- Dropdown: `../balloo-su/...` для web-экранов
- Tabbar: локальные ссылки в `mobile/` (chat.html, contacts.html, stories.html, calls-history.html, settings.html)
- Аватар → `profile.html` (локальный mobile профиль)
- Кнопка «Сделать новое пожертвование» → `donate.html`

## Компоненты (React Native / Expo)
- `DonateSummaryMobile` — сводка (3 card)
- `SubscriptionCardMobile` — активная подписка с кнопкой отписки
- `DonateHistoryMobile` — история пожертвований со статусами
- `MobileTopbar` — общий topbar с dropdown
- `MobileTabbar` — нижняя навигация

## API
- `GET /api/donate/me/history` — история пожертвований
- `GET /api/donate/me/subscriptions` — активные подписки
- `DELETE /api/donate/subscriptions/:id` — отписка
- `GET /api/donate/me/summary` — сводка (сумма, уровень)

## Технологии
- React Native / Expo