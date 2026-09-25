#!/usr/bin/env node
// P38 — почему на проде / и /blog редиректят гостя на /login, а /privacy — нет.
// Только факты: лог запросов браузера + смена location.hash.
// Запуск: node scripts/p38-prod-redirect-probe.cjs

const path = require('path');
const puppeteer = require(path.join(__dirname, 'node_modules', 'puppeteer'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probeRoute(browser, route) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  const reqs = [];
  page.on('request', (r) => reqs.push({ method: r.method(), url: r.url() }));
  page.on('response', (r) => {
    const rec = reqs.find((q) => q.url === r.url() && q.code === undefined);
    if (rec) rec.code = r.status();
  });
  await page.goto(`https://balloo.su/#${route}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2500);
  const final = await page.evaluate(() => location.hash);
  console.log(`\n=== ${route} -> hash=${final} ${final.replace(/^#/, '') !== route ? '<<< РЕДИРЕКТ' : ''}`);
  for (const q of reqs) {
    if (q.url.includes('/api/')) console.log(`  ${q.code || '?'} ${q.method} ${q.url}`);
  }
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  for (const r of ['/blog', '/', '/privacy']) await probeRoute(browser, r);
  await browser.close();
})();
