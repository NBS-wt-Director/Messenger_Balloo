# Тикет 1795369071 — Ссылка приглашения без hash → 0 рефералов, контакты не добавляются

**Создан:** 22.11.2026 (unix 1795369071)
**Статус:** в работе
**Источник:** приёмка H2 деплоя 24975f7, владелец: «в контактах только 2 и в приглашении 0»

## Симптом

Владелец создал приглашение с галочкой «добавить в контакты», минимум 2 человека
зарегистрировались, но: рефералы = 0, автоконтактов нет.

## Причина (доказана чтением кода 22.11.2026)

Роутер приложения — **hash** (`packages/web/src/router/index.tsx:179` createHashRouter,
KODA.md §7). Все генераторы ссылки приглашения отдают URL **без `#`**:

| Место | Сейчас | Куда ведёт |
|---|---|---|
| `server/services/inviteService.ts:113,176` | `https://balloo.su/join/CODE` | SPA грузится, hash-роутер игнорирует pathname → страница логина, код ПОТЕРЯН |
| `server/services/chatService.ts:534` | `https://app.balloo.su/invite/CODE` | домена `app.balloo.su` НЕ СУЩЕСТВУЕТ |
| `web/screens/invites/InvitesScreen.tsx:114` (fallback) | `https://balloo.su/join/CODE` | код потерян |
| `web/screens/groups/GroupSettingsScreen.tsx:50` | демо-дефолт без hash | — |
| `web/components/chat/ChatInfoPanel.tsx:136,140` | `balloo.su/invite/CODE` (без схемы) | нерабочий текст; плюс `chat.inviteCode` — колонка Chat, её `previewInvite`/`acceptInviteByCode` не находят (ищут только таблицу InviteLink) |

Итог: приглашённый открывает ссылку → регистрируется **без inviteCode** →
`InviteAcceptance` не пишется (рефералы 0), `ensureMutualContacts` не вызывается.

## Решение

1. Единый формат `https://balloo.su/#/join/${code}` во всех 6 местах
   (+ пример в `docsData.ts:279`).
2. `ChatInfoPanel`: вместо статики со `chat.inviteCode` — по кнопке создавать
   реальный InviteLink (`POST /api/chats/:id/invite`) и копировать `url` из ответа.
3. Спасение уже разосланных ссылок: в `main.tsx` редирект `location.pathname`
   вида `/join/CODE` → `/#/join/CODE` до рендера роутера.

## Подзадачи

- [x] 1. server: inviteService ×2 + chatService ×1 + docsData — формат `/#/join/`
- [x] 2. web: InvitesScreen fallback, GroupSettingsScreen дефолт, ChatInfoPanel (создание ссылки запросом)
- [x] 3. web: `utils/joinPathRescue.ts` + вызов в main.tsx (спасение разосланных ссылок)
- [x] 4. Тесты: `joinPathRescue.test.ts` (5 кейсов); существующие `b6-4`/`invites-link-flow`
      проверяют `toContain('/join/')` — новый формат проходит
- [x] 5. Проверки: server tsc 0 + jest 54 suites/805 tests; web tsc 0 + vitest 53/393; vite build ✓
- [x] 6. Деплой (server + web) — батчи C3–G3, 23.11.2026: `HEAD=65b4606`,
      бандль `index-BMWJl9HD.js` (=8090=домен), `joinPathRescue` в бандле,
      server img `a569328b…` (док-во: тик. `1795357403`, раздел «Батчи C3–G3»)

## Результат

Все URL приведены к `https://balloo.su/#/join/CODE`:

```text
inviteService.ts:113,176  → https://balloo.su/#/join/${code}
chatService.ts:534        → https://balloo.su/#/join/${code}   (было app.balloo.su/invite/)
InvitesScreen.tsx:114     → https://balloo.su/#/join/${code}
GroupSettingsScreen.tsx:50 → https://balloo.su/#/join/abc123
docsData.ts:279           → https://balloo.su/#/join/abc123
ChatInfoPanel             → ссылка создаётся POST /api/chats/:id/invite, копируется res.url
main.tsx                  → rescueJoinPath(): /join/CODE → /#/join/CODE
```

Проверки: `tsc` server+web exit 0; jest server 805/805; vitest web 393/393
(в т.ч. joinPathRescue 5/5); `vite build` ✓ 6.85s.

## Критерии готовности

- `POST /api/invites` → `url` = `https://balloo.su/#/join/...`;
- открытие `https://balloo.su/join/CODE` (без hash) редиректит на лендинг приглашения;
- регистрация по ссылке пишет InviteAcceptance и контакты (существующий тест
  `invites-link-flow.test.ts` на этом уже построен).

## Результат

(заполняется по ходу)
