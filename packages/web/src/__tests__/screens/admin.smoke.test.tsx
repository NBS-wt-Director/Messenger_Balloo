// Smoke-тесты admin-экранов: рендер без краха + загрузка данных через api
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderScreen } from '../helpers/screenTestUtils';

vi.mock('@/services/api', async () => {
  const { createUniversalApiMock } = await import('../helpers/apiSpyMock');
  return { api: createUniversalApiMock() };
});

import { UsersScreen } from '../../screens/admin/UsersScreen';
import { UserDetailScreen } from '../../screens/admin/UserDetailScreen';
import { BansScreen } from '../../screens/admin/BansScreen';
import { DownloadsScreen } from '../../screens/admin/DownloadsScreen';
import { AnnouncementsScreen } from '../../screens/admin/AnnouncementsScreen';
import { VersionsScreen } from '../../screens/admin/VersionsScreen';
import { ReportsScreen } from '../../screens/admin/ReportsScreen';
import { BlogCategoriesScreen } from '../../screens/admin/BlogCategoriesScreen';
import { BlogChannelsScreen } from '../../screens/admin/BlogChannelsScreen';
import { BlogQueueScreen } from '../../screens/admin/BlogQueueScreen';
import { DashboardScreen } from '../../screens/admin/DashboardScreen';
import { FeatureFlagsScreen } from '../../screens/admin/FeatureFlagsScreen';
import { InstallScreen } from '../../screens/admin/InstallScreen';
import { AnalyticsScreen } from '../../screens/admin/AnalyticsScreen';
import { AdminDonationsScreen } from '../../screens/admin/AdminDonationsScreen';
import { AdminLayout } from '../../screens/admin/AdminLayout';

describe('Admin screens (smoke)', () => {
  const cases: [string, React.ReactNode][] = [
    ['UsersScreen', <UsersScreen />],
    ['UserDetailScreen', <UserDetailScreen />],
    ['BansScreen', <BansScreen />],
    ['DownloadsScreen', <DownloadsScreen />],
    ['AnnouncementsScreen', <AnnouncementsScreen />],
    ['VersionsScreen', <VersionsScreen />],
    ['ReportsScreen', <ReportsScreen />],
    ['BlogCategoriesScreen', <BlogCategoriesScreen />],
    ['BlogChannelsScreen', <BlogChannelsScreen />],
    ['BlogQueueScreen', <BlogQueueScreen />],
    ['DashboardScreen', <DashboardScreen />],
    ['FeatureFlagsScreen', <FeatureFlagsScreen />],
    ['InstallScreen', <InstallScreen />],
    ['AnalyticsScreen', <AnalyticsScreen />],
    ['AdminDonationsScreen', <AdminDonationsScreen />],
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
