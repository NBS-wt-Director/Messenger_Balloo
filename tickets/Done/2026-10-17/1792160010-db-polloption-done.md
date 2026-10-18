# Тикет 1792160010 — Схема БД: PollOption vs JSON (1_01_28)

**Создан:** 16.10.2026 (unix 1792160010)
**Статус:** в работе
**Источник:** аудит → Н-43
**Зависит от:** 1792160001

## Цель

Проверить: нужны ли варианты опросов как отдельная таблица или JSON-строка suffices.

## Живое состояние

- `Poll` в Prisma: `options @db.Text // JSON array of option strings` — варианты хранятся как JSON.
- `PollOption` в data_schema — отдельная таблица с связью `pollId → Poll`.
- Экран: `packages/web/src/screens/polls/PollScreen.tsx` — **УЖЕ ЕСТЬ**.
- Если JSON suffices → тикет закрывается как «не требуется».
- Если data_schema требует нормализованную таблицу → добавить `PollOption`.

## Подзадачи

- [x] 1. Poll.options = JSON массив строк, PollVote.optionIndex = индекс варианта. Варианты не требуют отдельной таблицы.
- [x] 2. PollOption: id, pollId, text, order — но это покрывается JSON-полем Poll.options.
- [x] 3. JSON suffices — отдельная таблица PollOption НЕ требуется.
- [~] 4. Не требуется.

**Команда проверки:**
```bash
cd packages/shared && npx prisma validate && echo "✅"
```

## Критерии готовности

- Решение: JSON или таблица — зафиксировано в «Результат».
- Если таблица: миграция создана, validate зелёный.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Poll.options = JSON массив строк, PollVote.optionIndex = индекс варианта
- JSON suffices — отдельная таблица PollOption НЕ требуется
- npm run build → exit 0
