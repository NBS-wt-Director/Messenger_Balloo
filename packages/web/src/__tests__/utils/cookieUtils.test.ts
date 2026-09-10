import { describe, it, expect, beforeEach } from 'vitest';
import {
  setCookie,
  getCookie,
  deleteCookie,
  hasCookieChoice,
  hasCookieConsent,
  hasAnalyticsConsent,
  hasThirdPartyConsent,
  acceptCookieConsent,
  declineCookieConsent,
  getDomain,
  THEME_COOKIE,
  LANGUAGE_COOKIE,
  COOKIE_CONSENT_KEY,
  CONSENT_ACCEPTED,
  CONSENT_ESSENTIAL,
} from '../../utils/cookieUtils';

describe('cookieUtils', () => {
  beforeEach(() => {
    // Очистить все cookie
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    });
  });

  describe('setCookie / getCookie', () => {
    it('sets and reads a cookie', () => {
      setCookie('test-cookie', 'test-value');
      expect(getCookie('test-cookie')).toBe('test-value');
    });

    it('returns null for missing cookie', () => {
      expect(getCookie('nonexistent')).toBeNull();
    });

    it('overwrites existing cookie', () => {
      setCookie('test-cookie', 'v1');
      setCookie('test-cookie', 'v2');
      expect(getCookie('test-cookie')).toBe('v2');
    });

    it('sets functional setting cookies', () => {
      setCookie(THEME_COOKIE, 'dark');
      setCookie(LANGUAGE_COOKIE, 'ru');

      expect(getCookie(THEME_COOKIE)).toBe('dark');
      expect(getCookie(LANGUAGE_COOKIE)).toBe('ru');
    });
  });

  describe('deleteCookie', () => {
    it('deletes an existing cookie', () => {
      setCookie('to-delete', 'value');
      expect(getCookie('to-delete')).toBe('value');

      deleteCookie('to-delete');
      expect(getCookie('to-delete')).toBeNull();
    });
  });

  describe('getDomain', () => {
    it('returns undefined on localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost', protocol: 'http:' },
        writable: true,
      });
      expect(getDomain()).toBeUndefined();
    });

    it('returns parent domain for subdomains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'admin.balloo.su', protocol: 'https:' },
        writable: true,
      });
      expect(getDomain()).toBe('.balloo.su');
    });

    it('returns .domain for 2-part hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'balloo.su', protocol: 'https:' },
        writable: true,
      });
      expect(getDomain()).toBe('.balloo.su');
    });

    it('returns undefined for IP addresses', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '192.168.1.1', protocol: 'http:' },
        writable: true,
      });
      expect(getDomain()).toBeUndefined();
    });
  });

  describe('cookie consent', () => {
    it('no choice initially', () => {
      expect(hasCookieChoice()).toBe(false);
      expect(hasCookieConsent()).toBe(false);
      expect(hasAnalyticsConsent()).toBe(false);
      expect(hasThirdPartyConsent()).toBe(false);
    });

    it('acceptCookieConsent grants full consent', () => {
      acceptCookieConsent();

      expect(getCookie(COOKIE_CONSENT_KEY)).toBe(CONSENT_ACCEPTED);
      expect(hasCookieChoice()).toBe(true);
      expect(hasCookieConsent()).toBe(true);
      expect(hasAnalyticsConsent()).toBe(true);
      expect(hasThirdPartyConsent()).toBe(true);
    });

    it('declineCookieConsent grants essential-only consent', () => {
      declineCookieConsent();

      expect(getCookie(COOKIE_CONSENT_KEY)).toBe(CONSENT_ESSENTIAL);
      expect(hasCookieChoice()).toBe(true);
      expect(hasCookieConsent()).toBe(false);
      expect(hasAnalyticsConsent()).toBe(false);
      expect(hasThirdPartyConsent()).toBe(false);
    });
  });
});
