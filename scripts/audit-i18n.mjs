#!/usr/bin/env node
/**
 * Аудит i18n: полнота словарей и строки, зашитые в код без t().
 * Вывод: ключи без перевода по локэлам + TOP файлов с хардкодом.
 * Использование: node scripts/audit-i18n.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] || process.cwd();
const trPath = join(root, 'packages/shared/src/i18n/translations.ts');
const src = readFileSync(trPath, 'utf8');

// 1) TranslationKey union
const unionMatch = src.match(/export type TranslationKey =([\s\S]*?);/);
const unionKeys = new Set([...(unionMatch?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]));

// 2) Объект translations: блоки "key": { locale: '...' }
const objStart = src.indexOf('export const translations: Translations = {');
const body = src.slice(objStart);
const LOCALES = ['ru','en','tt','ba','ce','cv','av','dar','udm','lez','kbd','chm','os','sah','bua','ukr','zh','hi','be','fr'];
const keyRe = /\n\s{2}'([a-zA-Z0-9_.]+)':\s*\{/g;
const marks = [];
let m;
while ((m = keyRe.exec(body))) marks.push({ key: m[1], start: m.index });
const dict = new Map();
for (let i = 0; i < marks.length; i++) {
  const block = body.slice(marks[i].start, marks[i + 1]?.start ?? marks[i].start + 4000);
  const locales = new Set();
  for (const loc of LOCALES) if (new RegExp(`\\b${loc}:\\s*['"\`]`).test(block)) locales.add(loc);
  dict.set(marks[i].key, locales);
}

// 3) Использование t('...') в web
const used = new Map(); // key -> [files]
function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p) && !p.includes('e2e')) {
      const code = readFileSync(p, 'utf8');
      const rel = relative(root, p);
      for (const mm of code.matchAll(/\bt\(\s*'([^']+)'/g)) {
        if (!used.has(mm[1])) used.set(mm[1], []);
        const files = used.get(mm[1]);
        if (!files.includes(rel)) files.push(rel);
      }
      // хардкод: JSX-текст и строки с кириллицей вне t()/комментариев
      const withoutComments = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const hard = [];
      for (const hm of withoutComments.matchAll(/(?:>[^<>{}\n]*|[('"])([А-Яа-яЁё][^'"<>]{2,})/g)) {
        const s = hm[1].trim();
        if (s && !/^\s*$/.test(s)) hard.push(s.slice(0, 40));
      }
      if (hard.length) hardcodes.push([rel, hard.length, hard.slice(0, 3)]);
    }
  }
}
const hardcodes = [];
walk(join(root, 'packages/web/src'));

// --- отчёт ---
console.log(`TranslationKey union: ${unionKeys.size} | объект translations: ${dict.size}`);
const usedKeys = [...used.keys()].sort();
console.log(`\nИспользуется t() в web: ${usedKeys.length} уникальных ключей`);
const notInDict = usedKeys.filter((k) => !dict.has(k));
const notInUnion = usedKeys.filter((k) => !unionKeys.has(k));
console.log(`  нет в объекте translations: ${notInDict.length}`, notInDict.slice(0, 20));
console.log(`  нет в union TranslationKey: ${notInUnion.length}`, notInUnion.slice(0, 20));

for (const loc of ['ru', 'en', ...LOCALES.filter((l) => l !== 'ru' && l !== 'en')]) {
  const missing = usedKeys.filter((k) => dict.has(k) && !dict.get(k).has(loc));
  const line = `${loc}: пропущено ${missing.length}`;
  if (loc === 'ru' || loc === 'en' || missing.length) console.log(`  ${line}`, missing.slice(0, 10));
}

console.log(`\nХардкод-строки (кириллица вне t()), файлов: ${hardcodes.length}`);
hardcodes.sort((a, b) => b[1] - a[1]);
for (const [f, n, ex] of hardcodes.slice(0, 25)) console.log(`  ${String(n).padStart(3)} ${f}\n       ${ex.map((e) => JSON.stringify(e)).join(' | ')}`);
