// Тесты разбора deep-link привязки устройства (тик. 1795101592).
// Сканер QR получает строку и обязан достать из неё 48-hex токен для
// POST /api/devices/pair/confirm. Проверяем без камеры.

import { describe, it, expect } from 'vitest';
import { parsePairDeepLink } from '@/utils/pairLink';

const TOKEN = 'a'.repeat(48);
const TOKEN2 = '0123456789abcdef0123456789abcdef0123456789abcdef';

describe('parsePairDeepLink', () => {
  it('извлекает токен из полного deep-link balloo://pair/<token>', () => {
    expect(parsePairDeepLink(`balloo://pair/${TOKEN}`)).toBe(TOKEN);
    expect(parsePairDeepLink(`balloo://pair/${TOKEN2}`)).toBe(TOKEN2);
  });

  it('принимает «голый» токен без схемы', () => {
    expect(parsePairDeepLink(TOKEN)).toBe(TOKEN);
  });

  it('игнорирует регистр схемы и хвостовой слэш', () => {
    expect(parsePairDeepLink(`BALLOO://PAIR/${TOKEN}`)).toBe(TOKEN);
    expect(parsePairDeepLink(`balloo://pair/${TOKEN}/`)).toBe(TOKEN);
  });

  it('обрезает пробелы вокруг строки', () => {
    expect(parsePairDeepLink(`  balloo://pair/${TOKEN}  `)).toBe(TOKEN);
  });

  it('возвращает null для постороннего QR (ссылка сайта)', () => {
    expect(parsePairDeepLink('https://balloo.su/#/login')).toBeNull();
    expect(parsePairDeepLink('balloo://chat/123')).toBeNull();
  });

  it('возвращает null для токена неверной длины/алфавита', () => {
    expect(parsePairDeepLink('balloo://pair/short')).toBeNull();
    expect(parsePairDeepLink('z'.repeat(48))).toBeNull(); // не hex
    expect(parsePairDeepLink('a'.repeat(47))).toBeNull();
    expect(parsePairDeepLink('a'.repeat(49))).toBeNull();
  });

  it('возвращает null для пустой строки / null / undefined', () => {
    expect(parsePairDeepLink('')).toBeNull();
    expect(parsePairDeepLink('   ')).toBeNull();
    expect(parsePairDeepLink(null)).toBeNull();
    expect(parsePairDeepLink(undefined)).toBeNull();
  });
});
