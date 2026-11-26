// Правое меню шапки — РОВНО ДВА меню (решение владельца 22.11.2026):
//
//   1. PrivateRightMenu — ЧАСТНОЕ, только для авторизованного. Триггер —
//      аватарка пользователя, а если её нет — логотип компании. Панель —
//      частные пункты приложения (Профиль/Контакты/Истории/Приглашения/
//      Настройки/Аккаунты). В гостевом режиме не рендерится вовсе.
//
//   2. RightMenu — ОБЩЕЕ, для всех. Триггер — статичный маскот 🐻. Панель —
//      общие пункты: язык, тема, юр. ссылки; авторизован → «Выйти»,
//      гость → «Вход»/«Регистрация». Всегда САМОЕ ПРАВОЕ.
//
// Порядок в правом блоке: [контент экрана] [частное] [общее].
// Эталон состава панели — mockups/assets/common.js buildRightMenu() (433–570),
// но по решению владельца меню разделено на частное и общее.
//
// Расхождения мокапа с контрактом web (решения зафиксированы в мультитикете §7 P38):
//   - языков 20 (SUPPORTED_LANGUAGES), а не 6 из мокапа;
//   - «Мультиаккаунт» — новое требование владельца, в мокапе нет; ведёт на
//     /profile (секция аккаунтов в ProfileScreen; маршрута /accounts в web нет);
//   - «Техподдержка» (/support): экран `SupportScreen` и маршрут есть
//     (web/src/router/index.tsx:253), пункт кладётся в правое меню
//     (ecosystem.ts:82, SPA_LEGAL_ITEMS) — прежняя запись «не реализован» устарела;
//   - Cookies в правом меню мокапа нет — не добавляем.
//
// Стили — chrome.css (дословный перенос common.css:1820–1966 + .mascot).
// Как TopbarMenu НЕ зависит от react-router: onNavigate для SPA / location.href.

import React, { useEffect, useRef, useState } from 'react';
import { useUIStore, SUPPORTED_LANGUAGES, type Language, type Theme } from '../store/uiStore';
import { useI18n } from '../providers/I18nProvider';
import { rightMenuTargetsForHost } from './ecosystem';
import type { TranslationKey } from '@balloo/shared';
import { pluralKeyFor } from '@balloo/shared';

export interface RightMenuItem {
  /**
   * Ключ перевода. Тип строгий (не `| string`): пункт с несуществующим ключом
   * должен падать на сборке, а не молча показывать сырой ключ в UI — так
   * произошло с menu.profile/menu.settings/menu.accounts (сломанные подписи
   * в проде, ключей в словаре не было).
   */
  key: TranslationKey;
  to: string;
  icon: string;
}

/** Контент авторизации для Topbar→RightMenu/PrivateRightMenu (web прокидывает из AuthProvider) */
export interface RightMenuAuth {
  /** true — частное меню + «Выйти» в общем; false/нет — общее меню с Вход/Регистрация */
  isAuthenticated?: boolean;
  /** Инициалы авторизованного (alt аватара частного меню) */
  initials?: string;
  /** URL аватарки авторизованного; нет — логотип компании (частное меню) */
  avatarUrl?: string | null;
  /** Баланс баллов (тик. 1795686329) — показывается в частном меню, пункт «Баланс» */
  balancePoints?: number;
  /** Клик по «Выйти» (авторизованный) */
  onLogout?: () => void;
}

export interface RightMenuProps {
  /** 'guest' — кнопки Вход/Регистрация; 'user' — «Выйти» */
  auth?: 'guest' | 'user';
  /** Юр. пункты (по умолчанию: Приватность /privacy, Правила /rules) */
  legalItems?: RightMenuItem[];
  /** Пункты секции «О нас» (тик. 1795686329); по умолчанию — хост-осознанно */
  aboutItems?: RightMenuItem[];
  /** Клик по «Выйти» (нет — пункт не рендерится) */
  onLogout?: () => void;
  /** Переходы гостя (по умолчанию: /login, /register) */
  guestActions?: { loginTo: string; registerTo: string };
  /** SPA-навигация (react-router navigate). Нет — переход location.href. */
  onNavigate?: (to: string) => void;
}

