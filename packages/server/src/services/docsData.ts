// DocsData — статичная спецификация API для api.balloo.su/doc
// Тикет №58 — Docs: API документация
// Источник: docs/04-api-websocket-spec.md

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth?: boolean;
  admin?: boolean;
  params?: { name: string; type: string; required?: boolean; description: string }[];
  bodyExample?: string;
  responseExample?: string;
  responseCodes?: { code: number; description: string }[];
  curlExample?: string;
}

export interface ApiModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export interface WsEvent {
  event: string;
  payload: string;
  description: string;
}

// ============================================================
// REST API modules
// ============================================================
export const API_MODULES: ApiModule[] = [
  {
    id: 'auth',
    name: 'Auth',
    icon: '🔐',
    description: 'Аутентификация, регистрация, OAuth, 2FA, сброс пароля',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/register',
        description: 'Регистрация по email + пароль. Возвращает token pair.',
        bodyExample: `{
  "email": "user@example.com",
  "username": "ivan",
  "password": "secret123"
}`,
        responseExample: `{
  "user": { "id": "clx...", "email": "user@example.com", "username": "ivan" },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}`,
        responseCodes: [
          { code: 200, description: 'Успешная регистрация' },
          { code: 400, description: 'Невалидные данные' },
          { code: 409, description: 'Email/username занят' },
        ],
        curlExample: `curl -X POST https://api.balloo.su/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","username":"ivan","password":"secret123"}'`,
      },
      {
        method: 'POST',
        path: '/auth/login',
        description: 'Вход по email + пароль. Возвращает access и refresh токены.',
        auth: false,
        bodyExample: `{
  "email": "user@example.com",
  "password": "secret123"
}`,
        responseExample: `{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { "id": "clx...", "email": "user@example.com" }
}`,
        responseCodes: [
          { code: 200, description: 'Успешный вход' },
          { code: 401, description: 'Неверный email или пароль' },
          { code: 429, description: 'Слишком много попыток' },
        ],
        curlExample: `curl -X POST https://api.balloo.su/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"secret123"}'`,
      },
      {
        method: 'POST',
        path: '/auth/refresh',
        description: 'Обновление JWT по refresh token.',
        bodyExample: `{ "refreshToken": "eyJhbG..." }`,
        responseExample: `{ "accessToken": "eyJhbG...", "refreshToken": "eyJhbG..." }`,
        responseCodes: [
          { code: 200, description: 'Новые токены' },
          { code: 401, description: 'Refresh token невалиден' },
        ],
      },
      {
        method: 'POST',
        path: '/auth/logout',
        description: 'Выход — инвалидация refresh token.',
        auth: true,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Успешный выход' }],
      },
      {
        method: 'POST',
        path: '/auth/oauth/:provider',
        description: 'OAuth вход через Yandex / VK / Mail.ru.',
        params: [
          { name: 'provider', type: 'string', required: true, description: 'yandex | vk | mailru' },
        ],
        bodyExample: `{ "code": "oauth_code_from_provider" }`,
        responseExample: `{ "accessToken": "...", "refreshToken": "...", "user": {} }`,
        responseCodes: [
          { code: 200, description: 'Успешный OAuth вход' },
          { code: 400, description: 'Неверный provider или code' },
        ],
      },
      {
        method: 'POST',
        path: '/auth/2fa/enable',
        description: 'Включение 2FA (TOTP). Возвращает QR-код и backup codes.',
        auth: true,
        responseExample: `{
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["abc123", "def456", ...]
}`,
        responseCodes: [{ code: 200, description: '2FA активирована' }],
      },
      {
        method: 'POST',
        path: '/auth/2fa/verify',
        description: 'Подтверждение 2FA кода (TOTP или backup code).',
        auth: true,
        bodyExample: `{ "code": "123456" }`,
        responseExample: `{ "verified": true }`,
        responseCodes: [
          { code: 200, description: 'Код верен' },
          { code: 401, description: 'Неверный код' },
        ],
      },
      {
        method: 'POST',
        path: '/auth/reset-password',
        description: 'Сброс пароля по токену из email.',
        bodyExample: `{ "token": "...", "newPassword": "newsecret123" }`,
        responseExample: `{ "success": true }`,
        responseCodes: [
          { code: 200, description: 'Пароль изменён' },
          { code: 400, description: 'Токен невалиден' },
        ],
      },
    ],
  },
  {
    id: 'users',
    name: 'Users',
    icon: '👤',
    description: 'Профили, контакты, блокировки, устройства',
    endpoints: [
      {
        method: 'GET',
        path: '/users/me',
        description: 'Текущий профиль пользователя.',
        auth: true,
        responseExample: `{
  "id": "clx...",
  "email": "user@example.com",
  "username": "ivan",
  "avatarUrl": "https://cdn.balloo.su/...",
  "status": "active",
  "language": "ru"
}`,
        responseCodes: [{ code: 200, description: 'Профиль' }, { code: 401, description: 'Не авторизован' }],
      },
      {
        method: 'PUT',
        path: '/users/me',
        description: 'Обновление профиля (имя, био, аватар, язык, тема).',
        auth: true,
        bodyExample: `{ "username": "ivan", "bio": "Hi!", "language": "ru" }`,
        responseExample: `{ "id": "clx...", "username": "ivan", "bio": "Hi!" }`,
        responseCodes: [{ code: 200, description: 'Обновлено' }],
      },
      {
        method: 'GET',
        path: '/users/:username',
        description: 'Публичный профиль по username.',
        params: [
          { name: 'username', type: 'string', required: true, description: 'Username пользователя' },
        ],
        responseExample: `{ "username": "ivan", "displayName": "Ivan", "avatarUrl": "...", "bio": "Hi!" }`,
        responseCodes: [{ code: 200, description: 'Профиль' }, { code: 404, description: 'Не найден' }],
      },
      {
        method: 'GET',
        path: '/users/search',
        description: 'Поиск пользователей по username/name.',
        auth: true,
        params: [
          { name: 'q', type: 'string', required: true, description: 'Поисковый запрос' },
        ],
        responseExample: `[{ "id": "...", "username": "ivan", "avatarUrl": "..." }]`,
        responseCodes: [{ code: 200, description: 'Результаты поиска' }],
      },
      {
        method: 'POST',
        path: '/users/:id/block',
        description: 'Заблокировать пользователя.',
        auth: true,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Заблокирован' }],
      },
      {
        method: 'DELETE',
        path: '/users/:id/block',
        description: 'Разблокировать пользователя.',
        auth: true,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Разблокирован' }],
      },
    ],
  },
  {
    id: 'chats',
    name: 'Chats',
    icon: '💬',
    description: 'Создание чатов, участники, invite links, настройки',
    endpoints: [
      {
        method: 'POST',
        path: '/chats',
        description: 'Создание группы или канала.',
        auth: true,
        bodyExample: `{ "type": "group", "name": "Test Group", "description": "..." }`,
        responseExample: `{ "id": "clx...", "type": "group", "name": "Test Group" }`,
        responseCodes: [{ code: 201, description: 'Чат создан' }],
      },
      {
        method: 'GET',
        path: '/chats',
        description: 'Список чатов пользователя (pagination).',
        auth: true,
        params: [
          { name: 'cursor', type: 'string', description: 'Cursor для pagination' },
          { name: 'limit', type: 'number', description: 'Лимит (по умолчанию 20)' },
        ],
        responseExample: `{
  "items": [{ "id": "...", "name": "...", "lastMessage": {} }],
  "nextCursor": "..."
}`,
        responseCodes: [{ code: 200, description: 'Список чатов' }],
      },
      {
        method: 'GET',
        path: '/chats/:id',
        description: 'Информация о чате.',
        auth: true,
        responseExample: `{ "id": "...", "type": "group", "name": "...", "members": [] }`,
        responseCodes: [{ code: 200, description: 'Информация' }, { code: 404, description: 'Чат не найден' }],
      },
      {
        method: 'POST',
        path: '/chats/:id/members',
        description: 'Добавить участника в чат.',
        auth: true,
        bodyExample: `{ "userId": "clx..." }`,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Участник добавлен' }],
      },
      {
        method: 'POST',
        path: '/chats/:id/invite',
        description: 'Создание invite link.',
        auth: true,
        bodyExample: `{ "maxUses": 10, "expiresAt": 1700000000 }`,
        responseExample: `{ "code": "abc123", "url": "https://balloo.su/invite/abc123" }`,
        responseCodes: [{ code: 201, description: 'Invite создан' }],
      },
      {
        method: 'POST',
        path: '/chats/invite/:code',
        description: 'Вход в чат по invite code.',
        auth: true,
        responseExample: `{ "chatId": "clx...", "success": true }`,
        responseCodes: [{ code: 200, description: 'Вступил в чат' }, { code: 404, description: 'Invite не найден' }],
      },
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: '✉️',
    description: 'Отправка, редактирование, удаление, реакции, чтение',
    endpoints: [
      {
        method: 'POST',
        path: '/chats/:chatId/messages',
        description: 'Отправка текстового/медиа сообщения.',
        auth: true,
        bodyExample: `{ "type": "text", "content": "Hello!", "replyToId": null }`,
        responseExample: `{
  "id": "clx...",
  "chatId": "...",
  "senderId": "...",
  "type": "text",
  "content": "Hello!",
  "createdAt": 1700000000
}`,
        responseCodes: [{ code: 201, description: 'Сообщение отправлено' }],
      },
      {
        method: 'GET',
        path: '/chats/:chatId/messages',
        description: 'История сообщений (cursor pagination).',
        auth: true,
        params: [
          { name: 'cursor', type: 'string', description: 'Cursor для pagination' },
          { name: 'limit', type: 'number', description: 'Лимит (по умолчанию 50)' },
        ],
        responseExample: `{
  "items": [{ "id": "...", "content": "Hello!", "senderId": "..." }],
  "nextCursor": "...",
  "hasMore": true
}`,
        responseCodes: [{ code: 200, description: 'История сообщений' }],
      },
      {
        method: 'PUT',
        path: '/messages/:id',
        description: 'Редактирование сообщения (до 5 мин после отправки).',
        auth: true,
        bodyExample: `{ "content": "Edited text" }`,
        responseExample: `{ "id": "...", "content": "Edited text", "editCount": 1 }`,
        responseCodes: [{ code: 200, description: 'Обновлено' }, { code: 403, description: 'Время истекло' }],
      },
      {
        method: 'DELETE',
        path: '/messages/:id',
        description: 'Удаление сообщения.',
        auth: true,
        params: [{ name: 'forEveryone', type: 'boolean', description: 'Удалить для всех' }],
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Удалено' }],
      },
      {
        method: 'POST',
        path: '/messages/:id/reactions',
        description: 'Поставить реакцию на сообщение.',
        auth: true,
        bodyExample: `{ "emoji": "👍" }`,
        responseExample: `{ "reactions": [{ "emoji": "👍", "count": 1 }] }`,
        responseCodes: [{ code: 200, description: 'Реакция добавлена' }],
      },
    ],
  },
  {
    id: 'upload',
    name: 'Upload',
    icon: '📎',
    description: 'Загрузка файлов: аватарки, медиа, вложения',
    endpoints: [
      {
        method: 'POST',
        path: '/upload/avatar',
        description: 'Загрузка аватарки пользователя (PNG/JPEG, до 5 МБ).',
        auth: true,
        bodyExample: `multipart/form-data: file=@avatar.png`,
        responseExample: `{ "url": "https://cdn.balloo.su/avatars/clx..._256.png" }`,
        responseCodes: [{ code: 200, description: 'Загружено' }, { code: 413, description: 'Файл слишком большой' }],
      },
      {
        method: 'POST',
        path: '/upload/file',
        description: 'Загрузка вложения в сообщение (до 50 МБ).',
        auth: true,
        bodyExample: `multipart/form-data: file=@document.pdf`,
        responseExample: `{
  "url": "https://cdn.balloo.su/files/...",
  "size": 1234567,
  "name": "document.pdf",
  "type": "application/pdf"
}`,
        responseCodes: [{ code: 200, description: 'Загружено' }],
      },
      {
        method: 'POST',
        path: '/upload/story',
        description: 'Загрузка медиа для истории (фото/видео, до 50 МБ).',
        auth: true,
        responseExample: `{ "url": "https://cdn.balloo.su/stories/...", "thumbnail": "..." }`,
        responseCodes: [{ code: 200, description: 'Загружено' }],
      },
    ],
  },
  {
    id: 'stories',
    name: 'Stories',
    icon: '📸',
    description: 'Истории, просмотры, реакции',
    endpoints: [
      {
        method: 'POST',
        path: '/stories',
        description: 'Создание истории (медиа + expiresAt 24ч).',
        auth: true,
        bodyExample: `multipart/form-data: media=@photo.jpg`,
        responseExample: `{ "id": "clx...", "mediaUrl": "...", "expiresAt": 1700086400 }`,
        responseCodes: [{ code: 201, description: 'История создана' }],
      },
      {
        method: 'GET',
        path: '/stories',
        description: 'Лента историй (круг + лента).',
        auth: true,
        responseExample: `[{ "id": "...", "userId": "...", "mediaUrl": "..." }]`,
        responseCodes: [{ code: 200, description: 'Лента историй' }],
      },
      {
        method: 'GET',
        path: '/stories/:id/views',
        description: 'Кто посмотрел историю.',
        auth: true,
        responseExample: `{ "viewCount": 42, "viewers": [{ "userId": "...", "viewedAt": 1700000000 }] }`,
        responseCodes: [{ code: 200, description: 'Просмотры' }],
      },
      {
        method: 'DELETE',
        path: '/stories/:id',
        description: 'Удаление своей истории.',
        auth: true,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Удалена' }],
      },
    ],
  },
  {
    id: 'polls',
    name: 'Polls',
    icon: '📊',
    description: 'Опросы, голосование, результаты',
    endpoints: [
      {
        method: 'POST',
        path: '/polls',
        description: 'Создание опроса в чате.',
        auth: true,
        bodyExample: `{
  "chatId": "clx...",
  "question": "Выберите вариант",
  "options": ["A", "B", "C"],
  "allowsMultiple": false,
  "expiresAt": 1700086400
}`,
        responseExample: `{ "id": "clx...", "question": "...", "options": [] }`,
        responseCodes: [{ code: 201, description: 'Опрос создан' }],
      },
      {
        method: 'POST',
        path: '/polls/:id/vote',
        description: 'Голосование в опросе.',
        auth: true,
        bodyExample: `{ "optionIndex": 0 }`,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Голос принят' }],
      },
      {
        method: 'GET',
        path: '/polls/:id/results',
        description: 'Результаты опроса.',
        auth: true,
        responseExample: `{
  "totalVotes": 100,
  "options": [{ "index": 0, "text": "A", "votes": 60, "percent": 60 }]
}`,
        responseCodes: [{ code: 200, description: 'Результаты' }],
      },
    ],
  },
  {
    id: 'blog',
    name: 'Blog',
    icon: '📝',
    description: 'Блог, каналы, категории, подписка',
    endpoints: [
      {
        method: 'GET',
        path: '/blog/posts',
        description: 'Лента постов (pagination, filter by channel/category).',
        params: [
          { name: 'page', type: 'number', description: 'Страница' },
          { name: 'channel', type: 'string', description: 'Фильтр по каналу' },
          { name: 'category', type: 'string', description: 'Фильтр по категории' },
        ],
        responseExample: `{ "items": [{ "id": "...", "title": "...", "content": "..." }], "total": 42 }`,
        responseCodes: [{ code: 200, description: 'Лента постов' }],
      },
      {
        method: 'GET',
        path: '/blog/posts/:id',
        description: 'Один пост с полным контентом.',
        responseExample: `{ "id": "...", "title": "...", "content": "...", "author": {} }`,
        responseCodes: [{ code: 200, description: 'Пост' }, { code: 404, description: 'Не найден' }],
      },
      {
        method: 'POST',
        path: '/blog/posts',
        description: 'Создание поста (draft/published).',
        auth: true,
        bodyExample: `{ "channelId": "...", "title": "New Post", "content": "..." }`,
        responseExample: `{ "id": "...", "status": "draft" }`,
        responseCodes: [{ code: 201, description: 'Пост создан' }],
      },
      {
        method: 'POST',
        path: '/blog/channels/:id/subscribe',
        description: 'Подписка на канал.',
        auth: true,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Подписан' }],
      },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    icon: '📚',
    description: 'База знаний, категории, страницы',
    endpoints: [
      {
        method: 'GET',
        path: '/knowledge/pages',
        description: 'Страницы базы знаний (по категории).',
        params: [{ name: 'categoryId', type: 'string', description: 'Фильтр по категории' }],
        responseExample: `{ "items": [{ "id": "...", "title": "...", "category": {} }] }`,
        responseCodes: [{ code: 200, description: 'Список страниц' }],
      },
      {
        method: 'GET',
        path: '/knowledge/pages/:id',
        description: 'Одна страница базы знаний.',
        responseExample: `{ "id": "...", "title": "...", "content": "...", "version": 3 }`,
        responseCodes: [{ code: 200, description: 'Страница' }, { code: 404, description: 'Не найдена' }],
      },
    ],
  },
  {
    id: 'hiring',
    name: 'Hiring',
    icon: '💼',
    description: 'Вакансии, отклики, интервью',
    endpoints: [
      {
        method: 'GET',
        path: '/hiring/vacancies',
        description: 'Список вакансий, фильтры по отделам.',
        params: [{ name: 'department', type: 'string', description: 'Фильтр по отделу' }],
        responseExample: `{ "items": [{ "id": "...", "title": "...", "salary": "100k" }] }`,
        responseCodes: [{ code: 200, description: 'Вакансии' }],
      },
      {
        method: 'GET',
        path: '/hiring/vacancies/:id',
        description: 'Детали вакансии.',
        responseExample: `{ "id": "...", "title": "...", "description": "...", "requirements": [] }`,
        responseCodes: [{ code: 200, description: 'Вакансия' }, { code: 404, description: 'Не найдена' }],
      },
      {
        method: 'POST',
        path: '/hiring/applications',
        description: 'Отклик на вакансию.',
        auth: true,
        bodyExample: `{ "vacancyId": "...", "coverLetter": "...", "resumeUrl": "..." }`,
        responseExample: `{ "id": "...", "status": "new" }`,
        responseCodes: [{ code: 201, description: 'Отклик создан' }],
      },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: '🛡️',
    description: 'Админ-панель: пользователи, баны, жалобы, метрики',
    endpoints: [
      {
        method: 'GET',
        path: '/admin/users',
        description: 'Список пользователей (filter, search, pagination). Требует admin.',
        auth: true,
        params: [
          { name: 'status', type: 'string', description: 'active | banned | suspended' },
          { name: 'q', type: 'string', description: 'Поиск по email/username' },
          { name: 'page', type: 'number', description: 'Страница' },
        ],
        responseExample: `{ "items": [{ "id": "...", "email": "...", "status": "active" }], "total": 1000 }`,
        responseCodes: [{ code: 200, description: 'Список' }, { code: 403, description: 'Нет прав' }],
      },
      {
        method: 'POST',
        path: '/admin/users/:id/ban',
        description: 'Бан пользователя (глобальный или чат).',
        auth: true,
        bodyExample: `{ "reason": "Нарушение правил", "expiresAt": 1700086400 }`,
        responseExample: `{ "success": true }`,
        responseCodes: [{ code: 200, description: 'Забанен' }],
      },
      {
        method: 'GET',
        path: '/admin/reports',
        description: 'Список жалоб.',
        auth: true,
        responseExample: `{ "items": [{ "id": "...", "reason": "...", "status": "pending" }] }`,
        responseCodes: [{ code: 200, description: 'Жалобы' }],
      },
      {
        method: 'GET',
        path: '/admin/metrics',
        description: 'Метрики сервиса.',
        auth: true,
        responseExample: `{ "totalUsers": 1000, "activeToday": 500, "messagesToday": 10000 }`,
        responseCodes: [{ code: 200, description: 'Метрики' }],
      },
    ],
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: '💳',
    description: 'Донаты, ЮKassa, СБП, тарифы',
    endpoints: [
      {
        method: 'GET',
        path: '/payments/config',
        description: 'Публичная конфигурация платёжного модуля (режим, QR СБП, номер телефона).',
        auth: false,
        responseExample: `{ "mode": "anonymous", "sbpQrUrl": "...", "sbpPhoneNumber": "89122023035", "notice": "..." }`,
        responseCodes: [{ code: 200, description: 'Конфигурация' }],
      },
      {
        method: 'POST',
        path: '/payments/donate',
        description: 'Создание доната (двухрежимно: анонимный/ЮKassa).',
        auth: true,
        bodyExample: `{ "tierId": "gold", "amount": 500 }`,
        responseExample: `{ "donationId": "...", "mode": "anonymous", "sbpInfo": { "qrUrl": "...", "phoneNumber": "..." } }`,
        responseCodes: [{ code: 200, description: 'Информация о донате' }],
      },
      {
        method: 'GET',
        path: '/payments/tiers',
        description: 'Уровни донатов.',
        responseExample: `[{ "id": "gold", "name": "Gold", "amount": 500, "features": [] }]`,
        responseCodes: [{ code: 200, description: 'Уровни' }],
      },
      {
        method: 'POST',
        path: '/payments/webhook/yookassa',
        description: 'HTTP-уведомление (webhook) от ЮKassa (success/fail/waiting_for_capture).',
        auth: false,
        bodyExample: `{ "type": "notification", "event": "payment.succeeded", "object": { "id": "...", "status": "succeeded", "metadata": { "donationId": "..." } } }`,
        responseExample: `{ "status": "ok", "donationId": "..." }`,
        responseCodes: [{ code: 200, description: 'Обработано' }],
      },
      {
        method: 'GET',
        path: '/payments/me/donations',
        description: 'История донатов текущего пользователя.',
        auth: true,
        responseExample: `{ "donations": [...], "total": 5, "page": 1 }`,
        responseCodes: [{ code: 200, description: 'История' }],
      },
      {
        method: 'GET',
        path: '/payments/admin/config',
        description: 'Настройки платёжного модуля (админка).',
        auth: true,
        admin: true,
        responseExample: `{ "config": { "mode": "anonymous", "shopId": "****", "hasSecretKey": false } }`,
        responseCodes: [{ code: 200, description: 'Настройки' }],
      },
      {
        method: 'PUT',
        path: '/payments/admin/config',
        description: 'Обновление настроек платёжного модуля (админка).',
        auth: true,
        admin: true,
        bodyExample: `{ "mode": "yookassa", "shopId": "12345", "secretKey": "test_..." }`,
        responseExample: `{ "message": "Настройки платежей обновлены", "config": {...} }`,
        responseCodes: [{ code: 200, description: 'Обновлено' }],
      },
      {
        method: 'GET',
        path: '/payments/admin/donations',
        description: 'Список всех донатов (админка).',
        auth: true,
        admin: true,
        responseExample: `{ "donations": [...], "total": 10, "page": 1 }`,
        responseCodes: [{ code: 200, description: 'Список' }],
      },
      {
        method: 'POST',
        path: '/payments/admin/confirm/:id',
        description: 'Подтверждение ручного доната (админка).',
        auth: true,
        admin: true,
        responseExample: `{ "message": "Донат подтверждён" }`,
        responseCodes: [{ code: 200, description: 'Подтверждён' }],
      },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    icon: '💡',
    description: 'Фич-реквесты, голосование, статусы',
    endpoints: [
      {
        method: 'GET',
        path: '/features',
        description: 'Список фич-реквестов (filter by status/category, sort by votes/date).',
        params: [
          { name: 'status', type: 'string', description: 'pending | in_progress | planned | rejected | done' },
          { name: 'category', type: 'string', description: 'Категория' },
          { name: 'sort', type: 'string', description: 'votes | date' },
        ],
        responseExample: `{ "items": [{ "id": "...", "title": "...", "votes": 42 }] }`,
        responseCodes: [{ code: 200, description: 'Список фич' }],
      },
      {
        method: 'POST',
        path: '/features',
        description: 'Создание фич-реквеста.',
        auth: true,
        bodyExample: `{ "title": "Dark mode for blog", "description": "...", "category": "ui" }`,
        responseExample: `{ "id": "...", "status": "pending" }`,
        responseCodes: [{ code: 201, description: 'Создан' }],
      },
      {
        method: 'POST',
        path: '/features/:id/vote',
        description: 'Голосование за фичу (1 голос/пользователь).',
        auth: true,
        responseExample: `{ "success": true, "votes": 43 }`,
        responseCodes: [{ code: 200, description: 'Голос принят' }, { code: 409, description: 'Уже голосовал' }],
      },
    ],
  },
  {
    id: 'history',
    name: 'History',
    icon: '📜',
    description: 'История версий, changelog, сравнение',
    endpoints: [
      {
        method: 'GET',
        path: '/history/versions',
        description: 'Список версий (pagination).',
        params: [{ name: 'status', type: 'string', description: 'released | planned' }],
        responseExample: `{ "items": [{ "id": "...", "version": "1.0.0", "isLatest": true }] }`,
        responseCodes: [{ code: 200, description: 'Версии' }],
      },
      {
        method: 'GET',
        path: '/history/versions/:id',
        description: 'Детальная страница версии с changelog.',
        responseExample: `{ "id": "...", "version": "1.0.0", "changelog": {} }`,
        responseCodes: [{ code: 200, description: 'Версия' }, { code: 404, description: 'Не найдена' }],
      },
      {
        method: 'GET',
        path: '/history/compare',
        description: 'Сравнение двух версий (diff).',
        params: [
          { name: 'v1', type: 'string', required: true, description: 'Первая версия' },
          { name: 'v2', type: 'string', required: true, description: 'Вторая версия' },
        ],
        responseExample: `{ "added": [], "removed": [], "modified": [] }`,
        responseCodes: [{ code: 200, description: 'Diff' }],
      },
    ],
  },
  {
    id: 'download',
    name: 'Download',
    icon: '⬇️',
    description: 'Файлы загрузок для всех платформ',
    endpoints: [
      {
        method: 'GET',
        path: '/downloads',
        description: 'Список всех файлов для скачивания.',
        responseExample: `{ "desktop": { "win": [], "linux": [], "mac": [] }, "mobile": { "android": [], "ios": [] } }`,
        responseCodes: [{ code: 200, description: 'Файлы' }],
      },
      {
        method: 'GET',
        path: '/downloads/desktop/:platform',
        description: 'Пакеты для конкретной ОС (win/linux/mac).',
        params: [{ name: 'platform', type: 'string', required: true, description: 'win | linux | mac' }],
        responseExample: `{ "platform": "win", "packages": [{ "format": "exe", "url": "...", "size": 82000000 }] }`,
        responseCodes: [{ code: 200, description: 'Пакеты' }],
      },
      {
        method: 'GET',
        path: '/downloads/:platform',
        description: 'Мобильные приложения (android/ios).',
        params: [{ name: 'platform', type: 'string', required: true, description: 'android | ios' }],
        responseExample: `{ "platform": "android", "packages": [{ "format": "apk", "arch": "universal" }] }`,
        responseCodes: [{ code: 200, description: 'Пакеты' }],
      },
    ],
  },
];

// ============================================================
// WebSocket events
// ============================================================
export const WS_CLIENT_EVENTS: WsEvent[] = [
  { event: 'message:send', payload: '{chatId, text, attachments[], replyToId?}', description: 'Отправка сообщения' },
  { event: 'message:edit', payload: '{chatId, messageId, newText}', description: 'Редактирование сообщения' },
  { event: 'message:delete', payload: '{chatId, messageId}', description: 'Удаление сообщения' },
  { event: 'message:read', payload: '{chatId, messageIds[]}', description: 'Отметить прочитанным' },
  { event: 'message:typing', payload: '{chatId, isTyping}', description: 'Индикатор набора' },
  { event: 'reaction:add', payload: '{chatId, messageId, emoji}', description: 'Реакция на сообщение' },
  { event: 'reaction:remove', payload: '{chatId, messageId, emoji}', description: 'Убрать реакцию' },
  { event: 'call:offer', payload: '{callId, targetUserId, sdp}', description: 'WebRTC offer' },
  { event: 'call:answer', payload: '{callId, sdp}', description: 'WebRTC answer' },
  { event: 'call:ice', payload: '{callId, candidate}', description: 'ICE candidate' },
  { event: 'call:mute', payload: '{callId, isMuted}', description: 'Mute микрофона' },
  { event: 'call:video', payload: '{callId, isVideoOn}', description: 'Camera toggle' },
  { event: 'presence:update', payload: '{status}', description: 'Онлайн/офлайн/занят/днд' },
  { event: 'poll:vote', payload: '{pollId, optionIds[]}', description: 'Голосование в опросе' },
  { event: 'device:pair:request', payload: '{token}', description: 'Запрос привязки устройства (QR)' },
  { event: 'account:switch', payload: '{accountId}', description: 'Переключение активного аккаунта' },
];

export const WS_SERVER_EVENTS: WsEvent[] = [
  { event: 'message:new', payload: '{chatId, message}', description: 'Новое сообщение' },
  { event: 'message:edited', payload: '{chatId, messageId, newText, editedAt}', description: 'Сообщение отредактировано' },
  { event: 'message:deleted', payload: '{chatId, messageId}', description: 'Сообщение удалено' },
  { event: 'message:read', payload: '{chatId, messageIds[], userId}', description: 'Прочитано' },
  { event: 'message:typing', payload: '{chatId, userId, isTyping}', description: 'Пользователь печатает' },
  { event: 'reaction:updated', payload: '{chatId, messageId, reactions[]}', description: 'Реакция обновлена' },
  { event: 'call:incoming', payload: '{callId, from, type}', description: 'Входящий звонок' },
  { event: 'call:offer', payload: '{callId, sdp}', description: 'WebRTC offer' },
  { event: 'call:answer', payload: '{callId, sdp}', description: 'WebRTC answer' },
  { event: 'call:ice', payload: '{callId, candidate}', description: 'ICE candidate' },
  { event: 'call:ended', payload: '{callId, reason}', description: 'Звонок завершён' },
  { event: 'call:participant:joined', payload: '{callId, userId}', description: 'Участник присоединился' },
  { event: 'call:participant:left', payload: '{callId, userId}', description: 'Участник вышел' },
  { event: 'presence:update', payload: '{userId, status, lastSeen}', description: 'Статус пользователя' },
  { event: 'notification', payload: '{type, title, body, data}', description: 'Push-уведомление' },
  { event: 'poll:updated', payload: '{pollId, results}', description: 'Результаты опроса обновлены' },
  { event: 'story.created', payload: '{storyId, userId, type, expiresAt}', description: 'Новая история' },
  { event: 'ban:status', payload: '{banId, isBanned, reason, type, expiresAt?}', description: 'Статус бана' },
  { event: '2fa.required', payload: '{userId, methods: ["email"]}', description: 'Требуется 2FA-код' },
];

// ============================================================
// Error codes
// ============================================================
export const ERROR_CODES = [
  { code: 400, name: 'Bad Request', description: 'Невалидные данные запроса' },
  { code: 401, name: 'Unauthorized', description: 'Требуется авторизация или невалидный токен' },
  { code: 403, name: 'Forbidden', description: 'Недостаточно прав для выполнения действия' },
  { code: 404, name: 'Not Found', description: 'Ресурс не найден' },
  { code: 409, name: 'Conflict', description: 'Конфликт (дубликат, уже существует)' },
  { code: 413, name: 'Payload Too Large', description: 'Файл превышает допустимый размер' },
  { code: 429, name: 'Too Many Requests', description: 'Превышен rate limit' },
  { code: 500, name: 'Internal Server Error', description: 'Внутренняя ошибка сервера' },
];

// ============================================================
// Quick start examples
// ============================================================
export const QUICK_START = [
  {
    title: 'Регистрация',
    description: 'Создайте аккаунт и получите токены',
    code: `curl -X POST https://api.balloo.su/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","username":"ivan","password":"secret123"}'`,
  },
  {
    title: 'Отправка сообщения',
    description: 'Используйте access token для отправки сообщений',
    code: `curl -X POST https://api.balloo.su/v1/chats/clx.../messages \\
  -H "Authorization: Bearer eyJhbG..." \\
  -H "Content-Type: application/json" \\
  -d '{"type":"text","content":"Hello!"}'`,
  },
  {
    title: 'WebSocket подключение',
    description: 'Подключитесь к WebSocket для realtime-сообщений',
    code: `const ws = new WebSocket("wss://balloo.su/ws?token=eyJhbG...");
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === "message:new") {
    console.log("New message:", data.message);
  }
};`,
  },
];
