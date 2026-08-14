// NotificationsBell — колокольчик уведомлений
// Счётчик непрочитанных

import React, { useState } from 'react';

interface NotificationsBellProps {
  count?: number;
  onClick?: () => void;
}

export function NotificationsBell({ count = 0, onClick }: NotificationsBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onClick?.();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '4px 8px',
          position: 'relative',
          color: 'var(--text-primary)',
        }}
      >
        🔔
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#e53e3e',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '0',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--text-primary)',
            }}
          >
            Уведомления
            {count > 0 && (
              <span style={{ float: 'right', color: 'var(--accent)', fontSize: '12px' }}>
                {count} новых
              </span>
            )}
          </div>

          {count === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              Нет новых уведомлений
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {/* Placeholder for notification items */}
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Тестовое уведомление</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Только что</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
