// Живая проверка бандля админки (тикет 1793187702).
// Запуск: node scripts/admin-live-check.cjs <url>
//   url по умолчанию — http://127.0.0.1:4174/ (локальный serve dist web-admin)
// Открывает страницу настоящим Chromium, ждёт отрисовки и печатает:
//   - текст в #root (пусто = белый экран)
//   - ошибки консоли и необработанные исключения
// Код возврата 0 — страница отрисовала непустой DOM; 1 — белый экран/ошибка.
const puppeteer = require('puppeteer');

const url = process.argv[2] || 'http://127.0.0.1:4174/';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  // Ждём фактической отрисовки: либо дети в #root, либо таймаут.
  await page
    .waitForFunction(() => {
      const root = document.querySelector('#root');
      return !!root && root.children.length > 0;
    }, { timeout: 8000 })
    .catch(() => {});

  const state = await page.evaluate(() => {
    const root = document.querySelector('#root');
    return {
      childCount: root ? root.children.length : -1,
      text: root ? (root.textContent || '').trim().slice(0, 300) : '(нет #root)',
      title: document.title,
    };
  });

  await browser.close();

  console.log(`URL: ${url}`);
  console.log(`title: ${state.title}`);
  console.log(`#root children: ${state.childCount}`);
  console.log(`#root text: ${state.text || '(пусто)'}`);
  console.log(`ошибок консоли: ${errors.length}`);
  for (const e of errors) console.log(`  - ${e}`);

  const ok = state.childCount > 0 && errors.length === 0;
  console.log(ok ? 'ИТОГ: страница отрисована, ошибок нет' : 'ИТОГ: страница НЕ отрисована или есть ошибки');
  process.exit(ok ? 0 : 1);
})();
