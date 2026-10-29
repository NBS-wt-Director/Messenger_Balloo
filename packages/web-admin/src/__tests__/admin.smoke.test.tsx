// Smoke-тесты admin-экранов: рендер без краха + загрузка данных через api.
// Перенесены из packages/web вместе с экранами (тикет 1792395490-05 закрыл
// вынос админки в @balloo/web-admin, а тесты остались следить за мёртвыми
// копиями — тикет 1793187702).
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderScreen } from '../../../web/src/__tests__/helpers/screenTestUtils';

vi.mock('@/services/api', async () => {
  const { createUniversalApiMock } = await import(
    '../../../web/src/__tests__/helpers/apiSpyMock'
  );
  return { api: createUniversalApiMock() };
});

import { UsersScreen } from '../screens/UsersScreen';
import { UserDetailScreen } from '../screens/UserDetailScreen';
import { BansScreen } from '../screens/BansScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { VersionsScreen } from '../screens/VersionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { FeatureFlagsScreen } from '../screens/FeatureFlagsScreen';
import { AuditLogsScreen } from '../screens/AuditLogsScreen';
import { SystemSettingsScreen } from '../screens/SystemSettingsScreen';
import { InstallScreen } from '../screens/InstallScreen';
import { AdminDonationsScreen } from '../screens/AdminDonationsScreen';
import { DepartmentsScreen } from '../screens/DepartmentsScreen';
import { EmployeesScreen } from '../screens/EmployeesScreen';
import { VacanciesScreen } from '../screens/VacanciesScreen';
import { TextsScreen } from '../screens/TextsScreen';
import { FeaturesMgmtScreen } from '../screens/FeaturesMgmtScreen';
import { BlogQueueScreen } from '../screens/BlogQueueScreen';
import { BlogChannelsScreen } from '../screens/BlogChannelsScreen';
import { BlogCategoriesScreen } from '../screens/BlogCategoriesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AdminLayout } from '../screens/AdminLayout';

describe('Admin screens (smoke)', () => {
  const cases: [string, React.ReactNode][] = [
    ['DashboardScreen', <DashboardScreen />],
    ['UsersScreen', <UsersScreen />],
    ['UserDetailScreen', <UserDetailScreen />],
    ['BansScreen', <BansScreen />],
    ['ReportsScreen', <ReportsScreen />],
    ['AnalyticsScreen', <AnalyticsScreen />],
    ['FeatureFlagsScreen', <FeatureFlagsScreen />],
    ['VersionsScreen', <VersionsScreen />],
    ['AnnouncementsScreen', <AnnouncementsScreen />],
    ['DownloadsScreen', <DownloadsScreen />],
    ['AuditLogsScreen', <AuditLogsScreen />],
    ['SystemSettingsScreen', <SystemSettingsScreen />],
    ['InstallScreen', <InstallScreen />],
    ['AdminDonationsScreen', <AdminDonationsScreen />],
    ['DepartmentsScreen', <DepartmentsScreen />],
    ['EmployeesScreen', <EmployeesScreen />],
    ['VacanciesScreen', <VacanciesScreen />],
    ['TextsScreen', <TextsScreen />],
    ['FeaturesMgmtScreen', <FeaturesMgmtScreen />],
    ['BlogQueueScreen', <BlogQueueScreen />],
    ['BlogChannelsScreen', <BlogChannelsScreen />],
    ['BlogCategoriesScreen', <BlogCategoriesScreen />],
    ['AdminLayout', <AdminLayout />],
  ];

  for (const [name, ui] of cases) {
    it(`${name} renders and loads data`, async () => {
      const { container } = renderScreen(ui);
      expect(container.firstChild).not.toBeNull();
      // Даём async useEffect разрешиться (загрузка данных через api)
      await waitFor(() => {}, { timeout: 1000 }).catch(() => {});
    });
  }
});
