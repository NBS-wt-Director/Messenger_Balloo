// Регресс-тест Service Worker (тик. 1795152410).
//
// Причина появления: 20.11.2026 в `public/sw.js` нашлась синтаксическая ошибка
// (лишние строки `'/offline.html',` внутри объектного литерала options в
// обработчике `push`) — файл вообще не парсился браузером, SW не устанавливался.
// Тест ловит повтор такой ошибки и проверяет версионирование имени кэша.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const swPath = path.resolve(__dirname, '../../public/sw.js');
const src = readFileSync(swPath, 'utf8');

describe('public/sw.js', () => {
  it('парсится без синтаксических ошибок', () => {
    // new Function компилирует скрипт и бросает SyntaxError на невалидном коде
    expect(() => new Function(src)).not.toThrow();
  });

  it('CACHE_NAME версионируется плейсхолдером __BUILD_ID__ (подставляет сборка)', () => {
    expect(src).toContain("const CACHE_NAME = 'balloo-__BUILD_ID__'");
    expect(src).toContain("const DATA_CACHE_NAME = 'balloo-api-__BUILD_ID__'");
  });

  it('не содержит старую неизменяемую версию кэша balloo-v1', () => {
    expect(src).not.toContain("'balloo-v1'");
  });
});
