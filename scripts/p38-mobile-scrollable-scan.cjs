#!/usr/bin/env node
// Тикет 1790596191 — поиск мобильных макетов, где контент экрана реально
// прокручивается. Нужен, чтобы проверить скролл-лок правого меню на живом
// скролле, а не на странице, где всё помещается в 760px рамки.
//
// Запуск: node scripts/p38-mobile-scrollable-scan.cjs

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

const DIR = path.join(ROOT, 'mockups', 'mobile');

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).sort();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('файл'.padEnd(30), 'скроллов в экране', 'панель: элементов/высота');
  const withScroll = [];
  for (const f of files) {
    await page.goto('file://' + path.join(DIR, f), { waitUntil: 'load', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 350));
    const info = await page.evaluate(() => {
      const screen = document.querySelector('.phone-frame__screen');
      if (!screen) return { screen: false, scrollers: 0, detail: [] };
      const scrollers = [...screen.querySelectorAll('*')].filter((el) => {
        if (el.closest('.right-menu')) return false;
        const cs = getComputedStyle(el);
        return /auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
      });
      return {
        screen: true,
        scrollers: scrollers.length,
        detail: scrollers.map((el) => `${el.tagName.toLowerCase()}[${el.className || el.getAttribute('style') || ''}] ${el.scrollHeight}>${el.clientHeight}`),
      };
    });
    if (info.scrollers) withScroll.push(f);
    console.log(
      f.padEnd(30),
      String(info.scrollers).padStart(18),
      '   ', info.detail.join(' | ') || (info.screen ? '' : '(нет экрана)')
    );
  }
  await browser.close();
  console.log('\nстраницы с прокручиваемым контентом:', withScroll.join(', ') || '(нет ни одной)');
})();
