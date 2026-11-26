#!/usr/bin/env node
// assign-superadmin.cjs — назначение суперадминистратора (тикет 1795560009)
//
// Что делает:
//   1) Находит первого пользователя (createdAt ASC) → ставит role='superadmin'.
//   2) Находит чат с именем, содержащим «Балу» и «новости» (нечувствительно к
//      регистру и тире) → ставит этому пользователю UserChat.role='admin'.
//      Если записи нет — создаёт её.
//   3) Печатает результат (id пользователя, чата, что изменено).
//
// Безопасность: идемпотентен. Повторный запуск не меняет ничего.
// Запуск: node scripts/assign-superadmin.cjs
// Требуется DATABASE_URL в env (как у prisma).

const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

// Подтягиваем env из docker/prod/.env.production если есть (для локального запуска).
try {
  const dotenv = require('dotenv');
  const prodEnv = path.join(repoRoot, 'docker', 'prod', '.env.production');
  const devEnv = path.join(repoRoot, '.env');
  for (const f of [prodEnv, devEnv]) {
    try { dotenv.config({ path: f }); } catch {}
  }
} catch {}

const { PrismaClient } = require(path.join(repoRoot, 'node_modules', '@prisma', 'client'));
const prisma = new PrismaClient();

async function main() {
  // 1. Первый пользователь по createdAt ASC.
  const first = await prisma.user.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, displayName: true, role: true, createdAt: true },
  });
  if (!first) {
    console.error('❌ Нет ни одного активного пользователя — некому выдавать superadmin.');
    process.exit(1);
  }

  let userChanged = false;
  if (first.role !== 'superadmin') {
    await prisma.user.update({ where: { id: first.id }, data: { role: 'superadmin' } });
    userChanged = true;
  }
  console.log(
    `👤 ${first.username || first.id} (displayName="${first.displayName || ''}") ` +
      `role: ${first.role}${userChanged ? ' → superadmin' : ' (уже superadmin)'}`
  );

  // 2. Чат «Балу — новости и информация». Приоритет — env.NEWS_CHAT_ID
  //    (тот же id, что использует авто-вступление joinNewsChannel), иначе
  //    ищем среди каналов по подстрокам (переживает разные тире/регистр).
  const newsChatId = process.env.NEWS_CHAT_ID;
  let target = null;
  if (newsChatId) {
    target = await prisma.chat.findUnique({
      where: { id: newsChatId },
      select: { id: true, name: true },
    });
    if (!target) {
      console.warn(`⚠️ NEWS_CHAT_ID=${newsChatId} задан, но чат с таким id не найден.`);
    }
  }
  if (!target) {
    const allChats = await prisma.chat.findMany({
      where: { type: 'channel' },
      select: { id: true, name: true },
    });
    const norm = (s) => (s || '').toLowerCase().replace(/[—–-]/g, ' ');
    target =
      allChats.find((c) => norm(c.name).includes('балy') && norm(c.name).includes('новост')) ||
      allChats.find((c) => norm(c.name).includes('балy') && norm(c.name).includes('информац')) ||
      allChats.find((c) => norm(c.name).includes('балy'));
  }

  if (!target) {
    console.warn(
      '⚠️ Чат «Балу — новости и информация» не найден (нет NEWS_CHAT_ID и совпадений по имени). ' +
        'Назначьте администратора вручную через админку.'
    );
  } else {
    const existing = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId: first.id, chatId: target.id } },
    });
    if (existing) {
      if (existing.role !== 'admin') {
        await prisma.userChat.update({
          where: { id: existing.id },
          data: { role: 'admin' },
        });
        console.log(
          `📢 Chat "${target.name}" (${target.id}): роль ${existing.role} → admin`
        );
      } else {
        console.log(`📢 Chat "${target.name}" (${target.id}): уже admin`);
      }
    } else {
      await prisma.userChat.create({
        data: {
          userId: first.id,
          chatId: target.id,
          role: 'admin',
          joinedAt: BigInt(Date.now()),
        },
      });
      console.log(`📢 Chat "${target.name}" (${target.id}): создан UserChat role=admin`);
    }
  }

  console.log('\n✅ Готово. Перезайдите в админку, чтобы получить права superadmin.');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e?.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
