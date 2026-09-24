#!/usr/bin/env node
// P37 — честная проверка наличия и видимости ЕДИНОЙ шапки/подвала на маршрутах web.
// Критерии только фактические: элемент в DOM + его реальный прямоугольник + innerText.
// Никаких «визуальных оценок»: скрипт печатает числа, которые можно перепроверить.
//
// Запуск: node scripts/p37-chrome-audit.cjs
// Предварительно: мок-API :3199 (scripts/p34-mock-api.cjs) и vite :3211.

const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));

const WEB = 'http://localhost:3211';
const OUT = path.join(ROOT, '.check');

// Реальные маршруты из packages/web/src/router/index.tsx
const ROUTES = [
  ['/', 'лендинг'],
  ['/for_kassa', 'ЮKassa'],
  ['/donat', 'донаты'],
  ['/privacy', 'конфиденциальность'],
  ['/rules', 'правила'],
  ['/cookies', 'cookies'],
  ['/features', 'фичи: список'],
  ['/features/create', 'фичи: создание'],
  ['/features/1', 'фичи: карточка'],
  ['/history', 'история'],
  ['/history/version/1', 'история: версия'],
  ['/history/compare', 'история: сравнение'],
  ['/download', 'загрузки'],
  ['/download/progress', 'загрузки: прогресс'],
  ['/download/linux', 'загрузки: платформа'],
  ['/doc', 'док-сайт'],
  ['/doc/ws', 'док: websocket'],
  ['/blog', 'блог: лента'],
  ['/blog/post/1', 'блог: пост'],
  ['/blog/category/dev', 'блог: категория'],
  ['/blog/search', 'блог: поиск'],
  ['/blog/channel/1', 'блог: канал'],
  ['/blog/subscribe', 'блог: подписка'],
  ['/install', 'установка'],
  ['/spec', 'спецификация'],
  ['/chat', 'чат'],
  ['/profile', 'профиль'],
  ['/contacts', 'контакты'],
  ['/settings', 'настройки'],
  ['/settings/notifications', 'настройки: уведомления'],
  ['/settings/privacy', 'настройки: приватность'],
  ['/settings/blocked', 'настройки: блок-лист'],
  ['/search', 'поиск'],
  ['/stories', 'истории'],
  ['/stories/create', 'истории: создание'],
  ['/polls', 'опросы'],
  ['/knowledge', 'база знаний'],
  ['/knowledge/page/1', 'база знаний: страница'],
  ['/knowledge/create', 'база знаний: создание'],
  ['/group/create', 'группа: создание'],
  ['/channel/create', 'канал: создание'],
  ['/channel/1', 'канал: просмотр'],
  ['/channel/1/settings', 'канал: настройки'],
  ['/hiring/vacancies', 'вакансии'],
  ['/hiring/vacancy/1', 'вакансия'],
  ['/hiring/applications', 'мои отклики'],
  ['/hiring/why-us', 'почему мы'],
  ['/admin', 'админ: дашборд'],
  ['/admin/users', 'админ: пользователи'],
  ['/admin/reports', 'админ: жалобы'],
  ['/admin/bans', 'админ: баны'],
  ['/admin/analytics', 'админ: аналитика'],
  ['/admin/downloads', 'админ: загрузки'],
  ['/admin/versions', 'админ: версии'],
  ['/admin/announcements', 'админ: объявления'],
  ['/admin/donations', 'админ: донаты'],
  ['/admin/blog/queue', 'админ: блог-очередь'],
  ['/admin/blog/channels', 'админ: блог-каналы'],
  ['/admin/audit-logs', 'админ: аудит'],
  ['/admin/system-settings', 'админ: система'],
  ['/command', 'штаб'],
  ['/command/hr', 'штаб: кадры'],
  ['/command/vacancies', 'штаб: вакансии'],
  ['/command/applications', 'штаб: отклики'],
  ['/command/interviews', 'штаб: собеседования'],
  ['/command/chat', 'штаб: чат'],
  ['/command/meetings', 'штаб: встречи'],
  ['/command/tasks', 'штаб: задачи'],
  ['/command/blog', 'штаб: блог'],
  ['/command/knowledge', 'штаб: база знаний'],
  ['/command/settings', 'штаб: настройки'],
  ['/zzz-not-exist', '404'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(page, route) {
  await page.goto(`${WEB}/#${route}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(900);
  return page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
        vis: cs.visibility,
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    };
    const top = document.querySelector('header.topbar');
    const foot = document.querySelector('.balloo-footer');
    return {
      hash: location.hash.replace(/^#/, ''),
      topbar: top ? { present: true, ...box(top) } : { present: false },
      footer: foot ? { present: true, ...box(foot) } : { present: false },
      bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').trim().length,
    };
  });
}

function verdict(d, route) {
  const problems = [];
  const expected = route.replace(/^\//, '').split('?')[0];
  const got = d.hash.replace(/^\//, '').split('?')[0];
  if (got !== expected) problems.push(`REDIRECT->${d.hash}`);
  if (!d.topbar.present) problems.push('НЕТ_ШАПКИ');
  else if (d.topbar.h < 10 || d.topbar.w < 100) problems.push(`ШАПКА_НОЛЬ(${d.topbar.w}x${d.topbar.h},display=${d.topbar.display})`);
  else if (!d.topbar.text) problems.push('ШАПКА_БЕЗ_ТЕКСТА');
  if (!d.footer.present) problems.push('НЕТ_ПОДВАЛА');
  else if (d.footer.h < 10) problems.push(`ПОДВАЛ_НОЛЬ(${d.footer.w}x${d.footer.h})`);
  return problems;
}

async function main() {
  const rows = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCookie({ name: 'balloo-theme', value: 'russian', domain: 'localhost', path: '/' });

  for (const [route, label] of ROUTES) {
    let d, problems;
    try {
      d = await probe(page, route);
      problems = verdict(d, route);
    } catch (e) {
      problems = ['СБОЙ: ' + String(e && e.message).slice(0, 60)];
      d = { hash: '?', topbar: { present: false }, footer: { present: false }, bodyText: 0 };
    }
    const slug = route.replace(/[^a-z0-9]/gi, '_') || 'root';
    try {
      await page.screenshot({ path: path.join(OUT, `p37-${slug}.png`) });
    } catch {}
    rows.push({ route, label, ...d, problems });
    console.log(
      `${problems.length ? 'ПРОБЛЕМА' : 'ok      '} ${route.padEnd(28)} ` +
        `шапка=${d.topbar.present ? `${d.topbar.w}x${d.topbar.h}` : 'НЕТ'} ` +
        `подвал=${d.footer.present ? `${d.footer.w}x${d.footer.h}` : 'НЕТ'} ` +
        `${problems.join(' ')}`
    );
  }
  await browser.close();

  fs.writeFileSync(path.join(OUT, 'p37-chrome-audit.json'), JSON.stringify(rows, null, 2));
  const bad = rows.filter((r) => r.problems.length);
  const noTop = rows.filter((r) => r.problems.some((p) => p.startsWith('НЕТ_ШАПКИ') || p.startsWith('ШАПКА')));
  const noFoot = rows.filter((r) => r.problems.some((p) => p.startsWith('НЕТ_ПОДВАЛА') || p.startsWith('ПОДВАЛ')));
  console.log('\n================ ИТОГ ================');
  console.log(`маршрутов проверено: ${rows.length}`);
  console.log(`с проблемами:        ${bad.length}`);
  console.log(`  нет/сломана шапка:  ${noTop.length}`);
  console.log(`  нет/сломан подвал:  ${noFoot.length}`);
  console.log(`полностью ok:         ${rows.length - bad.length}`);
  console.log(`JSON: .check/p37-chrome-audit.json  скриншоты: .check/p37-*.png`);
}

main().catch((e) => { console.error(e); process.exit(1); });
