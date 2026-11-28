// AccessDeniedScreen — экран отказа в админ-панели (тик. 1795888510).
//
// Решение владельца: НЕ перенаправляем неавторизованного пользователя и
// пользователя без прав — показываем вежливое объяснение и три кнопки:
//   • «Подать заявку на вступление в команду» — форма заявки (хранится на
//     сервере, обрабатывается в админке);
//   • «Поддержать команду» — страница донатов основного сайта;
//   • «Общаться» — переход в мессенджер.
//
// Авторизация переносится с balloo.su (cookie domain=.balloo.su): гость,
// вошедший на главном сайте, сюда уже приходит авторизованным. Если сессии
// нет вовсе — кнопка «Войти» ведёт на вход основного сайта и возвращает сюда.

import { useEffect, useState } from 'react';
import { adminApi, AdminApiError, type AdminUser } from '../api';
import { TeamApplicationModal } from './TeamApplicationModal';
import { MAIN_SITE_LOGIN_URL, MAIN_SITE_CHAT_URL, MAIN_SITE_DONATE_URL } from '../config/mainSite';

interface AccessDeniedScreenProps {
  /** Причина: гость (нет сессии) или пользователь без прав. */
  reason: 'guest' | 'no-access';
  /** Пользователь, если сессия есть (для id Balloo в заявке). */
  user: AdminUser | null;
}

export function AccessDeniedScreen({ reason, user }: AccessDeniedScreenProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Есть ли уже поданная заявка — показываем статус вместо формы.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    adminApi
      .listTeamApplications('new')
      .then((res) => {
        if (cancelled) return;
        const own = res.applications.find((a) => a.userId === user.id);
        if (own) setApplicationStatus(own.status);
      })
      .catch((e) => {
        // 403 у обычного пользователя — норма: список доступен только админам.
        if (!cancelled && e instanceof AdminApiError && e.status !== 403) {
          setCheckError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const ballooId = user?.username || user?.id || '';
  const alreadySubmitted = submitted || applicationStatus === 'new';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--app-bg)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 560,
          padding: 32,
          textAlign: 'center',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
        <h1 style={{ fontSize: 22, marginBottom: 10, color: 'var(--text-primary)' }}>
          {reason === 'guest' ? 'Нужно войти в Balloo' : 'Доступ в админ-панель закрыт'}
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {reason === 'guest'
            ? 'Админ-панель доступна только сотрудникам Balloo. Войдите в аккаунт — если у вас есть доступ, вы попадёте в панель автоматически.'
            : 'Эта панель — для команды Balloo. Если вы хотите присоединиться к проекту, отправьте заявку: её рассмотрит команда, и при одобрении доступ откроется.'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Спасибо, что интересуетесь проектом ❤️
        </p>

        {checkError && (
          <div style={{ color: 'var(--warning)', fontSize: 12, marginBottom: 12 }}>⚠ {checkError}</div>
        )}

        {alreadySubmitted && (
          <div
            style={{
              padding: '10px 12px',
              marginBottom: 16,
              borderRadius: 8,
              background: 'rgba(45,184,77,0.12)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            ✅ Заявка отправлена. Команда рассмотрит её и свяжется с вами в мессенджере.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reason === 'guest' && (
            <button
              className="btn btn--primary btn--block"
              onClick={() => {
                window.location.href = MAIN_SITE_LOGIN_URL;
              }}
            >
              Войти в Balloo
            </button>
          )}

          {reason === 'no-access' && !alreadySubmitted && (
            <button className="btn btn--primary btn--block" onClick={() => setModalOpen(true)}>
              Подать заявку на вступление в команду
            </button>
          )}

          <button
            className="btn btn--secondary btn--block"
            onClick={() => {
              window.location.href = MAIN_SITE_DONATE_URL;
            }}
          >
            Поддержать команду
          </button>

          <button
            className="btn btn--secondary btn--block"
            onClick={() => {
              window.location.href = MAIN_SITE_CHAT_URL;
            }}
          >
            Общаться
          </button>
        </div>
      </div>

      {modalOpen && (
        <TeamApplicationModal
          ballooId={ballooId}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => {
            setModalOpen(false);
            setSubmitted(true);
          }}
        />
      )}
    </div>
  );
}
