# Тикет 1795254659 — Уборка тестовых данных и создание эмуляции (ПРОД)

**Статус:** код выполнен и задеплоен; уборка данных — остаток владельцу
**Создан:** 21.11.2026
**Зависимость:** Service API развёрнут на проде (тикет 1795253700 ✓)

> **Приборка 23.11.2026:** кодовая часть (авто-вступление в новостной канал,
> Service API contacts, фикс `ChatList` `{ chats }`) выполнена и на проде
> (`65b4606`). Остаток — **уборка тестовых данных через Service API** — вынесен
> владельцу в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` (раздел C, п. C8).

---

## ✅ ВЫПОЛНЕНО

### 1. Группы и сообщения

**Приватная группа «Рабочая группа»** (id: `cmwq9lwa4000bug9neaxok2v6`)
- Участники: o8eryuhtin (owner), chiv2607, lev224838
- Сообщения:
  1. o8eryuhtin → «Hello world, hello, hello,hello motherfucker world! https://www.youtube.com/watch?v=O42OyR695sg»
  2. chiv2607 → «Привет всем! Рады видеть вас в нашем новом чате.»
  3. lev224838 → «Отлично! Готов к запуску 🚀»

**Новостной канал «Балу — новости и информация»** (id: `cmwq9m7sv000gug9nwz3w57dy`)
- Тип: channel, groupType: public, isVerified: true
- Участники: o8eryuhtin, chiv2607, lev224838
- Сообщение: «До запуска - всего ничего! А это первое сообщение! официально.»

### 2. NEWS_CHAT_ID для авто-вступления

```
NEWS_CHAT_ID=cmwq9m7sv000gug9nwz3w57dy
```

Нужно добавить в `docker/prod/.env.production` на сервере:
```
NEWS_CHAT_ID=cmwq9m7sv000gug9nwz3w57dy
```
и перезапустить server (batch F). После этого все новые пользователи автоматически вступают в канал.

### 3. Код: авто-вступление в новостной канал

- Добавлен env: `NEWS_CHAT_ID` (optional) в `packages/server/src/config/env.ts`
- Добавлена функция `joinNewsChannel(userId)` в `packages/server/src/services/authService.ts`
- Вызывается из `register`, `oauthLogin`, `serviceController.createUser`
- Идемпотентна, fail-safe — не блокирует регистрацию при ошибке
- `tsc --noEmit` ✓, 775/775 тестов ✓

### 4. Код: Service API contacts endpoints

- `POST /api/service/users/:id/contacts` — добавить контакт
- `DELETE /api/service/users/:id/contacts/:contactId` — удалить контакт
- Обновлён `docs/local/service-api.md`
- `tsc --noEmit` ✓

### 5. Фикс прод-бага: список чатов всегда пуст («Нет чатов»)

**Симптом:** после создания группы/канала в проде они не отображаются в UI,
контакты тоже пусты.

**Корневая причина (доказано):** `ChatList` вызывал `.map` на ответе
`GET /api/chats`, но сервер отдаёт объект `{ chats, pagination }`, а не массив
(`routes/chats.ts` → `chatController.getChats` → `chatService.getChats`).
`(объект).map` → `TypeError` → `.catch` → список остаётся пустым.

**Доказательство из прод-бандла** (`https://balloo.su/assets/chunks/MainLayout-xyFRYIG2.js`):
```js
x.getChats().then(e=>{const t=(e||[]).map(e=>({...e,joinedAt:...}))})
```
а `api.getChats` (index-CSkBGCPZ.js) возвращает сырой ответ:
```js
getChats:(e,t=50)=>Ta("/api/chats",{method:"GET",data:void 0})
```
(для сообщений разворачивание есть: `Array.isArray(s)?s:s?.messages??[]` — для
чатов забыли).

**Фикс:**
- `packages/web/src/components/chat/ChatList.tsx` — разворачиваем `{ chats }`
  (массив оставлен для совместимости)
- `packages/web/src/services/api.ts` — тип `getChats` исправлен на
  `{ chats, pagination }` (был `any[]`)
- Новый тест `packages/web/src/__tests__/components/ChatList.fetch.test.tsx`
  (проверяет путь загрузки; старый `ChatList.test.tsx` предзаполнял store и
  путь загрузки не выполнялся — баг маскировался)
- Проверено: тест падает на старом коде, зелёный на фиксе; `tsc --noEmit` ✓;
  13/13 тестов ChatList ✓

**Требует деплоя web** (баг только во фронтенде).

---

## ⏳ ОЖИДАЕТ ВЛАДЕЛЬЦА

### A. Контакты между 3 реальными пользователями

Endpoint `POST /api/service/users/:id/contacts` готов, но **не на проде**. Три варианта:
1. Дождаться батча F (сборка+перезапуск server) — автоматически включится
2. Владелец выполнит SQL-вставку вручную (см. ниже)
3. Владелец выполнит 6 curl-запросов после батча F

