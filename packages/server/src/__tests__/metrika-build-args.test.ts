/**
 * Тикет 1793270207: страховка от повторного сбоя Метрики.
 * Проверяет, что ID счётчика Метрики пробрасывается из .env.production
 * через build args в Dockerfile.web — иначе бандль выходит без tag.js
 * и initYandexMetrika() молча возвращается до вставки <script>.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '../../../..');

describe('Yandex Metrika build args (тик. 1793270207)', () => {
  it('Dockerfile.web содержит ARG VITE_YM_METRIKA_ID', () => {
    const content = readFileSync(join(ROOT, 'docker/Dockerfile.web'), 'utf-8');
    const argLine = content
      .split('\n')
      .find((l) => l.trim().startsWith('ARG VITE_YM_METRIKA_ID'));
    expect(argLine).toBeDefined();
    expect(argLine!.trim()).toBe('ARG VITE_YM_METRIKA_ID=');
  });

  it('Dockerfile.web содержит ENV VITE_YM_METRIKA_ID', () => {
    const content = readFileSync(join(ROOT, 'docker/Dockerfile.web'), 'utf-8');
    const envLine = content
      .split('\n')
      .find((l) => l.trim().startsWith('ENV VITE_YM_METRIKA_ID='));
    expect(envLine).toBeDefined();
    expect(envLine!.trim()).toBe('ENV VITE_YM_METRIKA_ID=${VITE_YM_METRIKA_ID}');
  });

  it('docker-compose.local.yml пробрасывает VITE_YM_METRIKA_ID в build args web', () => {
    const content = readFileSync(
      join(ROOT, 'docker/prod/docker-compose.local.yml'),
      'utf-8'
    );
    // Проверка: в секции build args сервиса web должна быть строка
    // VITE_YM_METRIKA_ID: ${VITE_YM_METRIKA_ID:-}
    const match = content.match(
      /VITE_YM_METRIKA_ID:\s*\$\{VITE_YM_METRIKA_ID:-\}/
    );
    expect(match).not.toBeNull();
  });

  it('docker-compose.local.yml НЕ пробрасывает VITE_YM_METRIKA_ID в web-admin', () =>
    {
    const content = readFileSync(
      join(ROOT, 'docker/prod/docker-compose.local.yml'),
      'utf-8'
    );
    // web-admin не должен иметь VITE_YM_METRIKA_ID — Метрика только в web.
    // Находим секцию web-admin и проверяем отсутствие переменной.
    const webAdminIdx = content.indexOf('web-admin:');
    expect(webAdminIdx).toBeGreaterThan(-1);
    // Следующая секция после web-admin начинается с '  features:' или
    // '  prometheus:' и т.д. — берём кусок от web-admin до следующей секции.
    const afterWebAdmin = content.slice(webAdminIdx);
    const nextServiceIdx = afterWebAdmin.match(
      /^\s{2}(\w[\w-]*):/m
    )?.index;
    const webAdminBlock = nextServiceIdx
      ? afterWebAdmin.slice(0, nextServiceIdx)
      : afterWebAdmin;
    expect(webAdminBlock).not.toMatch(/VITE_YM_METRIKA_ID/);
  });
});
