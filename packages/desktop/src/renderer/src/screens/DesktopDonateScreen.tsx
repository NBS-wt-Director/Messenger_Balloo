// DesktopDonateScreen.tsx — Desktop donation screen
// Shows donation tiers and allows one-time or recurring donations

import React, { useState } from 'react';

interface DonationTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export function DesktopDonateScreen() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const tiers: DonationTier[] = [
    {
      id: 'supporter',
      name: 'Сторонник',
      amount: 100,
      description: 'Поддержите развитие проекта',
      features: ['Бейдж "Сторонник" в профиле', 'Специальные стикеры'],
    },
    {
      id: 'patron',
      name: 'Патрон',
      amount: 300,
      description: 'Помогите нам стать лучше',
      features: ['Бейдж "Патрон" в профиле', 'Специальные стикеры', 'Доступ к бета-функциям'],
      popular: true,
    },
    {
      id: 'benefactor',
      name: 'Благодетель',
      amount: 1000,
      description: 'Внесите значительный вклад',
      features: ['Бейдж "Благодетель" в профиле', 'Специальные стикеры', 'Доступ к бета-функциям', 'Упоминание в списке благодетелей'],
    },
  ];

  const handleDonate = async () => {
    const amount = selectedTier
      ? tiers.find(t => t.id === selectedTier)?.amount
      : parseInt(customAmount);

    if (!amount || amount <= 0) return;

    // TODO: API call to create donation via YooMoney
    console.log('Donate:', amount);
  };

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
            style={{
              background: 'var(--accent, #2db84d)',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Поддержать
          </button>
        </div>
      </div>
    </div>
  );
}