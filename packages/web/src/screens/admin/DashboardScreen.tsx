// DashboardScreen — главная страница админ-панели
// KPI cards, charts, activity feed, quick actions, alerts, reports

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { StatCard } from '@/components/admin/StatCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { QuickActions } from '@/components/admin/QuickActions';
import { AdminChart } from '@/components/admin/AdminChart';

export function DashboardScreen() {
  const navigate = useNavigate();
  const { metrics, alerts, reports, recentActivity, isLoading, fetchDashboard } =
    useAdminStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Chart data
  const userGrowthData = [
    { label: 'Пн', value: 11200 },
    { label: 'Вт', value: 11450 },
    { label: 'Ср', value: 11780 },
    { label: 'Чт', value: 11920 },
    { label: 'Пт', value: 12100 },
    { label: 'Сб', value: 12280 },
    { label: 'Вс', value: 12345 },
  ];

  const messagesData = [
    { label: 'Пн', value: 32000 },
    { label: 'Вт', value: 35000 },
    { label: 'Ср', value: 38000 },
    { label: 'Чт', value: 41000 },
    { label: 'Пт', value: 43000 },
    { label: 'Сб', value: 44000 },
    { label: 'Вс', value: 45678 },
  ];

  const topChannelsData = [
    { label: 'Общий', value: 15234 },
    { label: 'Новости', value: 12300 },
    { label: 'Техпод', value: 8900 },
    { label: 'Флуд', value: 7600 },
    { label: 'Важное', value: 5400 },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'ban-user',
      label: 'Забанить пользователя',
      icon: '🔨',
      variant: 'danger' as const,
      onClick: () => navigate('/admin/users'),
    },
    {
      id: 'create-announcement',
      label: 'Создать объявление',
      icon: '📢',
      variant: 'primary' as const,
      onClick: () => navigate('/admin/downloads'),
    },
    {
      id: 'view-reports',
      label: 'Просмотр жалоб',
      icon: '🚩',
      variant: 'warning' as const,
      onClick: () => navigate('/admin/reports'),
    },
    {
      id: 'check-analytics',
      label: 'Проверить метрики',
      icon: '📈',
      variant: 'info' as const,
      onClick: () => navigate('/admin/analytics'),
    },
  ];

  const severityStyles: Record<string, React.CSSProperties> = {
    critical: { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' },
    warning: { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' },
    ok: { background: 'rgba(45, 184, 77, 0.1)', color: 'var(--accent)' },
  };

  const statusStyles: Record<string, React.CSSProperties> = {
    pending: { background: 'rgba(245, 158, 11, 0.15)', color: '#ffc107' },
    in_progress: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
    resolved: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)' },
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    resolved: 'Решено',
  };

  if (isLoading && !metrics) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Page title */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 24,
        }}
      >
        Дашборд
      </h1>

      {/* KPI Cards */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Пользователей"
          value={metrics?.totalUsers ?? 0}
          trend={metrics?.usersTrend}
          color="var(--accent)"
        />
        <StatCard
          label="Активных сейчас"
          value={metrics?.activeNow ?? 0}
          trend={metrics?.activePercent}
          color="var(--info)"
        />
        <StatCard
          label="Сообщений сегодня"
          value={metrics?.messagesToday ?? 0}
          trend={metrics?.messagesTrend}
          color="var(--warning)"
        />
        <StatCard
          label="Жалобы"
          value={metrics?.pendingReports ?? 0}
          trend="Ожидают рассмотрения"
          color="var(--danger)"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Charts */}
        <AdminChart
          title="Рост пользователей (за неделю)"
          data={userGrowthData}
          type="line"
          color="var(--accent)"
        />
        <AdminChart
          title="Сообщения (за неделю)"
          data={messagesData}
          type="bar"
          color="var(--info)"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Top channels chart */}
        <AdminChart
          title="Топ каналов"
          data={topChannelsData}
          type="bar"
          height={180}
          color="var(--warning)"
        />

        {/* Quick actions */}
        <QuickActions actions={quickActions} />

        {/* Activity feed */}
        <ActivityFeed items={recentActivity} />
      </div>

      {/* Active alerts */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Активные алерты
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((alert) => {
            const dotColors: Record<string, string> = {
              busy: 'var(--danger)',
              dnd: 'var(--accent)',
              online: 'var(--accent)',
            };

            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: dotColors[alert.icon] || 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}
                >
                  {alert.message}
                </span>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    ...severityStyles[alert.severity],
                  }}
                >
                  {alert.severity === 'critical'
                    ? 'Критично'
                    : alert.severity === 'warning'
                      ? 'Внимание'
                      : 'OK'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent reports */}
      <div className="card" style={{ padding: 20 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Последние жалобы
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table
            className="table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Пользователь
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Причина
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Статус
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {report.user}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {report.reason}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        ...statusStyles[report.status],
                      }}
                    >
                      {statusLabels[report.status] || report.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      textAlign: 'right',
                    }}
                  >
                    <button
                      onClick={() => navigate('/admin/reports')}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-primary)',
                      }}
                    >
                      {report.status === 'in_progress' ? 'Открыть' : 'Рассмотреть'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}