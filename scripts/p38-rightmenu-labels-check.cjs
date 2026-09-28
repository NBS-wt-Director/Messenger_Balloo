#!/usr/bin/env node
// Тикет 1790480787-02 (P38) — живая проверка подписей правого меню шапки.
//
// Причина: секция «Аккаунт» у авторизованного показывала сырые ключи
// menu.profile / menu.settings / menu.accounts — их не было в словаре, а t()
// при отсутствии перевода возвращает сам ключ. Тип `key: TranslationKey | string`
// и проверка, видевшая только t('…'), это не ловили.
//
// Что поднимается само (порт 3100 занят другой программой — берём 3199):
//   1) мок-API :3199 в роли АВТОРИЗОВАННОГО (GET /api/users/me -> 200),
//   2) vite dev web (:5173) с VITE_API_URL=http://localhost:3199.
//
// Проверка: открыть #balloo-menu-btn, собрать тексты пунктов, убедиться что
// ни один не похож на сырой ключ и что ожидаемые русские подписи на месте.
//
// Запуск:  node scripts/p38-rightmenu-labels-check.cjs
// Выход:   scripts/p38-shots/rightmenu-<состояние>.png + таблица в stdout,
//          код возврата 1, если найден сырой ключ или пропала ожидаемая подпись.

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
const SHOTS = path.join(__dirname, 'p38-shots');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ожидаемые подписи секции «Аккаунт» (ru) — по эталону mockups/assets/common.js
// (buildRightMenu: «Профиль», «Настройки») и accounts.md §3 («Аккаунты»).
const EXPECTED_AUTHED = ['Профиль', 'Настройки', 'Аккаунты', 'Аккаунт'];
const EXPECTED_GUEST = ['Войти', 'Регистрация'];

function startMockApi(mode) {
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
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    if (p === '/api/auth/refresh-cookie') {
      res.writeHead(mode === 'authed' ? 200 : 400);
      res.end(JSON.stringify(mode === 'authed' ? { message: 'Tokens refreshed' } : { error: 'Bad Request' }));
      return;
    }
    if (p === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', mock: 'p38-rightmenu' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(empty));
  });

  return new Promise((resolve) => server.listen(MOCK_PORT, () => resolve(server)));
}

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
  return { child, log };
}

async function waitForUrl(url, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise((resolve) => {
      http.get(url, (r) => { r.resume(); resolve(true); }).on('error', () => resolve(false));
    });
    if (ok) return true;
    await sleep(500);
  }
  return false;
}

/** Тексты пунктов открытого меню + ярлыки секций. */
async function readMenuLabels(page) {
  return page.evaluate(() => {
    const text = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ');
    const menu = document.querySelector('#balloo-right-menu');
    if (!menu) return null;
    return {
      items: [...menu.querySelectorAll('.right-menu__item-label')].map(text),
      sections: [...menu.querySelectorAll('.right-menu__section-label')].map(text),
      guestButtons: [...menu.querySelectorAll('.right-menu__auth-guest button')].map(text),
    };
  });
}

async function run(state) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));

  await page.goto(`${WEB_ORIGIN}/#/`, { waitUntil: 'networkidle2', timeout: 60000 });

  // Ждём авторизации: в шапке появляется кнопка меню, а для авторизованного —
  // аватар с инициалами вместо маскота.
  await page.waitForSelector('#balloo-menu-btn', { timeout: 30000 });
  if (state === 'authed') {
    await page.waitForFunction(
      () => !!document.querySelector('#balloo-menu-btn .avatar__inner'),
      { timeout: 30000 }
    ).catch(() => {});
  }

  await page.click('#balloo-menu-btn');
  await sleep(400);

  const labels = await readMenuLabels(page);
  const trigger = await page.evaluate(() => {
    const btn = document.querySelector('#balloo-menu-btn');
    const avatar = btn && btn.querySelector('.avatar__inner');
    const mascot = btn && btn.querySelector('.mascot');
    return {
      title: btn ? btn.getAttribute('title') : null,
      avatar: avatar ? avatar.textContent.trim() : null,
      mascot: mascot ? mascot.textContent.trim() : null,
    };
  });

  fs.mkdirSync(SHOTS, { recursive: true });
  const shot = path.join(SHOTS, `rightmenu-${state}.png`);
  await page.screenshot({ path: shot });

  await browser.close();
  return { labels, trigger, shot, pageErrors };
}

function evaluate(state, res, expected) {
  const problems = [];
  if (!res.labels) {
    problems.push('панель #balloo-right-menu не найдена в DOM');
    return problems;
  }
  const all = [...res.labels.items, ...res.labels.sections, ...res.labels.guestButtons];
  const rawKeys = all.filter((s) => /^[a-z]+\.[a-zA-Z]+$/.test(s));
  if (rawKeys.length) problems.push(`сырые ключи в меню: ${JSON.stringify(rawKeys)}`);
  for (const want of expected) {
    if (!all.includes(want)) problems.push(`нет ожидаемой подписи «${want}»`);
  }
  if (res.pageErrors.length) problems.push(`ошибки страницы: ${res.pageErrors.slice(0, 3).join(' | ')}`);
  return problems;
}

(async () => {
  const api = await startMockApi('authed');
  const web = startWeb();
  let code = 0;
  try {
    if (!(await waitForUrl(`${WEB_ORIGIN}/`))) {
      console.error('vite dev не поднялся за 90 с:\n' + web.log.join('').slice(-2000));
      process.exit(1);
    }

    const authed = await run('authed');
    console.log('=== авторизованный ===');
    console.log('триггер:', JSON.stringify(authed.trigger));
    console.log('пункты:', JSON.stringify(authed.labels.items));
    console.log('секции:', JSON.stringify(authed.labels.sections));
    console.log('скрин:', authed.shot);
    const pa = evaluate('authed', authed, EXPECTED_AUTHED);
    pa.forEach((p) => console.log('  ✗ ' + p));

    // Гость: без сессии — мок отдаёт 401 на /api/users/me.
    api.close();
    const guestApi = await startMockApi('guest');
    const guest = await run('guest');
    console.log('\n=== гость ===');
    console.log('триггер:', JSON.stringify(guest.trigger));
    console.log('кнопки:', JSON.stringify(guest.labels && guest.labels.guestButtons));
    console.log('скрин:', guest.shot);
    const pg = evaluate('guest', guest, EXPECTED_GUEST);
    pg.forEach((p) => console.log('  ✗ ' + p));
    guestApi.close();

    if (pa.length || pg.length) code = 1;
    else console.log('\nOK: сырых ключей нет, ожидаемые подписи на месте (2 состояния)');
  } finally {
    web.child.kill('SIGTERM');
    process.exit(code);
  }
})();
