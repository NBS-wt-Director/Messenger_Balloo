#!/usr/bin/env node
/**
 * Проверка целостности ключей перевода.
 *
 * Сравнивает три множества:
 *   1. ключи словаря `translations` (packages/shared/src/i18n/translations.ts)
 *   2. члены типа `TranslationKey`
 *   3. ключи, реально использованные в коде:
 *        а) литералы `t('…')` / `translate('…')`;
 *        б) литералы, переданные в `t()` через локальную константу
 *           (`const labelKey = 'a.b'` → `t(labelKey)`);
 *        в) ключи, заданные свойствами объектов/JSX
 *           (`key: 'a.b'`, `labelKey: 'a.b'`, `titleKey: 'a.b'`) — так
 *           подписи пунктов приходят в RightMenu/TopbarMenu/Footer. Без этого
 *           класса проверка слепа: RightMenu показывал в меню сырые
 *           `menu.profile`/`menu.settings`/`menu.accounts` при зелёном CI.
 *
 * Выводит: в словаре, но не в типе; в типе, но не в словаре;
 * использованы, но не определены. Код выхода 1, если есть расхождения
 * 2-го и 3-го типа (они ломают типы или показывают сырой ключ в UI).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TRANSLATIONS = path.join(ROOT, 'packages/shared/src/i18n/translations.ts');

/** Обход дерева без node_modules/dist. */
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const src = fs.readFileSync(TRANSLATIONS, 'utf8');

// 1. Ключи словаря: строки вида  'a.b': {  с любым отступом.
const dictKeys = new Set([...src.matchAll(/^\s+'([a-z0-9.]+)':\s*\{/gim)].map((m) => m[1]));

// 2. Члены union-а: строки вида  | 'a.b'  (без двоеточия и фигурной скобки).
const unionKeys = new Set([...src.matchAll(/^\s+\|\s*'([a-z0-9.]+)'/gim)].map((m) => m[1]));

// 3. Использованные ключи.
const used = new Map(); // key -> [файлы]
const addUsed = (key, file, rel) => {
  if (!used.has(key)) used.set(key, []);
  const where = used.get(key);
  const mark = `${rel}#${key}`;
  if (!where.includes(mark)) where.push(mark);
};

for (const file of walk(path.join(ROOT, 'packages'))) {
  if (file === TRANSLATIONS) continue;
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');

  // а) литерал в вызове: t('a.b') / translate('a.b')
  for (const m of text.matchAll(/\b(?:t|translate)\(\s*'([a-z0-9.]+)'/gim)) {
    addUsed(m[1], file, rel);
  }

  // б) литерал, присвоенный константе с «ключевым» именем, и переданный в t()
  //    const labelKey = 'a.b' … t(labelKey)
  const constKeys = new Map();
  for (const m of text.matchAll(/\b(?:const|let)\s+(\w*(?:[Kk]ey|KEY)\w*)\s*(?::[^=]+)?=\s*'([a-z0-9.]+)'/gim)) {
    constKeys.set(m[1], m[2]);
  }
  for (const m of text.matchAll(/\b(?:t|translate)\(\s*(\w+)\s*[,)]/gim)) {
    if (constKeys.has(m[1])) addUsed(constKeys.get(m[1]), file, rel);
  }

  // в) ключ как свойство объекта/атрибут: key: 'a.b', labelKey="a.b", titleKey: 'a.b'
  //    Точка в значении обязательна — иначе попадают обычные id (`key: 'general'`).
  for (const m of text.matchAll(/\b(?:key|labelKey|titleKey|textKey)\s*[:=]\s*['"]([a-z0-9.]*\.[a-z0-9.]*)['"]/gim)) {
    addUsed(m[1], file, rel);
  }
}

const inDictNotUnion = [...dictKeys].filter((k) => !unionKeys.has(k)).sort();
const inUnionNotDict = [...unionKeys].filter((k) => !dictKeys.has(k)).sort();
const usedNotDefined = [...used.keys()].filter((k) => !dictKeys.has(k)).sort();

console.log(`словарь: ${dictKeys.size}, TranslationKey: ${unionKeys.size}, использовано: ${used.size}`);

const report = (title, items, withFiles) => {
  console.log(`\n${title}: ${items.length}`);
  for (const k of items) {
    const files = withFiles && used.get(k) ? `  (${[...new Set(used.get(k))].join(', ')})` : '';
    console.log(`  - ${k}${files}`);
  }
};

report('в словаре, но нет в TranslationKey', inDictNotUnion);
report('в TranslationKey, но нет в словаре', inUnionNotDict);
report('использованы в коде, но не определены', usedNotDefined, true);

const broken = inUnionNotDict.length + usedNotDefined.length;
process.exit(broken ? 1 : 0);
