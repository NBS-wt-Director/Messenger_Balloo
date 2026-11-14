// docsHtmlController — HTML-страница API документации по GET /docs
// Узел у_07 (docs.balloo.su — API документация). Решение владельца: адрес
// документации — api.balloo.su/docs. Рендер из docsData (тот же источник,
// что JSON-эндпоинты /api/docs/*), без внешних CDN (CSP продa).

import { Request, Response } from 'express';
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
            --text: #f4f0e8; --muted: #b0b8c8; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { color: var(--text);
           background:
             linear-gradient(45deg,
               rgba(255, 255, 255, 0.22) 0%,
               rgba(0, 57, 166, 0.38) 50%,
               rgba(213, 43, 30, 0.42) 100%),
             var(--bg);
           background-attachment: fixed;
           font: 15px/1.6 Inter, Manrope, system-ui, sans-serif; }
    header { display: flex; align-items: center; gap: 12px; padding: 16px 24px;
             background: var(--card); border-bottom: 1px solid var(--border); }
    header .logo { width: 32px; height: 32px; background: var(--accent);
                   color: #1a1d21; display: grid; place-items: center; font-weight: 800; }
    header h1 { font-size: 18px; font-weight: 700; }
    header a { margin-left: auto; color: var(--muted); text-decoration: none; }
    header a:hover { color: var(--accent); }
    main { max-width: 1080px; margin: 0 auto; padding: 32px 24px; }
    main > p, section { background: var(--card); border: 1px solid var(--border);
            border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    main > p { padding: 16px 20px; }
    h2 { font-size: 22px; margin: 8px 0; border-left: 3px solid var(--accent);
         padding-left: 12px; }
    section > h2:first-child { margin-top: 0; }
    h3 { font-size: 16px; margin: 20px 0 8px; color: var(--muted); }
    .mod-desc { color: var(--muted); margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px;
            font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
    th { color: var(--muted); font-weight: 600; }
    code { background: var(--bg); padding: 2px 6px; border-radius: 3px;
           font: 12px/1.5 "JetBrains Mono", monospace; word-break: break-all; }
    .m { font-weight: 700; font-size: 12px; }
    .m-get { color: #1565c0; } .m-post { color: var(--accent); }
    .m-put, .m-patch { color: #ffb300; } .m-delete { color: #d52b1e; }
    pre { background: var(--bg); border: 1px solid var(--border); padding: 16px;
          overflow-x: auto; font-size: 13px; border-radius: 4px; }
    .qs { margin-bottom: 24px; }
    footer { text-align: center; color: var(--muted); padding: 24px;
             border-top: 1px solid var(--border); font-size: 13px; }
    .json-links a { color: var(--accent); }
  </style>
</head>
<body>
  <header>
    <div class="logo">B</div>
    <h1>Balloo Messenger API</h1>
    <a href="https://balloo.su">← balloo.su</a>
  </header>
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
  <footer>© Balloo Messenger 2026 · <a href="https://balloo.su/#/rules">Правила</a>
    · <a href="https://balloo.su/#/privacy">Конфиденциальность</a></footer>
</body>
</html>`);
}
