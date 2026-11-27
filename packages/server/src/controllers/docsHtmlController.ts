// docsHtmlController — HTML-страница API документации по GET /docs
// Узел у_07 (docs.balloo.su — API документация). Решение владельца: адрес
// документации — api.balloo.su/docs. Рендер из docsData (тот же источник,
// что JSON-эндпоинты /api/docs/*), без внешних CDN (CSP прода).
//
// U1–U3 (тик. 1795683301, §4 P1–P3): страница больше не рисует собственную
// шапку/подвал. Разметка и стили приведены к единым требованиям системы:
//   • шапка — те же пункты, что в лого-меню остальных узлов (+ «Поддержка»,
//     «О компании», «Поддержать нас» в меню подвала);
//   • подвал — та же структура, что @balloo/ui/Footer: copyright → меню,
//     морзе-тикер, «Поддержка», морзе-тикер, правовой блок;
//   • прокрутка есть всегда, полоса скрыта (U2), горизонтальные отступы
//     контента 24px / 16px на мобиле (U3).
// Меню подвала и шапки — на <details>, чтобы работать без JS (сервер отдаёт
// статический HTML; CSP прода запрещает inline-скрипты).

import { Request, Response } from 'express';
import { toMorse } from '@balloo/shared';
import {
  API_MODULES,
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  QUICK_START,
} from '../services/docsData';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Морзе-паттерн в разметку подвала — те же классы, что у @balloo/ui. */
function morseCells(text: string): string {
  const pattern = toMorse(text);
  return pattern
    .split('')
    .map((ch) => {
      if (ch === '.') return '<i class="balloo-footer__morse balloo-footer__morse--dot"></i>';
      if (ch === '-') return '<i class="balloo-footer__morse balloo-footer__morse--dash"></i>';
      if (ch === '/') return '<i class="balloo-footer__morse balloo-footer__morse--wordgap"></i>';
      if (ch === ' ') return '<i class="balloo-footer__morse balloo-footer__morse--gap"></i>';
      return '';
    })
    .join('');
}

/** Один тикер подвала (направление — к центру, как в @balloo/ui). */
function ticker(text: string, direction: 'ltr' | 'rtl'): string {
  const cells = morseCells(text);
  return `<div class="balloo-footer__ticker-wrap">
      <div class="balloo-footer__ticker balloo-footer__ticker--${direction}">
        <div class="balloo-footer__ticker-track">
          <span class="balloo-footer__ticker-run">${cells}</span>
          <span class="balloo-footer__ticker-run">${cells}</span>
        </div>
      </div>
      <span class="balloo-footer__morse-tip" role="tooltip">${esc(text)}</span>
    </div>`;
}

// Пункты меню шапки — те же, что в @balloo/ui/ecosystem (тик. 1794575221).
const HEADER_MENU = [
  { label: '💬 Balloo', href: 'https://balloo.su/#/chat' },
  { label: '🛡️ Admin', href: 'https://admin.balloo.su/' },
  { label: '💡 Features', href: 'https://features.balloo.su/' },
  { label: '📜 History', href: 'https://history.balloo.su/#/history' },
  { label: '⬇️ Download', href: 'https://download.balloo.su/#/download' },
];

// Меню подвала — 5 пунктов по требованию владельца (тик. 1795507295).
const FOOTER_MENU = [
  { label: 'О компании', href: 'https://balloo.su/#/about-company' },
  { label: 'Контакты', href: 'https://balloo.su/#/coming-soon?name=%D0%9A%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D1%8B' },
  { label: 'О Balloo', href: 'https://balloo.su/#/about-balloo' },
  { label: 'Другие проекты компании', href: 'https://balloo.su/#/coming-soon?name=%D0%94%D1%80%D1%83%D0%B3%D0%B8%D0%B5%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D1%8B%20%D0%BA%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D0%B8' },
  { label: 'Поддержать нас', href: 'https://balloo.su/#/donat' },
];

