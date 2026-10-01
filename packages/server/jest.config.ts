import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@balloo/shared$': '<rootDir>/../shared/src/index.ts',
  },
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        module: 'commonjs',
        target: 'ES2022',
        isolatedModules: true,
      },
      transpileOnly: true,
    }],
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  forceExit: true,
  // Пороги покрытия. В-93 (ответ владельца 30.09): цель — server 80% / web 70%,
  // начать с критического контура (auth + payments + middleware) до 100%.
  // Пороги по путям включены и проверяются скриптами test:coverage*: падение
  // означает, что контур перестали тестировать. Общий порог 80% (пункт «а»)
  // включается только когда фактическое покрытие до него дорастиёт — сейчас
  // сервер покрыт на 58.6% statements, и глобальный порог сломал бы каждый прогон.
  collectCoverageFrom: [
    'src/middleware/**/*.ts',
    'src/routes/auth.ts',
    'src/routes/payments.ts',
    'src/controllers/authController.ts',
    'src/controllers/paymentsController.ts',
    'src/services/paymentService.ts',
    'src/services/authService.ts',
  ],
  coverageThreshold: {
    // Глобальный порог — страховка от регресса, а не цель В-93. Цель (server 80%)
    // поднимается сюда только после того, как фактическое покрытие её достигнет.
    global: {
      // Поднят 01.10.2026 после depth-тестов auth/payments (тикет 1790479920-02):
      // фактический уровень всего src = 94.33/80.97/94.11/94.06 (было 61.56/43/55/59.9).
      // Порог оставлен с запасом ниже факта, чтобы не ловить шум прогонов.
      statements: 80,
      branches: 60,
      functions: 80,
      lines: 80,
    },
    // Критический контур: целевые проценты В-93 (а) достигнуты и зафиксированы.
    // Замер 01.10.2026: authController 86.19/77.41/88/85.32; authService
    // 96.31/82.35/92.3/96.24; paymentService 95.23/65.55/100/95.09;
    // paymentController 88.88/75/100/87.5. Пороги ниже факта на ~1-2 п.п.
    './src/controllers/authController.ts': {
      statements: 85,
      branches: 75,
      functions: 85,
      lines: 84,
    },
    './src/services/authService.ts': {
      statements: 95,
      branches: 80,
      functions: 90,
      lines: 95,
    },
    './src/services/paymentService.ts': {
      statements: 94,
      branches: 60,
      functions: 95,
      lines: 94,
    },
    './src/controllers/paymentController.ts': {
      statements: 87,
      branches: 70,
      functions: 95,
      lines: 86,
    },
    './src/middleware/': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    './src/routes/auth.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    './src/routes/payments.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};

export default config;
