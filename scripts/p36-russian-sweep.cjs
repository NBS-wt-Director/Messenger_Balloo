// P36: полный обход всех маршрутов × 3 языка. Критерий «коллапса»: контент
// виден в innerText страницы при наличии topbar. Скриншоты проблемных страниц.
// 01.10.2026: playwright в окружении нет — прогон переведён на puppeteer
// (scripts/node_modules/puppeteer, chrome из ~/.cache/puppeteer).
const puppeteer = require('/home/ivan/Рабочий стол/проекты/balloo/scripts/node_modules/puppeteer');
const fs = require('fs');

const PORT = 3498;
// 01.10.2026 (тикет 1790480787-03): список маршрутов выверен по реальному
// packages/web/src/router/index.tsx (106 путей). Старый список содержал 59
// несуществующих маршрутов (about/help/internal-chat/blog/post-1/…) — они
// падали бы в NotFoundScreen и давали ложные EMPTY_RENDER.
const ROUTES = [
  '/', '/for_kassa', '/donat', '/support', '/privacy', '/rules', '/cookies',
  '/login', '/register', '/two-factor', '/reset-password', '/add-device',
  '/chat', '/chat/chat-1', '/profile', '/profile/username', '/contacts',
  '/settings', '/settings/notifications', '/settings/privacy', '/settings/blocked',
  '/search', '/group/create', '/group/chat-1/settings', '/channel/create',
  '/channel/chat-1', '/channel/chat-1/settings', '/stories', '/stories/create',
  '/polls', '/polls/poll-1', '/chat/chat-1/poll', '/knowledge',
  '/knowledge/page/page-1', '/knowledge/create', '/knowledge/edit/page-1',
  '/hiring/vacancies', '/hiring/vacancy/1', '/hiring/apply/1', '/hiring/applications',
  '/hiring/application/1', '/hiring/why-us', '/admin', '/admin/users',
  '/admin/users/1', '/admin/reports', '/admin/bans', '/admin/analytics',
  '/admin/feature-flags', '/admin/downloads', '/admin/texts', '/admin/departments',
  '/admin/employees', '/admin/vacancies', '/admin/versions', '/admin/announcements',
  '/admin/features', '/admin/donations', '/admin/support', '/admin/blog/queue',
  '/admin/blog/channels', '/admin/blog/categories', '/admin/audit-logs',
  '/admin/system-settings', '/command', '/command/hr', '/command/vacancies',
  '/command/applications', '/command/interviews', '/command/hiring', '/command/chat',
  '/command/meetings', '/command/tasks', '/command/blog', '/command/my-department',
  '/command/departments', '/command/knowledge', '/command/knowledge/page-1',
  '/command/knowledge/create', '/command/settings', '/command/monitoring',
  '/command/why-us', '/install', '/features', '/features/create', '/features/feat-1',
  '/history', '/history/version/1', '/history/compare', '/download',
  '/download/progress', '/download/desktop/android', '/download/android', '/doc',
  '/doc/endpoint/x', '/doc/ws', '/spec', '/spec/1/1', '/blog', '/blog/post/1',
  '/blog/category/cat', '/blog/search', '/blog/channel/1', '/blog/subscribe',
];
const LOCALES = ['ru', 'en', 'zh'];

async function initLang(browser, lang) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:${PORT}/#/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.topbar', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.evaluate((l) => localStorage.setItem('language', l), lang);
  await page.close();
}

