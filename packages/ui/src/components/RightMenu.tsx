// RightMenu — сворачиваемое ПРАВОЕ меню шапки (P38, тикет №1)
// Контракт: mockups/assets/common.js buildRightMenu() строки 433–554
// («Unified across all nodes — built by common.js»):
//   триггер .topbar__menu-btn: гость → маскот 🐻, авторизован → октагон-аватар;
//   панель .right-menu (fixed, top:56px, right:0, 280px):
//     «Язык / Language» → подменю языков; «Тема» → подменю тем; divider;
//     юр. пункты (Приватность / Правила пользования); divider; «Аккаунт»:
//       гость → кнопки Вход + Регистрация; авторизован → Профиль / Настройки /
//       Мультиаккаунт / Выйти.
//   поведение: toggle по кнопке, подменю ▾/▴, закрытие по клику вне и Escape.
//
// Расхождения мокапа с контрактом web (решения зафиксированы в мультитикете §7 P38):
//   - языков 20 (SUPPORTED_LANGUAGES), а не 6 из мокапа;
//   - «Мультиаккаунт» — новое требование владельца, в мокапа нет; ведёт на
//     /profile (секция аккаунтов в ProfileScreen; маршрута /accounts в web нет);
//   - «Техподдержка» (/support) в web не реализован — в меню не кладётся;
//   - Cookies в правом меню мокапа нет — не добавляем.
//
// Стили — chrome.css (дословный перенос common.css:1820–1966 + .mascot).
// Как TopbarMenu НЕ зависит от react-router: onNavigate для SPA / location.href.

import React, { useEffect, useRef, useState } from 'react';
import { useUIStore, SUPPORTED_LANGUAGES, type Language, type Theme } from '../store/uiStore';
import { useI18n } from '../providers/I18nProvider';
import type { TranslationKey } from '@balloo/shared';

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

/** Контент авторизации для Topbar→RightMenu (web прокидывает из AuthProvider) */
export interface RightMenuAuth {
  /** true — аватар + пункты аккаунта + Выйти; false/нет — маскот + Вход/Регистрация */
  isAuthenticated?: boolean;
  /** Инициалы в аватар-триггере (авторизованный) */
  initials?: string;
  /** Клик по «Выйти» (авторизованный) */
  onLogout?: () => void;
}

export interface RightMenuProps {
  /** 'guest' — кнопки Вход/Регистрация; 'user' — пункты аккаунта + Выйти */
  auth?: 'guest' | 'user';
  /** Инициалы в аватар-триггере (авторизованный), по умолчанию «ИИ» как в мокапе */
  userInitials?: string;
  /** Юр. пункты (по умолчанию: Приватность /privacy, Правила /rules) */
  legalItems?: RightMenuItem[];
  /** Пункты «Аккаунт» для авторизованного (по умолчанию: Профиль/Настройки/Мультиаккаунт) */
  accountItems?: RightMenuItem[];
  /** Клик по «Выйти» (нет — пункт не рендерится) */
  onLogout?: () => void;
  /** Переходы гостя (по умолчанию: /login, /register) */
  guestActions?: { loginTo: string; registerTo: string };
  /** SPA-навигация (react-router navigate). Нет — переход location.href. */
  onNavigate?: (to: string) => void;
}

// Темы ровно 3, лейблы — BALLOO_THEMES из common.js:7–11
const THEMES: { id: Theme; icon: string; labelKey: TranslationKey }[] = [
  { id: 'dark', icon: '🌙', labelKey: 'menu.themeDark' },
  { id: 'light', icon: '☀️', labelKey: 'menu.themeLight' },
  { id: 'russian', icon: '🇷🇺', labelKey: 'menu.themeRussian' },
];

export const DEFAULT_LEGAL_ITEMS: RightMenuItem[] = [
  // Техподдержка — первым пунктом юр. секции, как в эталоне common.js:496
  { key: 'menu.support', to: '/support', icon: '🛠️' },
  { key: 'footer.privacy', to: '/privacy', icon: '🔒' },
  { key: 'footer.rules', to: '/rules', icon: '📋' },
];

/**
 * Пункты секции «Аккаунт» по умолчанию. Экспортированы: тест проверяет по ним
 * наличие ключей в словаре, чтобы список не мог устареть молча.
 */
export const DEFAULT_ACCOUNT_ITEMS: RightMenuItem[] = [
  { key: 'menu.profile', to: '/profile', icon: '👤' },
  { key: 'menu.settings', to: '/settings', icon: '⚙️' },
  // Мультиаккаунт: секция аккаунтов живёт в профиле (ProfileScreen)
  { key: 'menu.accounts', to: '/profile', icon: '👥' },
];

type SubmenuKey = 'lang' | 'theme' | null;

export function RightMenu({
  auth = 'guest',
  userInitials = 'ИИ',
  legalItems = DEFAULT_LEGAL_ITEMS,
  accountItems = DEFAULT_ACCOUNT_ITEMS,
  onLogout,
  guestActions = { loginTo: '/login', registerTo: '/register' },
  onNavigate,
}: RightMenuProps) {
  const { t } = useI18n();
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<SubmenuKey>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне (common.js:549–553) и по Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSubmenu(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSubmenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
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
      {/* Триггер: гость — маскот 🐻, авторизован — октагон-аватар (common.js:452–463) */}
      <button
        type="button"
        id="balloo-menu-btn"
        className={`topbar__menu-btn${open ? ' topbar__menu-btn--open' : ''}`}
        title={t('menu.button')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {auth === 'guest' ? (
          <div className="mascot">🐻</div>
        ) : (
          <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
            <div className="avatar__inner">
              <span>{userInitials}</span>
            </div>
          </div>
        )}
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

        {/* Юридические пункты */}
        {legalItems.map((item) => (
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

        {/* Аккаунт */}
        <div className="right-menu__section-label">{t('settings.account')}</div>
        {auth === 'guest' ? (
          <div className="right-menu__auth-guest">
            <button type="button" className="btn btn--primary btn--block" onClick={() => go(guestActions.loginTo)}>
              {t('auth.login')}
            </button>
            <button type="button" className="btn btn--secondary btn--block" onClick={() => go(guestActions.registerTo)}>
              {t('auth.register')}
            </button>
          </div>
        ) : (
          <>
            {accountItems.map((item) => (
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
            {onLogout && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
