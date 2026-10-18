# Тикет 1792160014 — Web: экран «Онбординг» (1_01_01)

**Создан:** 16.10.2026 (unix 1792160014)
**Статус:** в работе
**Источник:** аудит → Н-15

## Цель

Создать React-компонент `OnboardingScreen` по макету `mockups/balloo-su/onboarding.html` и ТЗ `mockups/balloo-su/onboarding.md`.

## Живое состояние

- `packages/web/src/screens/onboarding/` — **ОТСУТСТВУЕТ** (grep → 0 совпадений).
- Роутер: `packages/web/src/router/index.tsx` — маршрут онбординга отсутствует (после `LoginScreen`/`RegisterScreen`/`TwoFactorScreen` идёт `MainLayout`).
- Макет: `mockups/balloo-su/onboarding.html` — 1 экран.

## Подзадачи

- [x] 1. Прочитал. 3 шага: иллюстрация, заголовок, текст, точки прогресса, кнопки навигации.
- [x] 2. Создан OnboardingScreen.tsx: загрузка шагов из API, навигация, точки прогресса, кнопки.
- [x] 3. Добавлен маршрут /onboarding в router/index.tsx.
- [x] 4. npm run build → exit 0 (5.94s).

**Команда проверки:**
```bash
cd packages/web && npm run build && echo "✅ build OK"
```

## Критерии готовности

- Компонент создан, импортируется в роутер.
- `vite build` без ошибок.
- Экран открывается по маршруту.

## Проблемы и решения

_Заполняется по ходу._

## Результат

**Выполнено 17.10.2026:**

- Создан OnboardingScreen.tsx: загрузка шагов из API, fallback на дефолтные, навигация, точки прогресса
- Добавлен маршрут /onboarding в router/index.tsx
- Добавлены методы API: getOnboardingSteps, completeOnboarding
- npm run build → exit 0
