// ecosystem — хост-осознанные ссылки между сайтами экосистемы Balloo
// (тик. 1794575221)
//
// Экосистема в проде: несколько SPA на своих поддоменах (каждое со своим
// hash-роутером):
//   balloo.su            — главное приложение (web)
//   admin.balloo.su      — админ-панель (web-admin)
//   features.balloo.su   — витрина фич-реквестов (web-features)
// Разделы command/history/download/docs отдельных сайтов НЕ имеют (замер
// 02.11.2026: одноимённые поддомены отдают то же главное SPA) — их ссылки
// всегда ведут на маршруты главного SPA через hash-URL.
//
// Правило выбора: карта строится по hostname текущего документа:
//   • balloo.su / *.balloo.su  → прод-ссылки (межсайтовые — абсолютные URL);
//   • всё остальное (localhost, preview) → внутренние SPA-пути: dev-серверы
//     живут на портах, абсолютные URL на прод уводили бы с локалки.

import type { TopbarMenuItem } from './TopbarMenu';
import type { FooterLink } from './Footer';
import type { RightMenuItem } from './RightMenu';

const MAIN_ORIGIN = 'https://balloo.su';
const ADMIN_ORIGIN = 'https://admin.balloo.su';
const FEATURES_ORIGIN = 'https://features.balloo.su';

/** Хосты, для которых строим прод-карту ссылок. */
export function isBallooProdHost(host: string): boolean {
  return host === 'balloo.su' || host.endsWith('.balloo.su');
}

/** Ссылка на маршрут главного SPA (hash-роутер). На главной — относительная. */
export function mainSiteUrl(path: string, host?: string): string {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!isBallooProdHost(h) || h === 'balloo.su') return path;
  return `${MAIN_ORIGIN}/#${path}`;
}

// ─── Лого-меню разделов (TopbarMenu) ────────────────────────────────────────

/** Внутренние пункты — поведение до тик. 1794575221 (dev/localhost). */
export const SPA_TOPBAR_ITEMS: TopbarMenuItem[] = [
  { key: 'menu.balloo', to: '/chat', emoji: '💬' },
  { key: 'menu.admin', to: '/admin', emoji: '🛡️', dividerBefore: true },
  { key: 'menu.command', to: '/command', emoji: '🏢' },
  { key: 'menu.features', to: '/features', emoji: '💡' },
  { key: 'menu.history', to: '/history', emoji: '📜' },
  { key: 'menu.download', to: '/download', emoji: '⬇️' },
  { key: 'menu.docs', to: '/doc', emoji: '📚' },
];

/**
 * Пункты лого-меню для текущего хоста.
 * На balloo.su собственные поддомены (admin/features) — абсолютные URL,
 * разделы без своих сайтов — внутренние маршруты SPA.
 * На admin/features-хостах все пункты абсолютные (у их роутеров чужих
 * маршрутов нет).
 */
export function topbarItemsForHost(host?: string): TopbarMenuItem[] {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!isBallooProdHost(h)) return SPA_TOPBAR_ITEMS;

  const onMain = h === 'balloo.su';
  const link = (path: string) => (onMain ? path : `${MAIN_ORIGIN}/#${path}`);

  return [
    { key: 'menu.balloo', to: link('/chat'), emoji: '💬' },
    { key: 'menu.admin', to: ADMIN_ORIGIN + '/', emoji: '🛡️', dividerBefore: true },
    { key: 'menu.command', to: link('/command'), emoji: '🏢' },
    { key: 'menu.features', to: FEATURES_ORIGIN + '/', emoji: '💡' },
    { key: 'menu.history', to: link('/history'), emoji: '📜' },
    { key: 'menu.download', to: link('/download'), emoji: '⬇️' },
    { key: 'menu.docs', to: link('/doc'), emoji: '📚' },
  ];
}

// ─── Правое меню (RightMenu) ────────────────────────────────────────────────

export const SPA_LEGAL_ITEMS: RightMenuItem[] = [
  { key: 'menu.support', to: '/support', icon: '🛠️' },
  { key: 'footer.privacy', to: '/privacy', icon: '🔒' },
  { key: 'footer.rules', to: '/rules', icon: '📋' },
];

export const SPA_ACCOUNT_ITEMS: RightMenuItem[] = [
  { key: 'menu.profile', to: '/profile', icon: '👤' },
  { key: 'menu.contacts', to: '/contacts', icon: '📇' },
  { key: 'menu.settings', to: '/settings', icon: '⚙️' },
  { key: 'menu.accounts', to: '/profile', icon: '👥' },
];

export const SPA_GUEST_ACTIONS = { loginTo: '/login', registerTo: '/register' };

/**
 * Все маршруты правого меню живут в главном SPA: на чужих хостах —
 * абсолютные hash-URL, на главной/локалке — относительные пути.
 */
export function rightMenuTargetsForHost(host?: string): {
  legal: RightMenuItem[];
  account: RightMenuItem[];
  guest: { loginTo: string; registerTo: string };
} {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return {
    legal: SPA_LEGAL_ITEMS.map((i) => ({ ...i, to: mainSiteUrl(i.to, h) })),
    account: SPA_ACCOUNT_ITEMS.map((i) => ({ ...i, to: mainSiteUrl(i.to, h) })),
    guest: {
      loginTo: mainSiteUrl(SPA_GUEST_ACTIONS.loginTo, h),
      registerTo: mainSiteUrl(SPA_GUEST_ACTIONS.registerTo, h),
    },
  };
}

// ─── Подвал (Footer) ────────────────────────────────────────────────────────

export const SPA_FOOTER_LINKS: FooterLink[] = [
  { key: 'footer.rules', href: '/rules' },
  { key: 'footer.privacy', href: '/privacy' },
  { key: 'footer.cookies', href: '/cookies' },
];

export function footerLinksForHost(host?: string): FooterLink[] {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return SPA_FOOTER_LINKS.map((l) => ({ ...l, href: mainSiteUrl(l.href, h) }));
}