/** Пропсы частного (авторизованного) меню. */
export interface PrivateRightMenuProps {
  /** Инициалы авторизованного (alt аватара) */
  initials?: string;
  /** URL аватарки; нет — логотип компании */
  avatarUrl?: string | null;
  /** Баланс баллов (тик. 1795686329) — значение в пункте «Баланс» */
  balancePoints?: number;
  /** Частные пункты (по умолчанию: Профиль/Контакты/Истории/Приглашения/Настройки/Аккаунты/Баланс) */
  items?: RightMenuItem[];
  /** SPA-навигация (react-router navigate). Нет — переход location.href. */
  onNavigate?: (to: string) => void;
}

// Темы ровно 3, лейблы — BALLOO_THEMES из common.js:7–11
const THEMES: { id: Theme; icon: string; labelKey: TranslationKey }[] = [
  { id: 'dark', icon: '🌙', labelKey: 'menu.themeDark' },
  { id: 'light', icon: '☀️', labelKey: 'menu.themeLight' },
  { id: 'russian', icon: '🇷🇺', labelKey: 'menu.themeRussian' },
];

// Дефолтные списки — внутренние маршруты главного SPA (экспортированы как
// эталон и для тестов). Фактические пункты по умолчанию строятся хост-осознанно
// (rightMenuTargetsForHost, тик. 1794575221): на admin/features-хостах все
// маршруты живут в balloo.su → абсолютные hash-URL.
export const DEFAULT_LEGAL_ITEMS: RightMenuItem[] = [
  // Техподдержка — первым пунктом юр. секции, как в эталоне common.js:496
  { key: 'menu.support', to: '/support', icon: '🛠️' },
  { key: 'footer.privacy', to: '/privacy', icon: '🔒' },
  { key: 'footer.rules', to: '/rules', icon: '📋' },
];

/**
 * Секция «О нас» в ОБЩЕМ правом меню (тик. 1795686329, решение владельца
 * 26.11.2026): копия меню копирайта подвала, размещается между блоком «Тема»
 * и юр. пунктами. «О компании»/«Контакты» переиспользуют существующие ключи
 * (`footer.about`, `menu.contacts` — тот же русский текст, 20 локалей).
 */
export const DEFAULT_ABOUT_ITEMS: RightMenuItem[] = [
  { key: 'footer.about', to: '/about-company', icon: '🏢' },
  { key: 'menu.contacts', to: '/coming-soon?name=Контакты', icon: '📞' },
  { key: 'menu.aboutBalloo', to: '/about-balloo', icon: 'ℹ️' },
  { key: 'menu.otherProjects', to: '/coming-soon?name=Другие%20проекты%20компании', icon: '🌐' },
  { key: 'menu.donate', to: '/donat', icon: '❤️' },
];

/**
 * Частные пункты приложения (по умолчанию). Экспортированы: тест проверяет по
 * ним наличие ключей в словаре, чтобы список не мог устареть молча.
 */
export const DEFAULT_ACCOUNT_ITEMS: RightMenuItem[] = [
  { key: 'menu.profile', to: '/profile', icon: '👤' },
  { key: 'menu.contacts', to: '/contacts', icon: '📇' },
  // Истории и Приглашения — по запросу владельца (тик. 1795282577)
  { key: 'menu.stories', to: '/stories', icon: '📷' },
  { key: 'menu.invites', to: '/invites', icon: '📨' },
  { key: 'menu.settings', to: '/settings', icon: '⚙️' },
  // Мультиаккаунт: секция аккаунтов живёт в профиле (ProfileScreen)
  { key: 'menu.accounts', to: '/profile', icon: '👥' },
  // Баланс баллов (тик. 1795686329): значение показывается справа от подписи
  { key: 'menu.balance', to: '/balance', icon: '💰' },
];

export const DEFAULT_GUEST_ACTIONS = { loginTo: '/login', registerTo: '/register' };

type SubmenuKey = 'lang' | 'theme' | null;

/** Общее поведение сворачиваемой панели: закрытие по клику вне и по Escape
 *  (common.js:549–562). Переиспользуется частным и общим меню. */
function usePanelBehavior() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return { open, setOpen, rootRef };
}

