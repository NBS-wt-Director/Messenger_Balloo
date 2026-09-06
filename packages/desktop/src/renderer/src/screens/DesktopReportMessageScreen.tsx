import React, { useState } from 'react';
import { api } from '@balloo/web/services/api';

const reportReasons = [
  { id: 'spam', label: 'Спам' },
  { id: 'harassment', label: 'Домогательство' },
  { id: 'hate_speech', label: 'Разжигание ненависти' },
  { id: 'violence', label: 'Насилие' },
  { id: 'pornography', label: 'Порнография' },
  { id: 'copyright', label: 'Нарушение авторских прав' },
  { id: 'other', label: 'Другое' },
];

interface DesktopReportMessageScreenProps {
  messageId?: string;
  reportedUserId?: string;
  chatId?: string;
  onSuccess?: () => void;
}

export function DesktopReportMessageScreen({ messageId, reportedUserId, chatId, onSuccess }: DesktopReportMessageScreenProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('Выберите причину обращения');
      return;
    }
    if (!messageId && !reportedUserId) {
      alert('Невозможно отправить жалобу: не указан контакт');
      return;
    }
    setSubmitting(true);
    try {
      await api.createReport({ messageId, reportedUserId, reason: selectedReason, comment: comment || undefined, chatId });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-primary, #fff)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Жалоба отправлена</h2>
        <p style={{ color: 'var(--text-secondary, #8a8aa0)', fontSize: '14px' }}>Спасибо! Мы рассмотрим вашу жалобу.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'var(--text-primary, #fff)' }}>Жалоба на сообщение</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', marginBottom: '20px' }}>Выберите причину</p>
      <div style={{ marginBottom: '20px' }}>
        {reportReasons.map(reason => (
          <div
            key={reason.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: selectedReason === reason.id ? 'rgba(45, 184, 77, 0.1)' : 'var(--bg-card, #1e1e32)',
              border: `1px solid ${selectedReason === reason.id ? 'var(--accent, #2db84d)' : 'var(--border-color, #2a2a40)'}`,
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text-primary, #fff)',
              marginBottom: '6px',
            }}
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
        disabled={submitting || !selectedReason}
        style={{
          background: submitting || !selectedReason ? 'var(--bg-surface, #2a2a40)' : 'var(--accent, #2db84d)',
          color: submitting || !selectedReason ? 'var(--text-secondary, #8a8aa0)' : '#fff',
          border: 'none',
          padding: '12px 24px',
          cursor: submitting || !selectedReason ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '4px',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Отправка...' : 'Отправить жалобу'}
      </button>
    </div>
  );
}
