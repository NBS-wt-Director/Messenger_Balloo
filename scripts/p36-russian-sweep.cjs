// P36: полный обход всех маршрутов × 3 языка. Критерий «коллапса»: контент
// виден в innerText страницы при наличии topbar. Скриншоты проблемных страниц.
const { chromium } = require('playwright');
const fs = require('fs');

const PORT = 3498;
const ROUTES = [
  '/', '/chat', '/history', '/blog', '/about', '/settings', '/help', '/contact',
  '/donate', '/privacy', '/terms', '/features', '/features/create', '/features/feat-1',
  '/internal-chat', '/specifity', '/for-kursach', '/kassa', '/not-found',
  '/blog/post-1', '/blog/post-2', '/blog/post-3', '/blog/post-4', '/blog/post-5',
  '/blog/tag/Образование', '/blog/tag/Курсы', '/blog/search?q=курсовая', '/blog/new',
  '/help/faq', '/help/faq/1', '/help/guide', '/help/guide/1', '/help/article/1',
  '/help/article/99', '/help/category/faq', '/help/search?q=тест', '/help/feedback',
  '/settings/profile', '/settings/notifications', '/settings/privacy', '/settings/appearance',
  '/settings/language', '/settings/help', '/settings/test', '/settings/1', '/settings/x',
  '/donate/alert', '/donate/center', '/donate/faq', '/donate/rates', '/donate/tour',
  '/internal-chat/room-1', '/internal-chat/room-99', '/internal-chat/1',
  '/internal-chat/Общая', '/internal-chat/search?q=тест', '/internal-chat/new',
  '/about/1', '/about/Образование', '/chat/room-1', '/chat/1',
  '/for-kursach/1', '/for-kursach/Образование', '/history/v1', '/history/1',
  '/kassa/1', '/kassa/Образование', '/not-found/1', '/privacy/1', '/terms/1',
];
const LOCALES = ['ru', 'en', 'zh'];

async function initLang(browser, lang) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:${PORT}/#/, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.topbar', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.evaluate((l) => localStorage.setItem('language', l), lang);
  await page.close();
}

// Эталон: что рендерит каждая страница на en (заполняется по ходу прогона).
const reference = {};

(async () => {
  const browser = await chromium.launch({
    headless: 'new',
    args: ['--lang=ru-RU,ru;q=0.9', '--accept-lang=ru-RU,ru;q=0.9', '--force-device-scale-factor=1'],
  });

  const problems = [];
  let checked = 0;

  for (const lang of LOCALES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
        await page.waitForTimeout(1600);
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
  if (problems.length === 0) {
    console.log('RUSSIAN_SWEEP_OK: все маршруты отрендерились на ru/en/zh');
    process.exit(0);
  }
  console.log(`PROBLEMS=${problems.length}`);
  for (const p of problems) console.log(`  [${p.lang}] ${p.route} :: ${p.kind} ${p.detail}`);
  process.exit(2);
})().catch((e) => { console.error('SWEEP_FAIL', e); process.exit(1); });
