// ecosystem — хост-осознанные ссылки между сайтами экосистемы Balloo
// (тик. 1794575221; карта узлов — AGENTS.md «Номера узлов» и docs/15-domains.md)
//
// РЕШЕНИЕ ВЛАДЕЛЬЦА (повторено 13.11.2026): каждый пункт левого меню ведёт на
// СВОЙ поддомен узла, а не на внутренний маршрут главного SPA:
//   💬 Balloo   — balloo.su (главное приложение, web)
//   🛡️ Admin    — admin.balloo.su (web-admin)
//   🏢 Command  — command.balloo.su (портал сотрудников; не в MVP1, в меню не показывается)
//   💡 Features — features.balloo.su (web-features)
//   📜 History  — history.balloo.su/#/history
//   ⬇️ Download — download.balloo.su/#/download
//   📚 API Docs — api.balloo.su/docs (бэкенд, GET /docs — HTML документации)
//
// Правило выбора: карта строится по hostname текущего документа:
//   • balloo.su / *.balloo.su  → прод-ссылки (абсолютные URL поддоменов);
//   • всё остальное (localhost, preview) → внутренние SPA-пути: dev-серверы
//     живут на портах, абсолютные URL на прод уводили бы с локалки.

import type { TopbarMenuItem } from './TopbarMenu';
import type { FooterLink } from './Footer';
import type { RightMenuItem } from './RightMenu';

const MAIN_ORIGIN = 'https://balloo.su';
const ADMIN_ORIGIN = 'https://admin.balloo.su';
const FEATURES_ORIGIN = 'https://features.balloo.su';
const HISTORY_ORIGIN = 'https://history.balloo.su';
const DOWNLOAD_ORIGIN = 'https://download.balloo.su';
const API_ORIGIN = 'https://api.balloo.su';

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
 * РЕШЕНИЕ ВЛАДЕЛЬЦА (повторено 13.11.2026): каждый пункт → СВОЙ поддомен,
 * не hash-маршрут на главном SPA.
 *
 * command/history/download: их поддомены (nginx → :8090) отдают тот же SPA,
 * поэтому hash-роутер открывает нужный экран.
 * API docs: бэкенд-маршрут GET /docs (точка у_07 — docsController).
 */
export function topbarItemsForHost(host?: string): TopbarMenuItem[] {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!isBallooProdHost(h)) return SPA_TOPBAR_ITEMS;

  const onMain = h === 'balloo.su';

  return [
    { key: 'menu.balloo', to: onMain ? '/chat' : `${MAIN_ORIGIN}/#/chat`, emoji: '💬' },
    { key: 'menu.admin', to: `${ADMIN_ORIGIN}/`, emoji: '🛡️', dividerBefore: true },
    { key: 'menu.features', to: `${FEATURES_ORIGIN}/`, emoji: '💡' },
    { key: 'menu.history', to: `${HISTORY_ORIGIN}/#/history`, emoji: '📜' },
    { key: 'menu.download', to: `${DOWNLOAD_ORIGIN}/#/download`, emoji: '⬇️' },
    { key: 'menu.docs', to: `${API_ORIGIN}/docs`, emoji: '📚' },
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
