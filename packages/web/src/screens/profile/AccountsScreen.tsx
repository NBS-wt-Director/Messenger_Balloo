// Accounts Screen — мультиаккаунт
// Макет: mockups/balloo-su/accounts.html (принят владельцем 16.10.2026,
// 1.1.9 → 6.33), задание: mockups/balloo-su/accounts.md, тикет 1792124252.
// Данные: GET /api/accounts (account_device_links), переключение — POST
// /api/accounts/switch (сервер перевыпускает httpOnly-cookie, без повтора входа).

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore, type AuthUser } from '@/store/authStore';

interface DeviceAccount {
  userId: string;
  displayName: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  pushEnabled: boolean;
  connectedAt: number;
  chatsCount: number;
  unreadCount: number;
  accountStatus: string;
}

// «Подключён: 10 июля 2026» — как в макете
function formatConnected(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function AccountsScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [accounts, setAccounts] = useState<DeviceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAccounts();
      setAccounts(res.accounts ?? []);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить список аккаунтов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = accounts.find((a) => a.isActive);
  const others = accounts.filter((a) => !a.isActive);
  const notificationsOn = accounts.filter((a) => a.pushEnabled).length;

  const handleSwitch = async (account: DeviceAccount) => {
    if (!confirm('Переключить аккаунт? Текущие чаты будут скрыты.')) return;
    try {
      const res = await api.switchAccount(account.userId);
      // Сервер перевыпустил httpOnly-cookie на целевой аккаунт; обновляем
      // клиентский кэш пользователя. Языки/тема общие для устройства
      // (accounts.md), берём текущие значения.
      const switched: AuthUser = {
        id: res.user.id,
        email: res.user.email ?? '',
        username: res.user.username ?? '',
        displayName: res.user.displayName ?? undefined,
        avatarUrl: res.user.avatarUrl ?? undefined,
        status: 'active',
        language: user?.language ?? 'ru',
        theme: user?.theme ?? 'dark',
        isAdmin: res.user.role === 'admin',
        isTwoFAEnabled: false,
      };
      setUser(switched);
      navigate('/chat', { replace: true });
    } catch {
      // error toast
    }
  };

  const handleToggleNotifications = async (account: DeviceAccount) => {
    try {
      const res = await api.setAccountNotifications(account.userId, !account.pushEnabled);
      setAccounts((prev) =>
        prev.map((a) => (a.userId === account.userId ? { ...a, pushEnabled: res.pushEnabled } : a))
      );
    } catch {
      // error toast
    }
  };

  const handleUnlink = async (account: DeviceAccount) => {
    if (
      !confirm(
        `Отключить аккаунт ${account.displayName}? Чаты и данные останутся на сервере.`
      )
    ) {
      return;
    }
    try {
      await api.unlinkAccount(account.userId);
      setAccounts((prev) => prev.filter((a) => a.userId !== account.userId));
    } catch {
      // error toast
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Ссылка назад в профиль (макет, строка 42) */}
        <a
          href="#/profile"
          className="text-sm text-secondary"
          style={{ display: 'inline-block', marginBottom: 16 }}
        >
          ← Назад в профиль
        </a>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>👥 Аккаунты</h1>
        <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>
          Управление подключёнными аккаунтами. Неограниченное количество.
        </p>

        {loading && (
          <div className="text-sm text-secondary" style={{ padding: 24, textAlign: 'center' }}>
            Загрузка…
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-danger" style={{ padding: 24, textAlign: 'center' }}>
            {error}{' '}
            <button className="btn btn--tertiary btn--sm" onClick={load}>
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Быстрое переключение (карточка чипов) */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="card__title" style={{ marginBottom: 16 }}>
                Быстрое переключение
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {accounts.map((a) => (
                  <div
                    key={a.userId}
                    role="button"
                    tabIndex={0}
                    onClick={() => (a.isActive ? undefined : handleSwitch(a))}
                    onKeyDown={(e) => e.key === 'Enter' && !a.isActive && handleSwitch(a)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      cursor: a.isActive ? 'default' : 'pointer',
                      background: a.isActive ? 'rgba(45,184,77,0.08)' : 'var(--bg-tertiary)',
                      border: a.isActive
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        clipPath: 'var(--octagon-clip)',
                        background: a.isActive ? 'var(--accent)' : 'var(--bg-active)',
                        color: a.isActive ? '#fff' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {initials(a.displayName)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {a.isActive ? `${a.displayName} (активный)` : a.displayName}
                    </span>
                  </div>
                ))}
                <div
                  role="button"
                  tabIndex={0}
                  title="Добавить аккаунт"
                  onClick={() => navigate('/login')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/login')}
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: 'var(--accent)',
                    border: '1px dashed var(--accent)',
                    cursor: 'pointer',
                  }}
                >
                  +
                </div>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: 12 }}>
                Нажмите на аккаунт для переключения. Уведомления приходят для всех аккаунтов
                одновременно.
              </p>
            </div>

            {/* Статистика */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div className="card flex-1" style={{ minWidth: 120 }}>
                <div className="text-xs text-muted">Всего аккаунтов</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                  {accounts.length}
                </div>
              </div>
              <div className="card flex-1" style={{ minWidth: 120 }}>
                <div className="text-xs text-muted">Уведомлений включено</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)' }}>
                  {notificationsOn}
                </div>
              </div>
              <div className="card flex-1" style={{ minWidth: 120 }}>
                <div className="text-xs text-muted">Активный</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginTop: 4,
                    color: 'var(--text-primary)',
                  }}
                >
                  {active?.displayName ?? '—'}
                </div>
              </div>
            </div>

            {/* Карточка активного аккаунта */}
            {active && (
              <div className="card" style={{ marginBottom: 16, borderColor: 'var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span className="chip chip--accent">Активный аккаунт</span>
                  <span className="chip">Сейчас в сети</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="avatar avatar--md avatar--bordered avatar--status-online avatar--ctx-contact">
                    <div className="avatar__inner">
                      <span>{initials(active.displayName)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="list__item-title">{active.displayName}</div>
                    <div className="list__item-subtitle">
                      {[active.email, active.username ? `@${active.username}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div className="text-xs text-muted">Чатов</div>
                    <div className="text-sm">{active.chatsCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Непрочитано</div>
                    <div className="text-sm text-danger">{active.unreadCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Уведомления</div>
                    <div className="text-sm" style={{ color: active.pushEnabled ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {active.pushEnabled ? 'Включены' : 'Выключены'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--secondary btn--sm" onClick={() => navigate('/profile')}>
                    ⚙ Настройки профиля
                  </button>
                  <button
                    className="btn btn--tertiary btn--sm"
                    onClick={() => handleToggleNotifications(active)}
                  >
                    {active.pushEnabled ? '🔔 Уведомления' : '🔕 Уведомления'}
                  </button>
                </div>
              </div>
            )}

            {/* Карточки других аккаунтов */}
            {others.map((a) => (
              <div key={a.userId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    className={`avatar avatar--md avatar--bordered avatar--status-offline ${
                      a.accountStatus === 'active' ? 'avatar--ctx-family' : 'avatar--ctx-blocked'
                    }`}
                  >
                    <div className="avatar__inner">
                      <span>{initials(a.displayName)}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="list__item-title">{a.displayName}</div>
                    <div className="list__item-subtitle">
                      {[
                        a.email,
                        a.username ? `@${a.username}` : null,
                        `${a.chatsCount} чатов`,
                        `${a.unreadCount} непрочитанных`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--primary btn--sm" onClick={() => handleSwitch(a)}>
                      Переключить
                    </button>
                    <button
                      className="btn btn--tertiary btn--sm"
                      aria-label={a.pushEnabled ? `Выключить уведомления ${a.displayName}` : `Включить уведомления ${a.displayName}`}
                      onClick={() => handleToggleNotifications(a)}
                    >
                      {a.pushEnabled ? '🔔' : '🔕'}
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleUnlink(a)}>
                      Отключить
                    </button>
                  </div>
                </div>
                <div className="text-xs text-muted" style={{ padding: '8px 0 0' }}>
                  Уведомления: {a.pushEnabled ? 'включены' : 'выключены'} · Подключён:{' '}
                  {formatConnected(a.connectedAt)}
                </div>
              </div>
            ))}

            {/* Добавить аккаунт */}
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <button className="btn btn--primary" onClick={() => navigate('/login')}>
                ➕ Добавить аккаунт
              </button>
              <p className="text-xs text-muted" style={{ marginTop: 8 }}>
                Войдите с другим email или OAuth. Неограниченное количество аккаунтов.
              </p>
            </div>

            {/* Как работает мультиаккаунт (текст из макета) */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="card__title" style={{ marginBottom: 16 }}>
                ℹ️ Как работает мультиаккаунт
              </h3>
              <ul
                className="text-sm text-secondary"
                style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 1.8 }}
              >
                <li>
                  <strong>Чаты и контакты</strong> — у каждого аккаунта свои, отображаются только
                  для активного
                </li>
                <li>
                  <strong>Уведомления</strong> — приходят для всех аккаунтов одновременно, с
                  пометкой аккаунта
                </li>
                <li>
                  <strong>Переключение</strong> — мгновенное, без повторного входа (сессии
                  хранятся)
                </li>
                <li>
                  <strong>Тема и язык</strong> — общие для всех аккаунтов (синхронизируются)
                </li>
                <li>
                  <strong>Устройства</strong> — общие для всех аккаунтов на этом устройстве
                </li>
                <li>
                  <strong>Отключение аккаунта</strong> — сессия удаляется, данные остаются на
                  сервере
                </li>
                <li>
                  <strong>Лимит</strong> — неограниченно
                </li>
              </ul>
            </div>

            {/* Уведомления мультиаккаунта */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="card__title" style={{ marginBottom: 16 }}>
                🔔 Уведомления мультиаккаунта
              </h3>
              <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
                Push-уведомления приходят для всех подключённых аккаунтов. Каждое уведомление
                содержит:
              </p>
              <ul
                className="text-sm text-secondary"
                style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 1.8 }}
              >
                <li>
                  <strong>Метку аккаунта</strong> — имя/аватар аккаунта, от которого пришло
                </li>
                <li>
                  <strong>Группировку</strong> — уведомления одного аккаунта группируются
                </li>
                <li>
                  <strong>Переключение по тапу</strong> — тап на уведомление переключает на нужный
                  аккаунт и открывает чат
                </li>
              </ul>
              <p className="text-sm text-secondary" style={{ marginTop: 12 }}>
                Уведомления можно отключить индивидуально для каждого аккаунта (кнопка 🔔/🔕).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
