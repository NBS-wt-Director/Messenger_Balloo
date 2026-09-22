#!/usr/bin/env node
// P35-сверка: единая шапка (.topbar из @balloo/ui) и подвал (.balloo-footer)
// на всех публичных страницах web, в 3 темах (dark/light/russian).
// Воспроизводимо: поднимает vite dev сам, скриншоты → scripts/p35-shots/.
// Использование: node scripts/p35-chrome-check.cjs

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const PUPPETEER = path.join(ROOT, 'scripts', 'node_modules', 'puppeteer');
const WEB_PORT = 3211;
const OUT = path.join(ROOT, 'scripts', 'p35-shots');

const THEMES = ['dark', 'light', 'russian'];

// Маршруты для сверки: [url, ожидаемый footer]
const ROUTES = [
  ['/', true],              // Landing (placeholder)
  ['/donat', true],         // Донаты
  ['/for_kassa', true],     // Для ЮKassa
  ['/privacy', true],       // Правовые
  ['/login', true],         // Auth (гость)
  ['/features', true],      // Фич-реквесты
  ['/history', true],       // История версий
  ['/download', true],      // Загрузки
  ['/doc', true],           // API Docs
  ['/nonexistent-page-xyz', false], // 404: topbar есть, футера в макете нет
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error('server not up: ' + url);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const puppeteer = require(PUPPETEER);

  // --- Поднимаем dev-сервер web (порт 3211 — 3100 занят docker-proxy) ---
  const webProc = spawn('pnpm', ['exec', 'vite', '--port', String(WEB_PORT), '--strictPort'], {
    cwd: path.join(ROOT, 'packages', 'web'),
    stdio: 'pipe',
    env: { ...process.env, VITE_API_URL: 'http://localhost:3199' },
  });
  await waitForServer(`http://localhost:${WEB_PORT}/`);
  await sleep(1500);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1'],
  });

  const report = [];
  let failed = 0;

  try {
    for (const theme of THEMES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      // Тема через cookie (тот же механизм, что в p34-сверке)
      await page.setCookie({ name: 'balloo-theme', value: theme, domain: 'localhost', path: '/' });

      for (const [route, wantFooter] of ROUTES) {
        const url = `http://localhost:${WEB_PORT}/#${route}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        // hash-навигация: goto с тем же origin не перезагружает страницу,
        // DOM от предыдущего маршрута может остаться (Suspense-гонка) — reload.
        await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
        await sleep(600);
        // Тема дублируем напрямую (как p34)
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-theme', t);
        }, theme);
        await sleep(300);

        const check = await page.evaluate((wf) => {
          const topbar = document.querySelector('header.topbar');
          const footer = document.querySelector('footer.balloo-footer');
          const topbarVisible = topbar
            ? getComputedStyle(topbar).display !== 'none' &&
              topbar.offsetHeight > 0
            : false;
          const footerVisible = footer
            ? getComputedStyle(footer).display !== 'none' &&
              footer.offsetHeight > 0
            : false;
          return {
            hasTopbar: !!topbar,
            topbarVisible,
            hasFooter: !!footer,
            footerVisible,
            wantFooter: wf,
          };
        }, wantFooter);

        const topbarOk = check.hasTopbar && check.topbarVisible;
        const footerOk = wantFooter
          ? check.hasFooter && check.footerVisible
          : !check.hasFooter; // на 404 футера быть не должно (макет 1_00_01)
        const pass = topbarOk && footerOk;
        if (!pass) failed++;

        const slug = route === '/' ? 'root' : route.replace(/\//g, '_').replace(/^_/, '');
        const shot = `web-${theme}-${slug}.png`;
        if (pass) {
          await page.screenshot({ path: path.join(OUT, shot) });
        } else {
          await page.screenshot({ path: path.join(OUT, `FAIL-${shot}`) });
        }

        report.push({
          theme,
          route,
          pass,
          topbar: topbarOk,
          footer: footerOk,
          expectedFooter: wantFooter,
          shot,
        });
        console.log(
          `${pass ? 'PASS' : 'FAIL'}  [${theme}] ${route}  topbar=${topbarOk} footer=${footerOk} (expected=${wantFooter})`
        );
      }
      await page.close();
    }
  } finally {
    await browser.close().catch(() => {});
    webProc.kill('SIGTERM');
  }

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ failed, total: report.length, report }, null, 2));
  console.log(`\nИтог: ${report.length - failed}/${report.length} PASS (3 темы × ${ROUTES.length} маршрутов)`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
