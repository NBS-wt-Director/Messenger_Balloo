#!/usr/bin/env node
// Тикет 1790480787-01 (P38-0) — живая проверка: гость НЕ сбрасывается с
// публичных страниц на #/login.
//
// Что поднимается само (ничего чужого не трогаем, порт 3100 занят другой
// программой — берём 3199):
//   1) мок-API :3199 в роли ГОСТЯ: GET /api/users/me -> 401,
//      POST /api/auth/refresh-cookie -> 400 («refresh-куки нет»),
//      остальные /api/* -> пустой ответ, чтобы страницы отрисовались;
//   2) vite dev web (:5173) с VITE_API_URL=http://localhost:3199.
//
// Критерий: после фактической отрисовки страницы location.hash остался
// прежним. Скрипт ждёт непустой отрисованный текст, а не только networkidle.
//
// Запуск:  node scripts/p38-0-guest-check.cjs [--label after] [--routes /,/blog,/privacy]
// Выход:   scripts/p38-0-shots/<label>-<route>.png + таблица в stdout,
//          код возврата 1 если хоть на одном маршруте hash изменился.

const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

const MOCK_PORT = 3199;
const WEB_PORT = 5173;
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;
const SHOTS = path.join(__dirname, 'p38-0-shots');

const argv = process.argv.slice(2);
const argVal = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const LABEL = argVal('label', 'after');
const ROUTES = argVal('routes', '/,/blog,/privacy').split(',').filter(Boolean);
// Режим мока: guest — сессии нет (401/400); authed — сессия есть (200).
// Нужен, чтобы отличить «роут затенён защищённой группой» от «редирект из api.ts».
const MODE = argVal('mode', 'guest');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. Мок-API в роли «гость» ------------------------------------------------
function startMockApi(mode) {
  // Пустой ответ, который одинаково безопасен для `res.map` и для `res.items`
  const empty = Object.assign([], {
    items: [], posts: [], categories: [], channels: [], comments: [],
    pages: [], total: 0, count: 0, user: null, success: true,
  });
  const me = {
    id: 'user1',
    username: 'edb',
    displayName: 'Тест Тестов',
    email: 'edb@balloo.su',
    status: 'online',
    language: 'ru',
    theme: 'dark',
    isAdmin: false,
    isTwoFAEnabled: false,
  };

  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-csrf-token');
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${MOCK_PORT}`);
    const p = url.pathname;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (p === '/api/users/me') {
      if (mode === 'authed') {
        res.writeHead(200);
        res.end(JSON.stringify(me));
        return;
      }
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized', message: 'Требуется авторизация' }));
      return;
    }
    if (p === '/api/auth/refresh-cookie') {
      if (mode === 'authed') {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Tokens refreshed' }));
        return;
      }
      // Контракт сервера (authController.refreshCookie): куки нет -> 400
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Bad Request', message: 'Refresh токен обязателен' }));
      return;
    }
    if (p === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', mock: 'p38-0-guest' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(empty));
  });

  return new Promise((resolve) => {
    server.listen(MOCK_PORT, () => resolve(server));
  });
}

// --- 2. vite dev web ----------------------------------------------------------
function startWeb() {
  const child = spawn(
    path.join(ROOT, 'packages', 'web', 'node_modules', '.bin', 'vite'),
    ['--port', String(WEB_PORT), '--strictPort'],
    {
      cwd: path.join(ROOT, 'packages', 'web'),
      env: { ...process.env, VITE_API_URL: `http://localhost:${MOCK_PORT}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const log = [];
  child.stdout.on('data', (d) => log.push(d.toString()));
  child.stderr.on('data', (d) => log.push(d.toString()));
  child.on('exit', (code) => log.push(`[vite exited code=${code}]`));
  return { child, log };
}

async function waitForUrl(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise((resolve) => {
      http
        .get(url, (r) => {
          r.resume();
          resolve(true);
        })
        .on('error', () => resolve(false));
    });
    if (ok) return true;
    await sleep(500);
  }
  return false;
}

