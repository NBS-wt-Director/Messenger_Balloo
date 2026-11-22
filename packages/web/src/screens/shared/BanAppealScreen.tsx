// Ban Appeal Screen — оверлей обжалования бана
// Shared error screen (1_00_08) — макет mockups/shared/ban-appeal.html
// Это оверлей-экран, который перекрывает все остальные экраны

import { useState } from 'react';
import { useUIStore } from '@balloo/ui';
import { PageChrome } from '@/components/chrome/PageChrome';

interface BanAppealScreenProps {
  onClose?: () => void;
}

// Mock ban data — в реальности берётся из store/api
const banInfo = {
  reason: 'Спам (массовая рассылка)',
  date: '17.07.2026, 14:32',
  type: 'Временный (7 дней)',
  id: '#BAN-2026-0717-0042',
};

function BanAppealScreen({ onClose }: BanAppealScreenProps) {
  const setTheme = useUIStore((s) => s.setTheme);
  const [appealText, setAppealText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(71 * 3600 + 59 * 60 + 42); // ~71:59:42
  const [result, setResult] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Countdown timer
  useState(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  });

  const formatCountdown = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    const text = appealText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      // В реальности: POST /appeals
      // await api.post('/appeals', { text });
      setSubmitted(true);
      // Симуляция: через 3 секунды — статус рассмотрения
      setTimeout(() => {
        setResult('pending');
      }, 3000);
    } catch {
      // молчим — ошибка не критична для UI
    } finally {
      setSubmitting(false);
    }
  };

  const countdownClasses = result === 'approved'
    ? 'countdown countdown--approved'
    : result === 'rejected'
      ? 'countdown countdown--expired'
      : 'countdown';

  return (
    <PageChrome title="Обжалование бана">
    <div
      className="appeal-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        padding: 24,
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div
        className="appeal-window"
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="appeal-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(var(--blur))',
          }}
        >
          <span style={{ fontSize: 28 }}>⚖️</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>Обжалование бана</span>
          <span
            className="appeal-header__status"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              padding: '3px 10px',
              border: '1px solid var(--warning)',
              color: 'var(--warning)',
              background: 'rgba(232,163,23,0.12)',
            }}
          >
            {result === 'approved' ? 'Принято' : result === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* Countdown timer */}
          <div className={countdownClasses} style={{ textAlign: 'center', marginBottom: 24, padding: 16, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>До истечения срока обжалования</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: result === 'approved' ? 'var(--accent)' : result === 'rejected' ? 'var(--danger)' : 'var(--warning)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {formatCountdown(countdown)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
              {result === 'rejected' ? 'Бан отклонён. Повторное обжалование через 30 дней.' : 'После истечения срока подать обжалование будет невозможно'}
            </div>
          </div>

          {/* Ban info */}
          <div className="ban-info" style={{ marginBottom: 24, padding: 16, background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Информация о бане</div>
            {[
              { label: 'Причина:', value: banInfo.reason },
              { label: 'Дата бана:', value: banInfo.date },
              { label: 'Тип:', value: banInfo.type },
              { label: 'ID бана:', value: banInfo.id },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 100, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Appeal form or review status */}
          {!submitted ? (
            <div className="appeal-form" style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }} htmlFor="appeal-text">Опишите вашу ситуацию</label>
              <textarea
                id="appeal-text"
                className="appeal-form__textarea"
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                placeholder="Объясните, почему вы считаете бан ошибочным, или опишите обстоятельства нарушения..."
                maxLength={2000}
                style={{ width: '100%', minHeight: 120, resize: 'vertical', padding: 12, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{appealText.length} / 2000</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                💡 Будьте честны и конкретны. Укажите, какие действия привели к нарушению и почему оно больше не повторится. Приложите скриншоты, если это поможет делу.
              </div>
            </div>
          ) : (
            <div className="review-status" style={{ marginBottom: 24, padding: 16, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Статус рассмотрения</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 10, height: 10, flexShrink: 0, background: 'var(--accent)', border: '1px solid var(--accent)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Заявка подана</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 10, height: 10, flexShrink: 0, background: 'var(--warning)', border: '1px solid var(--warning)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ожидание подтверждения администраторами (0 / 4)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 10, height: 10, flexShrink: 0, background: 'var(--bg-active)', border: '1px solid var(--border-color)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Решение принято</span>
              </div>
            </div>
          )}

          {/* Decision result */}
          {result === 'approved' && (
            <div style={{ marginBottom: 24, padding: 20, textAlign: 'center', border: '1px solid var(--accent)', background: 'rgba(45,184,77,0.08)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Бан снят</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>Администрация рассмотрела ваше обжалование и приняла решение снять блокировку. Вы можете продолжить пользоваться Balloo.</div>
            </div>
          )}
          {result === 'rejected' && (
            <div style={{ marginBottom: 24, padding: 20, textAlign: 'center', border: '1px solid var(--danger)', background: 'var(--danger-bg)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)', marginBottom: 8 }}>Обжалование отклонено</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>Администрация отклонила ваше обжалование. Бан остаётся в силе. Вы сможете подать повторное обжалование через 30 дней.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="appeal-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(var(--blur))',
          }}
        >
          <button
            className="btn btn--secondary"
            onClick={() => { if (onClose) onClose(); }}
            style={{ padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 0, cursor: 'pointer', fontSize: 14 }}
          >
            Закрыть
          </button>
          {!submitted && (
            <button
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={submitting || !appealText.trim()}
              style={{
                padding: '0.6rem 1.2rem',
                background: submitting || !appealText.trim() ? 'var(--bg-active)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 0,
                cursor: submitting || !appealText.trim() ? 'wait' : 'pointer',
                fontSize: 14,
                opacity: submitting || !appealText.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? 'Отправка…' : 'Подать обжалование'}
            </button>
          )}
        </div>
      </div>
    </div>
    </PageChrome>
  );
}

export default BanAppealScreen;
