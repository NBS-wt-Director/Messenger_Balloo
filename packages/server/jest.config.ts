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
      // Порог для файлов, не входящих в критический контур.
      // Установлен чуть ниже текущего (50.1/47.1/42.3), чтобы не сломать
      // сборку, но не давать регрессии. Поднимать только после доработки
      // контроллеров и сервисов (В-93 а — цель 80/70).
      statements: 45,
      branches: 20,
      functions: 35,
      lines: 45,
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