// --- 3. Проверка маршрута живым браузером -------------------------------------
async function checkRoute(browser, route) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);

  const apiCalls = [];
  page.on('response', async (r) => {
    const u = r.url();
    if (u.includes('/api/')) {
      apiCalls.push(`${r.status()} ${r.request().method()} ${u.replace(WEB_ORIGIN, '')}`);
    }
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));

  // Диагностика источника навигации: React Router идёт через history.pushState/
  // replaceState, а присвоение location.hash — через hashchange. Видно, кто
  // именно уводит гостя на /login.
  await page.evaluateOnNewDocument(() => {
    window.__navLog = [];
    const wrap = (name) => {
      const orig = history[name].bind(history);
      history[name] = function (...args) {
        window.__navLog.push({
          type: name,
          to: String(args[2]),
          stack: new Error().stack || '',
        });
        return orig(...args);
      };
    };
    wrap('pushState');
    wrap('replaceState');
    window.addEventListener('hashchange', (e) =>
      window.__navLog.push({ type: 'hashchange', from: e.oldURL, to: e.newURL, stack: new Error().stack || '' })
    );
  });

  await page.goto(`${WEB_ORIGIN}/#${route}`, { waitUntil: 'networkidle2', timeout: 60000 });

  // Ждём фактической отрисовки: непустой видимый текст в body
  let rendered = false;
  try {
    await page.waitForFunction(
      () => (document.body ? document.body.innerText.trim().length > 50 : false),
      { timeout: 30000 }
    );
    rendered = true;
  } catch {
    rendered = false;
  }
  // Запас на асинхронный редирект (именно он и был дефектом)
  await sleep(2500);

  const final = await page.evaluate(() => ({
    hash: location.hash,
    textLen: document.body ? document.body.innerText.trim().length : 0,
    title: document.title,
    text: document.body ? document.body.innerText.replace(/\s+/g, ' ').slice(0, 160) : '',
    navLog: window.__navLog || [],
  }));

  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${LABEL}${route === '/' ? '-root' : route.replace(/\//g, '-')}.png`);
  await page.screenshot({ path: file, fullPage: false });
  await page.close();

  const expected = MODE === 'guest' ? `#${route}` : 'не #/login';
  const ok = MODE === 'guest' ? final.hash === expected : final.hash !== '#/login';
  return {
    route,
    expectedHash: expected,
    hash: final.hash,
    ok,
    rendered: rendered && final.textLen > 50,
    textLen: final.textLen,
    text: final.text,
    navLog: final.navLog,
    apiCalls,
    pageErrors,
    shot: path.relative(ROOT, file),
  };
}

(async () => {
  const mock = await startMockApi(MODE);
  const { child, log } = startWeb();
  let browser;
  let failed = 0;

  try {
    const up = await waitForUrl(`${WEB_ORIGIN}/`);
    if (!up) {
      console.error('vite dev не поднялся за 90 с:\n' + log.join(''));
      process.exitCode = 2;
      return;
    }

    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: CHROME,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log(`\n=== P38-0: проверка маршрутов (${LABEL}, режим мока: ${MODE}) ===`);
    console.log(
      `мок-API :${MOCK_PORT} (${MODE === 'guest' ? '401 /users/me, 400 /refresh-cookie' : '200 /users/me'}), web :${WEB_PORT}`
    );
    for (const route of ROUTES) {
      const r = await checkRoute(browser, route);
      if (!r.ok) failed += 1;
      console.log(
        `\n${r.ok ? 'OK  ' : 'FAIL'} ${route.padEnd(10)} hash="${r.hash}" (ожидался "${r.expectedHash}")` +
          `  отрисовка=${r.rendered ? 'да' : 'НЕТ'} символов=${r.textLen}`
      );
      for (const c of r.apiCalls) console.log(`     ${c}`);
      for (const e of r.pageErrors.slice(0, 3)) console.log(`     pageerror: ${e}`);
      for (const n of r.navLog) {
        console.log(`     nav: ${n.type} -> ${n.to || n.newURL || ''}${n.from ? ` (from ${n.from})` : ''}`);
        if (process.env.DEBUG_NAV && n.stack) {
          console.log(
            n.stack
              .split('\n')
              .slice(1, 7)
              .map((l) => `          ${l.trim()}`)
              .join('\n')
          );
        }
      }
      console.log(`     текст: ${r.text}`);
      console.log(`     скрин: ${r.shot}`);
    }
    console.log(`\nИтог: ${ROUTES.length - failed}/${ROUTES.length} маршрутов без редиректа на /login`);
    process.exitCode = failed ? 1 : 0;
  } finally {
    if (browser) await browser.close();
    child.kill('SIGTERM');
    mock.close();
  }
})();
