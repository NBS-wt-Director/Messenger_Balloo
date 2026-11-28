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

/**
 * Внутренние пункты — поведение до тик. 1794575221 (dev/localhost).
 * Тик. 1795888510: пункта «Admin» здесь больше НЕТ. Вход в админку — только
 * в правом меню и только пользователям с правами (решение владельца
 * 28.11.2026), иначе узел был виден всем гостям через лого-меню.
 */
export const SPA_TOPBAR_ITEMS: TopbarMenuItem[] = [
  { key: 'menu.balloo', to: '/chat', emoji: '💬' },
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
 *
 * Тик. 1795888510: admin исключён — ссылка на админку живёт только в частном
 * правом меню (PrivateRightMenu) и только для администраторов.
 */
export function topbarItemsForHost(host?: string): TopbarMenuItem[] {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!isBallooProdHost(h)) return SPA_TOPBAR_ITEMS;

  const onMain = h === 'balloo.su';

  return [
    { key: 'menu.balloo', to: onMain ? '/chat' : `${MAIN_ORIGIN}/#/chat`, emoji: '💬' },
    { key: 'menu.features', to: `${FEATURES_ORIGIN}/`, emoji: '💡' },
    { key: 'menu.history', to: `${HISTORY_ORIGIN}/#/history`, emoji: '📜' },
    { key: 'menu.download', to: `${DOWNLOAD_ORIGIN}/#/download`, emoji: '⬇️' },
    { key: 'menu.docs', to: `${API_ORIGIN}/docs`, emoji: '📚' },
  ];
}

/**
 * Ссылка на админ-панель (тик. 1795888510).
 * Прод — отдельный домен admin.balloo.su; dev — vite-сервер web-admin (:5174).
 * Пункт показывается только администратору (см. PrivateRightMenu).
 */
export function adminSiteUrl(host?: string): string {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!isBallooProdHost(h)) return 'http://localhost:5174/';
  return `${ADMIN_ORIGIN}/`;
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
  // Истории и Приглашения — по запросу владельца (тик. 1795282577)
  { key: 'menu.stories', to: '/stories', icon: '📷' },
  { key: 'menu.invites', to: '/invites', icon: '📨' },
  { key: 'menu.settings', to: '/settings', icon: '⚙️' },
  { key: 'menu.accounts', to: '/profile', icon: '👥' },
  // Баланс баллов — только в частном меню (тик. 1795686329)
  { key: 'menu.balance', to: '/balance', icon: '💰' },
];

/**
 * Секция «О нас» общего правого меню (тик. 1795686329) — копия меню
 * копирайта подвала. «О компании»/«Контакты» переиспользуют существующие ключи.
 */
export const SPA_ABOUT_ITEMS: RightMenuItem[] = [
  { key: 'footer.about', to: '/about-company', icon: '🏢' },
  { key: 'menu.contacts', to: '/coming-soon?name=Контакты', icon: '📞' },
  { key: 'menu.aboutBalloo', to: '/about-balloo', icon: 'ℹ️' },
  { key: 'menu.otherProjects', to: '/coming-soon?name=Другие%20проекты%20компании', icon: '🌐' },
  { key: 'menu.donate', to: '/donat', icon: '❤️' },
];

export const SPA_GUEST_ACTIONS = { loginTo: '/login', registerTo: '/register' };

/**
 * Все маршруты правого меню живут в главном SPA: на чужих хостах —
 * абсолютные hash-URL, на главной/локалке — относительные пути.
 */
export function rightMenuTargetsForHost(host?: string): {
  legal: RightMenuItem[];
  account: RightMenuItem[];
  aboutUs: RightMenuItem[];
  guest: { loginTo: string; registerTo: string };
  /** Тик. 1795888510: цель пункта «Админ-панель» (только для админов). */
  admin: string;
} {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return {
    legal: SPA_LEGAL_ITEMS.map((i) => ({ ...i, to: mainSiteUrl(i.to, h) })),
    account: SPA_ACCOUNT_ITEMS.map((i) => ({ ...i, to: mainSiteUrl(i.to, h) })),
    aboutUs: SPA_ABOUT_ITEMS.map((i) => ({ ...i, to: mainSiteUrl(i.to, h) })),
    guest: {
      loginTo: mainSiteUrl(SPA_GUEST_ACTIONS.loginTo, h),
      registerTo: mainSiteUrl(SPA_GUEST_ACTIONS.registerTo, h),
    },
    admin: adminSiteUrl(h),
  };
}

// ─── Подвал (Footer) ────────────────────────────────────────────────────────

// Подвал (Footer). Тик. 1795507295: правовой блок — только три пункта;
// «Поддержка» — отдельная ссылка подвала, «О компании»/«Поддержать нас» — в меню.
export const SPA_FOOTER_LINKS: FooterLink[] = [
  { key: 'footer.rules', href: '/rules' },
  { key: 'footer.privacy', href: '/privacy' },
  { key: 'footer.cookies', href: '/cookies' },
];

export function footerLinksForHost(host?: string): FooterLink[] {
  const h = host ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return SPA_FOOTER_LINKS.map((l) => ({ ...l, href: mainSiteUrl(l.href, h) }));
}
