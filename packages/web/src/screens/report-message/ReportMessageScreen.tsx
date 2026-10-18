// ReportMessage Screen — жалоба на сообщение
// Макет: mockups/balloo-su/report-message.html

import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/services/api';

interface ReportReason {
  id: string;
  icon: string;
  title: string;
}

const REASONS: ReportReason[] = [
  { id: 'spam', icon: '📢', title: 'Спам / Реклама' },
  { id: 'insults', icon: '🤬', title: 'Оскорбления / Травля' },
  { id: 'adult_content', icon: '🔞', title: 'Неприемлемый контент' },
  { id: 'misinformation', icon: '⚠️', title: 'Дезинформация' },
  { id: 'privacy', icon: '🔐', title: 'Нарушение приватности' },
  { id: 'illegal', icon: '⚖️', title: 'Нарушение закона' },
  { id: 'other', icon: '📋', title: 'Другое' },
];

export default function ReportMessageScreen() {
  const { messageId } = useParams<{ messageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const submitReport = useCallback(async () => {
    if (!selectedReason || !messageId) return;
    try {
      setSubmitting(true);
      const result = await api.createReport({
        messageId,
        chatId: message?.chatId,
        reason: selectedReason,
        comment: comment || undefined,
      });
      setReportId(result.report_id);
    } catch {
      // ошибка
    } finally {
      setSubmitting(false);
    }
  }, [selectedReason, comment, messageId, message]);

  if (reportId) {
    return (
      <div className="report-panel">
        <div className="report-success">
          <div className="report-success__icon">✅</div>
          <h2 className="report-success__title">Жалоба отправлена</h2>
          <p className="report-success__text">
            Номер жалобы: <code>{reportId}</code>
          </p>
          <p className="report-success__hint">Ожидаемое время рассмотрения: 24 часа</p>
          <button className="btn btn--primary" onClick={() => navigate(-1)}>
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-panel">
      {/* Заголовок */}
      <div className="report-header">
        <button className="btn btn--tertiary btn--sm" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <span className="report-title">🚩 Пожаловаться</span>
        <button className="btn btn--tertiary btn--sm" onClick={() => navigate(-1)}>
          ✕
        </button>
      </div>

      {/* Цитируемое сообщение */}
      {message && (
        <div className="quoted-message">
          <div className="quoted-message__header">
            <span className="quoted-message__avatar">{(message.senderName || '?')[0]}</span>
            <span className="quoted-message__name">{message.senderName}</span>
          </div>
          <p className="quoted-message__text">{message.content}</p>
        </div>
      )}

      {/* Причины */}
      <div className="report-reasons">
        <h3 className="report-reasons__title">Причина жалобы</h3>
        {REASONS.map((reason) => (
          <label
            key={reason.id}
            className={`report-reason ${selectedReason === reason.id ? 'report-reason--selected' : ''}`}
          >
            <input
              type="radio"
              name="reason"
              value={reason.id}
              checked={selectedReason === reason.id}
              onChange={() => setSelectedReason(reason.id)}
            />
            <span className="report-reason__icon">{reason.icon}</span>
            <span className="report-reason__title">{reason.title}</span>
          </label>
        ))}
      </div>

      {/* Комментарий */}
      <div className="form-group">
        <label className="form-label">Комментарий (необязательно)</label>
        <textarea
          className="form-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Опишите подробнее..."
          rows={3}
        />
      </div>

      {/* Футер */}
      <div className="report-footer">
        <button className="btn btn--tertiary" onClick={() => navigate(-1)}>
          Отмена
        </button>
        <button
          className="btn btn--danger"
          onClick={submitReport}
          disabled={submitting || !selectedReason}
        >
          {submitting ? 'Отправка...' : '🚩 Отправить жалобу'}
        </button>
      </div>
    </div>
  );
}
