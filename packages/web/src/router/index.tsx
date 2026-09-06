// Router — React Router v6
// Protected routes, lazy loading, error boundaries

import { createHashRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { PrivacyScreen } from '@/screens/legal/PrivacyScreen';
import { RulesScreen } from '@/screens/legal/RulesScreen';
import { CookiesScreen } from '@/screens/legal/CookiesScreen';

// Lazy-loaded screen components
const LandingScreen = lazy(() => import('@/screens/landing/LandingScreen'));
const LoginScreen = lazy(() => import('@/screens/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('@/screens/auth/RegisterScreen'));
const TwoFactorScreen = lazy(() => import('@/screens/auth/TwoFactorScreen'));
const ResetPasswordScreen = lazy(() => import('@/screens/auth/ResetPasswordScreen'));
const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const ChatViewScreen = lazy(() => import('@/screens/chat/ChatViewScreen'));
const ProfileScreen = lazy(() => import('@/screens/profile/ProfileScreen'));
const PublicProfileScreen = lazy(() => import('@/screens/profile/PublicProfileScreen'));
const ContactsScreen = lazy(() => import('@/screens/contacts/ContactsScreen'));
const SettingsScreen = lazy(() => import('@/screens/settings/SettingsScreen'));
const NotificationSettingsScreen = lazy(() => import('@/screens/settings/NotificationSettingsScreen'));
const PrivacySettingsScreen = lazy(() => import('@/screens/settings/PrivacySettingsScreen'));
const BlockedUsersScreen = lazy(() => import('@/screens/settings/BlockedUsersScreen'));
const SearchScreen = lazy(() => import('@/screens/search/SearchScreen'));
const CreateGroupScreen = lazy(() => import('@/screens/groups/CreateGroupScreen'));
const GroupSettingsScreen = lazy(() => import('@/screens/groups/GroupSettingsScreen'));
const CreateChannelScreen = lazy(() => import('@/screens/channels/CreateChannelScreen'));
const ChannelViewScreen = lazy(() => import('@/screens/channels/ChannelViewScreen'));
const ChannelSettingsScreen = lazy(() => import('@/screens/channels/ChannelSettingsScreen'));
const StoriesScreen = lazy(() => import('@/screens/stories/StoriesScreen'));
const StoryCreateScreen = lazy(() => import('@/screens/stories/StoryCreateScreen'));
const PollScreen = lazy(() => import('@/screens/polls/PollScreen'));
const KnowledgeScreen = lazy(() => import('@/screens/knowledge/KnowledgeScreen').then((m) => ({ default: m.KnowledgeScreen })));
const KnowledgePageScreen = lazy(() => import('@/screens/knowledge/KnowledgePageScreen').then((m) => ({ default: m.KnowledgePageScreen })));
const EditPageScreen = lazy(() => import('@/screens/knowledge/EditPageScreen').then((m) => ({ default: m.EditPageScreen })));
const NotFoundScreen = lazy(() => import('@/screens/shared/NotFoundScreen'));

// Admin screens
const AdminLayout = lazy(() => import('@/screens/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const DashboardScreen = lazy(() => import('@/screens/admin/DashboardScreen').then((m) => ({ default: m.DashboardScreen })));
const UsersScreen = lazy(() => import('@/screens/admin/UsersScreen').then((m) => ({ default: m.UsersScreen })));
const UserDetailScreen = lazy(() => import('@/screens/admin/UserDetailScreen').then((m) => ({ default: m.UserDetailScreen })));
const BansScreen = lazy(() => import('@/screens/admin/BansScreen').then((m) => ({ default: m.BansScreen })));
const ReportsScreen = lazy(() => import('@/screens/admin/ReportsScreen').then((m) => ({ default: m.ReportsScreen })));
const BlogQueueScreen = lazy(() => import('@/screens/admin/BlogQueueScreen').then((m) => ({ default: m.BlogQueueScreen })));
const BlogChannelsScreen = lazy(() => import('@/screens/admin/BlogChannelsScreen').then((m) => ({ default: m.BlogChannelsScreen })));
const BlogCategoriesScreen = lazy(() => import('@/screens/admin/BlogCategoriesScreen').then((m) => ({ default: m.BlogCategoriesScreen })));
const AnalyticsScreen = lazy(() => import('@/screens/admin/AnalyticsScreen').then((m) => ({ default: m.AnalyticsScreen })));
const FeatureFlagsScreen = lazy(() => import('@/screens/admin/FeatureFlagsScreen').then((m) => ({ default: m.FeatureFlagsScreen })));
const VersionsScreen = lazy(() => import('@/screens/admin/VersionsScreen').then((m) => ({ default: m.VersionsScreen })));
const AnnouncementsScreen = lazy(() => import('@/screens/admin/AnnouncementsScreen').then((m) => ({ default: m.AnnouncementsScreen })));
const DownloadsScreen = lazy(() => import('@/screens/admin/DownloadsScreen').then((m) => ({ default: m.DownloadsScreen })));
const AuditLogsScreen = lazy(() => import('@/screens/admin/AuditLogsScreen').then((m) => ({ default: m.AuditLogsScreen })));
const SystemSettingsScreen = lazy(() => import('@/screens/admin/SystemSettingsScreen').then((m) => ({ default: m.SystemSettingsScreen })));
const InstallScreen = lazy(() => import('@/screens/admin/InstallScreen').then((m) => ({ default: m.InstallScreen })));
const AdminDonationsScreen = lazy(() => import('@/screens/admin/AdminDonationsScreen').then((m) => ({ default: m.AdminDonationsScreen })));

// Landing pages
const ForKassaScreen = lazy(() => import('@/screens/landing/ForKassaScreen').then((m) => ({ default: m.ForKassaScreen })));
const DonateScreen = lazy(() => import('@/screens/donate/DonateScreen').then((m) => ({ default: m.DonateScreen })));

// Command (employee portal) screens
const CommandLayout = lazy(() => import('@/screens/command/CommandLayout').then((m) => ({ default: m.CommandLayout })));
const HRScreen = lazy(() => import('@/screens/command/HRScreen').then((m) => ({ default: m.HRScreen })));
const CommandVacanciesScreen = lazy(() => import('@/screens/command/VacanciesScreen').then((m) => ({ default: m.VacanciesScreen })));
const ApplicationsScreen = lazy(() => import('@/screens/command/ApplicationsScreen').then((m) => ({ default: m.ApplicationsScreen })));
const InterviewsScreen = lazy(() => import('@/screens/command/InterviewsScreen').then((m) => ({ default: m.InterviewsScreen })));
const HireScreen = lazy(() => import('@/screens/command/HireScreen').then((m) => ({ default: m.HireScreen })));
const CommandKnowledgeScreen = lazy(() => import('@/screens/command/KnowledgeScreen').then((m) => ({ default: m.KnowledgeScreen })));
const CommandKnowledgePageScreen = lazy(() => import('@/screens/command/KnowledgePageScreen').then((m) => ({ default: m.KnowledgePageScreen })));
const CommandCreatePageScreen = lazy(() => import('@/screens/command/CreatePageScreen').then((m) => ({ default: m.CreatePageScreen })));
const InternalChatScreen = lazy(() => import('@/screens/command/InternalChatScreen').then((m) => ({ default: m.InternalChatScreen })));
const TasksScreen = lazy(() => import('@/screens/command/TasksScreen').then((m) => ({ default: m.TasksScreen })));
const CommandBlogScreen = lazy(() => import('@/screens/command/CommandBlogScreen').then((m) => ({ default: m.CommandBlogScreen })));
const CommandSettingsScreen = lazy(() => import('@/screens/command/CommandSettingsScreen').then((m) => ({ default: m.CommandSettingsScreen })));

// Hiring screens
const VacanciesScreen = lazy(() => import('@/screens/hiring/VacanciesScreen'));
const VacancyScreen = lazy(() => import('@/screens/hiring/VacancyScreen'));
const ApplicationScreen = lazy(() => import('@/screens/hiring/ApplicationScreen'));
const MyApplicationsScreen = lazy(() => import('@/screens/hiring/MyApplicationsScreen'));
const InterviewScreen = lazy(() => import('@/screens/hiring/InterviewScreen'));

// Features screens — тикет №55
const FeaturesListScreen = lazy(() => import('@/screens/features/FeaturesListScreen').then((m) => ({ default: m.FeaturesListScreen })));
const FeatureCreateScreen = lazy(() => import('@/screens/features/FeatureCreateScreen').then((m) => ({ default: m.FeatureCreateScreen })));
const FeatureDetailScreen = lazy(() => import('@/screens/features/FeatureDetailScreen').then((m) => ({ default: m.FeatureDetailScreen })));

// History screens — тикет №56
const HistoryScreen = lazy(() => import('@/screens/history/HistoryScreen').then((m) => ({ default: m.HistoryScreen })));
const VersionDetailScreen = lazy(() => import('@/screens/history/VersionDetailScreen').then((m) => ({ default: m.VersionDetailScreen })));
const CompareScreen = lazy(() => import('@/screens/history/CompareScreen').then((m) => ({ default: m.CompareScreen })));

// Download screens — тикет №57
const DownloadScreen = lazy(() => import('@/screens/download/DownloadScreen').then((m) => ({ default: m.DownloadScreen })));
const DownloadProgressScreen = lazy(() => import('@/screens/download/DownloadProgressScreen').then((m) => ({ default: m.DownloadProgressScreen })));

// Docs screens — тикет №58
const DocsScreen = lazy(() => import('@/screens/docs/DocsScreen').then((m) => ({ default: m.DocsScreen })));

// Specifity screens — тикет №59
const SpecifityScreen = lazy(() => import('@/screens/specifity/SpecifityScreen').then((m) => ({ default: m.SpecifityScreen })));

// Blog Landing screens (узел 11) — тикет №60
const BlogLandingScreen = lazy(() => import('@/screens/blog-landing/BlogLandingScreen'));
const BlogLandingPostScreen = lazy(() => import('@/screens/blog-landing/BlogLandingPostScreen'));
const BlogCategoryScreen = lazy(() => import('@/screens/blog-landing/BlogCategoryScreen'));
const BlogSearchScreen = lazy(() => import('@/screens/blog-landing/BlogSearchScreen'));
const BlogChannelScreen = lazy(() => import('@/screens/blog-landing/BlogChannelScreen'));
const BlogSubscribeScreen = lazy(() => import('@/screens/blog-landing/BlogSubscribeScreen'));

// Loading fallback
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

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Auth check is done in the layout
  return <>{children}</>;
}

// Guest route (redirect to main if authenticated)
function GuestRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const router = createHashRouter([
  // --- Public routes ---
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <LandingScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/for_kassa',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ForKassaScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/donat',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DonateScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- Legal pages (public, indexable, no auth required) ---
  {
    path: '/privacy',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <PrivacyScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/rules',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <RulesScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/cookies',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <CookiesScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <GuestRoute>
            <LoginScreen />
          </GuestRoute>
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/register',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <GuestRoute>
            <RegisterScreen />
          </GuestRoute>
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/two-factor',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <TwoFactorScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ResetPasswordScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- Protected routes (main app) ---
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />,
      },
      {
        path: 'chat',
        element: <ChatViewScreen />,
      },
      {
        path: 'chat/:chatId',
        element: <ChatViewScreen />,
      },
      {
        path: 'profile',
        element: <ProfileScreen />,
      },
      {
        path: 'profile/:username',
        element: <PublicProfileScreen />,
      },
      {
        path: 'contacts',
        element: <ContactsScreen />,
      },
      // --- Settings ---
      {
        path: 'settings',
        element: <SettingsScreen />,
      },
      {
        path: 'settings/notifications',
        element: <NotificationSettingsScreen />,
      },
      {
        path: 'settings/privacy',
        element: <PrivacySettingsScreen />,
      },
      {
        path: 'settings/blocked',
        element: <BlockedUsersScreen />,
      },
      {
        path: 'search',
        element: <SearchScreen />,
      },
      {
        path: 'group/create',
        element: <CreateGroupScreen />,
      },
      {
        path: 'group/:chatId/settings',
        element: <GroupSettingsScreen />,
      },
      {
        path: 'channel/create',
        element: <CreateChannelScreen />,
      },
      {
        path: 'channel/:chatId',
        element: <ChannelViewScreen />,
      },
      {
        path: 'channel/:chatId/settings',
        element: <ChannelSettingsScreen />,
      },
      // Stories
      {
        path: 'stories',
        element: <StoriesScreen />,
      },
      {
        path: 'stories/create',
        element: <StoryCreateScreen />,
      },
      // Polls
      {
        path: 'polls',
        element: <PollScreen />,
      },
      {
        path: 'polls/:pollId',
        element: <PollScreen />,
      },
      {
        path: 'chat/:chatId/poll',
        element: <PollScreen />,
      },
      // Blog (internal) — moved to blog-landing (public, тикет №60)
      // Knowledge
      {
        path: 'knowledge',
        element: <KnowledgeScreen />,
      },
      {
        path: 'knowledge/page/:pageId',
        element: <KnowledgePageScreen />,
      },
      {
        path: 'knowledge/create',
        element: <EditPageScreen />,
      },
      {
        path: 'knowledge/edit/:pageId',
        element: <EditPageScreen />,
      },
      // --- Hiring ---
      {
        path: 'hiring/vacancies',
        element: <VacanciesScreen />,
      },
      {
        path: 'hiring/vacancy/:id',
        element: <VacancyScreen />,
      },
      {
        path: 'hiring/apply/:id',
        element: <ApplicationScreen />,
      },
      {
        path: 'hiring/applications',
        element: <MyApplicationsScreen />,
      },
      {
        path: 'hiring/application/:id',
        element: <InterviewScreen />,
      },
      {
        path: 'hiring/why-us',
        element: <VacanciesScreen />,
      },
    ],
  },

  // --- Admin routes ---
  {
    path: '/admin',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AdminLayout />
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <DashboardScreen />,
      },
      {
        path: 'users',
        element: <UsersScreen />,
      },
      {
        path: 'users/:userId',
        element: <UserDetailScreen />,
      },
      {
        path: 'reports',
        element: <ReportsScreen />,
      },
      {
        path: 'bans',
        element: <BansScreen />,
      },
      {
        path: 'analytics',
        element: <AnalyticsScreen />,
      },
      {
        path: 'feature-flags',
        element: <FeatureFlagsScreen />,
      },
      {
        path: 'downloads',
        element: <DownloadsScreen />,
      },
      {
        path: 'texts',
        element: <NotFoundScreen />,
      },
      {
        path: 'departments',
        element: <NotFoundScreen />,
      },
      {
        path: 'employees',
        element: <NotFoundScreen />,
      },
      {
        path: 'vacancies',
        element: <NotFoundScreen />,
      },
      {
        path: 'versions',
        element: <VersionsScreen />,
      },
      {
        path: 'announcements',
        element: <AnnouncementsScreen />,
      },
      {
        path: 'features',
        element: <NotFoundScreen />,
      },
      {
        path: 'donations',
        element: <AdminDonationsScreen />,
      },
      // --- Blog moderation ---
      {
        path: 'blog/queue',
        element: <BlogQueueScreen />,
      },
      {
        path: 'blog/channels',
        element: <BlogChannelsScreen />,
      },
      {
        path: 'blog/categories',
        element: <BlogCategoriesScreen />,
      },
      {
        path: 'audit-logs',
        element: <AuditLogsScreen />,
      },
      {
        path: 'system-settings',
        element: <SystemSettingsScreen />,
      },
    ],
  },

  // --- Command (employee portal) routes ---
  {
    path: '/command',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <CommandLayout />
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <HireScreen />,
      },
      {
        path: 'hr',
        element: <HRScreen />,
      },
      {
        path: 'vacancies',
        element: <CommandVacanciesScreen />,
      },
      {
        path: 'applications',
        element: <ApplicationsScreen />,
      },
      {
        path: 'interviews',
        element: <InterviewsScreen />,
      },
      {
        path: 'hiring',
        element: <HireScreen />,
      },
      // Internal chat — тикет №50
      {
        path: 'chat',
        element: <InternalChatScreen />,
      },
      {
        path: 'meetings',
        element: <NotFoundScreen />,
      },
      {
        path: 'tasks',
        element: <TasksScreen />,
      },
      // Command blog — тикет №52
      {
        path: 'blog',
        element: <CommandBlogScreen />,
      },
      {
        path: 'my-department',
        element: <NotFoundScreen />,
      },
      {
        path: 'departments',
        element: <NotFoundScreen />,
      },
      {
        path: 'knowledge',
        element: <CommandKnowledgeScreen />,
      },
      {
        path: 'knowledge/:pageId',
        element: <CommandKnowledgePageScreen />,
      },
      {
        path: 'knowledge/create',
        element: <CommandCreatePageScreen />,
      },
      // Command settings — тикет №53
      {
        path: 'settings',
        element: <CommandSettingsScreen />,
      },
      {
        path: 'monitoring',
        element: <NotFoundScreen />,
      },
      {
        path: 'why-us',
        element: <CommandVacanciesScreen />,
      },
    ],
  },

  // --- Service routes ---
  {
    path: '/install',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <InstallScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  // --- Features (узел 04) — тикет №55 ---
  {
    path: '/features',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <FeaturesListScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/features/create',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <FeatureCreateScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/features/:id',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <FeatureDetailScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  // --- History (узел 05) — тикет №56 ---
  {
    path: '/history',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <HistoryScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/history/version/:id',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <VersionDetailScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/history/compare',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <CompareScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/download',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DownloadScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/download/progress',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DownloadProgressScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/download/desktop/:platform',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DownloadScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/download/:platform',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DownloadScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- Docs (узел 07) — тикет №58 ---
  {
    path: '/doc',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DocsScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/doc/endpoint/:path',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DocsScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/doc/ws',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DocsScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- Specifity (узел 10) — тикет №59 ---
  {
    path: '/spec',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <SpecifityScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/spec/:nodeId/:screenId',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <SpecifityScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- Blog Landing (узел 11) — тикет №60 ---
  {
    path: '/blog',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BlogLandingScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/blog/post/:id',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BlogLandingPostScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/blog/category/:slug',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BlogCategoryScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/blog/search',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BlogSearchScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/blog/channel/:id',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BlogChannelScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/blog/subscribe',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BlogSubscribeScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- 404 fallback ---
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <NotFoundScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
]);
