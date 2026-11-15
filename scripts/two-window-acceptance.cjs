/**
 * Приёмка «два окна» живым Chromium — тикет 1793567633, Шаг 7.
 *
 * Доказывает главный критерий MVP1 исполнением в настоящем браузере:
 * сообщение, отправленное в одном окне, появляется во втором БЕЗ перезагрузки.
 *
 * Цикл:
 *  1. REST: регистрация двух пользователей.
 *  2. REST: групповой чат + добавление второго участника.
 *  3. Два изолированных контекста Chromium (разные cookie-jar = два «окна»).
 *  4. В каждом: логин через форму → переход в #/chat/:id.
 *  5. В окне A: набор текста в textarea и отправка (Enter).
 *  6. В окне B: ожидание .message__bubble с этим текстом в DOM.
 *  7. Скриншоты обоих окон как доказательство.
 *
 * Запуск:  node scripts/two-window-acceptance.cjs
 * Нужно:   сервер :3100 и web :5173 (pnpm --filter @balloo/server|web dev)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require(path.join(__dirname, 'node_modules', 'puppeteer'));

const API = process.env.ACCEPT_API || 'http://localhost:3100';
const WEB = process.env.ACCEPT_WEB || 'http://localhost:5173';
const OUT = path.join(__dirname, '..', '.check', 'two-window');
const ACCOUNTS = path.join(OUT, 'accounts.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ============================================================
// HTTP-хелперы (без внешних зависимостей)
// ============================================================
function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: {
          ...(data
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          let parsed = null;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = text;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function cookieOf(headers, name) {
  for (const c of headers['set-cookie'] || []) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (pair.slice(0, eq).trim() === name) return decodeURIComponent(pair.slice(eq + 1));
  }
  return '';
}

/**
 * Регистрация с учётом authLimiter (5 попыток/минуту на IP): при 429 ждём
 * окно и повторяем. Учётки кэшируются в .check/two-window/accounts.json,
 * чтобы повторные прогоны тратили лимит только на логины.
 */
async function registerUser(tag) {
  const cached = fs.existsSync(ACCOUNTS) ? JSON.parse(fs.readFileSync(ACCOUNTS, 'utf8')) : {};
  if (!process.env.ACCEPT_FRESH && cached[tag] && cached[tag].password === 'Test1234') {
    return { ...cached[tag], fromCache: true };
  }
  const id = `${Date.now()}${tag}`;
  const email = `acc${id}@test.balloo.ru`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await request('POST', `${API}/api/auth/register`, {
      email,
      username: `acc${id}`,
      password: 'Test1234',
    });
    if (res.status === 201) {
      const user = {
        id: res.body.user.id,
        email,
        username: res.body.user.username,
        password: 'Test1234',
        accessToken: cookieOf(res.headers, 'balloo-access-token'),
      };
      cached[tag] = user;
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(ACCOUNTS, JSON.stringify(cached, null, 2));
      return user;
    }
    if (res.status === 429) {
      console.log(`  [rate-limit] register ${tag}: жду 61 с и повторяю`);
      await sleep(61_000);
      continue;
    }
    throw new Error(`register ${tag}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  throw new Error(`register ${tag}: превышено число повторов (rate limit)`);
}

// ============================================================
// Браузерная часть
// ============================================================

/** Логин через реальную форму. Чат открывается отдельно — createChatFromPage. */
async function loginInContext(ctx, user, label) {
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', (e) => console.log(`  [${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    const t = m.text();
    if (t.startsWith('WS ') || t.startsWith('[WS]')) console.log(`  [${label}] console: ${t}`);
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/auth/ws-token') && res.request().method() !== 'OPTIONS') {
      console.log(`  [${label}] API ${res.status()} GET ${url.replace(/^https?:\/\/[^/]+/, '')}`);
    }
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`${WEB}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 20000 });
    await page.type('[data-testid="login-email"]', user.email);
    await page.type('[data-testid="login-password"]', user.password);
    await page.click('[data-testid="login-submit"]');

    // После успешного входа LoginScreen делает navigate('/chat') — это hash-навигация,
    // поэтому ждём смены hash, а не события навигации документа.
    const ok = await page
      .waitForFunction(() => window.location.hash.includes('/chat'), { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (ok) {
      console.log(`  [${label}] вход выполнен`);
      return page;
    }

    const shown = await page
      .evaluate(() => document.querySelector('[data-testid="login-error"]')?.textContent || '')
      .catch(() => '');
    // authLimiter: 5 попыток/минуту на IP. Ждём окно и пробуем ещё раз.
    if (attempt < 2) {
      console.log(`  [${label}] вход отклонён (${shown || 'нет ответа'}) — жду 61 с`);
      await sleep(61_000);
      continue;
    }
    throw new Error(`[${label}] вход не выполнен (${shown || 'хэш не сменился за 20 с'})`);
  }
  throw new Error(`[${label}] вход не выполнен`);
}

/**
 * Создание группового чата из уже авторизованной страницы: fetch идёт
 * с cookie-сессией браузера и НЕ тратит authLimiter (в отличие от REST-логина
 * ради Bearer-токена).
 */
async function createChatFromPage(page, memberUserId, name) {
  const res = await page.evaluate(
    async ({ api, member, title }) => {
      const chat = await fetch(`${api}/api/chats`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'group', name: title }),
      });
      if (!chat.ok) return { error: `create ${chat.status}: ${await chat.text()}` };
      const created = await chat.json();
      const add = await fetch(`${api}/api/chats/${created.id}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member }),
      });
      if (!add.ok) return { error: `add ${add.status}: ${await add.text()}` };
      return { chatId: created.id };
    },
    { api: API, member: memberUserId, title: name }
  );
  if (res.error) throw new Error(`чат из браузера не создан: ${res.error}`);
  return res.chatId;
}

