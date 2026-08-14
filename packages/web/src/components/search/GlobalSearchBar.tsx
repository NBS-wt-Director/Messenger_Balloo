// GlobalSearchBar — глобальный поиск с горячей клавишей Ctrl+K
// Вызывается из topbar, открывает fullscreen overlay

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '@/store/searchStore';

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchStore = useSearchStore();

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback(() => {
    if (query.trim()) {
      searchStore.setQuery(query);
      searchStore.addRecentSearch(query);
      navigate('/search');
    } else {
      navigate('/search');
    }
    setIsOpen(false);
  }, [query, navigate, searchStore]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSelect();
      }
    },
    [handleSelect]
  );

  // Overlay backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setIsOpen(false);
      }
    },
    []
  );

  if (!isOpen) {
    // Trigger button — small search icon in topbar
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '6px 8px',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        title="Поиск (Ctrl+K)"
      >
        🔍
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            opacity: 0.6,
          }}
        >
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0',
          width: '100%',
          maxWidth: '640px',
          padding: '0',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск по чатам, людям, файлам, медиа..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '18px',
              padding: '4px 0',
            }}
          />
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '0',
              lineHeight: 1,
            }}
          >
            ESC
          </button>
        </div>

        {/* Quick suggestions */}
        <div
          style={{
            padding: '12px 20px',
            maxHeight: '40vh',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Быстрый переход
          </div>
          <div
            onClick={() => {
              navigate('/stories');
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              cursor: 'pointer',
              borderRadius: '0',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--bg-secondary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <span style={{ fontSize: '18px' }}>📖</span> Истории
          </div>
          <div
            onClick={() => {
              navigate('/contacts');
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              cursor: 'pointer',
              borderRadius: '0',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--bg-secondary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <span style={{ fontSize: '18px' }}>👤</span> Контакты
          </div>
          <div
            onClick={() => {
              navigate('/settings');
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              cursor: 'pointer',
              borderRadius: '0',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--bg-secondary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <span style={{ fontSize: '18px' }}>⚙️</span> Настройки
          </div>
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            <kbd
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: '0',
                fontSize: '11px',
              }}
            >
              ↵
            </kbd>{' '}
            открыть
          </span>
          <span>
            <kbd
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: '0',
                fontSize: '11px',
              }}
            >
              ↑↓
            </kbd>{' '}
            навигация
          </span>
          <span>
            <kbd
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: '0',
                fontSize: '11px',
              }}
            >
              esc
            </kbd>{' '}
            закрыть
          </span>
        </div>
      </div>
    </div>
  );
}
