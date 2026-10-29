// App — роутер админ-панели
// admin.balloo.su → все 24 маршрута под /admin

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { AdminGuard } from './AdminGuard';

// Lazy-loaded screens.
// ВАЖНО: все экраны админки — ИМЕНОВАННЫЕ экспорты (`export function X`),
// default-экспорта у них нет. `lazy` ждёт модуль с полем `default`, поэтому
// без `.then((m) => ({ default: m.X }))` React 18 падает при монтировании
// («Cannot convert object to primitive value» → ErrorBoundary → белый экран).
// Тикет 1793259599.
const DashboardScreen = lazy(() =>
  import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen }))
);
const UsersScreen = lazy(() =>
  import('./screens/UsersScreen').then((m) => ({ default: m.UsersScreen }))
);
const UserDetailScreen = lazy(() =>
  import('./screens/UserDetailScreen').then((m) => ({ default: m.UserDetailScreen }))
);
const BansScreen = lazy(() =>
  import('./screens/BansScreen').then((m) => ({ default: m.BansScreen }))
);
const ReportsScreen = lazy(() =>
  import('./screens/ReportsScreen').then((m) => ({ default: m.ReportsScreen }))
);
const AnalyticsScreen = lazy(() =>
  import('./screens/AnalyticsScreen').then((m) => ({ default: m.AnalyticsScreen }))
);
const FeatureFlagsScreen = lazy(() =>
  import('./screens/FeatureFlagsScreen').then((m) => ({ default: m.FeatureFlagsScreen }))
);
const VersionsScreen = lazy(() =>
  import('./screens/VersionsScreen').then((m) => ({ default: m.VersionsScreen }))
);
const AnnouncementsScreen = lazy(() =>
  import('./screens/AnnouncementsScreen').then((m) => ({ default: m.AnnouncementsScreen }))
);
const DownloadsScreen = lazy(() =>
  import('./screens/DownloadsScreen').then((m) => ({ default: m.DownloadsScreen }))
);
const AuditLogsScreen = lazy(() =>
  import('./screens/AuditLogsScreen').then((m) => ({ default: m.AuditLogsScreen }))
);
const SystemSettingsScreen = lazy(() =>
  import('./screens/SystemSettingsScreen').then((m) => ({ default: m.SystemSettingsScreen }))
);
const InstallScreen = lazy(() =>
  import('./screens/InstallScreen').then((m) => ({ default: m.InstallScreen }))
);
const AdminDonationsScreen = lazy(() =>
  import('./screens/AdminDonationsScreen').then((m) => ({ default: m.AdminDonationsScreen }))
);
const AdminSupportScreen = lazy(() =>
  import('./screens/AdminSupportScreen').then((m) => ({ default: m.AdminSupportScreen }))
);
const DepartmentsScreen = lazy(() =>
  import('./screens/DepartmentsScreen').then((m) => ({ default: m.DepartmentsScreen }))
);
const EmployeesScreen = lazy(() =>
  import('./screens/EmployeesScreen').then((m) => ({ default: m.EmployeesScreen }))
);
const VacanciesAdminScreen = lazy(() =>
  import('./screens/VacanciesScreen').then((m) => ({ default: m.VacanciesScreen }))
);
const TextsScreen = lazy(() =>
  import('./screens/TextsScreen').then((m) => ({ default: m.TextsScreen }))
);
const FeaturesMgmtScreen = lazy(() =>
  import('./screens/FeaturesMgmtScreen').then((m) => ({ default: m.FeaturesMgmtScreen }))
);
const BlogQueueScreen = lazy(() =>
  import('./screens/BlogQueueScreen').then((m) => ({ default: m.BlogQueueScreen }))
);
const BlogChannelsScreen = lazy(() =>
  import('./screens/BlogChannelsScreen').then((m) => ({ default: m.BlogChannelsScreen }))
);
const BlogCategoriesScreen = lazy(() =>
  import('./screens/BlogCategoriesScreen').then((m) => ({ default: m.BlogCategoriesScreen }))
);

// Layout
const AdminLayout = lazy(() =>
  import('./screens/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
              errorElement={<NotFoundScreen />}
            >
              <Route index element={<DashboardScreen />} />
              <Route path="users" element={<UsersScreen />} />
              <Route path="users/:userId" element={<UserDetailScreen />} />
              <Route path="reports" element={<ReportsScreen />} />
              <Route path="bans" element={<BansScreen />} />
              <Route path="analytics" element={<AnalyticsScreen />} />
              <Route path="feature-flags" element={<FeatureFlagsScreen />} />
              <Route path="versions" element={<VersionsScreen />} />
              <Route path="announcements" element={<AnnouncementsScreen />} />
              <Route path="downloads" element={<DownloadsScreen />} />
              <Route path="texts" element={<TextsScreen />} />
              <Route path="departments" element={<DepartmentsScreen />} />
              <Route path="employees" element={<EmployeesScreen />} />
              <Route path="vacancies" element={<VacanciesAdminScreen />} />
              <Route path="features" element={<FeaturesMgmtScreen />} />
              <Route path="donations" element={<AdminDonationsScreen />} />
              <Route path="support" element={<AdminSupportScreen />} />
              <Route path="blog/queue" element={<BlogQueueScreen />} />
              <Route path="blog/channels" element={<BlogChannelsScreen />} />
              <Route path="blog/categories" element={<BlogCategoriesScreen />} />
              <Route path="audit-logs" element={<AuditLogsScreen />} />
              <Route path="system-settings" element={<SystemSettingsScreen />} />
            </Route>

            {/* InstallScreen — публичный (без guard) */}
            <Route path="/install" element={<InstallScreen />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundScreen />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

function NotFoundScreen() {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1>404 — Not Found</h1>
      <p>Страница не найдена</p>
    </div>
  );
}
