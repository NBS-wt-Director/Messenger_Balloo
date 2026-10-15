# Тикет 1792092229 — OAuth: VK, Mail.ru, Rambler (кнопка без приложения)

**Создан:** 2026-10-16 00:23 (unix 1792092229)
**Статус:** в работе (пп.1–7 исполнены; п.8 = коммит/пуш)
**Источник запроса:** вопрос владельца в чате 16.10.2026: «а ключи вк майлру и рамблер?»

## Цель

Дать владельцу точную картину по трём провайдерам: где ключи есть, где их нет, что
произойдёт пользователю при клике, и что нужно решить до деплоя.

## Найденные факты (замеры 16.10.2026, реальными командами)

| Провайдер | Ключи в `docker/prod/.env.production` | В `OAUTH_PROVIDER_ENV` (сервер) | Маршрут callback | Кнопка в UI | Реальный вход проверен |
|---|---|---|---|---|---|
| Яндекс | ✅ `:92-94` | ✅ `authService.ts:846` | ✅ `auth.ts:85` | ✅ | ❌ нет |
| VK | ✅ `:97-99` | ✅ `authService.ts:851` | ✅ `auth.ts:86` | ✅ | ❌ нет |
| Mail.ru | ✅ `:102-104` | ✅ `authService.ts:856` | ✅ `auth.ts:87` | ✅ | ❌ нет |
| **Rambler** | ❌ **переменной `RAMBLER_CLIENT_ID` нет нигде** | ❌ **нет в `OAUTH_PROVIDER_ENV`** | ❌ нет | ✅ **кнопка есть** | — |
| Max | ❌ `:107-108` пусто | ❌ нет | ❌ нет | ❌ нет кнопки | — |

Ключевые строки:

1. `packages/server/src/services/authService.ts:836` — комментарий кода:
   «Rambler/Max — OAuth-приложений нет → не настроены».
2. `packages/server/src/services/authService.ts:839` — тип `OAuthProviderId`
   **включает** `'rambler'`, но `OAUTH_PROVIDER_ENV` (`:841`) содержит только
   `yandex`, `vk`, `mailru`.
3. `packages/web/src/components/auth/OAuthGrid.tsx:27` — кнопка Rambler
   отрисовывается в сетке 2×2 на входе и регистрации.
4. `packages/web/src/screens/auth/LoginScreen.tsx:72` — клик ведёт на
   `GET /api/auth/oauth/rambler`.
5. `packages/server/src/controllers/authController.ts:421-424` — при отсутствии
   конфига: `oauthErrorRedirect(res, provider, 'not_configured')`, т.е. пользователь
   получает `/#/login?oauth_error=not_configured`.
6. `packages/web/src/__tests__/components/LoginScreen.test.tsx:45` — тест
   **требует** кнопку Rambler (`getByRole('button', { name: /rambler/i })`).

### Что это значит для пользователя

Кнопка Rambler кликабельна, но OAuth-приложения Rambler не существует → 100 %
кликов дают страницу с ошибкой. Это не «не настроен ключ», это «приложения нет».

### Проверенная проводка VK/Mail.ru/Яндекс (локально, без прод-запросов)

Маршруты зарегистрированы в правильном порядке (`auth.ts:85-87` до параметрического
`/oauth/:provider` на `:91`) — иначе `yandex-callback` матчился бы как `:provider`.
Комментарий `auth.ts:80-82` фиксирует эту ловушку. Реальный обмен кода на токен
не проверялся — нужен браузер и прод (with_lord 3.2).

## Подзадачи

- [x] 1. `grep -rn "RAMBLER" docker/prod/.env.production packages/web/.env.example` → exit 1 (переменной нет).
- [x] 2. `grep -n "clientId:" packages/server/src/services/authService.ts` → 3 провайдера (yandex/vk/mailru), rambler отсутствует.
- [x] 3. `grep -n "router.get('/oauth" packages/server/src/routes/auth.ts` → 3 callback-маршрута + параметрический, порядок корректен.
- [x] 4. Прочитан `authController.ts:416-441` → неконфигурированный провайдер = `not_configured`, не 500.
- [x] 5. Проверено, что тест требует кнопку Rambler (`LoginScreen.test.tsx:45`) — удаление кнопки = правка теста.
- [x] 6. Решение по Rambler записано в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` как 1.2.6 с вариантами и рекомендацией. Доказательство: `grep -c "^| 1.2.6" СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` → 1.
- [x] 7. Состояние OAuth перенесено в `РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §12 (таблица фактов). Доказательство: `grep -n "^## 12\." РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` → строка найдена.
- [ ] 8. Коммит + `git push origin main`, хэш в Результат.

## Критерии готовности

- Владелец видит точную таблицу «где ключи, где нет» — исполнено.
- Решение по Rambler поставлено перед владельцем с вариантами — исполнено (1.2.6).
- Ничего не «починено» молча: кнопка не удалена, тест не переписан — это решение владельца,
  оно меняет макет (источник правды).

## Проблемы и решения

**Проблема:** удалить кнопку Rambler — быстро и честно, но `mockups/balloo-su/login.html`
содержит 4 плитки, а макет по `AGENTS.md` = единственный источник правды. Значит
удаление кнопки — правка дизайн-решения, не техническая чистка. Решение за владельцем.

**Не является проблемой:** VK и Mail.ru. Ключи заполнены, проводка на месте. Осталась
единственная незакрытая часть — проверка реального входа браузером (with_lord 3.2.1–3.2.4),
она требует прода и вас.

## Результат

```
$ grep -rn "RAMBLER" docker/prod/.env.production packages/web/.env.example; echo "exit=$?"
exit=1                                    # переменной нет ни в одном конфиге

$ grep -n "clientId:" packages/server/src/services/authService.ts
846:    clientId: 'YANDEX_CLIENT_ID',
851:    clientId: 'VK_CLIENT_ID',
856:    clientId: 'MAILRU_CLIENT_ID',       # rambler в списке отсутствует

$ grep -n "router.get('/oauth" packages/server/src/routes/auth.ts
85:router.get('/oauth/yandex-callback', yandexCallback);
86:router.get('/oauth/vk/callback', vkCallback);
87:router.get('/oauth/mailru/callback', mailruCallback);
91:router.get('/oauth/:provider', oauthAuthorize);

$ grep -n "VK_CLIENT_ID\|MAILRU_CLIENT_ID\|YANDEX_CLIENT_ID" docker/prod/.env.production
92:YANDEX_CLIENT_ID="d510d63d88f643859ff0e2e3890bb199"
97:VK_CLIENT_ID="54752550"
102:MAILRU_CLIENT_ID="01a067110db474148019fe5602471858"
```

Вывод: VK и Mail.ru настроены и проведены по коду; Rambler — кнопки рабочими не будут
приложения не существует. Решение о кнопке — 1.2.6 в `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`.
