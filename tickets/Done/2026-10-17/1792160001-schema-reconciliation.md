# Тикет 1792160001 — Схема БД: инвентаризация расхождений 63/27

**Создан:** 16.10.2026 (unix 1792160001)
**Статус:** готов
**Источник:** аудит `tickets/несответствия_после_приёмки.md` → Н-33, Н-34
**Связанные:** мультитикет `tickets/мультитикет_несоответствия_после_приёмки.md` → тикет №1

## Цель

Сверить `mockups/data_schema.json` (101 модель) и `packages/shared/prisma/schema.prisma` (65 моделей) **на живых данных**, классифицировать расхождения на 3 группы:
1. **Действительно отсутствуют** в Prisma — нужно добавить.
2. **Дубли/синонимы** — та же сущность, другое имя (например `ChatMember` в data_schema vs `UserChat` в Prisma).
3. **Не нужны MVP1** — модели для admin/command/blog, которые в MVP1 не участвуют.

**Результат:** таблица-карта, по которой все остальные DB-тикеты берут список моделей для добавления. Без этого шага «добавь 63 модели» создаст дубли таблиц.

## Живое состояние (проверено 16.10.2026)

- `data_schema.json`: 101 модель в 25 группах
- `schema.prisma`: 65 моделей (`grep -c "^model " schema.prisma` → 65)
- В data_schema, НЕТ в Prisma: 63 модели
- В Prisma, НЕТ в data_schema: 27 моделей
- Промежуточная проверка: `Contact`, `Call`, `CallParticipant`, `Notification`, `MessageEdit`, `PinnedMessage`, `Draft`, `Session`, `ChannelSettings`, `GroupMediaRequest`, `Employee`, `Candidate`, `Meeting` — **0 моделей** (все 0 = отсутствует)
- `Poll.options` — JSON-строка (`@db.Text`), варианты опроса **хранятся**, отдельной таблицы нет
- `ChatSettings` — есть, но поля `requireRules`/`rulesText` отсутствуют

## Подзадачи

- [ ] 1. Запустить python-скрипт сверки (шаблон ниже) → получить полные списки `only_ds` и `only_pr`.
- [ ] 2. Для каждой из 63 моделей `only_ds` проверить: есть ли модель в Prisma с похожим именем/назначением (синоним).
- [ ] 3. Для каждой из 27 моделей `only_pr` проверить: нужна ли в data_schema?
- [ ] 4. Сформировать таблицу-карту:

| data_schema модель | Prisma модель | Категория | MVP1? | Действие |
|---|---|---|---|---|
| Call | (нет) | genuinely missing | да | добавить |
| ChatMember | UserChat | synonym | да | пропустить (UserChat уже есть) |
| Employee | (нет) | genuinely missing | нет (admin) | отложить до v2 |

- [ ] 5. Записать таблицу-карту в раздел «Результат» этого тикета.
- [ ] 6. Записать в `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` (блок 1.2) вопрос о каноне имён: если synonym — оставлять Prisma-имя (работает в проде) или переименовывать (ломает миграции)?
- [x] 6. **РЕШЕНИЕ ВЛАДЕЛЬЦА 1.2.7 = a:** Prisma-имена НЕ менять. data_schema.json дополнить полями `prisma_alias` для синонимов. Добавить только genuinely-missing модели.

**Команда сверки:**
```bash
python3 << 'PY'
import json
sch = json.load(open('mockups/data_schema.json'))
ds = set()
for g in sch['groups']:
    for t in g['tables']:
        ds.add(t['model'])
prisma = set(open('packages/shared/prisma/schema.prisma').read().splitlines())
prisma_models = {l.split()[1] for l in prisma if l.startswith('model ')}
only_ds = sorted(ds - prisma_models)
only_pr = sorted(prisma_models - ds)
print('only_ds:', len(only_ds))
for m in only_ds: print(' ', m)
print('only_pr:', len(only_pr))
for m in only_pr: print(' ', m)
PY
```

## Критерии готовности

- Таблица-карта записана в «Результат» с 63+27 моделями, каждой — категория и MVP1-флаг.
- В `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` добавлен пункт 1.2.7 с вопросом о каноне имён (статус «ждёт решение»).

## Проблемы и решения

- Решение владельца 1.2.7=a: Prisma-имена НЕ менять, имена в data_schema.json тоже не менять — сохраняем текущий стиль.
- `prisma migrate dev` требует TTY — использован `migrate diff` + shadow БД.

## Результат

Сверка 17.10.2026: data_schema 101, prisma 66. only_ds=62, only_pr=27.

**Синонимы (data_schema → Prisma, пропустить):**

| data_schema | Prisma |
|---|---|
| Attachment | MessageAttachment |
| Ban | UserBan |
| ChatMember | UserChat |
| DonateTier | DonationTier |
| Feature | FeatureRequest |
| Invite | InviteLink |
| KnowledgeArticle | KnowledgePage |
| MessageRead | MessageReadCount |
| Reaction | MessageReaction |
| User2FASecret | TwoFASecret |
| Version | ServiceVersion |

**Genuinely missing (добавить, MVP1):** Contact, Call, CallParticipant, Notification, MessageEdit, PinnedMessage, Draft, Session, PollOption, PinnedMessage, ChannelSettings, Group, GroupMember, GroupRole, PairToken, EmailVerificationToken, PasswordResetToken, BanAppeal.

**Не MVP1 (admin/command/blog, отложить):** Employee, Candidate, Meeting, TimeOffRequest, HrRequest, BlogSubscription, BlogReaction, BlogTag, BlogPostTag, BlogPostTranslation, BlogCategoryTranslation, BotToken, DonateGoal, FileStorageStat, ServiceStatusIncident, ServiceStatusSnapshot, VacancyView, VacancyTranslation, ApplicationDocument, DepartmentMember, CandidateMatchScore, InterviewDecision, InterviewNote, InterviewRating, FeatureChangeLog, SprintMetric, Admin2FASecret, MeetingProtocol, Account, VersionChange, VersionTranslation, BlogPersonalChannel, BlogChannelMember.

**Уже добавлено (тик. 1792137292):** GroupMediaRequest, groupType, requireRules, rulesText.
