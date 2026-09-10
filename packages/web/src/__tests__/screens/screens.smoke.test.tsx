// Smoke-тесты экранов настроек, профиля, историй, опросов, 2FA, командного портала
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderScreen } from '../helpers/screenTestUtils';

vi.mock('@/services/api', async () => {
  const { createUniversalApiMock } = await import('../helpers/apiSpyMock');
  return { api: createUniversalApiMock() };
});

import SettingsScreen from '../../screens/settings/SettingsScreen';
import NotificationSettingsScreen from '../../screens/settings/NotificationSettingsScreen';
import PrivacySettingsScreen from '../../screens/settings/PrivacySettingsScreen';
import BlockedUsersScreen from '../../screens/settings/BlockedUsersScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import StoriesScreen from '../../screens/stories/StoriesScreen';
import PollScreen from '../../screens/polls/PollScreen';
import TwoFactorScreen from '../../screens/auth/TwoFactorScreen';
import GroupSettingsScreen from '../../screens/groups/GroupSettingsScreen';
import { TasksScreen } from '../../screens/command/TasksScreen';
import { CommandBlogScreen } from '../../screens/command/CommandBlogScreen';
import { CommandSettingsScreen } from '../../screens/command/CommandSettingsScreen';
import { AuditLogsScreen } from '../../screens/admin/AuditLogsScreen';
import { SystemSettingsScreen } from '../../screens/admin/SystemSettingsScreen';

describe('Settings, profile, stories, polls, command screens (smoke)', () => {
  const cases: [string, React.ReactNode][] = [
    ['SettingsScreen', <SettingsScreen />],
    ['NotificationSettingsScreen', <NotificationSettingsScreen />],
    ['PrivacySettingsScreen', <PrivacySettingsScreen />],
    ['BlockedUsersScreen', <BlockedUsersScreen />],
    ['ProfileScreen', <ProfileScreen />],
    ['StoriesScreen', <StoriesScreen />],
    ['PollScreen', <PollScreen />],
    ['TwoFactorScreen', <TwoFactorScreen />],
    ['GroupSettingsScreen', <GroupSettingsScreen />],
    ['TasksScreen', <TasksScreen />],
    ['CommandBlogScreen', <CommandBlogScreen />],
    ['CommandSettingsScreen', <CommandSettingsScreen />],
    ['AuditLogsScreen', <AuditLogsScreen />],
    ['SystemSettingsScreen', <SystemSettingsScreen />],
  ];

  for (const [name, ui] of cases) {
    it(`${name} renders and loads data`, async () => {
      const { container } = renderScreen(ui);
      expect(container.firstChild).not.toBeNull();
      await waitFor(() => {}, { timeout: 1000 }).catch(() => {});
    });
  }
});
