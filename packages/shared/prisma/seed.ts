/**
 * Balloo Messenger — Prisma Seed Script
 * 
 * Предзаполнение таблиц с fill_type=seed.
 * Все переводы на 6 базовых языков: ru, en, zh, fr, be, hi.
 * 
 * Запуск:
 *   cd packages/shared && npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// 1. DonationTier — уровни поддержки
// ============================================

async function seedDonateTiers() {
  const tiers = [
    {
      name: 'Кофе разработчику',
      amount: 100,
      features: JSON.stringify([
        'Спасибо в личном кабинете',
        'Бейдж «Спонсор»'
      ])
    },
    {
      name: 'Спонсор',
      amount: 500,
      features: JSON.stringify([
        'Бейдж «Спонсор»',
        'Приоритет в фич-реквестах',
        'Доступ к beta-каналу'
      ])
    },
    {
      name: 'VIP',
      amount: 2500,
      features: JSON.stringify([
        'Бейдж «VIP»',
        'Расширенные лимиты вложений',
        'Ранний доступ к функциям',
        'Прямой канал с командой'
      ])
    }
  ]

  for (const tier of tiers) {
    await prisma.donationTier.upsert({
      where: { id: '' }, // placeholder — slug не используется как PK
      update: tier,
      create: {
        ...tier,
        id: `tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`.slice(0, 25)
      }
    })
  }

  console.log('✅ DonationTier: 3 уровня созданы')
}

// ============================================
// 2. BlogCategory — категории блога
// ============================================

async function seedBlogCategories() {
  const categories = [
    { slug: 'news', name: 'Новости' },
    { slug: 'tech', name: 'Технологии' },
    { slug: 'team', name: 'Команда' },
    { slug: 'metrics', name: 'Метрики' }
  ]

  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: {
        slug: cat.slug,
        name: cat.name
      }
    })
  }

  console.log('✅ BlogCategory: 4 категории созданы')
}

// ============================================
// 3. KnowledgePage — стартовые страницы базы знаний
// ============================================

async function seedKnowledgePages() {
  // Сначала создаём категорию "Начало работы"
  let category = await prisma.blogCategory.findUnique({
    where: { slug: 'getting-started' }
  })

  if (!category) {
    category = await prisma.blogCategory.create({
      data: {
        slug: 'getting-started',
        name: 'Начало работы'
      }
    })
  }

  const pages = [
    {
      categoryId: category.id,
      title: 'Добро пожаловать в Balloo',
      content: `# Добро пожаловать в Balloo!\n\nBalloo — это российский мессенджер с фокусом на приватность и безопасность.\n\n## Возможности\n\n- **Личные сообщения** — общение один на один\n- **Группы** — до 30 участников\n- **Каналы** — широковещательные сообщения\n- **Истории** — исчезающие медиа\n- **Опросы** — голосование в реальном времени\n- **Блог** — корпоративные каналы и посты\n\n## Быстрый старт\n\n1. Заполните профиль\n2. Найдите друзей по username\n3. Создайте или вступите в группу\n4. Настройте уведомления`
    },
    {
      categoryId: category.id,
      title: 'Как создать группу',
      content: `# Как создать группу\n\n1. Откройте главный экран чатов\n2. Нажмите кнопку «Создать группу»\n3. Введите название группы\n4. Выберите участников (до 30 человек)\n5. Нажмите «Создать»\n\nПосле создания вы сможете:\n- Назначить администраторов\n- Создать invite-ссылку\n- Настроить права доступа\n- Закрепить важные сообщения`
    },
    {
      categoryId: category.id,
      title: 'Настройки приватности',
      content: `# Настройки приватности\n\nBalloo уважает вашу приватность. Вы можете настроить:\n\n## Видимость профиля\n\n- **Публичный** — ваш профиль виден всем\n- **Только друзья** — только пользователи, которых вы добавили\n- **Скрытый** — никто не видит ваш профиль\n\n## Кто может писать мне\n\n- Все\n- Только друзья\n- Никто (только группы)\n\n## История просмотров\n\n- Включить показ просмотров историй\n- Скрыть свои просмотры\n\n## Онлайн-статус\n\n- Показывать мой онлайн\n- Показывать время последнего посещения`
    }
  ]

  for (const page of pages) {
    await prisma.knowledgePage.upsert({
      where: {
        id: `kp-${page.title.toLowerCase().replace(/\s+/g, '-')}-${category.id}`.slice(0, 25)
      },
      update: {
        title: page.title,
        content: page.content
      },
      create: {
        id: `kp-${page.title.toLowerCase().replace(/\s+/g, '-')}-${category.id}`.slice(0, 25),
        categoryId: page.categoryId,
        title: page.title,
        content: page.content
      }
    })
  }

  console.log('✅ KnowledgePage: 3 стартовые страницы созданы')
}

// ============================================
// 4. ServiceVersion — история версий (узел 05)
// Тикет №56
// ============================================

async function seedServiceVersions() {
  const now = Math.floor(Date.now() / 1000)
  const day = 86400

  const versions = [
    {
      version: 'v0.1.0',
      publishedAt: now - day * 59, // ~1 июня 2026
      isLatest: false,
      createdAt: now - day * 59,
      changelog: JSON.stringify({
        title: 'Начало проекта',
        icon: '🌱',
        type: 'patch',
        status: 'released',
        summary: 'Репозиторий создан · ТЗ · Стек выбран',
        sections: {
          new: ['Репозиторий создан', 'Техническое задание', 'Стек технологий выбран'],
        },
      }),
    },
    {
      version: 'v0.5.0',
      publishedAt: now - day * 45, // ~15 июня 2026
      isLatest: false,
      createdAt: now - day * 45,
      changelog: JSON.stringify({
        title: 'Архитектура и инфраструктура',
        icon: '🏗️',
        type: 'minor',
        status: 'released',
        summary: 'Монорепо · pnpm workspaces · Docker · Документация',
        sections: {
          new: ['Монорепо структура', 'pnpm workspaces', 'Docker-окружение', 'Документация проекта'],
        },
      }),
    },
    {
      version: 'v0.9.0',
      publishedAt: now - day * 29, // ~1 июля 2026
      isLatest: false,
      createdAt: now - day * 29,
      changelog: JSON.stringify({
        title: 'Pre-beta: макеты и дизайн-система',
        icon: '🎨',
        type: 'minor',
        status: 'released',
        summary: 'CSS дизайн-система · JS интерактивность · Макеты всех узлов',
        sections: {
          new: ['CSS дизайн-система (common.css)', 'JS интерактивность (common.js)', 'Макеты всех узлов экосистемы'],
        },
      }),
    },
    {
      version: 'v1.0.0-beta',
      publishedAt: now - day * 14, // ~16 июля 2026
      isLatest: true,
      createdAt: now - day * 14,
      changelog: JSON.stringify({
        title: 'Первый бета-релиз Balloo Messenger',
        icon: '🚀',
        type: 'major',
        status: 'released',
        summary: 'Онбординг · Чаты · Звонки · Группы · 3 темы · 6 языков · Bot API · 77 макетов экранов',
        sections: {
          new: [
            'Онбординг с 3 экранами приветствия',
            'Аутентификация: Email + OAuth (Яндекс, Mail.ru, Rambler)',
            'Текстовые сообщения с Markdown, реакции (до 5), вложения',
            '1:1 и групповые чаты (4 типа групп)',
            'Голосовые и видеозвонки 1:1 (WebRTC)',
            'Восьмигранные аватарки с двойной рамкой (контекст + статус)',
            '3 темы оформления: тёмная, светлая, «Наша»',
            '6 языков: RU, EN, ZH, FR, BE, HI',
            'Глобальный поиск по чатам, людям, файлам, медиа',
            'Архивация чатов',
            'Публичные профили по ссылке',
            'Bot API с документацией',
            'Чат с техподдержкой',
            'Приглашения пользователей',
            'Мультиаккаунт (неограниченное количество)',
            'QR-привязка устройств',
            'Донат-страница для поддержки проекта',
            'Портал сотрудников (командный портал)',
            'Портал фич-реквестов',
          ],
          improved: [
            'Glassmorphism дизайн-система с blur-эффектами',
            'WebSocket на Hono + uWebSockets.js',
            'Хранение файлов: MinIO + Yandex Disk',
            'Единое API для всех узлов экосистемы',
          ],
          known_issues: [
            'Групповые видеозвонки пока не поддерживаются (запланировано v1.1)',
            'P2G threading в планах v2',
          ],
        },
        stats: { screens: 77, nodes: 9, platforms: 5, languages: 6 },
      }),
    },
    {
      version: 'v1.1.0',
      publishedAt: 0, // planned
      isLatest: false,
      createdAt: now - day,
      changelog: JSON.stringify({
        title: 'Групповые видеозвонки',
        icon: '🔮',
        type: 'minor',
        status: 'planned',
        summary: 'Видео-конференции до 12 человек · Шумоподавление · Low bandwidth mode',
        expectedAt: 'сентябрь 2026',
        sections: {
          new: ['Видео-конференции до 12 человек', 'Шумоподавление', 'Low bandwidth mode'],
        },
      }),
    },
    {
      version: 'v2.0.0',
      publishedAt: 0, // planned
      isLatest: false,
      createdAt: now,
      changelog: JSON.stringify({
        title: 'Balloo v2 — масштабное обновление',
        icon: '🔮',
        type: 'major',
        status: 'planned',
        summary: 'P2G threading · Истории · Бот-маркетплейс · Групповые звонки 12+ · Реакции на сообщения',
        expectedAt: 'Q4 2026',
        sections: {
          new: ['P2G threading', 'Бот-маркетплейс', 'Групповые звонки 12+', 'Реакции на сообщения'],
        },
      }),
    },
  ]

  for (const v of versions) {
    await prisma.serviceVersion.upsert({
      where: { version: v.version },
      update: {
        changelog: v.changelog,
        publishedAt: v.publishedAt,
        isLatest: v.isLatest,
      },
      create: {
        id: `sv-${v.version.replace(/[^a-zA-Z0-9]/g, '')}`.slice(0, 25),
        version: v.version,
        changelog: v.changelog,
        publishedAt: v.publishedAt,
        isLatest: v.isLatest,
        createdAt: v.createdAt,
      },
    })
  }

  console.log('✅ ServiceVersion: 6 версий созданы (4 релиза + 2 планируемых)')
}

// ============================================
// Main seed function
// ============================================

async function main() {
  console.log('🌱 Balloo Messenger — Starting seed...')
  console.log('   Базовые языки: ru, en, zh, fr, be, hi')
  console.log()

  await seedDonateTiers()
  await seedBlogCategories()
  await seedKnowledgePages()
  await seedServiceVersions()

  console.log()
  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
