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
// восстанавливаем связь переменная -> файл -> префикс, затем require-им
// каждый файл и сопоставляем объект роутера с его префиксом.
const ROUTES_DIR = nodePath.join(__dirname, '..', 'routes');
const indexSrc: string = fs.readFileSync(nodePath.join(ROUTES_DIR, 'index.ts'), 'utf8');

// Импорты двух видов: `import { router as x } from './f'` и `import x from './f'`
const varToFile = new Map<string, string>();
const reNamed =
  /import\s*\{\s*router(?:\s+as\s+(\w+))?\s*\}\s*from\s*['"]\.\/([\w.-]+)['"]/g;
for (const m of indexSrc.matchAll(reNamed)) {
  varToFile.set(m[1] || 'router', m[2]);
}
const reDefault = /import\s+(\w+)\s+from\s*['"]\.\/([\w.-]+)['"]/g;
for (const m of indexSrc.matchAll(reDefault)) {
  varToFile.set(m[1], m[2]);
}

// Один роутер может быть примонтирован несколько раз (knowledge -> /api/knowledge
// и /api/hiring), поэтому префиксов может быть несколько.
const prefixesByFile = new Map<string, string[]>();
const reUse = /router\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g;
for (const m of indexSrc.matchAll(reUse)) {
  const file = varToFile.get(m[2]);
  if (!file) continue;
  const list = prefixesByFile.get(file) || [];
  list.push(m[1]);
  prefixesByFile.set(file, list);
}

const prefixesByRouter = new Map<any, string[]>();
for (const [file, prefixes] of prefixesByFile) {
  try {
    const mod = require(nodePath.join(ROUTES_DIR, file));
    const r = mod.router || mod.default;
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
