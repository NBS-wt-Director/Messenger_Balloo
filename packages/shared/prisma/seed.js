"use strict";
/**
 * Balloo Messenger — Prisma Seed Script
 *
 * Предзаполнение таблиц с fill_type=seed.
 * Все переводы на 6 базовых языков: ru, en, zh, fr, be, hi.
 *
 * Запуск:
 *   cd packages/shared && npx prisma db seed
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
    ];
    for (const tier of tiers) {
        // Идемпотентный seed: ищем по уникальному имени, создаём по slug-подобному
        // детерминированному id (Date.now() создавал новый id при каждом прогоне,
        // из-за чего таблица дублировалась, а upsert с where id:'' падал с P2002).
        const existing = await prisma.donationTier.findFirst({ where: { name: tier.name } });
        if (existing) {
            await prisma.donationTier.update({ where: { id: existing.id }, data: tier });
        }
        else {
            await prisma.donationTier.create({
                data: {
                    ...tier,
                    id: `tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`.slice(0, 25)
                }
            });
        }
    }
    console.log('✅ DonationTier: 3 уровня созданы');
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
    ];
    for (const cat of categories) {
        await prisma.blogCategory.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name },
            create: {
                slug: cat.slug,
                name: cat.name
            }
        });
    }
    console.log('✅ BlogCategory: 4 категории созданы');
}
// ============================================
// 3. KnowledgePage — стартовые страницы базы знаний
// ============================================
async function seedKnowledgePages() {
    // Сначала создаём категорию "Начало работы"
    let category = await prisma.blogCategory.findUnique({
        where: { slug: 'getting-started' }
    });
    if (!category) {
        category = await prisma.blogCategory.create({
            data: {
                slug: 'getting-started',
                name: 'Начало работы'
            }
        });
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
    ];
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
        });
    }
    console.log('✅ KnowledgePage: 3 стартовые страницы созданы');
}
// ============================================
// 4. ServiceVersion — история версий (узел 05)
// Даты и хэши — реальные, из git log и CHANGELOG.md (тикет 1791912132-3).
// Дата = полночь UTC указанного дня; publishedAt=0 — планируемые версии.
// ============================================
async function seedServiceVersions() {
    const versions = [
        {
            version: 'v0.1.0',
            date: '2026-08-14',
            isLatest: false,
            commits: ['ccb6f1e', '35eb799', '084d3bf'],
            changelog: JSON.stringify({
                title: 'Начало проекта',
                icon: '🌱',
                type: 'patch',
                status: 'released',
                summary: 'Монорепо · git + CI/CD · ТЗ · Стек выбран',
                sections: {
                    new: [
                        'Монорепо Balloo Messenger создан (14.08.2026, ccb6f1e)',
                        'ticket #1: git init, .gitignore, шаблон API-ключей',
                        'CI/CD готов (084d3bf, 15.08.2026)',
                    ],
                },
            }),
        },
        {
            version: 'v0.5.0',
            date: '2026-09-06',
            isLatest: false,
            commits: ['2544936'],
            changelog: JSON.stringify({
                title: 'Backend-контур и инфраструктура',
                icon: '🏗️',
                type: 'minor',
                status: 'released',
                summary: 'Auth (httpOnly+bcrypt) · Email · Docker-инфраструктура · API для desktop/Android',
                sections: {
                    new: [
                        'CI/CD, httpOnly cookies, bcrypt, email (2544936)',
                        'Docker-инфраструктура: web, server, postgres, redis',
                        'API для desktop и Android',
                    ],
                },
            }),
        },
        {
            version: 'v0.9.0',
            date: '2026-09-19',
            isLatest: false,
            commits: ['b04f9bc', '2bd2f63', '14243f6', '7c1439e', '57abfd4'],
            changelog: JSON.stringify({
                title: 'Прод-запуск: SMTP, OAuth, первые приёмки',
                icon: '🚀',
                type: 'minor',
                status: 'released',
                summary: 'SMTP через postfix (16.09) · OAuth 2×2 Яндекс/VK/Mail.ru (P20–P26) · P27–P31 на проде (19.09) · smoke PASS=8 (20.09)',
                sections: {
                    new: [
                        'SMTP-релей postfix, письма проходят проверку (16.09)',
                        'OAuth: Яндекс/VK/Mail.ru, сетка 2×2, i18n экранов входа (P20–P26)',
                        'Деплой P27–P31: тема russian, QR-привязка устройства, Rambler 429 фикс',
                        'Приёмка на проде: smoke PASS=8 FAIL=0 (20.09)',
                    ],
                },
            }),
        },
        {
            version: 'v1.0.0',
            date: '2026-09-30',
            isLatest: false,
            commits: ['41f3e96', 'a79aacc', '6977776', 'b42ed06'],
            changelog: JSON.stringify({
                title: 'Первый релиз Balloo Messenger',
                icon: '🎉',
                type: 'major',
                status: 'released',
                summary: 'P37 (единый подвал, 6+5 экранов) · P38 (правое меню, 3 темы) · экран /support + админ-раздел · release engineering (CHANGELOG, docs/10–13)',
                sections: {
                    new: [
                        'Единый подвал на blog-экранах и публичных страницах (P37-1…5)',
                        'Правое меню шапки: аккаунт, темы, уведомления (P38)',
                        'Экран /support + раздел обращений в админке (6977776)',
                        'Release engineering: CHANGELOG, docs/11-release-process, README (b42ed06)',
                    ],
                },
                stats: { screens: 174, nodes: 12, platforms: 5, languages: 20 },
            }),
        },
        {
            version: 'v1.1.0',
            date: '2026-10-08',
            isLatest: true,
            commits: ['ecda0a2', '9d59bdf'],
            changelog: JSON.stringify({
                title: 'REST API v1, безопасность, features-SPA',
                icon: '🛡️',
                type: 'minor',
                status: 'released',
                summary: 'REST /api/v1/* (support, notifications, polls, search, monitoring) · helmet/CSRF/rate-limit · features.balloo.su отдельным пакетом · 918 тестов · WebSocket events',
                sections: {
                    new: [
                        'REST API /api/v1/*: support, notifications, polls, search, admin monitoring, uploads',
                        'Security middleware: helmet, CSRF, sanitize, 4 rate-лимтера',
                        'features.balloo.su — отдельный SPA-пакет web-features (ecda0a2, 04.10)',
                        'WebSocket: poll_vote, pinned, online/offline, call:*, typing',
                        '918 unit-тестов, критический контур auth/payments покрыт',
                    ],
                    improved: [
                        'GitHub Actions: lint + test + build',
                        'Docker-образы: web, server, postgres, redis',
                    ],
                },
            }),
        },
        {
            version: 'v2.0.0',
            date: null, // planned
            isLatest: false,
            commits: [],
            changelog: JSON.stringify({
                title: 'Balloo v2 — масштабное обновление',
                icon: '🔮',
                type: 'major',
                status: 'planned',
                summary: 'P2G threading · Бот-маркетплейс · Групповые звонки 12+ · Языки народов РФ (18) · вынос admin/command/info-поддоменов в отдельные пакеты',
                sections: {
                    new: [
                        'P2G threading',
                        'Бот-маркетплейс',
                        'Групповые видеозвонки 12+',
                        'Переводы на 18 языков народов РФ (отложено, триггер — носители)',
                        'Отдельные пакеты admin/command + info-поддомены (отложено, решение владельца)',
                    ],
                },
            }),
        },
    ];
    for (const v of versions) {
        // Реальная дата вехи (полночь UTC) либо 0 для планируемых версий.
        const ts = v.date ? Math.floor(new Date(`${v.date}T00:00:00Z`).getTime() / 1000) : 0;
        const changelog = JSON.stringify({ ...JSON.parse(v.changelog), commits: v.commits });
        await prisma.serviceVersion.upsert({
            where: { version: v.version },
            update: {
                changelog,
                publishedAt: ts,
                isLatest: v.isLatest,
            },
            create: {
                id: `sv-${v.version.replace(/[^a-zA-Z0-9]/g, '')}`.slice(0, 25),
                version: v.version,
                changelog,
                publishedAt: ts,
                isLatest: v.isLatest,
                createdAt: ts,
            },
        });
    }
    // Устаревшие записи прежнего seed (v1.0.0-beta заменена на v1.0.0 с реальной датой).
    const removed = await prisma.serviceVersion.deleteMany({
        where: { version: { in: ['v1.0.0-beta'] } },
    });
    if (removed.count > 0) {
        console.log(`🧹 ServiceVersion: удалено устаревших записей: ${removed.count} (v1.0.0-beta)`);
    }
    const released = versions.filter((v) => v.date).length;
    console.log(`✅ ServiceVersion: ${versions.length} версий (${released} релиза с реальными датами из git log, ${versions.length - released} планируемая)`);
}
// ============================================
// 5. OnboardingStep + translations
// Источник: mockups/pre_filled_data.json → onboarding_steps
// ============================================
async function seedOnboardingSteps() {
    const steps = [
        {
            id: 'ob-step-1',
            order: 1,
            illustrationUrl: '/img/onboarding/welcome.svg',
            translations: [
                { language: 'ru', title: 'Добро пожаловать в Balloo', description: 'Российский мессенджер с фокусом на приватность и безопасность.' },
                { language: 'en', title: 'Welcome to Balloo', description: 'A Russian messenger focused on privacy and security.' },
                { language: 'zh', title: '欢迎来到 Balloo', description: '一款注重隐私和安全的俄罗斯即时通讯应用。' },
                { language: 'fr', title: 'Bienvenue sur Balloo', description: 'Une messagerie russe axée sur la confidentialité et la sécurité.' },
                { language: 'be', title: 'Сардэчна запрашаем у Balloo', description: 'Расійскі месенджар з акцэнтам на прыватнасць і бяспеку.' },
                { language: 'hi', title: 'Balloo में आपका स्वागत है', description: 'गोपनीयता और सुरक्षा पर केंद्रित एक रूसी मैसेंजर।' },
            ],
        },
        {
            id: 'ob-step-2',
            order: 2,
            illustrationUrl: '/img/onboarding/chats.svg',
            translations: [
                { language: 'ru', title: 'Чаты и группы', description: 'Общайтесь один на один или создавайте группы до 30 участников.' },
                { language: 'en', title: 'Chats and Groups', description: 'Chat one-on-one or create groups of up to 30 participants.' },
                { language: 'zh', title: '聊天和群组', description: '一对一聊天或创建最多30人的群组。' },
                { language: 'fr', title: 'Discussions et groupes', description: 'Discutez en privé ou créez des groupes jusqu\'à 30 participants.' },
                { language: 'be', title: 'Чаты і групы', description: 'Гутарце адзін на адзін або стварайце групы да 30 удзельнікаў.' },
                { language: 'hi', title: 'चैट और समूह', description: 'एक-से-एक चैट करें या 30 सदस्यों तक के समूह बनाएँ।' },
            ],
        },
        {
            id: 'ob-step-3',
            order: 3,
            illustrationUrl: '/img/onboarding/security.svg',
            translations: [
                { language: 'ru', title: 'Безопасность', description: 'Сквозное шифрование, 2FA и контроль устройств.' },
                { language: 'en', title: 'Security', description: 'End-to-end encryption, 2FA and device control.' },
                { language: 'zh', title: '安全', description: '端到端加密、双因素认证和设备控制。' },
                { language: 'fr', title: 'Sécurité', description: 'Chiffrement de bout en bout, 2FA et contrôle des appareils.' },
                { language: 'be', title: 'Бяспека', description: 'Скразное шыфраванне, 2FA і кантроль прылад.' },
                { language: 'hi', title: 'सुरक्षा', description: 'एंड-टू-एंड एन्क्रिप्शन, 2FA और डिवाइस नियंत्रण।' },
            ],
        },
        {
            id: 'ob-step-4',
            order: 4,
            illustrationUrl: '/img/onboarding/devices.svg',
            translations: [
                { language: 'ru', title: 'Мультиаккаунт и устройства', description: 'Привязывайте любое число устройств и переключайтесь между аккаунтами.' },
                { language: 'en', title: 'Multi-account and Devices', description: 'Link any number of devices and switch between accounts.' },
                { language: 'zh', title: '多账户和设备', description: '绑定任意数量的设备并在账户之间切换。' },
                { language: 'fr', title: 'Multi-comptes et appareils', description: 'Liez autant d\'appareils que souhaité et basculez entre les comptes.' },
                { language: 'be', title: 'Мультыаккаунт і прылады', description: 'Прывязвайце любую колькасць прылад і пераключайцеся паміж акаўтамі.' },
                { language: 'hi', title: 'बहु-खाता और डिवाइस', description: 'कितने भी डिवाइस जोड़ें और खातों के बीच स्विच करें।' },
            ],
        },
    ];
    const now = Math.floor(Date.now() / 1000);
    let translationsCount = 0;
    for (const step of steps) {
        const { translations, ...data } = step;
        await prisma.onboardingStep.upsert({
            where: { id: step.id },
            update: { order: data.order, illustrationUrl: data.illustrationUrl, isActive: true, updatedAt: now },
            create: { ...data, isActive: true, createdAt: now, updatedAt: now },
        });
        for (const tr of translations) {
            await prisma.onboardingStepTranslation.upsert({
                where: {
                    onboardingStepId_language: { onboardingStepId: step.id, language: tr.language },
                },
                update: { title: tr.title, description: tr.description },
                create: {
                    id: `obt-${step.id.slice(-1)}-${tr.language}`.slice(0, 25),
                    onboardingStepId: step.id,
                    language: tr.language,
                    title: tr.title,
                    description: tr.description,
                },
            });
            translationsCount++;
        }
    }
    console.log(`✅ OnboardingStep: ${steps.length} шага + ${translationsCount} переводов`);
}
// ============================================
// 6. TextPage + translations
// Источник: mockups/pre_filled_data.json → text_pages
// ============================================
async function seedTextPages() {
    const pages = [
        {
            slug: 'rules',
            translations: [
                { language: 'ru', title: 'Правила Balloo', content: '# Правила Balloo\n\n1. Уважайте других пользователей.\n2. Запрещён спам и массовые рассылки.\n3. Запрещён контент, нарушающий законодательство РФ.\n4. Не используйте боты для накруток.\n5. Соблюдайте приватность третьих лиц.' },
                { language: 'en', title: 'Balloo Rules', content: '# Balloo Rules\n\n1. Respect other users.\n2. Spam and mass mailings are prohibited.\n3. Content violating Russian law is prohibited.\n4. Do not use bots for fraud.\n5. Respect the privacy of third parties.' },
                { language: 'zh', title: 'Balloo 规则', content: '# Balloo 规则\n\n1. 尊重其他用户。\n2. 禁止垃圾信息和群发。\n3. 禁止违反俄罗斯法律的内容。\n4. 不得使用机器人作弊。\n5. 尊重第三方隐私。' },
                { language: 'fr', title: 'Règles de Balloo', content: '# Règles de Balloo\n\n1. Respectez les autres utilisateurs.\n2. Le spam et les envois massifs sont interdits.\n3. Le contenu contraire à la loi russe est interdit.\n4. N\'utilisez pas de bots pour fraude.\n5. Respectez la vie privée des tiers.' },
                { language: 'be', title: 'Правілы Balloo', content: '# Правілы Balloo\n\n1. Паважайце іншых карыстальнікаў.\n2. Забаронены спам і масавыя рассылкі.\n3. Забаронены кантэнт, што парушае заканадаўства РФ.\n4. Не выкарыстоўвайце боты для накрутак.\n5. Захоўвайце прыватнасць трэціх асоб.' },
                { language: 'hi', title: 'Balloo नियम', content: '# Balloo नियम\n\n1. अन्य उपयोगकर्ताओं का सम्मान करें।\n2. स्पैम और बल्क मेलिंग प्रतिबंधित है।\n3. रूसी कानून का उल्लंघन करने वाली सामग्री प्रतिबंधित है।\n4. धोखाधड़ी के लिए बॉट का उपयोग न करें।\n5. तीसरे पक्ष की गोपनीयता का सम्मान करें।' },
            ],
        },
        {
            slug: 'about-company',
            translations: [
                { language: 'ru', title: 'О компании', content: '# О компании\n\nРазработчик мессенджера Balloo. Российская технологическая команда.' },
                { language: 'en', title: 'About the Company', content: '# About the Company\n\nDeveloper of the Balloo messenger. A Russian tech team.' },
                { language: 'zh', title: '关于公司', content: '# 关于公司\n\nBalloo 即时通讯的开发者。一支俄罗斯技术团队。' },
                { language: 'fr', title: "À propos de l'entreprise", content: "# À propos de l'entreprise\n\nDéveloppeur de la messagerie Balloo. Une équipe technologique russe." },
                { language: 'be', title: 'Аб кампаніі', content: '# Аб кампаніі\n\nРаспрацоўшчык месенджара Balloo. Расійская тэхналагічная каманда.' },
                { language: 'hi', title: 'कंपनी के बारे में', content: '# कंपनी के बारे में\n\nBalloo मैसेंजर का डेवलपर। एक रूसी तकनीकी टीम।' },
            ],
        },
        {
            slug: 'about-balloo',
            translations: [
                { language: 'ru', title: 'О Balloo', content: '# О Balloo\n\nВерсия приложения, лицензии сторонних компонентов, ссылки и история изменений.' },
                { language: 'en', title: 'About Balloo', content: '# About Balloo\n\nApplication version, third-party licenses, links and changelog.' },
                { language: 'zh', title: '关于 Balloo', content: '# 关于 Balloo\n\n应用版本、第三方许可证、链接和更新日志。' },
                { language: 'fr', title: 'À propos de Balloo', content: "# À propos de Balloo\n\nVersion de l'application, licences tierces, liens et journal des modifications." },
                { language: 'be', title: 'Аб Balloo', content: '# Аб Balloo\n\nВерсія прыкладання, ліцэнзіі старонніх кампанентаў, спасылкі і гісторыя змен.' },
                { language: 'hi', title: 'Balloo के बारे में', content: '# Balloo के बारे में\n\nऐप संस्करण, तीसरे पक्ष के लाइसेंस, लिंक और बदलाव का लॉग।' },
            ],
        },
    ];
    const now = Math.floor(Date.now() / 1000);
    let translationsCount = 0;
    for (const page of pages) {
        const tp = await prisma.textPage.upsert({
            where: { slug: page.slug },
            update: { isPublished: true, updatedAt: now },
            create: {
                id: `tp-${page.slug}`.slice(0, 25),
                slug: page.slug,
                isPublished: true,
                createdAt: now,
                updatedAt: now,
            },
        });
        for (const tr of page.translations) {
            await prisma.textPageTranslation.upsert({
                where: {
                    textPageId_language: { textPageId: tp.id, language: tr.language },
                },
                update: { title: tr.title, content: tr.content },
                create: {
                    id: `tpt-${page.slug}-${tr.language}`.slice(0, 25),
                    textPageId: tp.id,
                    language: tr.language,
                    title: tr.title,
                    content: tr.content,
                },
            });
            translationsCount++;
        }
    }
    console.log(`✅ TextPage: ${pages.length} страницы + ${translationsCount} переводов`);
}
// ============================================
// 7. KnowledgeCategory
// Источник: mockups/pre_filled_data.json → knowledge_categories
// ============================================
async function seedKnowledgeCategories() {
    const categories = [
        { slug: 'getting-started', name: 'Начало работы', order: 1 },
        { slug: 'messaging', name: 'Сообщения', order: 2 },
        { slug: 'groups', name: 'Группы', order: 3 },
        { slug: 'security', name: 'Безопасность', order: 4 },
        { slug: 'bots-api', name: 'Боты и API', order: 5 },
        { slug: 'admin', name: 'Администрирование', order: 6 },
    ];
    for (const cat of categories) {
        await prisma.knowledgeCategory.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, order: cat.order },
            create: {
                id: `kc-${cat.slug}`.slice(0, 25),
                slug: cat.slug,
                name: cat.name,
                order: cat.order,
            },
        });
    }
    console.log(`✅ KnowledgeCategory: ${categories.length} категорий`);
}
// ============================================
// 8. ApplicationStage
// Источник: mockups/pre_filled_data.json → application_stages
// ============================================
async function seedApplicationStages() {
    const stages = [
        { slug: 'screening', name: 'Скрининг', order: 1, isTerminal: false },
        { slug: 'interview', name: 'Интервью', order: 2, isTerminal: false },
        { slug: 'offer', name: 'Оффер', order: 3, isTerminal: false },
        { slug: 'hired', name: 'Нанят', order: 4, isTerminal: true },
        { slug: 'rejected', name: 'Отклонён', order: 5, isTerminal: true },
    ];
    for (const stage of stages) {
        await prisma.applicationStage.upsert({
            where: { slug: stage.slug },
            update: { name: stage.name, order: stage.order, isTerminal: stage.isTerminal },
            create: {
                id: `as-${stage.slug}`.slice(0, 25),
                slug: stage.slug,
                name: stage.name,
                order: stage.order,
                isTerminal: stage.isTerminal,
            },
        });
    }
    console.log(`✅ ApplicationStage: ${stages.length} этапов`);
}
// ============================================
// 9. InterviewCriterion
// Источник: mockups/pre_filled_data.json → interview_criteria
// Идемпотентность по name (у модели нет уникального slug)
// ============================================
async function seedInterviewCriteria() {
    const criteria = [
        { name: 'Технические навыки', description: 'Оценка профессиональных навыков: знание языков программирования, фреймворков, архитектурных паттернов', order: 1 },
        { name: 'Коммуникация', description: 'Способность ясно излагать мысли, слушать, задавать вопросы, работать в команде', order: 2 },
        { name: 'Решение задач', description: 'Анализ проблемы, генерация гипотез, структурированный подход к решению', order: 3 },
        { name: 'Командный дух', description: 'Готовность помогать коллегам, обмен знаниями, конструктивная обратная связь', order: 4 },
        { name: 'Опыт', description: 'Релевантный опыт работы, соответствие требованиям вакансии', order: 5 },
        { name: 'Качество кода', description: 'Читаемость, тестируемость, масштабируемость, соблюдение стандартов', order: 6 },
    ];
    for (const c of criteria) {
        const existing = await prisma.interviewCriterion.findFirst({ where: { name: c.name } });
        if (existing) {
            await prisma.interviewCriterion.update({
                where: { id: existing.id },
                data: { description: c.description, order: c.order, isActive: true },
            });
        }
        else {
            await prisma.interviewCriterion.create({
                data: {
                    id: `ic-${c.order}`.slice(0, 25),
                    name: c.name,
                    description: c.description,
                    order: c.order,
                    isActive: true,
                },
            });
        }
    }
    console.log(`✅ InterviewCriterion: ${criteria.length} критериев`);
}
// ============================================
// 10. FeatureCategory
// Источник: mockups/pre_filled_data.json → feature_categories
// ============================================
async function seedFeatureCategories() {
    const categories = [
        { slug: 'messaging', name: 'Сообщения', icon: 'chat', order: 1 },
        { slug: 'calls', name: 'Звонки', icon: 'phone', order: 2 },
        { slug: 'groups', name: 'Группы', icon: 'users', order: 3 },
        { slug: 'privacy', name: 'Приватность', icon: 'shield', order: 4 },
        { slug: 'ui', name: 'Интерфейс', icon: 'layout', order: 5 },
        { slug: 'bots', name: 'Боты', icon: 'bot', order: 6 },
        { slug: 'other', name: 'Другое', icon: 'more', order: 7 },
    ];
    for (const cat of categories) {
        await prisma.featureCategory.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, icon: cat.icon, order: cat.order },
            create: {
                id: `fc-${cat.slug}`.slice(0, 25),
                slug: cat.slug,
                name: cat.name,
                icon: cat.icon,
                order: cat.order,
            },
        });
    }
    console.log(`✅ FeatureCategory: ${categories.length} категорий`);
}
// ============================================
// Main seed function
// ============================================
async function main() {
    console.log('🌱 Balloo Messenger — Starting seed...');
    console.log('   Базовые языки: ru, en, zh, fr, be, hi');
    console.log();
    await seedDonateTiers();
    await seedBlogCategories();
    await seedKnowledgePages();
    await seedServiceVersions();
    await seedOnboardingSteps();
    await seedTextPages();
    await seedKnowledgeCategories();
    await seedApplicationStages();
    await seedInterviewCriteria();
    await seedFeatureCategories();
    console.log();
    console.log('🎉 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
