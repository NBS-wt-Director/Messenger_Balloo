# Тикет 1792095104 — OAuth: решение (б) по Rambler + сетка 6 провайдеров с неактивными плитками

**Создан:** 2026-10-16 01:18 (unix 1792095104)
**Статус:** готов (проверено прогонами 16.10.2026)
**Источник запроса:** ответ владельца в чате 16.10.2026 на `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` 1.2.6:
«мой выбор б. и остальные ключи тоже надо будет мне перепроверить... и в дизайне оставь
место для макс и госуслуге, но кнопка серая и при наведении надпись что-то вроде
"проходим валидация извините ща неудобства"».
Правило «ответ владельца → атомарная задача сразу» (`AGENTS.md`, быстрое правило 21).

## Цель

1. Решение (б) по Rambler зафиксировано: приложение заводит владелец, код провайдера
   пишу я, когда будут ключи. До ключей Rambler — неактивная плитка.
2. Сетка OAuth на входе и регистрации — **6 плиток**: Яндекс, VK, Mail.ru, Rambler, Max,
   Госуслуги. Рабочие: Яндекс, VK, Mail.ru. Неактивные (серые, `disabled`, с подсказкой
   при наведении): Rambler, Max, Госуслуги.
3. Текст подсказки (слова владельца, нормализованные): **«Проходим валидацию.
   Извините за неудобства»** — на 20 языках проекта.
4. Владелец получает задачу перепроверить **все** ключи, а не только OAuth.

## Найденные факты (замеры 16.10.2026, до правок)

1. `packages/web/src/components/auth/OAuthGrid.tsx:23-28` — `PROVIDERS` содержит
   ровно 4 элемента: yandex, vk, mailru, rambler. Тип `OAuthProvider` (`:10`) —
   `'yandex' | 'vk' | 'mailru' | 'rambler'`.
2. `packages/web/src/styles/design-system.css:345-350` — `.auth-oauth-grid` =
   `grid-template-columns: repeat(2, 1fr)` → при 6 плитках будет 2 колонки × 3 ряда
   (карточка входа станет выше). `:376-382` — `:hover { transform: scale(1.5) }`,
   для неактивной плитки масштабирование не нужно.
3. `packages/web/src/screens/auth/LoginScreen.tsx:72` — обработчик безусловно ведёт на
   `${apiBase}/api/auth/oauth/${provider}` → для неактивного провайдера нужен guard.
   `packages/web/src/screens/auth/RegisterScreen.tsx` — тот же паттерн (проверить).
4. `packages/web/src/__tests__/components/LoginScreen.test.tsx:48` —
   `expect(...querySelectorAll('.auth-oauth-tile')).toHaveLength(4)` — правка числа
   плиток обязана сопровождаться правкой теста.
5. `packages/shared/src/i18n/translations.ts:106-109` — ключи OAuth: `notConfigured`,
   `failed`, `accountInactive`, `yandex`. Каждый ключ = 20 языков (ru, en, tt, ba, ce,
   cv, av, dar, udm, lez, kbd, chm, os, sah, bua, uk, zh, hi, be, fr).
6. `packages/server/src/services/authService.ts:839-861` — `OAuthProviderId` включает
   `'rambler' | 'max'`, но `OAUTH_PROVIDER_ENV` содержит только yandex/vk/mailru →
   неконфигурированный провайдер уже даёт `not_configured`, не 500 (`authController.ts:421-424`).
   Госуслуг в типе нет.

## Подзадачи

- [x] 1. i18n: новый ключ `oauth.validationNotice` (20 языков) + метки `oauth.vk`,
      `oauth.mailru`, `oauth.rambler`, `oauth.max`, `oauth.gosuslugi`.
      Доказательство: `pnpm --filter @balloo/shared test` зелёный.
      → 6 новых ключей в `translations.ts` (TranslationKey + значения 20 языков), прогон 76/76 зелёный (16.10.2026).
- [x] 2. `OAuthGrid.tsx`: тип +`'max' | 'gosuslugi'`; у провайдера флаг `configured`;
      6 плиток; неактивные — `disabled`, `aria-label` с текстом подсказки, `data-tooltip`.
      Неактивный клик не уходит на сервер.
      → сделано: `aria-disabled="true"` + `onClick preventDefault` (нативный `disabled` не отдаёт :hover — подсказка не показалась бы); экспорт `isOAuthConfigured`.
- [x] 3. `design-system.css`: 3 колонки для 6 плиток; класс `auth-oauth-tile--disabled`
      (серый, `cursor: not-allowed`, без `scale`), CSS-подсказка через `::after` на hover/focus.
      → `.auth-oauth-grid` repeat(3, 1fr); `--disabled`: grayscale+opacity, tooltip через `::after` (база `.auth-oauth-tile` уже `position: relative`).
