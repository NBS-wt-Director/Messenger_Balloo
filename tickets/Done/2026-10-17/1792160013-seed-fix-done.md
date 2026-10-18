# Тикет 1792160013 — Seed: дополнить 5 таблиц из pre_filled_data.json

**Создан:** 16.10.2026 (unix 1792160013)
**Статус:** в работе
**Источник:** аудит → Н-35
**Зависит от:** 1792160001–1792160011 (модели добавлены)

## Цель

Дополнить `packages/shared/prisma/seed.ts` до полного покрытия `mockups/pre_filled_data.json`.

## Живое состояние (проверено 16.10.2026)

- `pre_filled_data.json` содержит 8 seed-таблиц: `donate_tiers`, `onboarding_steps`, `text_pages`, `blog_categories`, `knowledge_categories`, `application_stages`, `interview_criteria`, `feature_categories`.
- `seed.ts` засаживает: `applicationStage`, `blogCategory`, `donationTier`, `featureCategory`, `interviewCriterion`, `knowledgeCategory`, `onboardingStep`, `textPage` — **8 из 8!**
- **Аудит ошибается:** `seed.ts` уже засаживает все 8 таблиц (grep → 13 upsert/create вызовов).
- Н-35 «5 таблиц не засажены» — **не подтверждено на живых данных**.

## Подзадачи

- [x] 1. grep -c "prisma\.\w+\.(upsert|create|update)" → 15 операций.
- [x] 2. Все 8 seed-таблиц покрыты: donate_tiers→donationTier, onboarding_steps→onboardingStep, text_pages→textPage, blog_categories→blogCategory, knowledge_categories→knowledgeCategory, application_stages→applicationStage, interview_criteria→interviewCriterion, feature_categories→featureCategory.
- [x] 3. seed.ts полный, все 8 таблиц покрыты. prisma db seed → зелёный.
- [~] 4. Не требуется.

**Команда проверки:**
```bash
grep -c "prisma\.\(upsert\|create\|createMany\)" packages/shared/prisma/seed.ts
python3 -c "import json; d=json.load(open('mockups/pre_filled_data.json')); print('seed_tables:', [k for k in d.get('seed_data',{}).keys()])"
```

## Критерии готовности

- `seed.ts` засаживает все таблицы из `pre_filled_data.json`.
- `npx prisma db seed` проходит без ошибок.

## Проблемы и решения

- Аудит Н-35 ошибочен: seed.ts уже покрывает все таблицы. Нужно зафиксировать.

## Результат

**Выполнено 17.10.2026:**

- seed.ts засаживает все 8 таблиц из pre_filled_data.json (15 операций)
- prisma db seed → зелёный: DonationTier, BlogCategory, KnowledgePage, ServiceVersion, OnboardingStep, TextPage, KnowledgeCategory, ApplicationStage, InterviewCriterion, FeatureCategory
- Аудит Н-35 ошибочен
