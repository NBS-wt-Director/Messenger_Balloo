#!/usr/bin/env node
// Тикет 1790572800-01 — живая проверка экрана «Чат с поддержкой» (/support).
//
// Поднимает мок-API :3199 (авторизованный пользователь + эндпоинты support) и
// vite dev :5173 с VITE_API_URL на мок. Открывает #/support в Chromium,
// дожидается фактической отрисовки и снимает:
//   - заголовок шапки «Чат с поддержкой»;
//   - хедер поддержки (🦊, «Техподдержка Balloo», онлайн + среднее время ответа);
//   - chip приоритета;
//   - сообщения (автоответ с тегом «⚙ Автоответ»);
//   - сырые ключи перевода (должно быть пусто);
//   - отправку сообщения (сообщение появляется в ленте);
//   - скриншот.
//
// Запуск:  node scripts/p38-support-check.cjs
// Выход:   scripts/p38-shots/support.png, код 1 при любом расхождении.

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

// Лента поддержки: автоответ бота + сообщение пользователя.
let messages = [
  {
    id: 'sm1',
    text: 'Здравствуйте! Опишите вашу проблему, и мы обязательно поможем. Среднее время ответа — 5 минут.',
    authorId: 'bot',
    isBot: true,
    createdAt: 1750000000,
  },
  { id: 'sm2', text: 'Не могу подключить Яндекс Диск', authorId: 'user1', isBot: false, createdAt: 1750000300 },
];

function startMockApi() {
  const empty = Object.assign([], {
    items: [], posts: [], categories: [], channels: [], comments: [],
    pages: [], total: 0, count: 0, user: null, success: true,
  });

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
      res.writeHead(200);
      res.end(JSON.stringify(me));
      return;
    }
    if (p === '/api/auth/refresh-cookie') {
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Tokens refreshed' }));
      return;
    }
    if (p === '/api/support/status') {
      res.writeHead(200);
      res.end(JSON.stringify({ online: true, avgResponseMinutes: 5, openTickets: 1 }));
      return;
    }
    if (p === '/api/support/chat' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        ticket: { id: 't1', subject: 'Обращение в поддержку', status: 'open', priority: 'high', createdAt: 1750000000 },
        messages,
        created: false,
      }));
      return;
    }
    if (p === '/api/support/chat' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let text = '';
        try { text = JSON.parse(body).text; } catch { /* пусто */ }
        const created = { id: `sm${messages.length + 1}`, text, authorId: 'user1', isBot: false, createdAt: 1750000600 };
        messages.push(created);
        res.writeHead(201);
        res.end(JSON.stringify(created));
      });
      return;
    }
    if (p === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', mock: 'p38-support' }));
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

(async () => {
  const api = await startMockApi();
  const web = startWeb();
  let code = 0;
  const problems = [];

  try {
    if (!(await waitForUrl(`${WEB_ORIGIN}/`))) {
      console.error('vite dev не поднялся за 90 с:\n' + web.log.join('').slice(-2000));
      process.exit(1);
    }

    const browser = await puppeteer.launch({
      executablePath: CHROME,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setCacheEnabled(false);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));

    await page.goto(`${WEB_ORIGIN}/#/support`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction(
      () => document.body.innerText.includes('Техподдержка Balloo'),
      { timeout: 30000 }
    );

    // Отправка сообщения. Клик через evaluate: page.click промахивался по
    // кнопке (проверено отладкой — POST при этом не уходил).
    await page.type('.input-area__field', 'Проверка живого экрана');
    await page.evaluate(() => {
      document.querySelector('.input-area__btn--send').click();
    });
    await page.waitForFunction(
      () => document.body.innerText.includes('Проверка живого экрана'),
      { timeout: 15000 }
    ).catch(() => problems.push('отправленное сообщение не появилось в ленте'));

    await sleep(300);
    fs.mkdirSync(SHOTS, { recursive: true });
    const shot = path.join(SHOTS, 'support.png');
    await page.screenshot({ path: shot });

    const state = await page.evaluate(() => {
      const text = document.body.innerText;
      const raw = (text.match(/\b[a-z]+\.[a-zA-Z]+\b/g) || []).filter(
        (s) => !s.startsWith('api.') && !s.startsWith('www.')
      );
      return {
        title: text.includes('Чат с поддержкой'),
        header: text.includes('Техподдержка Balloo'),
        online: /Среднее время ответа: 5 мин/.test(text),
        priority: text.includes('Приоритет: Повышенный'),
        autoTag: !!document.querySelector('.message__header-tag--auto'),
        mascot: document.querySelector('.avatar--ctx-new')?.textContent?.trim() ?? null,
        sent: text.includes('Проверка живого экрана'),
        rawKeys: raw,
      };
    });

    console.log('заголовок «Чат с поддержкой»:', state.title);
    console.log('хедер «Техподдержка Balloo»:', state.header);
    console.log('статус (среднее время ответа):', state.online);
    console.log('chip приоритета:', state.priority);
    console.log('тег «⚙ Автоответ»:', state.autoTag);
    console.log('аватар поддержки:', JSON.stringify(state.mascot));
    console.log('отправленное сообщение в ленте:', state.sent);
    console.log('сырые ключи:', JSON.stringify(state.rawKeys));
    console.log('скрин:', shot);

    for (const [name, ok] of [
      ['заголовок', state.title],
      ['хедер', state.header],
      ['статус', state.online],
      ['приоритет', state.priority],
      ['тег автоответа', state.autoTag],
      ['отправка', state.sent],
    ]) {
      if (!ok) problems.push(`не выполнено: ${name}`);
    }
    if (state.rawKeys.length) problems.push(`сырые ключи: ${JSON.stringify(state.rawKeys)}`);
    if (state.mascot !== '🦊') problems.push(`аватар поддержки не 🦊: ${state.mascot}`);
    if (pageErrors.length) problems.push(`ошибки страницы: ${pageErrors.slice(0, 3).join(' | ')}`);

    await browser.close();

    if (problems.length) {
      code = 1;
      problems.forEach((p) => console.log('  ✗ ' + p));
    } else {
      console.log('\nOK: экран /support отрисован по макету, отправка работает');
    }
  } finally {
    api.close();
    web.child.kill('SIGTERM');
    process.exit(code);
  }
})();