**SQL для контактов (6 записей, взаимные пары):**
```sql
-- На проде: docker compose -f docker-compose.local.yml --env-file .env.production exec -T postgres psql -U balloo -d balloo
INSERT INTO contacts (id, userId, contactId, createdAt) VALUES
  ('c1', 'cmub9fxq1000042e6e6dmi7e2', 'cmv4fghln000014hj19yayi5d', 1795256800),  -- admin → chiv
  ('c2', 'cmub9fxq1000042e6e6dmi7e2', 'cmwg7cyzh0000hu0lyq4plyab', 1795256800),  -- admin → lev
  ('c3', 'cmv4fghln000014hj19yayi5d', 'cmub9fxq1000042e6e6dmi7e2', 1795256800),  -- chiv → admin
  ('c4', 'cmv4fghln000014hj19yayi5d', 'cmwg7cyzh0000hu0lyq4plyab', 1795256800),  -- chiv → lev
  ('c5', 'cmwg7cyzh0000hu0lyq4plyab', 'cmub9fxq1000042e6e6dmi7e2', 1795256800),  -- lev → admin
  ('c6', 'cmwg7cyzh0000hu0lyq4plyab', 'cmv4fghln000014hj19yayi5d', 1795256800);  -- lev → chiv
```

### B. Удаление тестовых пользователей и чатов

#### Тестовые пользователи (активные, удалить обязательно)

| ID | Username / Email | Причина |
|---|---|---|
| `cmwq78en7000of5fahwdr2xgw` | chk_1795252914_a | тест базовых эндпоинтов Service API |
| `cmwq78f0u000qf5faha1jizx7` | chk_1795252914_b | тест базовых эндпоинтов Service API |
| `cmwq78f7a000sf5faa26lcg1t` | chk_1795252914_c@test.balloo.ru | тест базовых эндпоинтов Service API |

#### Тестовые пользователи (уже deleted, удалить по желанию)

| ID | Username | Статус | Примечание |
|---|---|---|---|
| `cmtwkkn4q0000771zd4nwul5t` | probe01 | deleted | старая проверка SMTP |
| `cmu425bbl00004z5qab07sfiw` | e2e_smtp_test | deleted | старая проверка SMTP |

> **Вопрос владельцу:** удаляем deleted-артефакты или оставляем?

#### Тестовые чаты (все 6 — удалить)

| ID | Тип | Имя | Участники |
|---|---|---|---|
| `cmwq6ui45000df5fa5tmt4xtr` | direct | — | 0 (сирота) |
| `cmwq78fvk000tf5famf5aqgjo` | group | Группа 1795252914 | chk_a, chk_b, chk_c |
| `cmwq78g5q000zf5fa5rve5tfq` | channel | Канал 1795252914 | chk_*, chk_* |
| `cmwq78get0013f5faijaow17j` | direct | — | chk_a, chk_b |
| `cmwq7aem10021f5fak2e8fyg5` | direct | — | 0 (сирота) |
| `cmwq7aeu0002af5fawdn18coo` | direct | — | 0 (сирота) |

#### Порядок выполнения (на проде, через Service API)

**Сначала чаты, потом пользователи** — иначе при удалении пользователей FK-каскад
удалит members-записи, а chat-строки останутся безымянными сиротами.

```bash
KEY=$(grep '^SERVICE_API_KEY=' /data/balloo/repo/docker/prod/.env.production | cut -d= -f2)
BASE=http://127.0.0.1:3100

# 1. Чаты (6 штук)
for id in cmwq6ui45000df5fa5tmt4xtr cmwq78fvk000tf5famf5aqgjo \
           cmwq78g5q000zf5fa5rve5tfq cmwq78get0013f5faijaow17j \
           cmwq7aem10021f5fak2e8fyg5 cmwq7aeu0002af5fawdn18coo; do
  curl -s -H "X-Service-Key:$KEY" -X DELETE "$BASE/api/service/chats/$id"
done

# 2. Тестовые пользователи (3 активных)
for id in cmwq78en7000of5fahwdr2xgw cmwq78f0u000qf5faha1jizx7 cmwq78f7a000sf5faa26lcg1t; do
  curl -s -H "X-Service-Key:$KEY" -X DELETE "$BASE/api/service/users/$id"
done

# 3. Deleted-пользователи (по решению владельца)
# curl -s -H "X-Service-Key:$KEY" -X DELETE "$BASE/api/service/users/cmtwkkn4q0000771zd4nwul5t"
# curl -s -H "X-Service-Key:$KEY" -X DELETE "$BASE/api/service/users/cmu425bbl00004z5qab07sfiw"

# 4. Проверка чистоты
curl -s -H "X-Service-Key:$KEY" "$BASE/api/service/users?status=active" | python3 -c "
import json,sys; d=json.load(sys.stdin)
for u in d['users']: print(u['username'] or u['email'], u['role'], u['status'])"
curl -s -H "X-Service-Key:$KEY" "$BASE/api/service/chats?limit=50" | python3 -c "
import json,sys; d=json.load(sys.stdin); print('chats total:', d['total'])"
```

---

## Реальные пользователи — НЕ ТРОГАТЬ

| ID | Username | Роль |
|---|---|---|
| `cmub9fxq1000042e6e6dmi7e2` | o8eryuhtin | admin |
| `cmv4fghln000014hj19yayi5d` | chiv2607 | user |
| `cmwg7cyzh0000hu0lyq4plyab` | lev224838 | user |
