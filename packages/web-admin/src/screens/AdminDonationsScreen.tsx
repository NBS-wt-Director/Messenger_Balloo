// AdminDonationsScreen — управление донатами и настройками платёжного модуля
// Двухрежимная система: анонимный (СБП) / полноценный (ЮKassa)

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export function AdminDonationsScreen() {
  const [mode, setMode] = useState<'anonymous' | 'yookassa'>('anonymous');
  const [shopId, setShopId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [hasSecretKey, setHasSecretKey] = useState(false);
  const [webhookActive, setWebhookActive] = useState(false);
  const [sbpQrUrl, setSbpQrUrl] = useState('/assets/logos/qr_helpus.jpg');
  const [sbpPhoneNumber, setSbpPhoneNumber] = useState('89122023035');
  const [sbpPhoneName, setSbpPhoneName] = useState('Оберюхттин Иван, Сбербанк');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);
  const [donationsPage, setDonationsPage] = useState(1);
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [donationsFilter, setDonationsFilter] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
    loadDonations();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.request<any>('/api/payments/admin/config');
      const cfg = res.config;
      if (cfg) {
        setMode(cfg.mode);
        setShopId(cfg.shopId || '');
        setHasSecretKey(cfg.hasSecretKey || false);
        setWebhookActive(cfg.webhookActive || false);
        setSbpQrUrl(cfg.sbpQrUrl || '/assets/logos/qr_helpus.jpg');
        setSbpPhoneNumber(cfg.sbpPhoneNumber || '89122023035');
        setSbpPhoneName(cfg.sbpPhoneName || 'Оберюхттин Иван, Сбербанк');
      }
    } catch (e: any) {
      setMessage('Ошибка загрузки конфигурации');
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async (status?: string) => {
    try {
      const params = new URLSearchParams({ page: String(donationsPage), limit: '50' });
      if (status) params.set('status', status);
      const res = await api.request<any>(`/api/payments/admin/donations?${params}`);
      setDonations(res.donations || []);
      setDonationsTotal(res.total || 0);
    } catch (e: any) {
      // ignore
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      const body: any = { mode };
      if (shopId) body.shopId = shopId;
      if (secretKey) body.secretKey = secretKey;
      body.sbpQrUrl = sbpQrUrl;
      body.sbpPhoneNumber = sbpPhoneNumber;
      body.sbpPhoneName = sbpPhoneName;
      body.webhookActive = webhookActive;

      const res = await api.request<any>('/api/payments/admin/config', {
        method: 'PUT',
        data: body,
      });
      setMessage(res.message || 'Настройки сохранены');
      setSecretKey('');
      loadConfig();
    } catch (e: any) {
      setMessage('Ошибка сохранения: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDonation = async (donationId: string) => {
    try {
      await api.request<any>(`/api/payments/admin/confirm/${donationId}`, {
        method: 'POST',
      });
      loadDonations(donationsFilter || undefined);
    } catch (e: any) {
      setMessage('Ошибка подтверждения доната');
    }
  };

  const handleFilterChange = (status: string) => {
    setDonationsFilter(status);
    setDonationsPage(1);
    loadDonations(status || undefined);
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">💚 Донаты</h1>
        <p className="admin-page__subtitle">
          Управление платёжным модулем и списком донатов
        </p>
      </div>

      {message && (
        <div className="admin-alert" style={{
          padding: '12px 16px',
          background: message.includes('Ошибка') ? '#ef444420' : '#2db84d20',
          border: `1px solid ${message.includes('Ошибка') ? '#ef4444' : '#2db84d'}`,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      {/* Payment Config */}
      <div className="admin-section">
        <h2 className="admin-section__title">⚙️ Настройки платёжного модуля</h2>
        <div className="admin-card">
          <div className="admin-card__body">
            {/* Mode Selection */}
            <div className="admin-form-group" style={{ marginBottom: 20 }}>
              <label className="admin-label">Режим работы</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  className={`admin-btn ${mode === 'anonymous' ? 'admin-btn--primary' : 'admin-btn--outline'}`}
                  onClick={() => setMode('anonymous')}
                  style={{ flex: 1 }}
                >
                  Анонимный (СБП)
                </button>
                <button
                  className={`admin-btn ${mode === 'yookassa' ? 'admin-btn--primary' : 'admin-btn--outline'}`}
                  onClick={() => setMode('yookassa')}
                  style={{ flex: 1 }}
                >
                  Полноценный (ЮKassa)
                </button>
              </div>
              {mode === 'anonymous' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
                  По умолчанию. Пользователи видят QR-код СБП и номер телефона для перевода.
                  Администратор подтверждает платежи вручную.
                </p>
              )}
              {mode === 'yookassa' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
                  Полноценная интеграция с ЮKassa. Платежи обрабатываются автоматически.
                  Требуется shopId и API-ключ.
                </p>
              )}
            </div>

            {/* YooKassa Settings */}
            {mode === 'yookassa' && (
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🔑 ЮKassa</h3>
                <div className="admin-form-group" style={{ marginBottom: 12 }}>
                  <label className="admin-label">Shop ID (текущий: {shopId || 'не указан'})</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    placeholder="Введите shopId из ЮKassa"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 12 }}>
                  <label className="admin-label">
                    Secret API Key {hasSecretKey ? '(ключ установлен)' : '(не установлен)'}
                  </label>
                  <input
                    className="admin-input"
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={hasSecretKey ? 'Оставьте пустым, чтобы не менять' : 'Введите секретный ключ'}
                  />
                </div>
                <div className="toggle-row">
                  <div className="toggle-row__info">
                    <div className="toggle-row__label">Webhook активен</div>
                    <div className="toggle-row__desc">HTTP-уведомления от ЮKassa</div>
                  </div>
                  <button
                    className={`toggle-btn ${webhookActive ? 'toggle-btn--active' : ''}`}
                    onClick={() => setWebhookActive(!webhookActive)}
                  >
                    <span className="toggle-btn__indicator" />
                  </button>
                </div>
              </div>
            )}

            {/* SBP Settings */}
            {mode === 'anonymous' && (
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📱 СБП (СПБ)</h3>
                <div className="admin-form-group" style={{ marginBottom: 12 }}>
                  <label className="admin-label">QR-код (URL)</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={sbpQrUrl}
                    onChange={(e) => setSbpQrUrl(e.target.value)}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 12 }}>
                  <label className="admin-label">Номер телефона</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={sbpPhoneNumber}
                    onChange={(e) => setSbpPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 12 }}>
                  <label className="admin-label">Название получателя</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={sbpPhoneName}
                    onChange={(e) => setSbpPhoneName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              className="admin-btn admin-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>
      </div>

      {/* Donations List */}
      <div className="admin-section">
        <h2 className="admin-section__title">📋 Список донатов ({donationsTotal})</h2>
        <div className="admin-card">
          <div className="admin-card__body">
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['', 'manual_pending', 'yookassa_pending', 'completed', 'failed'].map((s) => (
                <button
                  key={s}
                  className={`admin-btn admin-btn--sm ${donationsFilter === s ? 'admin-btn--primary' : 'admin-btn--outline'}`}
                  onClick={() => handleFilterChange(s)}
                >
                  {s ? { manual_pending: '⏳ Ожидает', yookassa_pending: '🔄 В обработке', completed: '✅ Завершён', failed: '❌ Ошибка' }[s] : 'Все'}
                </button>
              ))}
            </div>

            {donations.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>
                Нет донатов
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Пользователь</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Сумма</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Способ</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Статус</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d: any) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>
                          {d.id.slice(-8)}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {d.user?.username || d.userId?.slice(-8) || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          {d.amount} {d.currency}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span className="chip" style={{ fontSize: 12 }}>
                            {d.provider === 'yookassa' ? 'ЮKassa' : 'СБП'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span className={`chip ${
                            d.status === 'completed' ? 'chip--accent' :
                            d.status === 'failed' ? 'chip--danger' :
                            d.status === 'manual_pending' ? 'chip--warning' : ''
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {d.status === 'manual_pending' && (
                            <button
                              className="admin-btn admin-btn--sm admin-btn--primary"
                              onClick={() => handleConfirmDonation(d.id)}
                            >
                              Подтвердить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}