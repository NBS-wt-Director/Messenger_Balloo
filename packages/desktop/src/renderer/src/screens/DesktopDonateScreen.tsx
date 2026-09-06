// DesktopDonateScreen.tsx — Desktop donation screen
// Shows donation tiers and allows one-time or recurring donations

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@balloo/web/services/api';

interface DonationTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export function DesktopDonateScreen() {
  const [tiers, setTiers] = useState<DonationTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [donated, setDonated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getDonationTiers();
      setTiers(result.tiers || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки уровней донатов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleDonate = async () => {
    const amount = selectedTier
      ? tiers.find(t => t.id === selectedTier)?.amount
      : parseInt(customAmount);

    if (!amount || amount <= 0) return;

    setProcessing(true);
    try {
      await api.createDonation({ amount, tierId: selectedTier || undefined });
      setDonated(true);
    } catch (err: any) {
      alert('Ошибка оплаты: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (donated) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: 'var(--text-primary, #fff)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💚</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>Спасибо за поддержку!</h2>
        <p style={{ color: 'var(--text-secondary, #8a8aa0)', fontSize: '14px', maxWidth: '400px' }}>
          Ваша помощь помогает нам развивать Balloo Messenger. 
          Бейдж появится в профиле в течение нескольких минут.
        </p>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    overflow: 'auto',
  };

  const tierCardStyle = (isSelected: boolean, isPopular: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: '220px',
    maxWidth: '300px',
    padding: '20px',
    background: isSelected ? 'rgba(45, 184, 77, 0.1)' : 'var(--bg-card, #1e1e32)',
    border: `2px solid ${isSelected ? 'var(--accent, #2db84d)' : isPopular ? 'var(--accent, #2db84d)' : 'var(--border-color, #2a2a40)'}`,
    cursor: 'pointer',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  });

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary, #fff)' }}>
          Поддержать Balloo
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', marginTop: '8px' }}>
          Ваша поддержка помогает нам развивать мессенджер
        </p>
      </div>

      {/* Loading / Error / Empty */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
          <p style={{ fontSize: '16px' }}>Загрузка уровней поддержки...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#e74c3c' }}>
          <p style={{ fontSize: '16px' }}>{error}</p>
          <button onClick={fetchTiers} style={{ marginTop: '12px', padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Повторить
          </button>
        </div>
      ) : (
        <>
          {/* Donation Tiers */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {tiers.map(tier => (
              <div
                key={tier.id}
                style={tierCardStyle(selectedTier === tier.id, !!tier.popular)}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '12px',
                    background: 'var(--accent, #2db84d)',
                    color: '#fff',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    Популярное
                  </div>
                )}
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary, #fff)' }}>
                  {tier.name}
                </h3>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent, #2db84d)' }}>
                  {tier.amount} ₽
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', margin: 0 }}>
                  {tier.description}
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)' }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ marginTop: '4px' }}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Custom Amount */}
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', marginBottom: '8px' }}>
          Или укажите свою сумму
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <input
            type="number"
            placeholder="Сумма в ₽"
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedTier(null); }}
            style={{
              background: 'var(--bg-surface, #2a2a40)',
              border: '1px solid var(--border-color, #2a2a40)',
              color: 'var(--text-primary, #fff)',
              padding: '10px 16px',
              fontSize: '14px',
              width: '200px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleDonate}
            disabled={processing || (!selectedTier && !customAmount)}
            style={{
              background: processing || (!selectedTier && !customAmount) ? 'var(--bg-surface, #2a2a40)' : 'var(--accent, #2db84d)',
              color: processing || (!selectedTier && !customAmount) ? 'var(--text-secondary, #8a8aa0)' : '#fff',
              border: 'none',
              padding: '10px 24px',
              cursor: processing || (!selectedTier && !customAmount) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {processing ? 'Обработка...' : 'Поддержать'}
          </button>
        </div>
      </div>
    </div>
  );
}
