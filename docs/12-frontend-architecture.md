# 🎨 Frontend Architecture — Balloo Messenger

> **Версия:** 1.0 | **Дата:** 2026-09-30
> Архитектура фронтенд-приложений: пакеты, компоненты, стейт, роутинг.

---

## 1. Структура пакетов

```
packages/
├── shared/     ← общие типы, утилиты, Prisma, i18n
├── ui/         ← @balloo/ui — общая UI-библиотека
├── web/        ← React + Vite (веб-клиент)
├── desktop/    ← Electron (обёртка над web)
├── mobile-android/  ← Expo + React Native (Android)
└── mobile-ios/      ← Expo + React Native (iOS)
```

### `@balloo/shared`
Общий пакет. Содержит:
- **Типы** (`src/types/`) — TypeScript-интерфейсы для всех сущностей БД
- **Утилиты** (`src/utils/`) — хелперы, форматы дат, валидация
- **Константы** (`src/constants/`) — константы приложения
- **i18n** (`src/i18n/`) — словари переводов (20 языков)
- **Prisma** (`prisma/`) — schema.prisma, seed-скрипты, миграции

### `@balloo/ui`
UI-компоненты, переиспользуемые всеми пакетами:
- **Topbar** — шапка с логотипом, левым/правым меню
- **RightMenu** — сворачиваемое правое меню (язык, тема, юр. страницы, аккаунт)
- **Footer** — подвал с копирайтом и юридическими ссылками
- **ThemeProvider** — переключатель тем (dark/light/russian)
- **I18nProvider** — переключатель языков (20 языков, 3 группы)

---

## 2. Пакет `@balloo/web`

### Архитектура
```
packages/web/src/
├── components/   ← React-компоненты
│   ├── chrome/     ← AppTopbar, AppFooter, PageChrome, MainLayout
│   ├── admin/      ← AdminLayout, AdminSidebar
│   ├── blog/       ← BlogLayout, BlogSidebar
│   └── shared/     ← NotFoundScreen, AttachmentPanel, etc.
├── screens/      ← экраны-страницы (по макетам)
│   ├── balloo-su/       ← 41 экран мессенджера
│   ├── admin/           ← 18 экранов админ-панели
│   ├── command/         ← 13 экранов портала сотрудников
│   ├── blog-landing/    ← 6 экранов блога
│   └── shared/          ← общие экраны (404, бан, etc.)
├── services/   ← API-клиент (api.ts, socket.ts)
├── store/      ← Zustand-сторы (authStore, chatStore, etc.)
├── router/     ← React Router v6 (hash-роутер)
├── utils/      ← хелперы
└── main.tsx    ← точка входа
```

### Роутинг
Hash-роутер (`react-router-hash-router`): `/#/login`, `/#/chats`, `/#/chat/:id`.

```tsx
// router/index.tsx
<HashRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/chats" element={<MainLayout><ChatsScreen /></MainLayout>} />
      <Route path="/chat/:id" element={<MainLayout><ChatScreen /></MainLayout>} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  </AuthProvider>
</HashRouter>
```

### Защита маршрутов
```tsx
// ProtectedRoute — редирект на /login если не авторизован
// PublicRoute — редирект на /chats если авторизован (на логине)
```

### Стейт-менеджмент
Zustand-сторы:
- `authStore` — авторизация, пользователь, токен
- `chatStore` — список чатов, текущий чат, сообщения
- `groupStore` — группы
- `settingsStore` — настройки пользователя
- `uiStore` — UI-состояние (тема, язык, sidebar)

---

## 3. Пакет `@balloo/desktop`

### Архитектура
Electron-приложение:
```
packages/desktop/src/
├── main/       ← main process (electron)
├── renderer/   ← React-рендерер (тот же код, что web)
└── preload/    ← preload скрипт (contextBridge)
```

### Особенности
- Использует тот же UI-код, что `@balloo/web`
- Нативный трэй, меню, системные уведомления
- `VITE_API_URL` — тот же, что в web (из окружения)

---

## 4. Дизайн-система

### Темы
Три темы в CSS-переменных (`packages/ui/src/styles/themes.css`):

| Тема | Переменные | Описание |
|---|---|---|
| `dark` | `--bg-primary: #1a1a2e` | По умолчанию |
| `light` | `--bg-primary: #ffffff` | Светлая |
| `russian` | `--bg-primary: #1a1a2e` | Флаг РФ + драгметаллы |

### Компоненты
- **Аватарки** — восьмигранные (октагон), с двойной рамкой
- **Пузыри сообщений** — без скруглений, с угловыми срезами
- **Топбар** — 1440×56px, логотип слева, навигация справа
- **Подвал** — 1440×36px, копирайт слева, ссылки справа

### Шрифты
Inter / Manrope.

---

## 5. API-клиент

### REST
```typescript
// services/api.ts
const API_URL = import.meta.env.VITE_API_URL; // 'https://api.balloo.su'

// Методы:
api.get<T>(path)       // GET
api.post<T>(path, body) // POST
api.put<T>(path, body)  // PUT
api.delete(path)        // DELETE
```

### WebSocket
```typescript
// services/socket.ts
const socket = io(API_URL, {
  path: '/ws',
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

// События:
socket.on('message.new', handler);
socket.on('chat.updated', handler);
socket.on('typing', handler);
```

### Обработка ошибок
- 401 — refresh token → если не ок → редирект на /login
- 403 — forbidden
- 429 — rate limit
- 500 — серверная ошибка

---

## 6. i18n

### Структура
```typescript
// shared/src/i18n/translations.ts
export const translations: Record<TranslationKey, Record<Language, string>> = {
  'menu.chats': { ru: 'Чаты', en: 'Chats', zh: '聊天', ... },
  // 121 ключей × 20 языков
};
```

### Использование
```typescript
import { t } from '@balloo/shared/i18n';
t('menu.chats'); // → 'Чаты' (ru)
```

### 20 языков
3 группы:
1. **Русские** (17 языков): ru, tt, ba, ce, cv, av, dar, ud, lez, kbd, chm, os, sah, bua, uk, be
2. **Дружественные** (2): zh, hi
3. **Остальные** (2): en, fr

---

## 7. Сборка

### Vite
```bash
# Dev:
cd packages/web && npx --yes vite --port 5173

# Production:
cd packages/web && npx --yes vite build
```

### Docker
```dockerfile
# docker/Dockerfile.web
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml .pnpm-store/ ./
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @balloo/web build
FROM nginx:alpine
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY docker/prod/nginx.conf /etc/nginx/conf.d/default.conf
```

---

*Документ создан 2026-09-30.*
