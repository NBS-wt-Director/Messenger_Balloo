// CookieBanner - cookie consent banner
// Согласие фиксируется в cookie `balloo-cookie-consent`:
//   «Принять все»        → аналитика (Яндекс.Метрика) + сторонние cookie (OAuth, ЮKassa)
//   «Только необходимые» → без аналитики и сторонних cookie
// Яндекс.Метрика загружается ТОЛЬКО после «Принять все» (152-ФЗ, ip-анонимизация).

import { useState, useEffect } from "react";
import {
  hasCookieChoice,
  acceptCookieConsent,
  declineCookieConsent,
} from "@/utils/cookieUtils";
import { initYandexMetrika } from "@/utils/yandex-metrika";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasCookieChoice()) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    acceptCookieConsent();
    setVisible(false);
    // Consent-based загрузка Метрики: только после «Принять все»
    initYandexMetrika();
  };

  const handleDecline = () => {
    declineCookieConsent();
    setVisible(false);
  };

  if (!visible) return null;

  const btnBase: React.CSSProperties = {
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div
      role="dialog"
      aria-label="Настройки cookie"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
        padding: "16px 24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        fontFamily: "Inter, Manrope, sans-serif",
        fontSize: "14px",
      }}
    >
      <div style={{ flex: 1, minWidth: "280px" }}>
        <p style={{ margin: 0, color: "var(--text-primary)" }}>
          Мы используем файлы cookie для корректной работы сервиса, аналитики
          (Яндекс.Метрика, с анонимизацией IP) и сторонних сервисов
          (OAuth-вход: Яндекс, VK, Mail.ru; платежи: ЮKassa). Подробнее — в{" "}
          <a href="/cookies" style={{ color: "var(--accent)" }}>
            политике cookies
          </a>
          .
        </p>
      </div>
      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            ...btnBase,
            borderRadius: 0,
            border: "1px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-primary)",
          }}
        >
          Только необходимые
        </button>
        <button
          onClick={handleAccept}
          style={{
            ...btnBase,
            borderRadius: 0,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Принять все
        </button>
      </div>
    </div>
  );
}
