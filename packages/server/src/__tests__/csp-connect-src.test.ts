/**
 * Тикет №0 мультитикета поддоменов (Вариант C): CORS_ORIGIN становится
 * списком origin'ов через запятую (balloo.su + 7 поддоменов). Helmet принимает
 * connectSrc массивом токенов CSP, поэтому список ОБЯЗАН быть разобран —
 * иначе вся строка «https://a,https://b,...» станет одним битым токеном и
 * браузер заблокирует все fetch/WS с фронтенда. Тест — страховка именно от
 * этой регрессии (плюс ws/wss-варианты для WebSocket на том же origin).
 */
import { cspConnectSrc } from '../middleware/security';

const PROD_LIST = [
  'https://balloo.su',
  'https://admin.balloo.su',
  'https://command.balloo.su',
  'https://features.balloo.su',
  'https://blog.balloo.su',
  'https://history.balloo.su',
  'https://download.balloo.su',
  'https://docs.balloo.su',
].join(',');

describe('cspConnectSrc (тик. №0, CORS_ORIGIN-список)', () => {
  it('разбирает список из 8 origin\'ов в отдельные токены', () => {
    const src = cspConnectSrc(PROD_LIST);
    for (const origin of PROD_LIST.split(',')) {
      expect(src).toContain(origin);
    }
  });

  it('ни один токен не содержит запятую (главная регрессия)', () => {
    for (const token of cspConnectSrc(PROD_LIST)) {
      expect(token).not.toContain(',');
    }
  });

  it('добавляет ws-варианты для WebSocket на тех же origin\'ах', () => {
    const src = cspConnectSrc(PROD_LIST);
    expect(src).toContain('wss://balloo.su');
    expect(src).toContain('wss://admin.balloo.su');
    // http→ws работает и для локальной разработки
    const dev = cspConnectSrc('http://localhost:5173');
    expect(dev).toContain('http://localhost:5173');
    expect(dev).toContain('ws://localhost:5173');
  });

  it('всегда содержит \'self\' и не дублирует токены', () => {
    const src = cspConnectSrc('https://balloo.su, https://balloo.su ,https://blog.balloo.su');
    expect(src).toContain("'self'");
    expect(src.filter((t) => t === 'https://balloo.su')).toHaveLength(1);
    expect(src).toContain('https://blog.balloo.su');
  });

  it('CORS_ORIGIN="*" (тестовое окружение) не ломает CSP', () => {
    const src = cspConnectSrc('*');
    expect(src).toContain("'self'");
    expect(src).toContain('https://balloo.su');
    expect(src.every((t) => !t.includes(','))).toBe(true);
  });

  it('по умолчанию берёт значение из env (сигнатура обратно совместима)', () => {
    const env = require('../config/env').env as { CORS_ORIGIN: string };
    const src = cspConnectSrc();
    const expected = env.CORS_ORIGIN === '*' ? 'https://balloo.su' : env.CORS_ORIGIN;
    expect(src).toContain(expected.split(',')[0].trim());
  });
});
