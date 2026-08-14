// Admin Store — Zustand
// Dashboard metrics, activity feed, alerts

import { create } from 'zustand';
import { api } from '@/services/api';

export interface DashboardMetrics {
  totalUsers: number;
  activeNow: number;
  messagesToday: number;
  pendingReports: number;
  usersTrend: string;
  activePercent: string;
  messagesTrend: string;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: 'critical' | 'warning' | 'ok';
  icon: 'busy' | 'dnd' | 'online';
}

export interface ReportItem {
  id: string;
  user: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'resolved';
}

export interface ActivityItem {
  id: string;
  admin: string;
  action: string;
  target: string;
  timestamp: string;
}

interface AdminState {
  metrics: DashboardMetrics | null;
  alerts: AlertItem[];
  reports: ReportItem[];
  recentActivity: ActivityItem[];
  isLoading: boolean;

  // Actions
  fetchDashboard: () => Promise<void>;
  setMetrics: (metrics: DashboardMetrics) => void;
  setAlerts: (alerts: AlertItem[]) => void;
  setReports: (reports: ReportItem[]) => void;
  setRecentActivity: (activity: ActivityItem[]) => void;
}

export const useAdminStore = create<AdminState>()((set) => ({
  metrics: null,
  alerts: [],
  reports: [],
  recentActivity: [],
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      // Fetch metrics from API
      const metricsData = await api.getMetrics().catch(() => null);
      const reportsData = await api.getReports('pending').catch(() => [] as any[]);
      const auditLogs = await api.getAuditLogs({ limit: 10 }).catch(() => null);

      // Default mock data if API is not available
      const metrics: DashboardMetrics = {
        totalUsers: metricsData?.totalUsers ?? 12345,
        activeNow: metricsData?.activeNow ?? 1023,
        messagesToday: metricsData?.messagesToday ?? 45678,
        pendingReports: Array.isArray(reportsData) ? reportsData.length : 12,
        usersTrend: metricsData?.usersTrend ?? '+234 за неделю',
        activePercent: metricsData?.activePercent ?? '8.3% от всех',
        messagesTrend: metricsData?.messagesTrend ?? '+12% к вчера',
      };

      const alerts: AlertItem[] = [
        { id: '1', message: 'Высокая нагрузка на WebSocket сервер', severity: 'critical', icon: 'busy' },
        { id: '2', message: 'Бэкап БД завершён успешно', severity: 'ok', icon: 'dnd' },
        { id: '3', message: 'MinIO: 78% заполнено', severity: 'warning', icon: 'busy' },
      ];

      const reports: ReportItem[] = Array.isArray(reportsData) && reportsData.length > 0
        ? reportsData.map((r: any) => ({
            id: r.id,
            user: r.targetId || 'user_abc',
            reason: r.reason || 'Спам',
            status: r.status || 'pending',
          }))
        : [
            { id: '1', user: 'user_abc', reason: 'Спам', status: 'pending' as const },
            { id: '2', user: 'user_def', reason: 'Оскорбления', status: 'pending' as const },
            { id: '3', user: 'user_ghi', reason: 'Ненормативная лексика', status: 'in_progress' as const },
          ];

      const activity: ActivityItem[] = auditLogs?.data
        ? auditLogs.data.slice(0, 10).map((log: any) => ({
            id: log.id,
            admin: log.adminId || 'admin',
            action: log.action,
            target: log.target || '-',
            timestamp: log.createdAt ? new Date(Number(log.createdAt) * 1000).toLocaleString() : '-',
          }))
        : [];

      set({ metrics, alerts, reports, recentActivity: activity, isLoading: false });
    } catch {
      // Fallback to mock data
      set({
        metrics: {
          totalUsers: 12345,
          activeNow: 1023,
          messagesToday: 45678,
          pendingReports: 12,
          usersTrend: '+234 за неделю',
          activePercent: '8.3% от всех',
          messagesTrend: '+12% к вчера',
        },
        alerts: [
          { id: '1', message: 'Высокая нагрузка на WebSocket сервер', severity: 'critical', icon: 'busy' },
          { id: '2', message: 'Бэкап БД завершён успешно', severity: 'ok', icon: 'dnd' },
          { id: '3', message: 'MinIO: 78% заполнено', severity: 'warning', icon: 'busy' },
        ],
        reports: [
          { id: '1', user: 'user_abc', reason: 'Спам', status: 'pending' },
          { id: '2', user: 'user_def', reason: 'Оскорбления', status: 'pending' },
          { id: '3', user: 'user_ghi', reason: 'Ненормативная лексика', status: 'in_progress' },
        ],
        recentActivity: [],
        isLoading: false,
      });
    }
  },

  setMetrics: (metrics) => set({ metrics }),
  setAlerts: (alerts) => set({ alerts }),
  setReports: (reports) => set({ reports }),
  setRecentActivity: (activity) => set({ recentActivity: activity }),
}));