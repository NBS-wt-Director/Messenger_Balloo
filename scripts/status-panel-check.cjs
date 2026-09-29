// Проверка панели status.html живым браузером.
//
// Панель грузит данные тикетов из JSON через fetch(). После переезда
// balloо-status.json в tickets/Done/ панель отдавала «Ошибка загрузки данных».
// Скрипт поднимает http.server в корне репозитория, открывает status.html в
// Chromium, дожидается фактической отрисовки счётчиков и печатает, что видно.
//
// Запуск: node scripts/status-panel-check.cjs [--url http://localhost:8099/status.html]
// Код 0 — панель отрисовала данные; код 1 — сообщение об ошибке или пусто.

const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

const HTTP_PORT = Number(process.env.STATUS_CHECK_PORT || 8099);
const argUrl = process.argv.indexOf('--url');
const TARGET =
  argUrl >= 0
    ? process.argv[argUrl + 1]
    : `http://localhost:${HTTP_PORT}/status.html`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForRender(page, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = await page.evaluate(() => {
      const stats = document.getElementById('statsBar');
      const progress = document.getElementById('mainProgressText');
      return {
        stats: stats ? stats.textContent.replace(/\s+/g, ' ').trim() : null,
        progress: progress ? progress.textContent.trim() : null,
        tickets: document.querySelectorAll('#ticketList .ticket-item').length,
      };
    });
    if (state.stats && /Ошибка загрузки/.test(state.stats)) return { ...state, failed: true };
    if (state.progress && state.tickets > 0) return { ...state, failed: false };
    await sleep(250);
  }
  return { failed: true, reason: 'таймаут ожидания отрисовки' };
}

(async () => {
  const serve = argUrl >= 0 ? null : spawn('python3', ['-m', 'http.server', String(HTTP_PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  if (serve) await sleep(1200);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  let exitCode = 1;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    const requests = [];
    page.on('response', (r) => {
      if (r.url().endsWith('.json')) requests.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const state = await waitForRender(page);
    console.log('URL:', TARGET);
    console.log('ошибки страницы:', errors.length ? errors.slice(0, 5).join(' | ') : '(нет)');
    console.log('ответы по JSON:', requests.length ? requests.join(' | ') : '(нет запросов)');
    console.log('mainProgressText:', state.progress ?? '(пусто)');
    console.log('карточек тикетов:', state.tickets ?? 0);
    console.log('statsBar:', (state.stats || state.reason || '(пусто)').slice(0, 160));

    if (state.failed) {
      await page.screenshot({ path: path.join(ROOT, 'scripts', 'status-panel-check.fail.png') });
      console.log('СКРИН: scripts/status-panel-check.fail.png');
      exitCode = 1;
    } else {
      await page.screenshot({ path: path.join(ROOT, 'scripts', 'status-panel-check.png') });
      console.log('СКРИН: scripts/status-panel-check.png');
      console.log('ВЕРДИКТ: панель отрисовала данные, ошибки загрузки нет');
      exitCode = 0;
    }
  } catch (err) {
    console.error('ПАДЕНИЕ:', err.message);
    exitCode = 1;
  } finally {
    await browser.close();
    if (serve) serve.kill('SIGTERM');
  }
  process.exit(exitCode);
})();
