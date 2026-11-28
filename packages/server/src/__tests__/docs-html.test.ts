// Тикет 1795683301 (§4 P1–P3): HTML-страница /docs приведена к единым
// требованиям узлов.
//
// Проверяем разметку, которую отдаёт сервер (React здесь нет):
//   U1 — шапка/подвал той же структуры, что @balloo/ui (меню подвала из 5
//        пунктов, «Поддержка», правовой блок, морзе-тикер);
//   U2 — прокрутка есть, полоса скрыта;
//   U3 — горизонтальные отступы контента.

import request from 'supertest';
import { app } from './helpers';

describe('GET /docs — единая шапка/подвал (P1–P3)', () => {
  let html = '';

  beforeAll(async () => {
    const res = await request(app).get('/docs');
    expect(res.status).toBe(200);
    html = res.text;
  });

  it('отдаёт HTML с шапкой экосистемы и текущим разделом', () => {
    expect(html).toContain('class="topbar"');
    expect(html).toContain('API Docs (текущий)');
    // Пункты меню шапки — те же, что в @balloo/ui/ecosystem
    expect(html).toContain('https://features.balloo.su/');
    expect(html).toContain('https://history.balloo.su/');
    expect(html).toContain('https://download.balloo.su/');
    expect(html).toContain('https://admin.balloo.su/');
  });

  it('подвал повторяет структуру @balloo/ui/Footer', () => {
    expect(html).toContain('class="balloo-footer"');
    expect(html).toContain('© Balloo Messenger 2026');
    // Меню подвала — 5 пунктов требования владельца
    for (const label of [
      'О компании',
      'Контакты',
      'О Balloo',
      'Другие проекты компании',
      'Поддержать нас',
    ]) {
      expect(html).toContain(label);
    }
    // «Поддержка» отдельной ссылкой + правовой блок
    expect(html).toContain('class="balloo-footer__link" href="https://balloo.su/#/support"');
    expect(html).toContain('Правила');
    expect(html).toContain('Конфиденциальность');
    expect(html).toContain('Cookies');
  });

  it('в подвале два морзе-тикера (к центру, без читаемого текста)', () => {
    expect(html).toContain('balloo-footer__ticker--ltr');
    expect(html).toContain('balloo-footer__ticker--rtl');
    expect(html).toContain('balloo-footer__morse--dot');
    expect(html).toContain('balloo-footer__morse--dash');
    // Расшифровка — только в tooltip (доступность), не в видимом тексте
    expect(html).toContain('balloo-footer__morse-tip');
  });

  it('U2: прокрутка внутри страницы, полоса скрыта', () => {
    expect(html).toContain('overflow-y: auto');
    expect(html).toContain('scrollbar-width: none');
    // display:none ломал прокрутку в Chromium — заменено на нулевой размер
    // (коммит 7dc043f: width:0 + height:0, полоса по-прежнему невидима).
    expect(html).toContain('::-webkit-scrollbar { width: 0; height: 0; background: transparent; }');
    expect(html).toContain('class="page-container"');
  });

  it('U3: горизонтальные отступы контента 24px и 16px на мобиле', () => {
    expect(html).toContain('padding: 32px 24px');
    expect(html).toMatch(/max-width: 768px\)\s*\{\s*\.page-container \{ padding: 24px 16px; \}/);
  });

  it('не использует внешние CDN и inline-скрипты (CSP прода)', () => {
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link[^>]+https?:\/\//i);
  });
});
