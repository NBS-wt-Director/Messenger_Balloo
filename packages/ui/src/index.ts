// @balloo/ui — единый UI-контракт всех сайтов balloo.su (тик. №1 мультитикета поддоменов)
// Topbar/Footer/ThemeProvider/I18nProvider/токены/темы. Все сайты (web,
// web-admin, web-command, web-features, инфо-сайты) используют ЭТОТ пакет.

// Store (тема + язык, cookie-persist на .balloo.su)
export { useUIStore, SUPPORTED_LANGUAGES } from './store/uiStore';
export type { Theme, Language } from './store/uiStore';

// Providers
export { ThemeProvider, useTheme, ThemeContext } from './providers/ThemeProvider';
export { I18nProvider, useI18n, I18nContext } from './providers/I18nProvider';

// Components — единая шапка/подвал
export { Topbar } from './components/Topbar';
export { TopbarMenu, DEFAULT_TOPBAR_ITEMS } from './components/TopbarMenu';
export type { TopbarMenuItem } from './components/TopbarMenu';
export { Footer, DEFAULT_FOOTER_LINKS } from './components/Footer';
export type { FooterLink } from './components/Footer';
export { ThemeSwitcher } from './components/ThemeSwitcher';
export { LanguageSwitcher } from './components/LanguageSwitcher';

// Cookie utils (функциональные cookie, общие для поддоменов)
export {
  getCookie,
  setCookie,
  deleteCookie,
  THEME_COOKIE,
  LANGUAGE_COOKIE,
} from './utils/cookieUtils';