export function RightMenu({
  auth = 'guest',
  legalItems,
  aboutItems,
  onLogout,
  guestActions,
  onNavigate,
}: RightMenuProps) {
  const { t } = useI18n();
  // Хост-осознанные цели по умолчанию (тик. 1794575221): на чужих поддоменах
  // balloo.su маршруты главного SPA недоступны → абсолютные hash-URL.
  const hostDefaults = rightMenuTargetsForHost();
  const legal = legalItems ?? hostDefaults.legal;
  const about = aboutItems ?? hostDefaults.aboutUs;
  const guest = guestActions ?? hostDefaults.guest;
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const { open, setOpen, rootRef } = usePanelBehavior();
  const [submenu, setSubmenu] = useState<SubmenuKey>(null);

  // Сброс подменю при закрытии панели
  useEffect(() => {
    if (!open) setSubmenu(null);
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    setSubmenu(null);
    if (onNavigate && !/^https?:\/\//.test(to)) {
      onNavigate(to);
    } else {
      // Статический сайт / абсолютный URL поддомена / SPA без роутера
      window.location.href = to;
    }
  };

  const toggleSubmenu = (key: Exclude<SubmenuKey, null>) =>
    setSubmenu((prev) => (prev === key ? null : key));

  return (
    <div className="right-menu-host" ref={rootRef}>
      {/* Триггер ОБЩЕГО меню — статичный маскот для всех ролей
          (решение владельца 22.11.2026). Аватарка/логотип — в частном меню. */}
      <button
        type="button"
        id="balloo-menu-btn"
        className={`topbar__menu-btn${open ? ' topbar__menu-btn--open' : ''}`}
        title={t('menu.button')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <img className="mascot" src="/assets/logos/mascot.png" alt="Маскот Balloo — медведь Борис" />
      </button>

      {/* Панель (common.js:522–526: append в body; здесь — внутри host,
          CSS position:fixed top:56px right:0 даёт тот же результат) */}
      <div
        id="balloo-right-menu"
        className={`right-menu${open ? ' right-menu--open' : ''}`}
        role="menu"
        aria-hidden={!open}
      >
        {/* Язык */}
        <div className="right-menu__section-label">Язык / Language</div>
        <div
          className={`right-menu__item${submenu === 'lang' ? ' right-menu__item--active' : ''}`}
          role="menuitem"
          tabIndex={open ? 0 : -1}
          aria-expanded={submenu === 'lang'}
          onClick={() => toggleSubmenu('lang')}
        >
          <span className="right-menu__item-icon">🌐</span>
          <span className="right-menu__item-label">{t('settings.language')}</span>
          <span className="right-menu__item-chevron">{submenu === 'lang' ? '▴' : '▾'}</span>
        </div>
        <div className={`right-menu__submenu${submenu === 'lang' ? ' right-menu__submenu--open' : ''}`}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <div
              key={l.code}
              className={`right-menu__subitem${language === l.code ? ' right-menu__subitem--active' : ''}`}
              role="menuitemradio"
              aria-checked={language === l.code}
              tabIndex={open && submenu === 'lang' ? 0 : -1}
              onClick={() => setLanguage(l.code as Language)}
            >
              <span>{l.nativeName}</span>
              <span className="right-menu__subitem-check">{language === l.code ? '✓' : ''}</span>
            </div>
          ))}
        </div>

        {/* Тема */}
        <div className="right-menu__section-label">Тема</div>
        <div
          className={`right-menu__item${submenu === 'theme' ? ' right-menu__item--active' : ''}`}
          role="menuitem"
          tabIndex={open ? 0 : -1}
          aria-expanded={submenu === 'theme'}
          onClick={() => toggleSubmenu('theme')}
        >
          <span className="right-menu__item-icon">🎨</span>
          <span className="right-menu__item-label">{t('settings.theme')}</span>
          <span className="right-menu__item-chevron">{submenu === 'theme' ? '▴' : '▾'}</span>
        </div>
        <div className={`right-menu__submenu${submenu === 'theme' ? ' right-menu__submenu--open' : ''}`}>
          {THEMES.map((th) => (
            <div
              key={th.id}
              className={`right-menu__subitem${theme === th.id ? ' right-menu__subitem--active' : ''}`}
              role="menuitemradio"
              aria-checked={theme === th.id}
              tabIndex={open && submenu === 'theme' ? 0 : -1}
              onClick={() => setTheme(th.id)}
            >
              <span>
                {th.icon} {t(th.labelKey)}
              </span>
              <span className="right-menu__subitem-check">{theme === th.id ? '✓' : ''}</span>
            </div>
          ))}
        </div>

        <div className="right-menu__divider" />

        {/* Секция «О нас» (тик. 1795686329): копия меню копирайта подвала,
            между блоком «Тема» и юр. пунктами. */}
        <div className="right-menu__section-label">{t('menu.sectionAboutUs')}</div>
        {about.map((item) => (
          <div
            key={String(item.key)}
            className="right-menu__item"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => go(item.to)}
          >
            <span className="right-menu__item-icon">{item.icon}</span>
            <span className="right-menu__item-label">{t(item.key)}</span>
          </div>
        ))}

        <div className="right-menu__divider" />

        {/* Юридические пункты */}
        {legal.map((item) => (
          <div
            key={String(item.key)}
            className="right-menu__item"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => go(item.to)}
          >
            <span className="right-menu__item-icon">{item.icon}</span>
            <span className="right-menu__item-label">{t(item.key)}</span>
          </div>
        ))}

        <div className="right-menu__divider" />

        {/* Аккаунт: гость → Вход/Регистрация; авторизован → Выйти.
            Частные пункты приложения живут в PrivateRightMenu. */}
        <div className="right-menu__section-label">{t('settings.account')}</div>
        {auth === 'guest' ? (
          <div className="right-menu__auth-guest">
            <button type="button" className="btn btn--primary btn--block" onClick={() => go(guest.loginTo)}>
              {t('auth.login')}
            </button>
            <button type="button" className="btn btn--secondary btn--block" onClick={() => go(guest.registerTo)}>
              {t('auth.register')}
            </button>
          </div>
        ) : (
          onLogout && (
            <div
              className="right-menu__item"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                setSubmenu(null);
                onLogout();
              }}
            >
              <span className="right-menu__item-icon">🚪</span>
              <span className="right-menu__item-label">{t('auth.logout')}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/**
 * PrivateRightMenu — ЧАСТНОЕ правое меню (видит только авторизованный).
 * Триггер: аватарка пользователя, а если её нет — логотип компании. Панель —
 * частные пункты приложения. Общее меню (RightMenu) идёт правее частного.
 */
export function PrivateRightMenu({
  initials = 'ИИ',
  avatarUrl = null,
  balancePoints,
  items,
  onNavigate,
}: PrivateRightMenuProps) {
  const { t, locale } = useI18n();
  const hostDefaults = rightMenuTargetsForHost();
  const menuItems = items ?? hostDefaults.account;

  // Баланс в пункте «Баланс» (тик. 1795686329): «555 баллов» со склонением.
  // Показываем только в частном меню (решение владельца 26.11.2026).
  const balanceLabel =
    typeof balancePoints === 'number'
      ? `${balancePoints} ${t(pluralKeyFor(balancePoints, locale))}`
      : null;

  const { open, setOpen, rootRef } = usePanelBehavior();

  const go = (to: string) => {
    setOpen(false);
    if (onNavigate && !/^https?:\/\//.test(to)) {
      onNavigate(to);
    } else {
      // Статический сайт / абсолютный URL поддомена / SPA без роутера
      window.location.href = to;
    }
  };

  return (
    <div className="right-menu-host" ref={rootRef}>
      {/* Триггер ЧАСТНОГО меню — аватарка или логотип компании (тик. 1795292000) */}
      <button
        type="button"
        id="balloo-private-menu-btn"
        className={`topbar__menu-btn${open ? ' topbar__menu-btn--open' : ''}`}
        title={t('menu.button')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
          <div className="avatar__inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt={initials} />
            ) : (
              <img src="/assets/logos/company-logo.png" alt="Balloo" />
            )}
          </div>
        </div>
      </button>

      <div
        id="balloo-private-menu"
        className={`right-menu${open ? ' right-menu--open' : ''}`}
        role="menu"
        aria-hidden={!open}
      >
        {menuItems.map((item) => {
          const isBalance = item.key === 'menu.balance';
          return (
            <div
              key={String(item.key)}
              className="right-menu__item"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => go(item.to)}
            >
              <span className="right-menu__item-icon">{item.icon}</span>
              <span className="right-menu__item-label">{t(item.key)}</span>
              {isBalance && balanceLabel && (
                <span className="right-menu__item-value">{balanceLabel}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
