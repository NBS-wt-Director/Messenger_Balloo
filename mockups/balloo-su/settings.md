# Задание: balloo.su — Настройки приложения

## Макет
`balloo-su/settings.html`

## Описание страницы
Настройки приложения: уведомления (push, DND, звонки), оформление, язык, приватность, хранилище, устройства, Yandex Disk, оффлайн-кэш. Sidebar с разделами.

## Структура страницы

### Topbar
- Логотип Balloo с dropdown навигацией
- Заголовок «Настройки»
- Аватар → `profile.html`, язык, тема

### Sidebar (narrow)
- 🔔 Уведомления (active)
- 🎨 Оформление
- 🌍 Язык
- 🔒 Приватность
- 💾 Хранилище
- 📱 Устройства
- ☁️ Yandex Disk
- 📊 Оффлайн-кэш
- ℹ️ О Balloo

### Content (narrow) — «Уведомления»
1. Заголовок «Уведомления»
2. **Карточка «Push-уведомления»**:
   - Превью текста (20 символов)
   - Группировка (до 5 сообщений) — switch
   - Звук уведомлений (select: 5 стандартных / свой / без звука)
3. **Карточка «Не беспокоить (DND)»**:
   - Включить DND — switch
   - По расписанию (time: 22:00 — 08:00)
   - По геолокации — switch
4. **Карточка «Звонки»**:
   - Прерывающий звонок — switch
   - Вибрация при звонке — switch
5. **Карточка «Оффлайн-кэш (SQLite)»**:
   - Кэшировать сообщения — switch
   - Авто-очистка при >2GB — switch
   - Очередь отправки (офлайн) — switch
   - Используется: 847 МБ из 2 ГБ

## Функционал
- **Push-уведомления** — превью, группировка, звук
- **DND** — вкл/выкл, расписание, геолокация
- **Звонки** — прерывающий звонок, вибрация
- **Оффлайн-кэш** — кэш сообщений (SQLite), авто-очистка, очередь отправки
- **Разделы sidebar** — переключение между настройками

## Дизайн-требования
- Дизайн-система: `@balloo/shared`
- Switch для toggle
- Select для выбора
- Time input для расписания
- page-container--narrow

## Компоненты
- `SettingsSidebar` — sidebar с разделами
- `PushSettings` — push-уведомления (превью, группировка, звук)
- `DNDSettings` — DND (switch, расписание, геолокация)
- `CallSettings` — звонки (прерывающий, вибрация)
- `OfflineCacheSettings` — оффлайн-кэш (SQLite)

## API
- `GET /api/v1/users/me/settings` — получение настроек
- `PATCH /api/v1/users/me/settings` — обновление настроек
- `PATCH /api/v1/users/me/settings/notifications` — настройки уведомлений
- `PATCH /api/v1/users/me/settings/dnd` — настройки DND

## WebSocket
- `settings:sync` — синхронизация настроек между устройствами

## Адаптивность
- Desktop: sidebar + content (двухпанельный)
- Mobile: список разделов → контент

## Технологии
- React 19 + Next.js
- Zustand: `settingsStore` (notifications, dnd, calls, cache)
- Оффлайн-кэш: SQLite (WA-SQLite для web, expo-sqlite для mobile)
- Push: Web Push API / FCM / APNs
- DND: геолокация API
