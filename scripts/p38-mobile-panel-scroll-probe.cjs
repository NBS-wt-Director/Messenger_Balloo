#!/usr/bin/env node
// Тикет 1790596191 — съёмка фактов: что реально прокручивается внутри панели
// мобильного правого меню при раскрытом списке языков. Нужен, чтобы не
// придумывать контракт «скроллится внутри панели», а измерить его.
//
// Запуск: node scripts/p38-mobile-panel-scroll-probe.cjs

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

const PAGE = process.argv[2] || 'mockups/mobile/calls-history.html';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file://' + path.join(ROOT, PAGE), { waitUntil: 'networkidle2' });
  await page.waitForSelector('#balloo-menu-btn');
  await page.click('#balloo-menu-btn');
  await new Promise((r) => setTimeout(r, 500));

  const dump = async (tag) => {
    const d = await page.evaluate(() => {
      const menu = document.getElementById('balloo-right-menu');
      const all = [menu, ...menu.querySelectorAll('*')];
      return {
        menuRect: (() => {
          const b = menu.getBoundingClientRect();
          return { top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height) };
        })(),
        scrollable: all
          .filter((el) => el.scrollHeight > el.clientHeight + 1)
          .map((el) => ({
            cls: String(el.className).slice(0, 46),
            oy: getComputedStyle(el).overflowY,
            sh: el.scrollHeight,
            ch: el.clientHeight,
          })),
        langCount: menu.querySelectorAll('[data-lang-option]').length,
        subOpen: !!menu.querySelector('.right-menu__submenu--open'),
      };
    });
    console.log(tag, JSON.stringify(d));
    return d;
  };

  await dump('закрыто/только панель :');
  const clicked = await page.evaluate(() => {
    const t = document.querySelector('#balloo-right-menu [data-submenu-toggle="lang"]');
    if (!t) return false;
    t.click();
    return true;
  });
  await new Promise((r) => setTimeout(r, 500));
  if (!clicked) console.log('!! в панели нет переключателя подменю языка');
  const open = await dump('языки раскрыты      :');

  // реальный wheel внутри самого прокручиваемого элемента панели
  const target = await page.evaluate(() => {
    const menu = document.getElementById('balloo-right-menu');
    const el = [menu, ...menu.querySelectorAll('*')].find((n) => n.scrollHeight > n.clientHeight + 1);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { cls: String(el.className).slice(0, 40), x: Math.round(b.left + b.width / 2), y: Math.round(b.top + Math.min(b.height / 2, 200)), before: el.scrollTop };
  });
  if (target) {
    await page.mouse.move(target.x, target.y);
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise((r) => setTimeout(r, 400));
    const after = await page.evaluate((cls) => {
      const menu = document.getElementById('balloo-right-menu');
      const el = [...menu.querySelectorAll('*')].find((n) => String(n.className).startsWith(cls)) || menu;
      return el.scrollTop;
    }, target.cls);
    console.log('wheel внутри панели   :', JSON.stringify({ ...target, after, moved: after - target.before }));
  } else {
    console.log('wheel внутри панели   : ни один элемент панели не прокручивается');
  }

  await page.screenshot({ path: path.join(__dirname, 'p38-shots', 'panel-scroll-probe.png') });
  await browser.close();
})();
