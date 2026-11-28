-- Тикет 1795888510: первый пользователь получает права суперадминистратора.
-- Идемпотентно: если суперадмин уже есть, ничего не меняем. Иначе роль
-- superadmin выдаётся самому раннему действующему администратору (на проде
-- это первый зарегистрированный пользователь o8eryuhtin). Аккаунты со
-- статусом deleted/banned не трогаем: они не должны получать права.
UPDATE "users"
SET "role" = 'superadmin'
WHERE "id" = (
  SELECT "id"
  FROM "users"
  WHERE "role" IN ('admin', 'superadmin')
    AND "status" = 'active'
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM "users" WHERE "role" = 'superadmin'
);