- [x] 4. `LoginScreen.tsx` / `RegisterScreen.tsx`: guard — неактивный провайдер не
      редиректит.
      → `if (!isOAuthConfigured(provider)) return;` в `handleOAuth` обоих экранов (второй слой, импорт из OAuthGrid).
- [x] 5. Тест `LoginScreen.test.tsx`: 6 плиток, 3 из них `disabled`; обновить expectation
      количества. Прогон `pnpm --filter @balloo/web test`.
      → `toHaveLength(6)` + `.auth-oauth-tile--disabled` length 3 + новый тест на подсказку; прогон 24 файла / 219 тестов зелёный (16.10.2026).
- [x] 6. Макеты (источник правды): `mockups/balloo-su/login.html`, `register.html` —
      6 плиток, 3 серые с подсказкой. Правка макета — по явной команде владельца
      («в дизайне оставь место для макс и госуслуге, но кнопка серая...» 16.10.2026).
      → HTML обоих макетов + `common.css` (3×2, `--disabled`, tooltip) + `login.md`/`register.md` синхронно + запись в `index_ecrans.md` (правка 16.10.2026) + `edits_specific` у_01 12→13 в `index_ecrans.json`.
- [x] 7. `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`: 1.2.6 → закрыто (решение (б)) в Блок 6 (6.32); новые
      задачи владельцу 1.6.4 «завести OAuth-приложение Rambler» + 1.6.5 «перепроверить ВСЕ ключи».
- [x] 8. Проверки: `pnpm --filter @balloo/shared test` (76/76), `pnpm --filter @balloo/web test`
      (219/219, включая новые expectations), `pnpm --filter @balloo/web build` (exit 0, 6.97s) — вывод в Результат.
- [ ] 9. Коммит + `git push origin main`, хэш в Результат.

## Критерии готовности

- На входе и регистрации 6 плиток; Яндекс/VK/Mail.ru кликабельны; Rambler/Max/Госуслуги
  серые, `disabled`, при наведении и фокусе читаемая подсказка.
- Ни один неактивный провайдер не порождает запрос на сервер.
- Тесты shared + web зелёные, `tsc && vite build` exit 0.
- Макеты и код согласованы (AGENTS: макет = источник правды).

## Проблемы и решения

**Rambler: код провайдера сейчас не пишу.** Причина: ключей нет, а значит flow
(authorize → exchange → callback) невозможно проверить ни локально, ни на проде —
`AGENTS.md` §0: код проверяется запуском. Плюс эндпоинты Rambler OAuth (authorize/token/
профиль) нужно брать из актуальной документации Rambler&Co, а не по памяти — §0.1 п.3:
формулировка не имеет приоритета над фактом. Когда владелец даст Tech ID + secret,
сверяю эндпоинты по докам Rambler и пишу провайдера за один проход с прогоном.

**Госуслуги (ESIA):** приложения нет, документацию доступа (клиент в ESIA) заводит только
владелец. Пока — неактивная плитка, как просил владелец.

## Результат

Финальные прогоны 16.10.2026 (после всех правок):

```text
pnpm --filter @balloo/shared test → Test Files 4 passed (4), Tests 76 passed (76)
pnpm --filter @balloo/web test    → Test Files 24 passed (24), Tests 219 passed (219)
pnpm --filter @balloo/web build   → exit 0 (tsc && vite build, 6.97s)
pnpm --filter @balloo/server build → exit 0 (shared-переводы читаются сервером)
```

Изменённые файлы: `packages/shared/src/i18n/translations.ts` (6 ключей × 20 языков),
`packages/web/src/components/auth/OAuthGrid.tsx` (6 плиток, configured, aria-disabled,
isOAuthConfigured), `packages/web/src/screens/auth/LoginScreen.tsx` +
`RegisterScreen.tsx` (guard в handleOAuth), `packages/web/src/styles/design-system.css`
(3×2, --disabled, tooltip), `packages/web/src/__tests__/components/LoginScreen.test.tsx`
(6/3 + тест подсказки), макеты `login.html`/`register.html`/`common.css` +
`login.md`/`register.md` + `index_ecrans.md`/`index_ecrans.json` (у_01 edits_specific 12→13),
`СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` (1.2.6 → 6.32, новые 1.6.4/1.6.5).

Код провайдера Rambler — НЕ написан осознанно: нет ключей, flow непроверяем запуском
(AGENTS §0); после 1.6.4 пишется за один проход.

Хэш коммита: `70b778b` (push `55fa57c..70b778b main -> main`, HEAD = origin/main = 70b778b).
