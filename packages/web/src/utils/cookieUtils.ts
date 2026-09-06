/**
 * Возвращает домен для функциональных cookie.
 * В продакшене — `.balloo.su` (cookie читают все поддомены: admin, features, api, download, history).
 * На localhost (dev) — без атрибута Domain (host-only cookie, иначе браузер их отбросит).
 */
export function getDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  // localhost / 127.0.0.1 / IP — cookie без домена
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return undefined;
  }
  // Родительский домен для кросс-поддоменного доступа (.balloo.su)
  const parts = hostname.split(".");
  if (parts.length <= 2) return "." + hostname;
  return "." + parts.slice(-2).join(".");
}

export function setCookie(
  name: string,
  value: string,
  days = 365,
  path = "/",
  domain?: string
): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  const domainAttr = domain ?? getDomain();
  const domainPart = domainAttr ? ";domain=" + domainAttr : "";
  document.cookie =
    name +
    "=" +
    value +
    ";expires=" +
    date.toUTCString() +
    ";path=" +
    path +
    domainPart +
    ";SameSite=Lax" +
    secure;
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
  }
  return null;
}

export function deleteCookie(name: string, path = "/"): void {
  const domainAttr = getDomain();
  const domainPart = domainAttr ? ";domain=" + domainAttr : "";
  document.cookie =
    name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=" + path + domainPart + ";";
}

// --- Функциональные cookie (настройки UI, читаются всеми поддоменами) ---

export const THEME_COOKIE = "balloo-theme";
export const LANGUAGE_COOKIE = "balloo-language";
export const SIDEBAR_COOKIE = "balloo-sidebar";

// --- Согласие на cookie (CookieBanner) ---
// Значения cookie согласия:
//   'accepted'  — «Принять все»: аналитика (Яндекс.Метрика) + сторонние cookie (OAuth, ЮKassa)
//   'essential' — «Только необходимые»: аналитика и сторонние НЕ подключаются
export const COOKIE_CONSENT_KEY = "balloo-cookie-consent";
export const CONSENT_ACCEPTED = "accepted";
export const CONSENT_ESSENTIAL = "essential";

/** Есть ли выбор пользователя по cookie (любой вариант). */
export function hasCookieChoice(): boolean {
  const value = getCookie(COOKIE_CONSENT_KEY);
  return value === CONSENT_ACCEPTED || value === CONSENT_ESSENTIAL;
}

/** Дано ли полное согласие (аналитические + сторонние cookie). */
export function hasCookieConsent(): boolean {
  return getCookie(COOKIE_CONSENT_KEY) === CONSENT_ACCEPTED;
}

/** Дано ли согласие на аналитические cookie (Яндекс.Метрика и т.п.). */
export function hasAnalyticsConsent(): boolean {
  return hasCookieConsent();
}

/**
 * Дано ли согласие на сторонние cookie (OAuth-провайдеры: Яндекс ID, VK ID, Mail.ru ID;
 * платёжная система ЮKassa). Cookie этих сервисов ставятся на внешних доменах,
 * наше согласие фиксируется в cookie `balloo-cookie-consent`.
 */
export function hasThirdPartyConsent(): boolean {
  return hasCookieConsent();
}

/** Согласие «Принять все»: аналитика + сторонние. */
export function acceptCookieConsent(): void {
  setCookie(COOKIE_CONSENT_KEY, CONSENT_ACCEPTED, 365);
}

/** Согласие «Только необходимые»: без аналитики и сторонних cookie. */
export function declineCookieConsent(): void {
  setCookie(COOKIE_CONSENT_KEY, CONSENT_ESSENTIAL, 365);
}
