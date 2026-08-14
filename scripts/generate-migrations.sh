#!/usr/bin/env bash
# ============================================
# Balloo Messenger — Генерация Prisma миграций
# ============================================
# Запуск: bash scripts/generate-migrations.sh
# ============================================

set -euo pipefail

echo "🔧 Генерация Prisma миграций..."
echo ""

# Проверяем DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ ОШИБКА: переменная DATABASE_URL не установлена"
    echo ""
    echo "Установите её перед запуском:"
    echo "  export DATABASE_URL=\"postgresql://balloo:PASSWORD@localhost:5432/balloo?schema=public\""
    echo ""
    exit 1
fi

# Меняем на каталог shared
cd "$(dirname "$0")/../packages/shared"

# Проверяем, есть ли уже миграции
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "⚠️  Каталог prisma/migrations уже существует и не пустой."
    echo "    Пропускаю генерацию."
    exit 0
fi

# Генерируем миграцию
echo "📝 Создание миграции из schema.prisma..."
npx prisma migrate dev --name init --create-only

echo ""
echo "✅ Миграция создана!"
echo "📂 Путь: packages/shared/prisma/migrations/"
echo ""
echo "Для применения на production:"
echo "  npx prisma migrate deploy"
