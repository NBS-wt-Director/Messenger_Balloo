#!/usr/bin/env node
// Тикет 1790596191 — живая проверка мобильного правого меню шапки.
//
// Дефект: панель .right-menu append'ится в document.body и позиционируется
// position:fixed (common.css:1842-1860), а «экран» мобильного макета — это
// div.phone-frame 360x760 (calls-history.html:10-11), отцентрованный в body.
// fixed привязан к viewport, не к рамке → панель открывается вне зоны экрана.
//
// Что проверяет:
//   1) панель целиком внутри рамки (right/top/bottom/left не выходят за границы);
//   2) оверлей есть и тоже в рамке;
//   3) клик по оверлею и Escape закрывают панель;
//   4) десктопная страница (без рамки) — панель у правого края окна, как раньше;
//   5) скролл-лок: пока панель открыта, прокручиваемый контент экрана переведён
//      в overflow:hidden (и возвращён после закрытия), колесо под шторой его
//      не двигает; aria: role=dialog, aria-modal, aria-expanded у триггера.
//
// Важно для п.5: проверка требует страницы, где в экране ЕСТЬ прокручиваемый
// контейнер. По умолчанию это mockups/mobile/profile.html (div.phone-scroll
// 2200px в экран 760px). На calls-history.html контент помещается в рамку —
// там лочить нечего, и проверка честно сообщает «невозможно», а не «ок».
//
// Запуск:
//   node scripts/p38-mobile-menu-check.cjs                      # живой макет (профиль)
//   node scripts/p38-mobile-menu-check.cjs --label before       # подпись скринов
//   node scripts/p38-mobile-menu-check.cjs --static --page mockups/mobile/right-menu.html
//   node scripts/p38-mobile-menu-check.cjs --page mockups/balloo-su/chats.html --desktop
// Выход: scripts/p38-shots/mobile-menu-<label>-<имя>.png + таблица мерок,
//        код 1 если панель вне рамки, не закрывается или скролл-лок не работает.

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'scripts', 'node_modules', 'puppeteer'));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/home/ivan/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

const SHOTS = path.join(__dirname, 'p38-shots');
const argv = process.argv.slice(2);
const argVal = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const LABEL = argVal('label', 'check');
const DESKTOP = argv.includes('--desktop');
const PAGE = argVal('page', 'mockups/mobile/profile.html');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function inside(inner, outer) {
  const eps = 1.5; // субпиксели округления рамки
  return {
    ok:
      inner.left >= outer.left - eps &&
      inner.right <= outer.right + eps &&
      inner.top >= outer.top - eps &&
      inner.bottom <= outer.bottom + eps,
    deltaRight: +(outer.right - inner.right).toFixed(1),
    deltaLeft: +(inner.left - outer.left).toFixed(1),
    deltaBottom: +(outer.bottom - inner.bottom).toFixed(1),
    deltaTop: +(inner.top - outer.top).toFixed(1),
  };
}

