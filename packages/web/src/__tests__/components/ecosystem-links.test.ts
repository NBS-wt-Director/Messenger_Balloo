/**
 * Тикет 1794575221: ссылки лого-меню/правого меню/подвала должны вести на
 * поддомены экосистемы, а не на внутренние маршруты чужого SPA.
 * Причина бага в проде: DEFAULT_TOPBAR_ITEMS содержал только SPA-пути, и
 * «Features» на balloo.su открывал balloo.su/#/features вместо
 * features.balloo.su; на самом features.balloo.su «Balloo» вёл в несуществующий
 * features.balloo.su/chat.
 */
import { describe, it, expect } from 'vitest';
import {
  isBallooProdHost,
  mainSiteUrl,
  topbarItemsForHost,
  rightMenuTargetsForHost,
  footerLinksForHost,
} from '@balloo/ui';

describe('ecosystem — хост-осознанные ссылки (тик. 1794575221)', () => {
  it('распознаёт прод-хосты balloo.su и не считает ими остальное', () => {
    expect(isBallooProdHost('balloo.su')).toBe(true);
    expect(isBallooProdHost('features.balloo.su')).toBe(true);
    expect(isBallooProdHost('admin.balloo.su')).toBe(true);
    expect(isBallooProdHost('localhost')).toBe(false);
    expect(isBallooProdHost('evil-balloo.su')).toBe(false);
  });

  it('на balloo.su: каждый пункт → СВОЙ поддомен узла (решение владельца 13.11)', () => {
    const items = topbarItemsForHost('balloo.su');
    const byKey = Object.fromEntries(items.map((i) => [String(i.key), i.to]));
    // главное SPA — остаётся внутренним маршрутом (пользователь уже здесь)
    expect(byKey['menu.balloo']).toBe('/chat');
    // все узлы — абсолютные URL своих поддоменов
    expect(byKey['menu.admin']).toBe('https://admin.balloo.su/');
    expect(byKey['menu.features']).toBe('https://features.balloo.su/');
    expect(byKey['menu.command']).toBe('https://command.balloo.su/#/command');
    expect(byKey['menu.history']).toBe('https://history.balloo.su/#/history');
    expect(byKey['menu.download']).toBe('https://download.balloo.su/#/download');
    // API docs = api.balloo.su/docs (решение владельца, повторено 13.11.2026)
    expect(byKey['menu.docs']).toBe('https://api.balloo.su/docs');
  });

  it('на features.balloo.su: все пункты абсолютные (свой роутер чужих маршрутов не знает)', () => {
    const items = topbarItemsForHost('features.balloo.su');
    for (const item of items) {
      expect(item.to).toMatch(/^https:\/\//);
    }
    const byKey = Object.fromEntries(items.map((i) => [String(i.key), i.to]));
    expect(byKey['menu.balloo']).toBe('https://balloo.su/#/chat');
    expect(byKey['menu.features']).toBe('https://features.balloo.su/');
    expect(byKey['menu.docs']).toBe('https://api.balloo.su/docs');
  });

  it('на localhost: внутренние SPA-пути (dev не уводит на прод)', () => {
    const items = topbarItemsForHost('localhost');
    for (const item of items) {
      expect(item.to).toMatch(/^\//);
    }
  });

  it('правое меню на admin.balloo.su: аккаунт/гость/юридическое — на balloo.su/#/…', () => {
    const t = rightMenuTargetsForHost('admin.balloo.su');
    expect(t.guest.loginTo).toBe('https://balloo.su/#/login');
    expect(t.account.find((i) => i.key === 'menu.settings')?.to).toBe(
      'https://balloo.su/#/settings',
    );
    expect(t.legal.find((i) => i.key === 'footer.privacy')?.to).toBe(
      'https://balloo.su/#/privacy',
    );
    // на главной — относительные (SPA-навигация)
    const m = rightMenuTargetsForHost('balloo.su');
    expect(m.guest.loginTo).toBe('/login');
  });

  it('подвал на features.balloo.su: правовые ссылки — абсолютные hash-URL', () => {
    const links = footerLinksForHost('features.balloo.su');
    expect(links.map((l) => l.href)).toEqual([
      'https://balloo.su/#/rules',
      'https://balloo.su/#/privacy',
      'https://balloo.su/#/cookies',
    ]);
    expect(footerLinksForHost('balloo.su').map((l) => l.href)).toEqual([
      '/rules',
      '/privacy',
      '/cookies',
    ]);
  });

  it('mainSiteUrl: на главной относительная, на поддомене — hash-URL, вне прод — как есть', () => {
    expect(mainSiteUrl('/profile', 'balloo.su')).toBe('/profile');
    expect(mainSiteUrl('/profile', 'features.balloo.su')).toBe('https://balloo.su/#/profile');
    expect(mainSiteUrl('/profile', 'localhost')).toBe('/profile');
  });
});
