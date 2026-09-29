#!/usr/bin/env node
'use strict';

/**
 * Статический аудит кодовой базы Balloo.
 *
 *   node scripts/code-audit.cjs           # полный отчёт, код выхода 1 если есть ошибки
 *   node scripts/code-audit.cjs --json    # машиночитаемый вывод
 *   node scripts/code-audit.cjs --soft    # отчёт без падения в коде выхода
 *   node scripts/code-audit.cjs --all     # не прятать длинные списки в ...
 *
 * Разделы:
 *   A — секреты и учётные данные в закоммиченном коде
 *   B — целостность HTTP-контракта Express ↔ клиент (web/desktop)
 *   C — отладочный мусор в коде
 *   D — эффекты React без защиты от размонтирования
 *   E — консистентность env-шаблонов
 *
 * Сканируются только файлы, отслеживаемые git (`git ls-files`) — ровно то, что
 * реально попадает в репозиторий. Найденное не правится автоматически: скрипт
 * только показывает файл:строку и причину, решение остаётся за человеком.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
const AS_JSON = ARGS.includes('--json');
const SOFT = ARGS.includes('--soft');
const SHOW_ALL = ARGS.includes('--all');

// ─────────────────────────────────────────────────────────────────────────────
// Файловая база
// ─────────────────────────────────────────────────────────────────────────────

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  })
    .split('\0')
    .filter(Boolean);
}

const ALL_FILES = trackedFiles();

const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.bmp', '.svg',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pdf', '.zip', '.gz', '.tgz',
  '.mp4', '.webm', '.mp3', '.wav', '.db', '.sqlite', '.node', '.wasm', '.map',
]);

// Сгенерированное и.lock-файлы: совпадения в них — не код.
const GENERATED = [
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /\.lockb?$/,
];

// Тесты и фикстуры: секретоподобные строки там intentional.
const TEST_PATH = /(__tests__|\/tests?\/|\.test\.|\.spec\.|\/cypress\/|\/e2e\/|\.setup\.)/;

// Шаблоны конфигурации — значения-заглушки это их назначение.
const EXAMPLE_PATH = /\.example$|(^|\/)\.env\./;

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs']);

function isBinary(rel) {
  return BINARY_EXT.has(path.extname(rel).toLowerCase());
}

function isGenerated(rel) {
  return GENERATED.some((re) => re.test(rel));
}

function isDoc(rel) {
  return /\.(md|markdown|txt)$/i.test(rel);
}

const readCache = new Map();
function read(rel) {
  if (readCache.has(rel)) return readCache.get(rel);
  let text = null;
  try {
    const abs = path.join(ROOT, rel);
    if (fs.statSync(abs).size > 2 * 1024 * 1024) text = null;
    else text = fs.readFileSync(abs, 'utf8');
  } catch {
    text = null;
  }
  readCache.set(rel, text);
  return text;
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function snippetAt(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  const end = text.indexOf('\n', index);
  return text.slice(start, end === -1 ? text.length : end).trim().slice(0, 160);
}

// ─────────────────────────────────────────────────────────────────────────────
// Сбор находок
// ─────────────────────────────────────────────────────────────────────────────

const findings = [];
function add(section, severity, file, line, message, snippet) {
  findings.push({ section, severity, file, line, message, snippet: snippet || '' });
}

const SECTIONS = {
  A: 'A. Секреты и учётные данные в закоммиченном коде',
  B: 'B. Целостность HTTP-контракта Express ↔ клиент',
  C: 'C. Отладочный мусор в коде',
  D: 'D. Эффекты React без защиты от размонтирования',
  E: 'E. Консистентность env-шаблонов',
};

// ─────────────────────────────────────────────────────────────────────────────
// A. Секреты
// ─────────────────────────────────────────────────────────────────────────────

const SECRET_PATTERNS = [
  {
    name: 'Секрет из process.env со значением по умолчанию прямо в коде',
    re: /process\.env\.([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSPHRASE|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|SALT)[A-Z0-9_]*)\s*(?:\|\||\?\?)\s*['"`]([^'"`\n]{6,})['"`]/g,
    where: (f) => SOURCE_EXT.has(path.extname(f)),
    hint: (m) => `${m[1]} подставится в продакшене, если переменная окружения не задана`,
  },
  {
    name: 'Литерал присвоен ключу/секрету/паролю',
    re: /\b([A-Za-z0-9_]*(?:SECRET|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|PASSWORD|PASSPHRASE|AUTH_?TOKEN)[A-Za-z0-9_]*)\s*[:=]\s*['"]([^'"\n]{10,})['"]/g,
    where: (f) => SOURCE_EXT.has(path.extname(f)),
    hint: (m) => `поле "${m[1]}" присвоено конкретное значение, а не взято из конфигурации`,
  },
  {
    name: 'URL с встроенными учётными данными',
    re: /\b(?:https?|redis|rediss|postgres(?:ql)?|mongodb(?:\+srv)?|mysql|amqp):\/\/[^\s'"`@/\\]{1,64}:[^\s'"`@]{1,128}@[^\s'"`\\]+/gi,
    where: (f) => SOURCE_EXT.has(path.extname(f)) || /\.(ya?ml|toml|ini|conf|sh)$/.test(f),
    hint: () => 'логин:пароль (или токен) вшиты в строку подключения',
  },
  {
    name: 'Закрытый ключ (PEM)',
    re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/g,
    where: () => true,
    hint: () => 'содержимое приватного ключа в репозитории',
  },
  {
    name: 'Токен провайдера облака',
    re: /\b(AKIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{36}|gho_[0-9A-Za-z]{36}|glpat-[0-9A-Za-z_-]{20,}|xox[bpars]-[0-9A-Za-z-]{20,}|sk-(?:live-|proj-)?[0-9A-Za-z]{32,})\b/g,
    where: () => true,
    hint: () => 'формат совпадает с реальным токеном провайдера',
  },
  {
    name: 'JWT в исходнике',
    re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}\b/g,
    where: (f) => SOURCE_EXT.has(path.extname(f)),
    hint: () => 'подписанный JWT зашит в код',
  },
];

function scanSecrets() {
  for (const file of ALL_FILES) {
    if (isBinary(file) || isGenerated(file) || TEST_PATH.test(file) || EXAMPLE_PATH.test(file)) continue;
    const text = read(file);
    if (!text) continue;
    for (const pat of SECRET_PATTERNS) {
      if (!pat.where(file)) continue;
      pat.re.lastIndex = 0;
      let m;
      while ((m = pat.re.exec(text)) !== null) {
        // Заглушки и переменные окружения — не секрет.
        const value = m[2] || m[0];
        if (/changeme|your[-_]|xxx|placeholder|example|dummy|test|null|undefined|\$\{|\$\(|process\.env|import\.meta/i.test(value)) continue;
        add('A', 'error', file, lineOf(text, m.index), `${pat.name} — ${pat.hint(m)}`, snippetAt(text, m.index));
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Контракт Express ↔ клиент
// ─────────────────────────────────────────────────────────────────────────────

const VERBS = ['get', 'post', 'put', 'patch', 'delete'];

function joinBase(a, b) {
  const left = a === '/' ? '' : a.replace(/\/+$/, '');
  if (!b || b === '/') return left || '/';
  const right = b.startsWith('/') ? b : `/${b}`;
  return `${left}${right}` || '/';
}

/** Путь Express → сегменты, где параметры схлопнуты в '*'. */
function toSegments(routePath) {
  return routePath
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .map((s) => (s.startsWith(':') || s === '*' || s.startsWith('(.') || /^\(.*\)$/.test(s) ? '*' : s));
}

