# 1791912132-1 — Info DB Seed: добавить отсутствующие модели в Prisma

**Родитель:** `1791912132`
**Статус:** готов

## Результат

### Добавленные модели (schema.prisma)
1. OnboardingStep + OnboardingStepTranslation
2. TextPage + TextPageTranslation
3. KnowledgeCategory
4. ApplicationStage
5. InterviewCriterion
6. FeatureCategory

### Доказательство
`npx prisma validate` → "The schema at prisma/schema.prisma is valid 🚀" (exit 0, 13.10.2026)
