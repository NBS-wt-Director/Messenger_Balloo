// Router — React Router v6
// Protected routes, lazy loading, error boundaries
// P24 (2026-09-18): реальный auth-гвард — гость не попадает в /chat и другие
// защищённые маршруты; авторизованный не видит /login и /register.

import { createHashRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { PageChrome } from '@/components/chrome/PageChrome';
import { PrivacyScreen } from '@/screens/legal/PrivacyScreen';
import { RulesScreen } from '@/screens/legal/RulesScreen';
import { CookiesScreen } from '@/screens/legal/CookiesScreen';
import { AboutBallooScreen } from '@/screens/about/AboutBallooScreen';
import { AboutCompanyScreen } from '@/screens/about/AboutCompanyScreen';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';

// Lazy-loaded screen components
// Landing pages — тикет 1792472959-02: '/' гостя → OnboardingScreen (LandingScreen не используется)
const LoginScreen = lazy(() => import('@/screens/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('@/screens/auth/RegisterScreen'));
const TwoFactorScreen = lazy(() => import('@/screens/auth/TwoFactorScreen'));
const ResetPasswordScreen = lazy(() => import('@/screens/auth/ResetPasswordScreen'));
const OnboardingScreen = lazy(() => import('@/screens/onboarding/OnboardingScreen'));
const ActiveCallScreen = lazy(() => import('@/screens/active-call/ActiveCallScreen'));
const InvitesScreen = lazy(() => import('@/screens/invites/InvitesScreen'));
const BotsScreen = lazy(() => import('@/screens/bots/BotsScreen'));
const MyDevicesScreen = lazy(() => import('@/screens/my-devices/MyDevicesScreen'));
const ChatAttachmentsScreen = lazy(() => import('@/screens/chat-attachments/ChatAttachmentsScreen'));
const ReportMessageScreen = lazy(() => import('@/screens/report-message/ReportMessageScreen'));
const MyDonatesScreen = lazy(() => import('@/screens/my-donates/MyDonatesScreen'));
const MessageEditorScreen = lazy(() => import('@/screens/message-editor/MessageEditorScreen'));
const AddDeviceScreen = lazy(() => import('@/screens/auth/AddDeviceScreen'));
const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const ChatViewScreen = lazy(() => import('@/screens/chat/ChatViewScreen'));
const ArchiveScreen = lazy(() => import('@/screens/chat/ArchiveScreen'));
const AccountsScreen = lazy(() => import('@/screens/profile/AccountsScreen'));
const ProfileScreen = lazy(() => import('@/screens/profile/ProfileScreen'));
const PublicProfileScreen = lazy(() => import('@/screens/profile/PublicProfileScreen'));
const ContactsScreen = lazy(() => import('@/screens/contacts/ContactsScreen'));
const SettingsScreen = lazy(() => import('@/screens/settings/SettingsScreen'));
const NotificationSettingsScreen = lazy(() => import('@/screens/settings/NotificationSettingsScreen'));
const PrivacySettingsScreen = lazy(() => import('@/screens/settings/PrivacySettingsScreen'));
const BlockedUsersScreen = lazy(() => import('@/screens/settings/BlockedUsersScreen'));
const SearchScreen = lazy(() => import('@/screens/search/SearchScreen'));
const SupportScreen = lazy(() => import('@/screens/support/SupportScreen').then((m) => ({ default: m.SupportScreen })));
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

// Admin screens — вынесены в packages/web-admin (тикет 1792395490-05)

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

// Calls — тикет 1792137287
const CallsScreen = lazy(() => import('@/screens/calls/CallsScreen'));

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

// Protected route wrapper (P24): гость → /login.
// 1. user есть в store (persist) → пропускаем сразу.
// 2. user нет, но есть httpOnly-cookie (например, после OAuth-callback) →
//    пробуем getMe(): успех → пропускаем, 401/ошибка → редирект на /login.
// Экспортируется для юнит-тестов гварда (тикет №61).
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const [checking, setChecking] = useState(!user && !isAuthenticated);

  useEffect(() => {
    if (user || isAuthenticated) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.getMe();
        if (!cancelled) {
          if (me) setUser(me);
          setChecking(false);
        }
      } catch {
        // Нет валидной сессии (cookie отсутствует/истёк) → на /login
        if (!cancelled) {
          setUser(null);
          setChecking(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, setUser]);

  if (checking) return <LoadingFallback />;
  if (!user && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Guest route (P24): авторизованный → /chat (не показываем login/register)
// Экспортируется для юнит-тестов гварда (тикет №61).
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (user || isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
}

export const router = createHashRouter([
  // --- Public routes ---
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          {/* §17.1 (тикет 1792472959-02): гость открывает '/' → онбординг.
              Раньше здесь был <LandingScreen/>, теперь — OnboardingScreen
              (правило владельца: гость не видит лендинг, он видит онбординг). */}
          <GuestRoute>
            <OnboardingScreen />
          </GuestRoute>
        </Suspense>
      </ErrorBoundary>
    ),
  },

  // --- About pages (public, no auth required)
  {
    path: '/about-balloo',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AboutBallooScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/about-company',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AboutCompanyScreen />
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

  // --- Support (protected, однопанельный — по ТЗ «content без sidebar») ---
  {
    path: '/support',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <SupportScreen />
          </ProtectedRoute>
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

  // --- About pages (public, no auth required)
  {
    path: '/about-balloo',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AboutBallooScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/about-company',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AboutCompanyScreen />
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
  {
    path: '/onboarding',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <OnboardingScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/active-call',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ActiveCallScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/invites',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <InvitesScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/bots',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BotsScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/my-devices',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <MyDevicesScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/add-device',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AddDeviceScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },

  {
    path: '/chats/:chatId/attachments',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ChatAttachmentsScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/messages/:messageId/report',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ReportMessageScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/my-donates',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <MyDonatesScreen />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/messages/:messageId/edit',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <MessageEditorScreen />
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
      // P38-0: здесь больше нет { index: true → /chat } — он затенял публичный
      // лендинг на '/' (см. комментарий у публичного маршрута '/').
      {
        path: 'chat',
        element: <ChatViewScreen />,
      },
      {
        path: 'chat/:chatId',
        element: <ChatViewScreen />,
      },
      {
        path: 'archive',
        element: <ArchiveScreen />,
      },
      {
        path: 'profile',
        element: <ProfileScreen />,
      },
      {
        path: 'accounts',
        element: <AccountsScreen />,
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
      // Calls — тикет 1792137287
      {
        path: 'calls',
        element: <CallsScreen />,
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
        element: <NotFoundScreen />,
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
          <PageChrome title="Новый фич-реквест">
            <FeatureCreateScreen />
          </PageChrome>
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/features/:id',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <PageChrome title="Фич-реквест">
            <FeatureDetailScreen />
          </PageChrome>
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
          <PageChrome title="Версия">
            <VersionDetailScreen />
          </PageChrome>
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/history/compare',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <PageChrome title="Сравнение версий">
            <CompareScreen />
          </PageChrome>
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
          <PageChrome title="Загрузка">
            <DownloadProgressScreen />
          </PageChrome>
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