function keyOf(method, segs) {
  return `${method.toUpperCase()} ${segs.join('/')}`;
}

/** Разрешить относительный импорт в существующий файл модуля. */
function resolveModule(fromDir, spec) {
  const base = path.posix.normalize(path.posix.join(fromDir, spec));
  for (const cand of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (ALL_FILES.includes(cand) || fs.existsSync(path.join(ROOT, cand))) return cand;
  }
  return null;
}

/** Импорты файла: имя в скоупе → путь модуля. Видит default, именованные и алиасы. */
function importsOf(rel, text) {
  const dir = path.posix.dirname(rel);
  const map = new Map();
  for (const m of text.matchAll(/import\s+([^'";]+?)\s+from\s+['"](\.[^'"]+)['"]/g)) {
    const target = resolveModule(dir, m[2]);
    if (!target) continue;
    const clause = m[1];
    const braces = clause.match(/\{([\s\S]*)\}/);
    const defaultName = clause.replace(/\{[\s\S]*\}/, '').split(',')[0].trim();
    if (defaultName && !defaultName.startsWith('*')) map.set(defaultName, target);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const p = part.trim();
        if (!p || p.startsWith('*')) continue;
        const [orig, alias] = p.split(/\s+as\s+/).map((s) => s.trim());
        map.set(alias || orig, target);
      }
    }
  }
  return map;
}

