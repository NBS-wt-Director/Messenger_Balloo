// DesktopMyDonatesScreen.tsx — Desktop my donations history screen
// Shows user's donation history and status

import React from 'react';

interface DonationRecord {
  id: string;
  tier: string;
  amount: number;
  date: number;
  status: 'success' | 'pending' | 'failed';
}

export function DesktopMyDonatesScreen() {
  const donations: DonationRecord[] = [
    { id: '1', tier: 'Патрон', amount: 300, date: Date.now() - 86400000 * 30, status: 'success' },
    { id: '2', tier: 'Сторонник', amount: 100, date: Date.now() - 86400000 * 60, status: 'success' },
    { id: '3', tier: 'Патрон', amount: 300, date: Date.now() - 86400000 * 90, status: 'pending' },
  ];

  const statusLabel = (status: string): { text: string; color: string } => {
    switch (status) {
      case 'success': return { text: 'Успешно', color: 'var(--accent, #2db84d)' };
      case 'pending': return { text: 'В обработке', color: '#f0ad4e' };
      case 'failed': return { text: 'Ошибка', color: '#e74c3c' };
      default: return { text: status, color: 'var(--text-secondary, #8a8aa0)' };
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 0',
    borderBottom: '1px solid var(--border-color, #2a2a40)',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
        Мои донаты
      </h2>

      {donations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
          <p style={{ fontSize: '16px' }}>У вас пока нет донатов</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>
            Поддержите проект, чтобы появилась история
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={rowStyle}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', textTransform: 'uppercase' }}>
              Тир
            </span>
            <span style={{ width: '80px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', textTransform: 'uppercase', textAlign: 'right' }}>
              Сумма
            </span>
            <span style={{ width: '100px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', textTransform: 'uppercase', textAlign: 'right' }}>
              Дата
            </span>
            <span style={{ width: '100px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', textTransform: 'uppercase', textAlign: 'right' }}>
              Статус
            </span>
          </div>
          {donations.map(d => {
            const status = statusLabel(d.status);
            return (
              <div key={d.id} style={rowStyle}>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary, #fff)' }}>
                  {d.tier}
                </span>
                <span style={{ width: '80px', fontSize: '14px', color: 'var(--text-primary, #fff)', textAlign: 'right', fontWeight: 600 }}>
                  {d.amount} ₽
                </span>
                <span style={{ width: '100px', fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', textAlign: 'right' }}>
                  {formatDate(d.date)}
                </span>
                <span style={{ width: '100px', fontSize: '13px', color: status.color, textAlign: 'right' }}>
                  {status.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}