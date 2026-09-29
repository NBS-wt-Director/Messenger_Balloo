#!/usr/bin/env node
'use strict';

/**
 * Авторитетный список HTTP-маршрутов сервера.
 *
 * Разворачивает цепочку монтирования routes/index.ts -> routes/<файл>.ts и
 * печатает "METHOD /полный/путь". Нужен как эталон для сверки с клиентом:
 * аудит code-audit.cjs строил список своим парсером и часть маршрутов терял,
 * из-за чего выдавал «маршрута нет» там, где маршрут есть.
 *
 *   node scripts/list-server-routes.cjs            # список + счётчик в stderr
 *   node scripts/list-server-routes.cjs | grep polls
 *
 * Параметры нормализуются к ":x", поэтому сравнение путей не зависит от их имён
 * (:id против :chatId).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'packages/server/src/routes');
const VERBS = { get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' };

/** :id, :userId, {chatId} -> :x; хвостовой слэш убираем */
function norm(p) {
  return (
    p
      .replace(/\{[^}]*\}/g, ':x')
      .replace(/:[A-Za-z_][\w]*/g, ':x')
      .replace(/\/+$/, '') || '/'
  );
}

/** import { router as xRouter } from './x' | import xRouter from './x' */
function readImports(src) {
  const map = new Map();
  const re = /import\s+(?:\{\s*router\s+as\s+)?(\w+)\s*\}?\s*from\s*['"]\.\/([\w.-]+)['"]/g;
  for (const m of src.matchAll(re)) map.set(m[1], m[2]);
  return map;
}

const indexSrc = fs.readFileSync(path.join(ROUTES_DIR, 'index.ts'), 'utf8');
const imports = readImports(indexSrc);

const out = new Set();

/** Обход файла роутов: собственные verbs + вложенные router.use('<подпуть>', другойRouter) */
function collect(file, base, depth) {
  if (depth > 3) return;
  const full = path.join(ROUTES_DIR, `${file}.ts`);
  if (!fs.existsSync(full)) return;
  const src = fs.readFileSync(full, 'utf8');

  for (const m of src.matchAll(/\w*[Rr]outer\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]*)['"`]/g)) {
    out.add(`${VERBS[m[1]]} ${norm(base + m[2])}`);
  }

  const local = readImports(src);
  for (const m of src.matchAll(/\w*[Rr]outer\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)) {
    if (local.has(m[2])) collect(local.get(m[2]), norm(base + m[1]), depth + 1);
  }
}

for (const m of indexSrc.matchAll(/router\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)) {
  if (imports.has(m[2])) collect(imports.get(m[2]), norm(m[1]), 0);
}

const list = [...out].sort();
process.stdout.write(list.join('\n') + '\n');
console.error(`# всего маршрутов: ${list.length}`);