/**
 * Разворачивает дерево роутеров сервера в список {method, path, file, line}.
 * Точка входа — app.ts (mountedExpress app), не index.ts: index.ts только
 * поднимает http-сервер, все монтирования живут в app.ts и routes/index.ts.
 */
function collectServerRoutes() {
  const ENTRY = 'packages/server/src/app.ts';
  const appText = read(ENTRY);
  if (!appText) return [];

  const routes = [];
  const seen = new Set();

  function walk(rel, prefix, depth) {
    if (depth > 6) return;
    const text = read(rel);
    if (!text) return;
    const imports = importsOf(rel, text);

    // Листья: router.get('/x', handler) и app.get('/health', ...)
    for (const m of text.matchAll(/\b(?:router|app|baseRouter)\.(get|post|put|patch|delete|all)\(\s*['"`]([^'"`]+)['"`]/g)) {
      const verbs = m[1] === 'all' ? VERBS : [m[1].toUpperCase()];
      for (const v of verbs) {
        routes.push({ method: v, path: joinBase(prefix, m[2]), file: rel, line: lineOf(text, m.index) });
      }
    }

    // Ветки: app.use('/x', r) / router.use('/api/auth', authRouter)
    for (const m of text.matchAll(/\b(?:app|router)\.use\(\s*['"`]([^'"`]*)['"`]\s*,\s*([A-Za-z0-9_$]+)/g)) {
      const target = imports.get(m[2]);
      if (!target) continue;
      const key = `${target}#${joinBase(prefix, m[1])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      walk(target, joinBase(prefix, m[1]), depth + 1);
    }
  }

  walk(ENTRY, '', 0);
  // Отдельно health-эндпоинты, объявленные как app.get вне роутеров.
  return routes;
}

/** Вызовы клиентского HTTP-API: строковые пути, начинающиеся с /api/. */
function collectClientCalls() {
  const roots = ['packages/web/src', 'packages/desktop/src', 'packages/ui/src'];
  const calls = [];
  // Литерал, внутри которого есть /api/ (в т. ч. шаблоны с ${API_BASE} в начале).
  const literalWithApi = /[`'"]([^`'"\n]*\/api\/[^`'"\n]*)[`'"]/g;
  // Строка обязана стоять в позиции аргумента сетевого вызова, иначе это данные/мок.
  const CALL_TAIL =
    /(?:\bfetch|\brequest|\bapiCall|\baxios(?:\.\w+)?|\b\w*[Aa]pi\.\w+|location\.href|window\.open|document\.location\.\w+)\s*(?:<[^<>()]*>)?\s*[(,:=]\s*$/;

  for (const file of ALL_FILES) {
    if (!roots.some((r) => file.startsWith(`${r}/`))) continue;
    if (!SOURCE_EXT.has(path.extname(file))) continue;
    if (TEST_PATH.test(file)) continue;
    const text = read(file);
    if (!text) continue;

    // Локальные строковые константы: `${API_BASE}/status` → `/api/install/status`.
    const consts = new Map();
    for (const m of text.matchAll(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_$]*)\s*=\s*['"`]([^'"`\n]*)['"`]/g)) {
      consts.set(m[1], m[2]);
    }
    const expand = (raw) => raw.replace(/\$\{([A-Z][A-Za-z0-9_$]*)\}/g, (whole, name) => (consts.has(name) ? consts.get(name) : whole));

    literalWithApi.lastIndex = 0;
    let m;
    while ((m = literalWithApi.exec(text)) !== null) {
      const full = expand(m[1]);
      const apiAt = full.indexOf('/api/');
      if (apiAt === -1) continue;
      let apiPath = full.slice(apiAt);

      const before = text.slice(Math.max(0, m.index - 120), m.index);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 300);

      // Не позиция аргумента сетевого вызова — моки, подсказки, тексты ошибок.
      if (!CALL_TAIL.test(before)) continue;

      let method = 'GET';
      const optMethod = after.match(/method:\s*['"`]([A-Za-z]+)['"`]/);
      const verbOnReceiver = before.match(/\.(get|post|put|patch|delete|del)\s*(?:<[^<>()]*>)?\s*\(\s*$/i);

      if (optMethod && /^(get|post|put|patch|delete)$/i.test(optMethod[1])) {
        method = optMethod[1].toUpperCase();
      } else if (verbOnReceiver) {
        const v = verbOnReceiver[1].toLowerCase();
        method = v === 'del' ? 'DELETE' : v.toUpperCase();
      }

      // `${expr}` внутри пути → параметр сегмента; запрос и фрагмент отбрасываем.
      apiPath = apiPath.replace(/\$\{[^}]*\}/g, '*').replace(/\?[^#]*/, '').replace(/#.*$/, '');
      if (/^\/api\/(v\d+\/)?(mock|fake|stub)/i.test(apiPath)) continue;

      calls.push({ method, path: apiPath, file, line: lineOf(text, m.index), snippet: snippetAt(text, m.index) });
    }
  }
  return calls;
}

/** Все серверные маршруты, подходящие под путь клиента (сегмент ':id' совпадает с чем угодно). */
function matchRoutes(routes, segs) {
  return routes.filter(
    (r) => r.segs.length === segs.length && r.segs.every((s, i) => s === '*' || s === segs[i])
  );
}

function checkContract() {
  const serverRoutes = collectServerRoutes();
  const clientCalls = collectClientCalls();
  LAST_ROUTES = serverRoutes;
  LAST_CALLS = clientCalls;


  const routes = serverRoutes.map((r) => ({ ...r, segs: toSegments(r.path) }));

  const called = new Set();

  for (const call of clientCalls) {
    const segs = toSegments(call.path);
    // Точного совпадения строк недостаточно: сервер описывает сегменты как ':id',
    // клиент подставляет конкретные значения. Сравниваем посегментно ('*' на ':param').
    const candidates = matchRoutes(routes, segs);
    if (candidates.length === 0) {
      add(
        'B',
        'error',
        call.file,
        call.line,
        `Клиент зовёт ${call.method} ${call.path} — на сервере маршрута с таким путём нет`,
        call.snippet
      );
      continue;
    }
    const hit = candidates.find((c) => c.method.toUpperCase() === call.method);
    if (!hit) {
      add(
        'B',
        'warn',
        call.file,
        call.line,
        `Клиент зовёт ${call.method} ${call.path}, но на сервере для этого пути зарегистрированы только ${[...new Set(candidates.map((c) => c.method.toUpperCase()))].join(', ')}`,
        call.snippet
      );
      continue;
    }
    called.add(keyOf(hit.method, hit.segs));
  }

  // Маршруты сервера, до которых нет ни одного клиента.
  const orphans = serverRoutes
    .filter((r) => !called.has(keyOf(r.method, toSegments(r.path))))
    .map((r) => `${r.method.toUpperCase()} ${r.path} (${r.file}:${r.line})`)
    .sort();

  if (orphans.length) {
    add(
      'B',
      'info',
      'packages/server/src',
      0,
      `${orphans.length} маршрутов сервера не вызываются ни из одного клиента (m2m/webhook/внешние интеграции — нормально, мёртвый код — нет):`,
      orphans.join('\n')
    );
  }

  return { serverRoutes: serverRoutes.length, clientCalls: clientCalls.length, orphans: orphans.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Мусор
// ─────────────────────────────────────────────────────────────────────────────

function scanJunk() {
  const roots = ['packages/web/src', 'packages/server/src', 'packages/desktop/src', 'packages/ui/src', 'packages/shared/src'];
  const perFile = [];

  for (const file of ALL_FILES) {
    if (!roots.some((r) => file.startsWith(`${r}/`))) continue;
    if (!SOURCE_EXT.has(path.extname(file))) continue;
    if (TEST_PATH.test(file)) continue;
    const text = read(file);
    if (!text) continue;

    const count = (re) => {
      re.lastIndex = 0;
      return (text.match(re) || []).length;
    };

    const dbg = count(/\bdebugger\b/g);
    const alert = count(/\balert\s*\(/g);
    const todo = count(/\/\/.*\b(TODO|FIXME|HACK|XXX)\b/g);
    const clog = count(/console\.(log|debug|info)\s*\(/g);
    const cerr = count(/console\.(error|warn)\s*\(/g);
    const emptyCatch = count(/catch\s*(\([^)]*\))?\s*\{\s*\}/g) + count(/\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g);
    const anyCast = count(/ as any\b/g);

    if (dbg) add('C', 'error', file, 0, `${dbg} × debugger — оставленная точка останова`);
    if (alert) add('C', 'warn', file, 0, `${alert} × alert() — браузерный диалог в UI вместо нормального состояния ошибки`);
    if (emptyCatch) add('C', 'warn', file, 0, `${emptyCatch} × пустой catch — ошибка глотается без следа`);
    if (clog) add('C', 'warn', file, 0, `${clog} × console.log/debug/info в рабочем коде`);
    if (todo) add('C', 'info', file, 0, `${todo} × TODO/FIXME`);
    if (cerr) add('C', 'info', file, 0, `${cerr} × console.error/warn`);
    if (anyCast) add('C', 'info', file, 0, `${anyCast} × "as any" — отключённая проверка типов в месте присвоения`);

    perFile.push({ file, clog, cerr, todo, anyCast });
  }

  // Отладочные HTTP-эндпоинты, торчащие в прод.
  for (const file of ALL_FILES) {
    if (!file.startsWith('packages/server/src/routes/')) continue;
    const text = read(file);
    if (!text) continue;
    for (const m of text.matchAll(/router\.(get)\(\s*['"`](\/[^'"`]*)['"`]/g)) {
      if (/^\/(debug|test|dump|whoami|env|stats)\b/i.test(m[2])) {
        add('C', 'warn', file, lineOf(text, m.index), `Отладочный GET ${m[2]} доступен в продакшене`, snippetAt(text, m.index));
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Эффекты React
// ─────────────────────────────────────────────────────────────────────────────

function scanEffects() {
  const CLEANUP = /cancelled|canceled|aborted|ignore|isMounted|unmounted|AbortController|signal|clearTimeout|clearInterval|return\s*\(\)\s*=>/;

  for (const file of ALL_FILES) {
    if (!file.startsWith('packages/web/src/') && !file.startsWith('packages/desktop/src/')) continue;
    if (!/\.tsx?$/.test(file)) continue;
    if (TEST_PATH.test(file)) continue;
    const text = read(file);
    if (!text) continue;

    for (const m of text.matchAll(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{/g)) {
      // Блок эффекта: до совпадающей закрывающей скобки (с поправкой на вложенность).
      let i = m.index + m[0].length;
      let depth = 1;
      for (; i < text.length && depth > 0; i++) {
        const ch = text[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      const block = text.slice(m.index, i);
      const hasAsyncWork = /void\s*\(\s*async|async\s*\(\s*\)\s*=>\s*\{|\bawait\b/.test(block);
      if (!hasAsyncWork) continue;
      if (CLEANUP.test(block)) continue;
      if (block.length > 6000) continue; // генёж/исключение, чтобы не пложить ложняк

      add(
        'D',
        'warn',
        file,
        lineOf(text, m.index),
        'useEffect с асинхронной работой без признака отмены: setState после unmount, гонка двух загрузок',
        snippetAt(text, m.index)
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E. Env-шаблоны
// ─────────────────────────────────────────────────────────────────────────────

function parseEnv(rel) {
  const text = read(rel);
  if (!text) return new Set();
  const keys = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function checkEnvTemplates() {
  const envFiles = ALL_FILES.filter((f) => /(^|\/)\.env/.test(path.basename(f)) && !isBinary(f));
  const keySets = new Map();
  for (const f of envFiles) keySets.set(f, parseEnv(f));

  const templates = envFiles.filter((f) => /\.example$/.test(f));
  const allTemplateKeys = new Set();
  for (const t of templates) for (const k of keySets.get(t)) allTemplateKeys.add(k);

  const prod = keySets.get('.env.production');
  if (prod) {
    for (const k of [...prod].sort()) {
      const inTemplate = templates.some((t) => keySets.get(t).has(k));
      if (!inTemplate) {
        add('E', 'warn', '.env.production', 0, `${k} есть в .env.production, но нет ни в одном .env*.example — при переносе/восстановлении среды ключ теряется`);
      }
    }
  }

  // Ключи, читаемые кодом.
  const used = new Map(); // key → file:line
  for (const file of ALL_FILES) {
    if (!SOURCE_EXT.has(path.extname(file)) || TEST_PATH.test(file) || isGenerated(file)) continue;
    const text = read(file);
    if (!text) continue;
    for (const m of text.matchAll(/(?:process\.env|import\.meta\.env|env)\s*(?:\.|\[\s*)\s*['"]?([A-Z][A-Z0-9_]{2,})['"]?\s*\]?/g)) {
      if (!used.has(m[1])) used.set(m[1], `${file}:${lineOf(text, m.index)}`);
    }
  }

  const declaredEverywhere = new Set([...allTemplateKeys, ...(prod || new Set())]);
  for (const [k, where] of [...used].sort()) {
    if (/^(NODE_ENV|PORT|HOME|PATH|PWD|CI|TZ|LANG|HOST|SHELL|TERM|npm_|CI_)/.test(k)) continue;
    if (declaredEverywhere.has(k)) continue;
    // Только явно конфигурационные имена, иначе список тонет в локальных переменных.
    if (!/_(URL|KEY|SECRET|TOKEN|HOST|PORT|ID|MODE|ENABLED|VERSION|PATH|TTL|LIMIT|TIMEOUT|WEBHOOK|ALGORITHM)$|^VITE_/.test(k)) continue;
    add('E', 'info', where.split(':')[0], Number(where.split(':')[1] || 0), `${k} читается из окружения, но не объявлен ни в одном env-шаблоне`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Отчёт
// ─────────────────────────────────────────────────────────────────────────────

let LAST_ROUTES = [];
let LAST_CALLS = [];

scanSecrets();
const STATS = checkContract();

//--routes: отладочный дамп собранной таблицы маршрутов и вызовов клиента
if (process.argv.includes('--routes')) {
  for (const r of [...LAST_ROUTES].sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`))) {
    console.log(`СЕРВЕР ${r.method} ${r.path} (${r.file}:${r.line})`);
  }
  console.log('--- КЛИЕНТ ---');
  for (const c of [...LAST_CALLS].sort((a, b) => a.file.localeCompare(b.file))) {
    console.log(`${c.method} ${c.path}	${c.file}:${c.line}`);
  }
  process.exit(0);
}

scanJunk();
scanEffects();
checkEnvTemplates();

const SEV_ORDER = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => a.section.localeCompare(b.section) || SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);

const counts = { error: 0, warn: 0, info: 0 };
for (const f of findings) counts[f.severity]++;

if (AS_JSON) {
  process.stdout.write(`${JSON.stringify({ contract: STATS, counts, findings }, null, 2)}\n`);
} else {
  const line = '─'.repeat(78);
  process.stdout.write(`\nBalloo: статический аудит (${ALL_FILES.length} файлов в git)\n${'═'.repeat(78)}\n`);
  process.stdout.write(
    `Контракт: маршрутов сервера ${STATS.serverRoutes}, вызовов клиента ${STATS.clientCalls}, ` +
      `несовпадений пути ${findings.filter((f) => f.section === 'B' && f.severity === 'error').length}, ` +
      `несовпадений метода ${findings.filter((f) => f.section === 'B' && f.severity === 'warn').length}\n`
  );
  for (const section of Object.keys(SECTIONS)) {
    const items = findings.filter((f) => f.section === section);
    process.stdout.write(`\n${SECTIONS[section]}\n${line}\n`);
    if (!items.length) {
      process.stdout.write('  чисто\n');
      continue;
    }
    const shown = SHOW_ALL ? items : items.slice(0, 40);
    for (const f of shown) {
      const place = f.line ? `${f.file}:${f.line}` : f.file;
      process.stdout.write(`  [${f.severity.toUpperCase().padEnd(5)}] ${place}\n           ${f.message}\n`);
      if (f.snippet && f.snippet.split('\n').length <= 3) {
        process.stdout.write(`           ${f.snippet}\n`);
      } else if (f.snippet) {
        const rows = f.snippet.split('\n');
        for (const r of rows.slice(0, 12)) process.stdout.write(`             ${r}\n`);
        if (rows.length > 12) process.stdout.write(`             … ещё ${rows.length - 12}\n`);
      }
    }
    if (items.length > shown.length) process.stdout.write(`  … ещё ${items.length - shown.length} (--all)\n`);
  }
  process.stdout.write(`\n${'═'.repeat(78)}\nИТОГО: ошибок ${counts.error}, предупреждений ${counts.warn}, справочных ${counts.info}\n`);
  process.stdout.write(`Порог выхода: ${SOFT ? 'мягкий (--soft)' : 'ошибка при любом error'}\n\n`);
}

process.exit(!SOFT && counts.error > 0 ? 1 : 0);
