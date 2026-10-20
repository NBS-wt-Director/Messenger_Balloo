// App — роутер админ-панели
// admin.balloo.su → все 24 маршрута под /admin

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { AdminGuard } from './AdminGuard';

// Lazy-loaded screens
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const UsersScreen = lazy(() => import('./screens/UsersScreen'));
const UserDetailScreen = lazy(() => import('./screens/UserDetailScreen'));
const BansScreen = lazy(() => import('./screens/BansScreen'));
const ReportsScreen = lazy(() => import('./screens/ReportsScreen'));
const AnalyticsScreen = lazy(() => import('./screens/AnalyticsScreen'));
const FeatureFlagsScreen = lazy(() => import('./screens/FeatureFlagsScreen'));
const VersionsScreen = lazy(() => import('./screens/VersionsScreen'));
const AnnouncementsScreen = lazy(() => import('./screens/AnnouncementsScreen'));
const DownloadsScreen = lazy(() => import('./screens/DownloadsScreen'));
const AuditLogsScreen = lazy(() => import('./screens/AuditLogsScreen'));
const SystemSettingsScreen = lazy(() => import('./screens/SystemSettingsScreen'));
const InstallScreen = lazy(() => import('./screens/InstallScreen'));
const AdminDonationsScreen = lazy(() => import('./screens/AdminDonationsScreen'));
const AdminSupportScreen = lazy(() => import('./screens/AdminSupportScreen'));
const DepartmentsScreen = lazy(() => import('./screens/DepartmentsScreen'));
const EmployeesScreen = lazy(() => import('./screens/EmployeesScreen'));
const VacanciesAdminScreen = lazy(() => import('./screens/VacanciesScreen'));
const TextsScreen = lazy(() => import('./screens/TextsScreen'));
const FeaturesMgmtScreen = lazy(() => import('./screens/FeaturesMgmtScreen'));
const BlogQueueScreen = lazy(() => import('./screens/BlogQueueScreen'));
const BlogChannelsScreen = lazy(() => import('./screens/BlogChannelsScreen'));
const BlogCategoriesScreen = lazy(() => import('./screens/BlogCategoriesScreen'));

// Layout
const AdminLayout = lazy(() => import('./screens/AdminLayout'));

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
