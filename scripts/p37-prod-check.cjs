#!/usr/bin/env node
// P37 — проверка ПРОДА (https://balloo.su) живым браузером.
//
// Критерии только фактические: элемент в DOM + его реальный прямоугольник +
// innerText + хэш бандля, который браузер реально загрузил. Никаких оценок —
// скрипт печатает числа, которые можно перепроверить.
//
// Запуск: node scripts/p37-prod-check.cjs
// Выход:  .check/p37-prod-audit.json + таблица в stdout

const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));

const ORIGIN = process.env.PROD_ORIGIN || 'https://balloo.su';
const VIEWPORT = { width: 1440, height: 900 };

// Маршруты: (путь, что проверяем)
const ROUTES = [
  // P37-1 — ради чего делался деплой
  ['/blog', 'blog: лента'],
  ['/blog/post/1', 'blog: запись'],
  ['/blog/category/dev', 'blog: категория'],
  ['/blog/search', 'blog: поиск'],
  ['/blog/channel/1', 'blog: канал'],
  ['/blog/subscribe', 'blog: подписка'],
  // P37-2..5 — шапка/подвал на остальных страницах
  ['/install', 'установка'],
  ['/spec', 'спецификация'],
  ['/command', 'штаб'],
  ['/for_kassa', 'для кассы'],
  ['/zzz-not-exist', '404'],
  // регресс P35 (единая шапка/подвал) и общие страницы
  ['/', 'лендинг'],
  ['/login', 'вход'],
  ['/privacy', 'приватность'],
  ['/rules', 'правила'],
  ['/cookies', 'cookies'],
  ['/donat', 'донат'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(page, route) {
  await page.goto(`${ORIGIN}/#${route}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1200);
  return page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        vis: cs.visibility,
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      };
    };
    const top = document.querySelector('header.topbar');
    const foot = document.querySelector('.balloo-footer');
    const scripts = Array.from(document.querySelectorAll('script[type="module"]')).map((s) => s.src);
    return {
      hash: location.hash.replace(/^#/, ''),
      bundle: scripts.map((s) => (s.match(/assets\/[\w.-]+\.js/) || [s])[0]).join(','),
      topbar: top ? { present: true, ...box(top) } : { present: false },
      footer: foot ? { present: true, ...box(foot) } : { present: false },
      bodyChars: (document.body.innerText || '').replace(/\s+/g, ' ').trim().length,
    };
  });
}

function verdict(d, route) {
  const problems = [];
  const expected = route.replace(/^\//, '').split('?')[0];
  const got = d.hash.replace(/^\//, '').split('?')[0];
  if (got !== expected) problems.push(`REDIRECT->${d.hash}`);
  if (d.bodyChars < 30) problems.push(`ПУСТО(${d.bodyChars} симв.)`);
  if (!d.topbar.present) problems.push('НЕТ_ШАПКИ');
  else if (d.topbar.h < 10 || d.topbar.w < 100)
    problems.push(`ШАПКА_НОЛЬ(${d.topbar.w}x${d.topbar.h},display=${d.topbar.display})`);
  if (!d.footer.present) problems.push('НЕТ_ПОДВАЛА');
  else if (d.footer.h < 10) problems.push(`ПОДВАЛ_НОЛЬ(${d.footer.w}x${d.footer.h})`);
  else if (!d.footer.text) problems.push('ПОДВАЛ_БЕЗ_ТЕКСТА');
  return problems;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  // Кэш отключаем: иначе service worker может показать старый бандль и дать ложное «ок».
  await page.setCacheEnabled(false);

  const rows = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e.message).slice(0, 160)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`console: ${String(m.text()).slice(0, 160)}`);
  });

  for (const [route, title] of ROUTES) {
    let d;
    try {
      d = await probe(page, route);
    } catch (e) {
      rows.push({ route, title, error: String(e.message).split('\n')[0], problems: ['СБОЙ_ЗАГРУЗКИ'] });
      console.log(`${route.padEnd(22)} СБОЙ: ${String(e.message).split('\n')[0].slice(0, 90)}`);
      continue;
    }
    const problems = verdict(d, route);
    rows.push({ route, title, ...d, problems });
    const f = d.footer;
    const t = d.topbar;
    console.log(
      `${route.padEnd(22)} шапка=${t.present ? `${t.w}x${t.h}` : 'НЕТ'}`.padEnd(40) +
        `подвал=${f.present ? `${f.w}x${f.h}` : 'НЕТ'}`.padEnd(20) +
        `${problems.length ? '⚠ ' + problems.join('; ') : 'ok'}`,
    );
  }

  const out = path.join(ROOT, '.check');
  fs.mkdirSync(out, { recursive: true });
  const uniqErrors = Array.from(new Set(consoleErrors));
  fs.writeFileSync(
    path.join(out, 'p37-prod-audit.json'),
    JSON.stringify({ origin: ORIGIN, viewport: VIEWPORT, at: new Date().toISOString(), rows, pageErrors: uniqErrors }, null, 2),
  );

  const bad = rows.filter((r) => (r.problems || []).length);
  console.log(`\nитого: ${rows.length} маршрутов, с проблемами: ${bad.length}`);
  console.log(`бандль (первый маршрут): ${rows[0] && rows[0].bundle}`);
  console.log(`ошибок страницы/console: ${uniqErrors.length}`);
  uniqErrors.slice(0, 10).forEach((e) => console.log(`  ${e}`));
  await browser.close();
  process.exit(0);
}

main();