/** Переход в чат и ожидание поля ввода. */
async function openChat(page, chatId, label) {
  await page.evaluate((id) => {
    window.location.hash = `#/chat/${id}`;
  }, chatId);
  try {
    await page.waitForSelector('textarea.input-area__field', { timeout: 20000 });
  } catch {
    const hash = await page.evaluate(() => location.hash);
    throw new Error(`[${label}] чат ${chatId} не открылся: хэш=${hash}, поля ввода нет`);
  }
  console.log(`  [${label}] экран чата открыт (поле ввода видно)`);
}

async function main() {
  console.log('=== Приёмка «два окна»: реальный Chromium ===');
  fs.mkdirSync(OUT, { recursive: true });

  console.log('[1/5] пользователи (кэш .check/two-window/accounts.json)');
  const userA = await registerUser('a');
  const userB = await registerUser('b');
  console.log(`  A=${userA.email}  B=${userB.email}`);

  console.log('[2/5] запуск Chromium (headless)');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const ctxA = await browser.createBrowserContext();
  const ctxB = await browser.createBrowserContext();

  let verdict = 'FAIL';
  const evidence = {};
  let chatId = null;
  try {
    console.log('[3/5] окно A: логин + создание чата');
    const pageA = await loginInContext(ctxA, userA, 'A');
    chatId = await createChatFromPage(pageA, userB.id, `TwoWindow ${Date.now()}`);
    console.log(`  chatId=${chatId} (создан из браузера, authLimiter не тронут)`);
    await openChat(pageA, chatId, 'A');

    console.log('[4/5] окно B: логин + тот же чат');
    const pageB = await loginInContext(ctxB, userB, 'B');
    await openChat(pageB, chatId, 'B');

    const text = `two-window-${Date.now()}`;
    console.log(`[5/5] окно A отправляет «${text}» (Enter в textarea)`);
    await pageA.click('textarea.input-area__field');
    await pageA.type('textarea.input-area__field', text);
    await pageA.keyboard.press('Enter');

    // Собственное сообщение A отрисуется локально — это НЕ доказательство
    // доставки, поэтому главный критерий смотрим только в окне B.
    const t0 = Date.now();
    try {
      await pageB.waitForFunction(
        (t) =>
          Array.from(document.querySelectorAll('.message__bubble')).some((el) =>
            el.textContent.includes(t)
          ),
        { timeout: 15000, polling: 250 },
        text
      );
      verdict = 'PASS';
      evidence.deliveredToB = true;
      evidence.deliveryMs = Date.now() - t0;
    } catch {
      evidence.deliveredToB = false;
      evidence.deliveryMs = null;
    }

    evidence.visibleInA = await pageA
      .waitForFunction(
        (t) =>
          Array.from(document.querySelectorAll('.message__bubble')).some((el) =>
            el.textContent.includes(t)
          ),
        { timeout: 5000 },
        text
      )
      .then(() => true)
      .catch(() => false);

    evidence.B_bubbles = await pageB.evaluate(() =>
      Array.from(document.querySelectorAll('.message__bubble')).map((e) => e.textContent.trim()).slice(-5)
    );
    console.log(`  пузыри в окне B: ${JSON.stringify(evidence.B_bubbles)}`);
    await pageA.screenshot({ path: path.join(OUT, 'window-A-sender.png') });
    await pageB.screenshot({ path: path.join(OUT, `window-B-${verdict.toLowerCase()}.png`) });
  } catch (err) {
    evidence.error = err.message;
    console.error('  [ERROR]', err.message);
    for (const [ctx, name] of [[ctxA, 'A'], [ctxB, 'B']]) {
      try {
        const pages = await ctx.pages();
        if (pages[0]) await pages[0].screenshot({ path: path.join(OUT, `window-${name}-error.png`) });
      } catch {}
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUT, 'result.json'),
    JSON.stringify({ verdict, chatId, ...evidence }, null, 2)
  );

  console.log('');
  console.log(
    'ИТОГ: ' +
      (verdict === 'PASS'
        ? `PASS — отправлено в окне A, увидено в окне B без перезагрузки (${evidence.deliveryMs} мс)`
        : 'FAIL — сообщение не появилось во втором окне')
  );
  console.log('Доказательства: ' + OUT);
  process.exit(verdict === 'PASS' ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
