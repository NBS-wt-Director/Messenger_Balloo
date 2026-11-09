# 1794211606 — OAuth: сверить приложения в кабинетах VK и Mail.ru (+Яндекс)

**Создан:** 2026-11-09 (unix 1794211606)
**Блокирует:** приёмка Шага 7 (входы через соцсети)

## Что видел владелец в браузере
| Провайдер | Экран | Сообщение |
|---|---|---|
| Яндекс | JSON в браузере | `{"error":"FORGED_ORIGIN"}` — **наш баг**, чинится кодом (тик. `active/1794211606.md`), от владельца не требуется |
| VK | oauth.vk.com | `{"error":"invalid_request","error_description":"Security Error"}` |
| Mail.ru | connect.mail.ru | «Не указано приложение. Не передан идентификатор приложения в параметре client_id» |

## Доказано 09.11.2026 (curl с машины, read-only)
Сервер отдаёт корректные 302 — client_id и redirect_uri на месте, кавычек и CR
нет, значения не пустые (проверено по Location-заголовкам):
- VK: `client_id=<8 цифр>`, `redirect_uri=https://api.balloo.su/api/auth/oauth/vk/callback`
- Mail.ru: `client_id=<32 hex, начинается 01a067…>`, `redirect_uri=https://api.balloo.su/api/auth/oauth/mailru/callback`

Значит ошибки выдаёт **сторона провайдера** — настройки OAuth-приложения.

## Что сделать владельцу
1. **VK** → https://vk.com/dev → моё приложение (client_id 8 цифр из
   `.env.production`, `VK_CLIENT_ID`):
   - «Базовый домен» / «Разрешённые redirect URI» содержит
     `https://api.balloo.su/api/auth/oauth/vk/callback`;
   - приложение **включено** (не «тестируется» для чужих аккаунтов, либо
     тестовый аккаунт = ваш);
   - «Security Error» у VK = домен не подтверждён или приложение отключено.
2. **Mail.ru** → https://my.mail.ru/mail/info/ (Приложения / OAuth):
   - приложение с ID `01a067…` активно;
   - redirect URI `https://api.balloo.su/api/auth/oauth/mailru/callback`
     добавлен в разрешённые.
3. **Яндекс** → https://oauth.yandex.ru/client/my:
   - platform «Веб-сайты», redirect `https://api.balloo.su/api/auth/oauth/yandex-callback`
     (после деплоя фикса FORGED_ORIGIN проверим вход сам).

## Критерий закрытия
Браузерный вход через VK и Mail.ru доходит до согласия провайдера и возврата
в Balloo (или вы получаете конкретную строку ошибки кабинета — тогда правим
конфигурацию под неё).
