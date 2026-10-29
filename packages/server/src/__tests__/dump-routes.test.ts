// Вспомогательный тест: дамим реальную таблицу маршрутов Express.
// Нужен для аудита клиентских вызовов против фактически зарегистрированных
// маршрутов (tiket 1792335000). Запуск: npx jest dump-routes
import { app } from './helpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodePath = require('path');

// Mount-префикс берём НЕ из layer.regexp (он неоднозначен на вложенных
// mount), а по идентичности объекта роутера: читаем routes/index.ts,
// восстанавливаем связь переменная -> (файл, имя экспорта), затем require-им
// каждый файл и сопоставляем объект роутера с его префиксом.
//
// Импорты трёх видов (третий раньше терялся — из-за чего все маршруты
// channels.ts выпадали из дампа, тикет 1793187702):
//   import { router as x } from './f'   — один переименованный экспорт
//   import x from './f'                 — default-экспорт
//   import { a, b, c } from './f'       — несколько именованных роутеров
const ROUTES_DIR = nodePath.join(__dirname, '..', 'routes');
const indexSrc: string = fs.readFileSync(nodePath.join(ROUTES_DIR, 'index.ts'), 'utf8');

type Target = { file: string; exported: string };
const localVarToTarget = new Map<string, Target>();

// Именованные группы: `import { ... } from './f'`
const reNamed = /import\s*\{([^}]+)\}\s*from\s*['"]\.\/([\w.-]+)['"]/g;
for (const m of indexSrc.matchAll(reNamed)) {
  for (const raw of m[1].split(',')) {
    const spec = raw.trim();
    const asMatch = /^(\w+)\s+as\s+(\w+)$/.exec(spec);
    const single = /^(\w+)$/.exec(spec);
    if (asMatch) {
      localVarToTarget.set(asMatch[2], { file: m[2], exported: asMatch[1] });
    } else if (single) {
      localVarToTarget.set(single[1], { file: m[2], exported: single[1] });
    }
  }
}
// Default-экспорт: `import X from './f'`
const reDefault = /import\s+(\w+)\s+from\s*['"]\.\/([\w.-]+)['"]/g;
for (const m of indexSrc.matchAll(reDefault)) {
  if (!localVarToTarget.has(m[1])) {
    localVarToTarget.set(m[1], { file: m[2], exported: 'default' });
  }
}

// Один роутер может быть примонтирован несколько раз (knowledge -> /api/knowledge
// и /api/hiring), поэтому префиксов может быть несколько.
const prefixesByTarget = new Map<string, string[]>();
const targetByKey = new Map<string, Target>();
const reUse = /router\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g;
for (const m of indexSrc.matchAll(reUse)) {
  const target = localVarToTarget.get(m[2]);
  if (!target) continue;
  const key = `${target.file}#${target.exported}`;
  const list = prefixesByTarget.get(key) || [];
  list.push(m[1]);
  prefixesByTarget.set(key, list);
  targetByKey.set(key, target);
}

const prefixesByRouter = new Map<any, string[]>();
for (const [key, prefixes] of prefixesByTarget) {
  const target = targetByKey.get(key)!;
  try {
    const mod = require(nodePath.join(ROUTES_DIR, target.file));
    // default под ts-jest лежит в mod.default, именованный — по имени экспорта.
    const r =
      target.exported === 'default' ? mod.default || mod.router : mod[target.exported];
    if (r) prefixesByRouter.set(r, prefixes);
  } catch {
    /* роут не загрузился — пропускаем */
  }
}

describe('dump server routes', () => {
  it('prints all registered routes', () => {
    const routes: string[] = [];

    const walk = (stack: any[], prefix: string) => {
      for (const layer of stack) {
        if (layer.route) {
          const p = layer.route.path as string;
          const full = (prefix + p).replace(/\/+$/, '') || '/';
          for (const m of Object.keys(layer.route.methods)) {
            routes.push(`${m.toUpperCase()} ${full}`);
          }
        } else if (layer.handle?.stack) {
          const own = prefixesByRouter.get(layer.handle);
          if (own) {
            for (const p of own) walk(layer.handle.stack, p);
          } else {
            walk(layer.handle.stack, prefix);
          }
        }
      }
    };

    walk((app as any)._router?.stack ?? [], '');
    const sorted = [...new Set(routes)].sort();
    const out = nodePath.join(__dirname, '../../../..', 'scripts', 'server_routes.txt');
    fs.writeFileSync(out, sorted.join('\n') + '\n');
    console.log(`TOTAL ${sorted.length} -> ${out}`);
    expect(sorted.length).toBeGreaterThan(100);
  });
});