async function measure(page) {
  return page.evaluate(() => {
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { left: +b.left.toFixed(1), right: +b.right.toFixed(1), top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), width: +b.width.toFixed(1), height: +b.height.toFixed(1) };
    };
    const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
    const menu = document.querySelector('.right-menu');
    const frame = document.querySelector('.phone-frame');
    const overlay = document.querySelector('.right-menu__overlay');
    return {
      menu: r(menu),
      frame: r(frame),
      overlay: r(overlay),
      menuPosition: cs(menu, 'position'),
      menuTransform: cs(menu, 'transform'),
      overlayVisible: overlay ? cs(overlay, 'display') !== 'none' && cs(overlay, 'visibility') !== 'hidden' && +cs(overlay, 'opacity') > 0 : false,
      openClass: menu ? menu.className : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
}

// Статичный сториборд (mobile/right-menu.html): проверять все рамки сразу,
// без кликов — состояния панели в них размечены разметкой.
const STATIC = argv.includes('--static');

// Состояние скролла: какие элементы экрана реально прокручиваются и что с ними
// происходит при открытой панели (тик. 1790596191, правка п.3 — скролл-лок)
function measureScrollLock(page) {
  return page.evaluate(() => {
    const screen = document.querySelector('.phone-frame__screen');
    if (!screen) return { hasScreen: false };
    // Кандидаты: и прокручиваемые сейчас, и уже заблокированные (после лочания
    // overflowY становится hidden, и без second условия выборка ослепала).
    const cands = [...screen.querySelectorAll('*')].filter(
      (el) => !el.closest('.right-menu') && (el.dataset.ballooScrollLock || /auto|scroll/.test(getComputedStyle(el).overflowY))
    );
    const scrollers = cands.filter((el) => el.scrollHeight > el.clientHeight + 1);
    const menu = document.getElementById('balloo-right-menu');
    const btn = document.getElementById('balloo-menu-btn');
    const mcs = menu ? getComputedStyle(menu) : null;
    return {
      hasScreen: true,
      contentScrollers: scrollers.map((el) => ({
        tag: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
        overflowY: getComputedStyle(el).overflowY,
        scrollable: el.scrollHeight > el.clientHeight + 1,
        locked: !!el.dataset.ballooScrollLock,
      })),
      menu: menu
        ? {
            role: menu.getAttribute('role'),
            ariaModal: menu.getAttribute('aria-modal'),
            ariaLabel: menu.getAttribute('aria-label'),
            overflowY: mcs.overflowY,
            scrollableInside: menu.scrollHeight > menu.clientHeight + 1,
          }
        : null,
      btnExpanded: btn ? btn.getAttribute('aria-expanded') : null,
      btnHaspopup: btn ? btn.getAttribute('aria-haspopup') : null,
    };
  });
}

async function measureAllPanels(page) {
  return page.evaluate(() => {
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return { left: +b.left.toFixed(1), right: +b.right.toFixed(1), top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), width: +b.width.toFixed(1), height: +b.height.toFixed(1) };
    };
    return [...document.querySelectorAll('.phone-frame')].map((frame, i) => {
      const panel = frame.querySelector('.right-menu');
      const ov = frame.querySelector('.right-menu__overlay');
      const cs = panel ? getComputedStyle(panel) : null;
      return {
        i,
        frame: r(frame),
        panel: panel ? r(panel) : null,
        overlay: ov ? r(ov) : null,
        position: cs ? cs.position : null,
        visible: panel ? getComputedStyle(panel).visibility !== 'hidden' && cs.display !== 'none' : false,
      };
    });
  });
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = 'file://' + path.join(ROOT, PAGE);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(file, { waitUntil: 'networkidle2', timeout: 60000 });

  const name = path.basename(PAGE, '.html');
  const problems = [];

  if (STATIC) {
    await sleep(500);
    const frames = await measureAllPanels(page);
    const shot = path.join(SHOTS, `mobile-menu-${LABEL}-${name}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    console.log(`=== ${PAGE} [${LABEL}] — сториборд, рамок: ${frames.length} ===`);
    console.log('скрин:', shot);
    frames.forEach((f) => {
      if (!f.panel) { console.log(`  рамка ${f.i + 1}: панели нет`); return; }
      const rel = inside(f.panel, f.frame);
      console.log(`  рамка ${f.i + 1}: панель ${f.panel.left}..${f.panel.right} (w=${f.panel.width}) ` +
        `в рамке ${f.frame.left}..${f.frame.right} → ${rel.ok ? 'OK' : 'ВНЕ'} | position=${f.position} видима=${f.visible} ` +
        `штора=${f.overlay ? 'есть' : 'нет'}`);
      if (!rel.ok) problems.push(`рамка ${f.i + 1}: панель вне экрана (Δright=${rel.deltaRight}, Δleft=${rel.deltaLeft})`);
      if (f.position !== 'absolute') problems.push(`рамка ${f.i + 1}: позиция панели ${f.position}, ожидалась absolute`);
      if (!f.visible) problems.push(`рамка ${f.i + 1}: открытая панель не видима`);
      if (!f.overlay) problems.push(`рамка ${f.i + 1}: нет шторы`);
    });
    await browser.close();
    if (problems.length) { problems.forEach((p) => console.log('  ✗ ' + p)); process.exit(1); }
    console.log('\nOK: все панели внутри рамок');
    return;
  }

  await page.waitForSelector('#balloo-menu-btn', { timeout: 30000 });

  await page.click('#balloo-menu-btn');
  await page.waitForFunction(() => {
    const m = document.querySelector('.right-menu');
    return m && m.classList.contains('right-menu--open');
  }, { timeout: 15000 });
  await sleep(700); // transition 0.3s с запасом

  const m = await measure(page);
  console.log(`=== ${PAGE} [${LABEL}] ===`);
  console.log('viewport :', JSON.stringify(m.viewport));
  console.log('рамка    :', m.frame ? JSON.stringify(m.frame) : '(нет .phone-frame — десктоп)');
  console.log('панель   :', JSON.stringify(m.menu));
  console.log('оверлей  :', m.overlay ? JSON.stringify(m.overlay) : '(нет .right-menu__overlay)');
  console.log('position :', m.menuPosition, '| transform:', m.menuTransform);

  const shotOpen = path.join(SHOTS, `mobile-menu-${LABEL}-${name}.png`);
  await page.screenshot({ path: shotOpen });
  console.log('скрин    :', shotOpen);

  const lockOpen = await measureScrollLock(page);
  console.log('скролл-лок (открыто):', JSON.stringify(lockOpen));

  if (DESKTOP) {
    if (m.menuPosition !== 'fixed') problems.push(`десктоп: position должен быть fixed, получено ${m.menuPosition}`);
    if (Math.abs(m.menu.right - m.viewport.width) > 2) problems.push(`десктоп: панель не у правого края окна (right=${m.menu.right}, viewport=${m.viewport.width})`);
    if (Math.abs(m.menu.top - 56) > 2) problems.push(`десктоп: top должен быть 56, получено ${m.menu.top}`);
  } else {
    if (!m.frame) problems.push('нет .phone-frame — страница не мобильная?');
    else {
      const rel = inside(m.menu, m.frame);
      console.log('панель в рамке:', JSON.stringify(rel));
      if (!rel.ok) problems.push(`панель вне рамки (Δright=${rel.deltaRight}, Δleft=${rel.deltaLeft}, Δbottom=${rel.deltaBottom})`);
      if (!m.overlay) problems.push('нет оверлея .right-menu__overlay');
      else {
        const o = inside(m.overlay, m.frame);
        if (!o.ok) problems.push(`оверлей вне рамки (Δright=${o.deltaRight})`);
        if (!m.overlayVisible) problems.push('оверлей не виден (display/opacity)');
      }
    }
    // Контракт п.3: контент под шторой не скроллится, панель внутри — скроллится
    if (!lockOpen.hasScreen) problems.push('нет .phone-frame__screen — негде лочить скролл');
    if (!lockOpen.contentScrollers.length) {
      problems.push('в экране нет прокручиваемого контента — проверка скролл-лока невозможна (взять --page mockups/mobile/profile.html)');
    }
    lockOpen.contentScrollers.forEach((s) => {
      if (s.overflowY !== 'hidden' || !s.locked) problems.push(`контент под шторой прокручивается: ${s.tag} overflowY=${s.overflowY} locked=${s.locked}`);
    });
    if (!lockOpen.menu) problems.push('нет панели для проверки aria');
    else {
      if (lockOpen.menu.role !== 'dialog') problems.push(`role панели = ${lockOpen.menu.role}, ожидался dialog`);
      if (lockOpen.menu.ariaModal !== 'true') problems.push(`aria-modal открытой панели = ${lockOpen.menu.ariaModal}`);
      if (!lockOpen.menu.ariaLabel) problems.push('у панели нет aria-label');
      if (lockOpen.menu.overflowY !== 'auto') problems.push(`панель не умеет скроллиться (overflowY=${lockOpen.menu.overflowY})`);
    }
    if (lockOpen.btnExpanded !== 'true') problems.push(`aria-expanded кнопки при открытой панели = ${lockOpen.btnExpanded}`);

    // Пользовательская проба: крутим колесо над контентом под шторой.
    // Программный scrollTop сдвинется и при overflow:hidden, поэтому меряем
    // именно wheel. Сдвинуться не должен ни контент, ни холст макета.
    // Полоса шторы между левым краем экрана и панелью: панель занимает
    // 320px из 360px, поэтому брать надо левее панели, иначе колесо уйдёт
    // в саму панель, а не под штору.
    const wheelArea = {
      x: Math.max(Math.round(m.frame.left) + 6, Math.round(m.menu.left) - 8),
      y: Math.round((m.overlay.top + m.overlay.bottom) / 2),
    };
    const before = await page.evaluate(() => {
      const screen = document.querySelector('.phone-frame__screen');
      const el = [...screen.querySelectorAll('*')].find((n) => !n.closest('.right-menu') && n.dataset.ballooScrollLock);
      return { content: el ? el.scrollTop : null, page: window.scrollY, has: !!el };
    });
    await page.mouse.move(wheelArea.x, wheelArea.y);
    await page.mouse.wheel({ deltaY: 240 });
    await sleep(400);
    const after = await page.evaluate(() => {
      const screen = document.querySelector('.phone-frame__screen');
      const el = [...screen.querySelectorAll('*')].find((n) => !n.closest('.right-menu') && n.dataset.ballooScrollLock);
      return { content: el ? el.scrollTop : null, page: window.scrollY };
    });
    console.log('wheel под шторой:', JSON.stringify({ wheelArea, before, after }));
    if (!before.has) problems.push('не найден заблокированный элемент для пробы колесом');
    else if (after.content !== before.content) problems.push(`контент под шторой прокручен колесом на ${after.content - before.content}px`);
    // Холст макета (window) под шторой крутиться может: курсор стоит на шторе,
    // а она не является прокручиваемым предком контента. Это артефакт
    // десктопного просмотра макета, а не нарушение контракта — фиксируем факт.
    console.log('холст макета под шторой:', after.page === before.page ? 'не двигается' : `сдвиг на ${after.page - before.page}px (справочно)`);

    // Панель: overflow-y auto (скроллится она, не подменю — подменю разворачивается
    // inline, .right-menu__submenu без своего overflow). Если содержимое больше
    // высоты — обязано прокручиваться; если помещается — фиксировать как факт.
    const subSel = '.right-menu [data-submenu-toggle="lang"]';
    const subOpened = await page.evaluate((sel) => {
      const t = document.querySelector(sel);
      if (!t) return false;
      t.click();
      return true;
    }, subSel);
    await sleep(500);
    const menuScroll = await page.evaluate(() => {
      const menu = document.getElementById('balloo-right-menu');
      const sub = menu.querySelector('[data-submenu="lang"]');
      const items = menu.querySelectorAll('[data-lang-option]').length;
      const before = menu.scrollTop;
      menu.scrollTop = before + 150;
      return {
        subDisplay: sub ? getComputedStyle(sub).display : null,
        langItems: items,
        scrollHeight: menu.scrollHeight,
        clientHeight: menu.clientHeight,
        moved: menu.scrollTop - before,
      };
    });
    console.log('скролл внутри панели:', JSON.stringify({ subOpened, ...menuScroll }));
    if (!subOpened) problems.push('в панели нет переключателя подменю языка');
    else if (menuScroll.subDisplay !== 'flex') problems.push(`подменю языка не раскрылось (display=${menuScroll.subDisplay})`);
    if (menuScroll.scrollHeight > menuScroll.clientHeight + 1 && menuScroll.moved <= 0) {
      problems.push(`содержимое панели (${menuScroll.scrollHeight}px) больше панели (${menuScroll.clientHeight}px), но не прокручивается`);
    }
  }

  // закрытие по Escape
  await page.keyboard.press('Escape');
  await sleep(450);
  let stillOpen = await page.evaluate(() => {
    const el = document.querySelector('.right-menu');
    return el ? el.classList.contains('right-menu--open') : false;
  });
  if (stillOpen) problems.push('Escape не закрывает панель');

  // После закрытия скролл-лок снят, aria возвращены
  if (!DESKTOP) {
    const lockClosed = await measureScrollLock(page);
    console.log('скролл-лок (закрыто):', JSON.stringify(lockClosed));
    lockClosed.contentScrollers.forEach((s) => {
      if (s.overflowY === 'hidden' || s.locked) problems.push(`скролл-лок не снят: ${s.tag} overflowY=${s.overflowY} locked=${s.locked}`);
    });
    if (lockClosed.menu && lockClosed.menu.ariaModal !== 'false') problems.push(`aria-modal закрытой панели = ${lockClosed.menu.ariaModal}`);
    if (lockClosed.btnExpanded !== 'false') problems.push(`aria-expanded кнопки после закрытия = ${lockClosed.btnExpanded}`);
  }

  // повторное открытие + клик по оверлею
  await page.click('#balloo-menu-btn');
  await sleep(450);
  if (m.overlay) {
    // Штора перекрывает весь экран, панель — правые 320px из 360px. Центр
    // оверлея приходится на панель, поэтоку кликать надо в полосе слева от неё.
    const pt = {
      x: Math.max(Math.round(m.frame ? m.frame.left : m.overlay.left) + 6, Math.round(m.menu.left) - 8),
      y: Math.round((m.overlay.top + m.overlay.bottom) / 2),
    };
    const hit = await page.evaluate((p) => {
      const el = document.elementFromPoint(p.x, p.y);
      return el ? el.className || el.tagName.toLowerCase() : null;
    }, pt);
    console.log('клик по шторе:', JSON.stringify(pt), 'элемент под точкой:', hit);
    await page.mouse.click(pt.x, pt.y);
    await sleep(450);
    stillOpen = await page.evaluate(() => {
      const el = document.querySelector('.right-menu');
      return el ? el.classList.contains('right-menu--open') : false;
    });
    if (stillOpen) problems.push('клик по оверлею не закрывает панель');
  }

  await browser.close();

  if (problems.length) {
    console.log('\nПРОБЛЕМЫ:');
    problems.forEach((p) => console.log('  ✗ ' + p));
    process.exit(1);
  }
  console.log('\nOK: панель в нужной области, закрытие Escape/оверлеем работает');
})();
