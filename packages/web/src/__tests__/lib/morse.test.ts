// Морзе-утилита и часовой пояс для тикера подвала (тикет 1795677854).

import { describe, it, expect } from 'vitest';
import { toMorse, MORSE_TIMING, detectTimeZone, formatTimeZoneCity, tzOffsetHours } from '@balloo/ui';

describe('toMorse — кодирование', () => {
  it('SOS → ... --- ... (буквы через пробел)', () => {
    expect(toMorse('SOS')).toBe('... --- ...');
  });

  it('кириллица: «переверни общение» → непустой валидный паттерн', () => {
    const morse = toMorse('переверни общение');
    expect(morse).not.toBe('');
    // Только допустимые символы: . - пробел и слэш с пробелами
    expect(morse).toMatch(/^[.\- /]+$/);
    // Два слова → один разделитель « / »
    expect(morse.split(' / ').length).toBe(2);
  });

  it('неизвестный символ пропускается', () => {
    expect(toMorse('S😀O')).toBe('... ---');
  });

  it('регистр не важен', () => {
    expect(toMorse('sos')).toBe(toMorse('SOS'));
  });

  it('пустая строка → пустой результат', () => {
    expect(toMorse('')).toBe('');
    expect(toMorse('   ')).toBe('');
    expect(toMorse('😀😀')).toBe('');
  });
});

describe('MORSE_TIMING — классические длительности', () => {
  it('dot=1, dash=3, symbolGap=1, letterGap=3, wordGap=7', () => {
    expect(MORSE_TIMING).toEqual({ dot: 1, dash: 3, symbolGap: 1, letterGap: 3, wordGap: 7 });
  });
});

describe('часовой пояс → город', () => {
  it('detectTimeZone возвращает непустую строку', () => {
    expect(detectTimeZone()).not.toBe('');
  });

  it('tzOffsetHours для Europe/Moscow = 3', () => {
    expect(tzOffsetHours('Europe/Moscow')).toBe(3);
  });

  it('tzOffsetHours для Asia/Yekaterinburg = 5', () => {
    expect(tzOffsetHours('Asia/Yekaterinburg')).toBe(5);
  });

  it('формат «UTC+N Город»', () => {
    expect(formatTimeZoneCity('Europe/Moscow')).toBe('UTC+3 Москва');
    expect(formatTimeZoneCity('Asia/Yekaterinburg')).toBe('UTC+5 Екатеринбург');
    expect(formatTimeZoneCity('America/New_York')).toMatch(/^UTC-[45] Нью-Йорк$/);
  });

  it('неизвестный tz — fallback на сам tz', () => {
    expect(formatTimeZoneCity('Mars/Olympus')).toMatch(/^UTC[+-]\d+ Mars\/Olympus$/);
  });
});
