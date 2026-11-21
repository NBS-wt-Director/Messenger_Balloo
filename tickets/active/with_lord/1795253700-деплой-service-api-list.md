# 1795253700 — Деплой: Service API — просмотр чатов/сообщений (дополнение)

**Создан:** 2026-11-21 (unix 1795253700)
**Тип:** деплой (выполняет владелец)
**Родитель:** тик. 1795250448 (Service API — базовый деплой, Done)

## Что меняется

К базовому Service API добавлены эндпоинты просмотра (нужны для проверок и
уборки тестовых данных — без них созданный чат нельзя найти по ID):
- `GET /api/service/chats` — список чатов (`type`,`memberId`,`q`,`limit`,`offset`)
- `GET /api/service/chats/:id` — детали чата (участники, настройки, счётчики)
- `GET /api/service/messages` — список сообщений (`chatId`,`senderId`,`limit`,`offset`)

Коммит `ddf0f7e`. Меняется только контейнер `server`. Фронт не тронут.

## Причина

При проверке базового API на проде остались 3 тестовых чата-сироты (без
эндпоинта поиска чатов их нельзя удалить). Новый `GET /chats` решает и это.

## Батчи для владельца

```bash
# D — подтянуть код
cd /data/balloo/repo && git fetch origin && git checkout -B main origin/main && git log --oneline -1

# F — сборка и перезапуск ТОЛЬКО server
cd /data/balloo/repo/docker/prod
docker compose -f docker-compose.local.yml --env-file .env.production build server
docker compose -f docker-compose.local.yml --env-file .env.production up -d --no-deps --force-recreate server
sleep 20 && docker compose -f docker-compose.local.yml --env-file .env.production ps server

# G — доказательства
cd /data/balloo/repo/docker/prod
KEY=$(grep '^SERVICE_API_KEY=' .env.production | cut -d= -f2)
curl -s -H "X-Service-Key: $KEY" "http://127.0.0.1:3100/api/service/chats?limit=5"
curl -s -H "X-Service-Key: $KEY" "http://127.0.0.1:3100/api/service/messages?limit=1"
```

Ожидаемо: JSON со списком чатов и сообщений; без ключа — `401`.

## Критерий закрытия

Батч G отдаёт JSON `{chats:[...],total:...}` и `{messages:[...],total:...}`;
после этого ассистент удаляет 3 тестовых чата-сироты и подтверждает чистоту.