export function getDocsHtml(_req: Request, res: Response): void {
  const modulesHtml = API_MODULES.map(
    (mod) => `
    <section class="module">
      <h2>${esc(mod.name)}</h2>
      <p class="mod-desc">${esc(mod.description)}</p>
      <table>
        <thead><tr><th>Метод</th><th>Путь</th><th>Описание</th><th>Auth</th></tr></thead>
        <tbody>
          ${mod.endpoints
            .map(
              (ep) => `<tr>
            <td class="m m-${ep.method.toLowerCase()}">${esc(ep.method)}</td>
            <td><code>https://api.balloo.su${esc(ep.path)}</code></td>
            <td>${esc(ep.description)}</td>
            <td>${ep.auth ? '🔒 Bearer' : '🌐 публичный'}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </section>`,
  ).join('');

  const wsHtml = (events: typeof WS_CLIENT_EVENTS, dir: string) => `
    <h3>${dir}</h3>
    <table>
      <thead><tr><th>Событие</th><th>Полезная нагрузка</th></tr></thead>
      <tbody>
        ${events
          .map(
            (e) =>
              `<tr><td><code>${esc(e.event)}</code></td><td>${esc(
                e.description,
              )}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>`;

  const errorsHtml = `
    <table>
      <thead><tr><th>Код</th><th>Название</th><th>Описание</th></tr></thead>
      <tbody>
        ${ERROR_CODES.map(
          (e) =>
            `<tr><td><code>${e.code}</code></td><td>${esc(e.name)}</td><td>${esc(
              e.description,
            )}</td></tr>`,
        ).join('')}
      </tbody>
    </table>`;

  const quickStartHtml = QUICK_START.map(
    (q) => `
    <div class="qs">
      <h3>${esc(q.title)}</h3>
      ${q.description ? `<p>${esc(q.description)}</p>` : ''}
      <pre>${esc(q.code)}</pre>
    </div>`,
  ).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Balloo API — документация</title>
  <style>
    /* Палитра фирменной темы «Наша» (russian): флаг РФ + золото (тик. 1794575221) */
    :root { --accent: #c9a227; --bg: #0a0c10; --card: #141821; --border: #243040;
            --border-strong: #33425a; --bg-secondary: #0e1118; --bg-hover: #1b2230;
            --text: #f4f0e8; --text-primary: #f4f0e8; --text-secondary: #c8d0dc;
            --text-muted: #b0b8c8; --danger: #d52b1e;
            --shadow: 0 8px 24px rgba(0, 0, 0, 0.45); }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* U2 (тик. 1795683301): прокрутка есть всегда, полоса не видна.
       width:0 + height:0 вместо display:none — display:none ломает прокрутку
       в некоторых Chromium (элемент становится непрокручиваемым). */
    * { scrollbar-width: none; -ms-overflow-style: none; }
    ::-webkit-scrollbar { width: 0; height: 0; background: transparent; }

    html, body { height: 100%; }
    body { color: var(--text);
           background:
             linear-gradient(45deg,
               rgba(255, 255, 255, 0.22) 0%,
               rgba(0, 57, 166, 0.38) 50%,
               rgba(213, 43, 30, 0.42) 100%),
             var(--bg);
           background-attachment: fixed;
           overflow: hidden;
           font: 15px/1.6 Inter, Manrope, system-ui, sans-serif; }

    /* Каркас страницы: шапка → скролл-контент → подвал (как PageChrome в SPA). */
    .page-chrome { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

    /* ── Единая шапка экосистемы (макет mockups/docs-balloo-su/api-docs.html) ── */
    .topbar { flex-shrink: 0; display: flex; align-items: center; height: 56px;
              padding: 0 16px; gap: 12px; background: var(--card);
              border-bottom: 1px solid var(--border); position: relative; z-index: 100; }
    .topbar__menu { position: relative; display: flex; align-items: center; gap: 8px;
                    font-weight: 700; font-size: 18px; color: var(--text); }
    .topbar__menu summary { display: flex; align-items: center; gap: 8px;
                            list-style: none; cursor: pointer; }
    .topbar__menu summary::-webkit-details-marker { display: none; }
    .topbar__logo-icon { width: 32px; height: 32px; background: var(--accent);
                         color: #1a1d21; display: grid; place-items: center;
                         font-size: 16px; font-weight: 900; }
    .topbar__dropdown { position: absolute; top: calc(100% + 8px); left: 0;
                        min-width: 240px; background: var(--card);
                        border: 1px solid var(--border-strong);
                        box-shadow: var(--shadow); padding: 8px 0; z-index: 110; }
    .topbar__dropdown-item { display: flex; align-items: center; gap: 10px;
                             padding: 10px 16px; font-size: 14px; color: var(--text);
                             text-decoration: none; cursor: pointer; }
    .topbar__dropdown-item:hover { background: var(--bg-hover); }
    .topbar__dropdown-item--current { color: var(--accent); font-weight: 700; }
    .topbar__dropdown-divider { height: 1px; background: var(--border); margin: 8px 0; }
    .topbar__title { flex: 1; text-align: center; font-size: 16px; font-weight: 600;
                     color: var(--text); }
    .topbar__right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .topbar__right a { color: var(--text-muted); text-decoration: none; font-size: 14px; }
    .topbar__right a:hover { color: var(--accent); }

    /* U2/U3: контент прокручивается внутри, отступы от краёв обязательны. */
    .page-container { flex: 1 1 auto; min-height: 0; overflow-y: auto;
                      max-width: 1080px; width: 100%; margin: 0 auto;
                      padding: 32px 24px; }
    @media (max-width: 768px) { .page-container { padding: 24px 16px; } }

    main > p, section { background: var(--card); border: 1px solid var(--border);
            border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    main > p { padding: 16px 20px; }
    h2 { font-size: 22px; margin: 8px 0; border-left: 3px solid var(--accent);
         padding-left: 12px; }
    section > h2:first-child { margin-top: 0; }
    h3 { font-size: 16px; margin: 20px 0 8px; color: var(--text-muted); }
    .mod-desc { color: var(--text-muted); margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px;
            font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-weight: 600; }
    code { background: var(--bg); padding: 2px 6px; border-radius: 3px;
           font: 12px/1.5 "JetBrains Mono", monospace; word-break: break-all; }
    .m { font-weight: 700; font-size: 12px; }
    .m-get { color: #1565c0; } .m-post { color: var(--accent); }
    .m-put, .m-patch { color: #ffb300; } .m-delete { color: var(--danger); }
    pre { background: var(--bg); border: 1px solid var(--border); padding: 16px;
          overflow-x: auto; font-size: 13px; border-radius: 4px; }
    .qs { margin-bottom: 24px; }
    .json-links a { color: var(--accent); }

    /* ── Единый подвал (@balloo/ui/Footer, тик. 1795507295): одна строка ── */
    .balloo-footer { flex-shrink: 0; height: 36px; display: flex; align-items: center;
                     padding: 0 16px; background: var(--bg-secondary);
                     border-top: 1px solid var(--border); font-size: 12px;
                     color: var(--text-muted); gap: 12px; z-index: 50; }
    .balloo-footer__left { position: relative; display: flex; align-items: center;
                           gap: 12px; min-width: 0; }
    .balloo-footer__copyright { background: none; border: none; padding: 0;
                                font: inherit; color: inherit; cursor: pointer;
                                white-space: nowrap; }
    .balloo-footer__copyright:hover { color: var(--text-primary); }
    .balloo-footer__menu { position: absolute; bottom: 100%; left: 0; margin-bottom: 6px;
                           min-width: 230px; display: flex; flex-direction: column;
                           background: var(--bg-secondary); border: 1px solid var(--border-strong);
                           box-shadow: var(--shadow); z-index: 60; }
    .balloo-footer__menu-item { display: block; padding: 8px 14px; color: var(--text-primary);
                                text-decoration: none; white-space: nowrap; }
    .balloo-footer__menu-item:hover { background: var(--bg-hover); color: var(--accent); }
    .balloo-footer__ticker-wrap { flex: 1 1 0; position: relative; height: 100%;
                                  min-width: 24px; display: flex; align-items: center; }
    .balloo-footer__ticker { flex: 1 1 auto; position: relative; height: 100%;
                             min-width: 0; overflow: hidden; display: flex;
                             align-items: center; }
    .balloo-footer__morse-tip { position: absolute; bottom: calc(100% + 8px); left: 50%;
                                transform: translateX(-50%) translateY(4px);
                                max-width: 60vw; padding: 6px 10px;
                                background: var(--bg-secondary); color: var(--text-primary);
                                border: 1px solid var(--border-strong); box-shadow: var(--shadow);
                                font-size: 12px; line-height: 1.3; white-space: nowrap;
                                overflow: hidden; text-overflow: ellipsis; opacity: 0;
                                visibility: hidden; pointer-events: none;
                                transition: opacity .15s ease, transform .15s ease, visibility .15s;
                                z-index: 70; }
    .balloo-footer__ticker-wrap:hover .balloo-footer__morse-tip,
    .balloo-footer__ticker-wrap:focus-within .balloo-footer__morse-tip {
      opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
    .balloo-footer__ticker-track { display: flex; flex-wrap: nowrap; align-items: center;
                                   will-change: transform; animation-timing-function: linear;
                                   animation-iteration-count: infinite; }
    .balloo-footer__ticker--ltr .balloo-footer__ticker-track {
      animation-name: balloo-morse-to-center-left; animation-duration: 24s; }
    .balloo-footer__ticker--rtl .balloo-footer__ticker-track {
      animation-name: balloo-morse-to-center-right; animation-duration: 24s; }
    .balloo-footer__ticker-run { display: flex; flex-wrap: nowrap; align-items: center;
                                 flex-shrink: 0; }
    .balloo-footer__morse { display: block; flex-shrink: 0; height: 4px; margin: 0 2px;
                            background: var(--accent); }
    .balloo-footer__morse--dot { width: 4px; border-radius: 50%; }
    .balloo-footer__morse--dash { width: 12px; }
    .balloo-footer__morse--gap { width: 6px; margin: 0; background: transparent; }
    .balloo-footer__morse--wordgap { width: 18px; margin: 0; background: transparent; }
    @keyframes balloo-morse-to-center-left { from { transform: translateX(-50%); } to { transform: translateX(0); } }
    @keyframes balloo-morse-to-center-right { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @media (prefers-reduced-motion: reduce) {
      .balloo-footer__ticker-track { animation: none; transform: translateX(0); }
    }
    .balloo-footer__links { display: flex; align-items: center; gap: 14px; }
    .balloo-footer__link { cursor: pointer; white-space: nowrap; color: var(--text-muted);
                           text-decoration: none; }
    .balloo-footer__link:hover { color: var(--accent); }
    @media (max-width: 600px) {
      .balloo-footer { height: auto; flex-direction: column; gap: 4px; padding: 6px 12px; }
      .balloo-footer__ticker-wrap { min-width: 48px; height: 12px; }
      .balloo-footer__morse { height: 3px; }
      .topbar { padding: 0 10px; gap: 8px; }
      .topbar__title { display: none; }
    }
  </style>
</head>
<body>
  <div class="page-chrome">
    <header class="topbar">
      <details class="topbar__menu">
        <summary title="Разделы Balloo">
          <span class="topbar__logo-icon">B</span>
          <span>API Docs</span>
        </summary>
        <nav class="topbar__dropdown">
          ${HEADER_MENU.map(
            (m) => `<a class="topbar__dropdown-item" href="${m.href}">${m.label}</a>`,
          ).join('\n          ')}
          <div class="topbar__dropdown-divider"></div>
          <span class="topbar__dropdown-item topbar__dropdown-item--current">📚 API Docs (текущий)</span>
        </nav>
      </details>
      <div class="topbar__title">API Documentation</div>
      <div class="topbar__right">
        <a href="https://balloo.su/#/support">Поддержка</a>
        <a href="https://balloo.su">← balloo.su</a>
      </div>
    </header>

    <div class="page-container">
      <main>
        <p>REST + WebSocket API мессенджера Balloo. База:
          <code>https://api.balloo.su/api</code>, WS:
          <code>wss://api.balloo.su/ws/</code>.
          Машиночитаемая спецификация:
          <span class="json-links"><a href="/api/docs/spec">OpenAPI JSON</a> ·
          <a href="/api/docs/endpoints">endpoints</a> ·
          <a href="/api/docs/ws">ws-events</a> ·
          <a href="/api/docs/errors">errors</a></span>
        </p>
        ${quickStartHtml ? `<section><h2>Быстрый старт</h2>${quickStartHtml}</section>` : ''}
        <section><h2>REST эндпоинты</h2>${modulesHtml}</section>
        <section><h2>WebSocket события</h2>
          ${wsHtml(WS_CLIENT_EVENTS, 'Клиент → Сервер')}
          ${wsHtml(WS_SERVER_EVENTS, 'Сервер → Клиент')}
        </section>
        <section><h2>Коды ошибок</h2>${errorsHtml}</section>
      </main>
    </div>

    <footer class="balloo-footer">
      <div class="balloo-footer__left">
        <details>
          <summary class="balloo-footer__copyright" title="Меню Balloo">© Balloo Messenger 2026</summary>
          <nav class="balloo-footer__menu">
            ${FOOTER_MENU.map(
              (m) => `<a class="balloo-footer__menu-item" href="${m.href}">${esc(m.label)}</a>`,
            ).join('\n            ')}
          </nav>
        </details>
      </div>

      ${ticker('Переверни общение!', 'ltr')}

      <a class="balloo-footer__link" href="https://balloo.su/#/support">Поддержка</a>

      ${ticker('API Balloo — документация', 'rtl')}

      <div class="balloo-footer__links">
        <a class="balloo-footer__link" href="https://balloo.su/#/rules">Правила</a>
        <a class="balloo-footer__link" href="https://balloo.su/#/privacy">Конфиденциальность</a>
        <a class="balloo-footer__link" href="https://balloo.su/#/cookies">Cookies</a>
      </div>
    </footer>
  </div>
</body>
</html>`);
}