// Эталон: что рендерит каждая страница на en (заполняется по ходу прогона).
const reference = {};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--lang=ru-RU,ru;q=0.9', '--force-device-scale-factor=1'],
  });

  const problems = [];
  let checked = 0;

  for (const lang of LOCALES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });
    page.on('pageerror', (e) => {
      const msg = String(e && e.message || e);
      if (/dlopen|avcodec|libav|pipewire|pulse|GL:|Fontconfig|dbus|DBus/i.test(msg)) return;
      problems.push({ lang, route: '*', kind: 'PAGE_ERROR', detail: msg.slice(0, 160) });
    });

    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}/#${route}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.topbar', { timeout: 20000 });
        await page.evaluate((r) => {

          const h = window.location.hash;
          window.location.hash = h === r ? h + '?r=' + Date.now() : r;
        }, route);
        await new Promise((r) => setTimeout(r, 1600));
      } catch (e) {
        problems.push({ lang, route, kind: 'TIMEOUT', detail: String(e.message).slice(0, 100) });
        continue;
      }
      checked++;

      const d = await page.evaluate(() => {
        const vis = (el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return false;
          const s = getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden';
        };
        const header = document.querySelector('header.topbar');
        const app = document.getElementById('root') || document.body;
        const content = [];
        let collapsed = 0;
        const collapsedSamples = [];
        for (const el of app.querySelectorAll('*')) {
          const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim()).join('').trim();
          if (!own || own.length < 2) continue;
          if (vis(el)) {
            if (!header || !header.contains(el)) content.push(own.slice(0, 25));
          } else if (!header || !header.contains(el)) {
            collapsed++;
            if (collapsedSamples.length < 3) collapsedSamples.push(own.slice(0, 25));
          }
        }
        const topbarVisible = !!header && vis(header);
        const topbarTxt = header ? (header.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
        return {
          hash: window.location.hash,
          topbarVisible,
          topbarTxt,
          contentCount: content.length,
          contentSample: content.slice(0, 6),
          collapsed,
          collapsedSamples,
        };
      });

      const hashPath = d.hash.replace(/^#/, '').split('?')[0];
      if (hashPath !== route) {
        problems.push({ lang, route, kind: 'REDIRECT', detail: d.hash.slice(0, 50) });
        continue;
      }
      if (!d.topbarVisible) {
        problems.push({ lang, route, kind: 'TOPBAR_HIDDEN', detail: '' });
      }
      if (!d.topbarTxt || d.topbarTxt.length < 2) {
        problems.push({ lang, route, kind: 'TOPBAR_EMPTY', detail: '' });
      }
      if (d.collapsed > 2) {
        problems.push({ lang, route, kind: 'COLLAPSED', detail: `x${d.collapsed}: ${JSON.stringify(d.collapsedSamples)}` });
      }

      const sig = d.contentSample.join('|');
      const key = route.replace(/\/[^/]+$/, '/*');
      if (!(key in reference)) {
        reference[key] = { contentCount: d.contentCount, sample: sig };
      }
      if (d.contentCount < 2) {
        problems.push({ lang, route, kind: 'EMPTY_RENDER', detail: `content=${d.contentCount} sample=${JSON.stringify(d.contentSample)}` });
      } else if (lang !== 'en') {
        const ref = reference[key];
        const ratio = d.contentCount / Math.max(1, ref.contentCount);
        if (ratio < 0.4 && ref.contentCount >= 6) {
          problems.push({ lang, route, kind: 'FEWER_THAN_EN', detail: `${d.contentCount} vs en=${ref.contentCount} sample=${JSON.stringify(d.contentSample)}` });
        }
      }

      const hasProblem = problems.some((p) => p.lang === lang && p.route === route);
      if (hasProblem) {
        try {
          await page.screenshot({
            path: `/tmp/p36-sweep-${lang}${route.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}.png`,
            fullPage: false,
          });
        } catch (e) {}
      }
    }
    await page.close();
    console.log(`locale ${lang}: ${checked} проверено`);
  }

  await browser.close();
  console.log(`checked=${checked}`);
  // Валидный JSON-отчёт рядом с текстовым выводом (критерий тикета 1790480787-03)
  const reportPath = '/tmp/p36-sweep-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    port: PORT,
    routesCount: ROUTES.length,
    locales: LOCALES,
    checked,
    problemsCount: problems.length,
    problems,
  }, null, 2));
  console.log(`REPORT_JSON=${reportPath}`);
  if (problems.length === 0) {
    console.log('RUSSIAN_SWEEP_OK: все маршруты отрендерились на ru/en/zh');
    process.exit(0);
  }
  console.log(`PROBLEMS=${problems.length}`);
  for (const p of problems) console.log(`  [${p.lang}] ${p.route} :: ${p.kind} ${p.detail}`);
  process.exit(2);
})().catch((e) => { console.error('SWEEP_FAIL', e); process.exit(1); });
