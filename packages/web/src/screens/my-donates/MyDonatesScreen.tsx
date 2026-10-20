// MyDonates Screen — история пожертвований
// Макет: mockups/balloo-su/my-donates.html

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface Donation {
  id: string;
  amount: number;
  tierName?: string;
  status: string;
  createdAt: number;
}

interface Subscription {
  id: string;
  tierName: string;
  amount: number;
  status: string;
  nextPaymentAt: number;
}

export default function MyDonatesScreen() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDonated, setTotalDonated] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [donationsData, subsData] = await Promise.all([
        api.getMyDonations(),
        api.getMySubscriptions(),
      ]);
      setDonations(donationsData?.donations ?? []);
      setSubscriptions(subsData?.subscriptions ?? []);
      const total = (donationsData?.donations ?? []).reduce((sum: number, d: Donation) => sum + d.amount, 0);
      setTotalDonated(total);
    } catch {
      setDonations([]);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('ru-RU');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
  };

  return (
    <div className="page-container">
      <h1 className="page-title">💝 Мои донаты</h1>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          {/* Сводка */}
          <div className="donates-summary">
            <div className="donates-summary__card">
              <span className="donates-summary__value">{formatMoney(totalDonated)}</span>
              <span className="donates-summary__label">Всего пожертвовано</span>
            </div>
            <div className="donates-summary__card">
              <span className="donates-summary__value">{donations.length}</span>
              <span className="donates-summary__label">Пожертвований</span>
            </div>
            <div className="donates-summary__card">
              <span className="donates-summary__value">{subscriptions.length}</span>
              <span className="donates-summary__label">Активных подписок</span>
            </div>
          </div>

          {/* Подписки */}
          {subscriptions.length > 0 && (
            <div className="card">
              <h2 className="card__title">Активные подписки</h2>
              {subscriptions.map((sub) => (
                <div key={sub.id} className="subscription-item">
                  <span className="subscription-item__name">{sub.tierName}</span>
                  <span className="subscription-item__amount">{formatMoney(sub.amount)}/мес</span>
                  <span className="subscription-item__next">След: {formatDate(sub.nextPaymentAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* История */}
          <div className="card">
            <h2 className="card__title">История пожертвований</h2>
            {donations.length === 0 ? (
              <p className="empty-state">Пожертвований нет</p>
            ) : (
              <div className="donations-list">
                {donations.map((d) => (
                  <div key={d.id} className="donation-item">
                    <span className="donation-item__amount">{formatMoney(d.amount)}</span>
                    {d.tierName && <span className="chip chip--accent">{d.tierName}</span>}
                    <span className="donation-item__date">{formatDate(d.createdAt)}</span>
                    <span className={`chip ${d.status === 'completed' ? 'chip--accent' : 'chip--warning'}`}>
                      {d.status === 'completed' ? '✅' : '⏳'} {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка нового доната */}
          <button className="btn btn--primary btn--block" onClick={() => navigate('/donate')}>
            💝 Сделать пожертвование
          </button>
        </>
      )}
    </div>
  );
}
