// DesktopReportMessageScreen.tsx — Desktop report message screen
// Allows reporting inappropriate messages

import React, { useState } from 'react';

const reportReasons = [
  { id: 'spam', label: 'Спам' },
  { id: 'harassment', label: 'Домогательство' },
  { id: 'hate_speech', label: 'Разжигание ненависти' },
  { id: 'violence', label: 'Насилие' },
  { id: 'pornography', label: 'Порнография' },
  { id: 'copyright', label: 'Нарушение авторских прав' },
  { id: 'other', label: 'Другое' },
];

export function DesktopReportMessageScreen() {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) return;
    // TODO: API call to submit report
    console.log('Report:', { reason: selectedReason, comment });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: 'var(--text-primary, #fff)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Жалоба отправлена</h2>
        <p style={{ color: 'var(--text-secondary, #8a8aa0)', fontSize: '14px' }}>
          Спасибо! Мы рассмотрим вашу жалобу в ближайшее время.
        </p>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '500px',
  };

  const reasonStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: isSelected ? 'rgba(45, 184, 77, 0.1)' : 'var(--bg-card, #1e1e32)',
    border: `1px solid ${isSelected ? 'var(--accent, #2db84d)' : 'var(--border-color, #2a2a40)'}`,
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--text-primary, #fff)',
    marginBottom: '6px',
  });

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
        Пожаловаться на сообщение
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', marginBottom: '20px' }}>
        Выберите причину жалобы
      </p>

      <div style={{ marginBottom: '20px' }}>
        {reportReasons.map(reason => (
          <div
            key={reason.id}
            style={reasonStyle(selectedReason === reason.id)}
            onClick={() => setSelectedReason(reason.id)}
          >
            <input
              type="radio"
              checked={selectedReason === reason.id}
              onChange={() => setSelectedReason(reason.id)}
              style={{ accentColor: 'var(--accent, #2db84d)' }}
            />
            {reason.label}
          </div>
        ))}
      </div>

      <textarea
        placeholder="Дополнительный комментарий (необязательно)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{
          background: 'var(--bg-surface, #2a2a40)',
          border: '1px solid var(--border-color, #2a2a40)',
          color: 'var(--text-primary, #fff)',
          padding: '12px',
          fontSize: '14px',
          minHeight: '80px',
          resize: 'vertical',
          outline: 'none',
          marginBottom: '20px',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!selectedReason}
        style={{
          background: selectedReason ? 'var(--accent, #2db84d)' : 'var(--bg-surface, #2a2a40)',
          color: selectedReason ? '#fff' : 'var(--text-secondary, #8a8aa0)',
          border: 'none',
          padding: '12px 24px',
          cursor: selectedReason ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        Отправить жалобу
      </button>
    </div>
  );
}