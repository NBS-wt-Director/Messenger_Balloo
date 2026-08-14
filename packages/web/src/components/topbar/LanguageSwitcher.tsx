// LanguageSwitcher — переключатель языков

import React, { useState, useRef, useEffect } from 'react';
import { useUIStore, SUPPORTED_LANGUAGES, type Language } from '@/store/uiStore';

export function LanguageSwitcher() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0',
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: '13px',
          color: 'var(--text-primary)',
        }}
      >
        <span>{currentLang?.nativeName || 'RU'}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '160px',
            zIndex: 1000,
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                color: language === lang.code ? 'var(--accent)' : 'var(--text-primary)',
                background: language === lang.code ? 'var(--bg-hover)' : 'transparent',
                fontWeight: language === lang.code ? 600 : 400,
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (language !== lang.code) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (language !== lang.code) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{lang.nativeName}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{lang.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
