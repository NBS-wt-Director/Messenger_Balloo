// BlogSubscribeForm — форма подписки на рассылку
// Тикет №60 — Blog: корпоративный блог

import { useState } from 'react';
import { api } from '@/services/api';

export function BlogSubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Введите корректный email');
      return;
    }

    setStatus('loading');
    try {
      const res = await api.subscribeBlogNewsletter(email);
      setStatus('success');
      setMessage(res.message || 'Подписка оформлена успешно');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Ошибка при оформлении подписки');
    }
  };

  if (status === 'success') {
    return (
      <div className="blog-subscribe card" style={{ borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h3 className="blog-subscribe__title">Подписка оформлена!</h3>
        <p className="text-secondary text-sm">{message}</p>
        <button className="btn btn--tertiary btn--sm mt-4" onClick={() => setStatus('idle')}>
          Подписать другой email
        </button>
      </div>
    );
  }

  return (
    <div className="blog-subscribe card" style={{ borderLeft: '3px solid var(--accent)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
      <h3 className="blog-subscribe__title">Подпишитесь на рассылку</h3>
      <p className="text-secondary text-sm mb-4">
        Получайте уведомления о новых статьях, релизах и событиях Balloo прямо на почту
      </p>
      <form onSubmit={handleSubmit} className="blog-subscribe__form">
        <input
          type="email"
          className="form-input"
          placeholder="your@email.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn--accent" disabled={status === 'loading'}>
          {status === 'loading' ? 'Подписка...' : 'Подписаться'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{message}</p>
      )}
    </div>
  );
}
