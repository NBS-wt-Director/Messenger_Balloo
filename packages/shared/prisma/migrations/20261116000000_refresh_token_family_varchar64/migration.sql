-- Тикет 1794831100 (часть B): refresh-токены не сохранялись никогда.
-- authService.generateTokens() кладёт в familyId crypto.randomUUID() (36 символов),
-- а колонка была VARCHAR(25) → Postgres отвергал INSERT, ошибка проглатывалась
-- try/catch, таблица refresh_tokens оставалась пустой, family-revocation (А-02)
-- не срабатывал ни разу.
-- Расширение до 64 символов обратно совместимо (данные отсутствуют), формат
-- familyId в JWT не меняется.

ALTER TABLE "refresh_tokens" ALTER COLUMN "familyId" TYPE VARCHAR(64);
