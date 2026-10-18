// Bots Screen — управление ботами
// Макет: mockups/balloo-su/bots.html

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

interface Bot {
  id: string;
  name: string;
  description?: string;
  token: string;
  webhookUrl?: string;
  createdAt: number;
}

export default function BotsScreen() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  // Форма создания
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBots();
      setBots(data || []);
    } catch {
      setBots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const createBot = useCallback(async () => {
    if (!botName) return;
    try {
      setCreating(true);
      await api.createBot({
        name: botName,
        description: botDescription,
        webhookUrl: webhookUrl || undefined,
      });
      setBotName('');
      setBotDescription('');
      setWebhookUrl('');
      await fetchBots();
    } catch {
      // ошибка
    } finally {
      setCreating(false);
    }
  }, [botName, botDescription, webhookUrl, fetchBots]);

  const copyToken = useCallback((token: string) => {
    navigator.clipboard.writeText(token);
  }, []);

  const maskToken = (token: string) => {
    if (token.length <= 8) return token;
    return '•'.repeat(token.length - 4) + token.slice(-4);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🤖 Боты в Balloo</h1>
      <p className="page-subtitle">Создание и управление ботами через Balloo Bot API</p>

      {/* Создать бота */}
      <div className="card">
        <h2 className="card__title">Создать бота</h2>
        <div className="form-group">
          <label className="form-label">Имя бота</label>
          <input
            type="text"
            className="form-input"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Мой бот"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            className="form-input"
            value={botDescription}
            onChange={(e) => setBotDescription(e.target.value)}
            placeholder="Что делает бот"
            rows={2}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Webhook URL</label>
          <input
            type="url"
            className="form-input"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
        </div>
        <button
          className="btn btn--primary btn--block"
          onClick={createBot}
          disabled={creating || !botName}
        >
          {creating ? 'Создание...' : 'Создать бота'}
        </button>
      </div>

      {/* Мои боты */}
      <div className="card">
        <h2 className="card__title">Мои боты</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : bots.length === 0 ? (
          <p className="empty-state">Ботов нет. Создайте первого.</p>
        ) : (
          <div className="bot-list">
            {bots.map((bot) => (
              <div key={bot.id} className="bot-list-item">
                <div className="bot-list-item__avatar">🤖</div>
                <div className="bot-list-item__info">
                  <span className="bot-list-item__name">{bot.name}</span>
                  <code className="bot-list-item__token">{maskToken(bot.token)}</code>
                </div>
                <button
                  className="btn btn--tertiary btn--sm"
                  onClick={() => copyToken(bot.token)}
                >
                  📋 Копировать токен
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API документация */}
      <div className="card">
        <h2 className="card__title">API документация</h2>
        <p>Balloo Bot API на REST, Webhook. Отправка сообщений, получение обновлений.</p>
        <pre className="code-block">
{`POST /api/v1/bots/{token}/sendMessage
{
  "chat_id": "123",
  "text": "Привет!"
}`}
        </pre>
        <a href="/docs" className="btn btn--tertiary">
          📚 Полная документация API →
        </a>
      </div>
    </div>
  );
}
