// P34: скриншот-сверка web-чата с макетом mockups/balloo-su/chats.html по 3 темам.
// Запуск: node scripts/p34-screenshot-check.cjs
// Требует: dev-сервер web (:5173) + мок-API (:3100) — скрипт поднимает их сам.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PUPPETEER = path.join(ROOT, 'scripts', 'node_modules', 'puppeteer');
const MOCK_PORT = 3199;
const WEB_PORT = 5173;
const OUT = path.join(__dirname, 'p34-shots');

const THEMES = ['dark', 'light', 'russian'];

// Ключевые элементы и проверяемые computed-свойства (макет → web):
// селекторы идентичны, т.к. chat.css перенесён из common.css 1-в-1.
const CHECKS = [
  {
    name: 'bubble-sender',
    selMock: '.message--sender .message__bubble',
    selWeb: '.message--sender .message__bubble',
    props: ['clip-path', 'border-right-width', 'border-right-color', 'background-color', 'border-top-left-radius'],
  },
  {
    name: 'bubble-receiver',
    selMock: '.message--receiver .message__bubble',
    selWeb: '.message--receiver .message__bubble',
    props: ['clip-path', 'border-left-width', 'border-left-color', 'border-top-right-radius'],
  },
  {
    name: 'avatar-octagon',
    selMock: '.sidebar .list__item .avatar--md',
    selWeb: '.sidebar .list__item .avatar--md',
    props: ['clip-path', 'width', 'height'],
  },
  {
    name: 'list-item',
    selMock: '.sidebar .list__item',
    selWeb: '.sidebar .list__item',
    props: ['padding', 'border-bottom-color', 'gap'],
  },
  {
    name: 'badge',
    // >99 непрочитанных: badge--square-dot есть и в макете («Семья»), и в web (канал)
    selMock: '.sidebar .list__item .badge--square-dot',
    selWeb: '.sidebar .list__item .badge--square-dot',
    props: ['border-color', 'width', 'height', 'border-width'],
  },
  {
    name: 'input-field',
    selMock: '.input-area__field',
    selWeb: '.input-area__field',
    props: ['background-color', 'color', 'font-size', 'min-height', 'border-radius'],
  },
  {
    name: 'input-btn',
    selMock: '.input-area__btn--send',
    selWeb: '.input-area__btn--send',
    props: ['width', 'height', 'color'],
  },
  {
    name: 'poll-option',
    selMock: '.poll__option',
    selWeb: '.poll__option',
    props: ['background-color', 'padding'],
  },
  {
    name: 'typing-dot',
    selMock: '.typing__dot',
    selWeb: '.typing__dot',
    props: ['width', 'height', 'background-color'],
  },
  {
    name: 'msg-ticks',
    selMock: '.msg-ticks--read',
    selWeb: '.msg-ticks--read',
    props: ['color', 'font-size'],
  },
  {
    name: 'reaction-chip',
    selMock: '.message__reaction',
    selWeb: '.message__reaction',
    props: ['background-color', 'border-color', 'font-size', 'border-radius'],
  },
  {
    name: 'theme-bg',
    selMock: 'body',
    selWeb: 'body',
    props: ['background-color'],
  },
];

const normColor = (c) => {
  // rgba(0, 0, 0, 0) → transparent; привести к строке вида rgb/rgba
  return c.replace(/\s+/g, ' ').trim();
};

async function collectStyles(page, sel, props) {
  return page.evaluate((sel, props) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const out = {};
    props.forEach((p) => {
      out[p] = cs.getPropertyValue(p).replace(/\s+/g, ' ').trim();
    });
    return out;
  }, sel, props);
}

// typing-индикатор в web появляется только по WS-событию (runtime-состояние).
// Для сверки CSS инъектируем тестовый элемент с теми же классами в оба документа.
async function ensureTypingDot(page) {
  await page.evaluate(() => {
    if (document.querySelector('.typing__dot')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<span class="typing"><span class="typing__dots"><span class="typing__dot"></span><span class="typing__dot"></span><span class="typing__dot"></span></span></span>';
    document.body.appendChild(wrap);
  });
}

function diffStyles(mock, web, props) {
  const diffs = [];
  props.forEach((p) => {
    const a = normColor(String(mock?.[p] ?? ''));
    const b = normColor(String(web?.[p] ?? ''));
    if (a !== b) diffs.push(`${p}: mock="${a}" web="${b}"`);
  });
  return diffs;
}

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

  // --- Поднимаем мок-API ---
  const mockProc = spawn('node', [path.join(__dirname, 'p34-mock-api.cjs')], { stdio: 'inherit' });
  await waitForServer(`http://localhost:${MOCK_PORT}/api/users/me`);

  // --- Поднимаем dev-сервер web ---
  const webProc = spawn('pnpm', ['exec', 'vite', '--port', String(WEB_PORT), '--strictPort'], {
    cwd: path.join(ROOT, 'packages', 'web'),
    stdio: 'pipe',
    env: { ...process.env, VITE_API_URL: `http://localhost:${MOCK_PORT}` },
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
      // ===== 1. Скриншот макета =====
      const mockPage = await browser.newPage();
      await mockPage.setViewport({ width: 1440, height: 900 });
      const mockUrl = 'file://' + path.join(ROOT, 'mockups', 'balloo-su', 'chats.html');
      await mockPage.goto(mockUrl, { waitUntil: 'networkidle0' });
      await mockPage.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      await sleep(400);
      await mockPage.screenshot({ path: path.join(OUT, `mockup-${theme}.png`), fullPage: false });

      // Стили макета
      const mockStyles = {};
      for (const c of CHECKS) {
        mockStyles[c.name] = await collectStyles(mockPage, c.selMock, c.props);
      }

      // ===== 2. Скриншот web =====
      const webPage = await browser.newPage();
      await webPage.setViewport({ width: 1440, height: 900 });
      // Тема через cookie (uiStore читает cookie balloo-theme)
      await webPage.setCookie({ name: 'balloo-theme', value: theme, domain: 'localhost', path: '/' });
      await webPage.goto(`http://localhost:${WEB_PORT}/#/chat/chat1`, { waitUntil: 'networkidle2', timeout: 60000 });
      // Ждём рендер чата (load chat + messages)
      await webPage.waitForSelector('.message__bubble', { timeout: 20000 }).catch(() => {});
      await webPage.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      await sleep(800);
      await webPage.screenshot({ path: path.join(OUT, `web-${theme}.png`), fullPage: false });

      // Стили web
      // typing-dot — runtime-состояние (WS), инъекция тестового элемента для сверки CSS
      await ensureTypingDot(webPage);
      const webStyles = {};
      for (const c of CHECKS) {
        webStyles[c.name] = await collectStyles(webPage, c.selWeb, c.props);
      }

      // ===== 3. Сверка =====
      const themeLine = { theme, checks: [] };
      for (const c of CHECKS) {
        const m = mockStyles[c.name];
        const w = webStyles[c.name];
        if (!m || !w) {
          themeLine.checks.push({ name: c.name, status: 'MISSING', mock: !!m, web: !!w });
          failed++;
          continue;
        }
        const diffs = diffStyles(m, w, c.props);
        // clip-path у body-фона зависит от темы только через переменные — сверяем как есть
        themeLine.checks.push({
          name: c.name,
          status: diffs.length === 0 ? 'OK' : 'DIFF',
          diffs,
        });
        if (diffs.length > 0) failed++;
      }
      report.push(themeLine);
      await webPage.close();
    }
  } finally {
    await browser.close();
    mockProc.kill();
    webProc.kill();
  }

  // Отчёт
  const reportPath = path.join(OUT, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n===== P34 SCREENSHOT CHECK REPORT =====');
  for (const r of report) {
    console.log(`\n--- theme: ${r.theme} ---`);
    for (const c of r.checks) {
      console.log(`  [${c.status}] ${c.name}`);
      (c.diffs || []).forEach((d) => console.log(`        ${d}`));
    }
  }
  console.log(`\nШриншоты: ${OUT}`);
  console.log(`Итог: ${failed === 0 ? 'PASS (все проверки стилей совпали)' : `FAIL (${failed} расхождений)`}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});