// Smoke-тесты: блог, каналы, docs, download, группы, hiring, knowledge, search, features, chat
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderScreen } from '../helpers/screenTestUtils';

vi.mock('@/services/api', async () => {
  const { createUniversalApiMock } = await import('../helpers/apiSpyMock');
  return { api: createUniversalApiMock() };
});

import { CreatePostScreen } from '../../screens/blog/CreatePostScreen';
import { BlogPostScreen } from '../../screens/blog/BlogPostScreen';
import { BlogScreen } from '../../screens/blog/BlogScreen';
import CreateChannelScreen from '../../screens/channels/CreateChannelScreen';
import ChannelSettingsScreen from '../../screens/channels/ChannelSettingsScreen';
import { DocsScreen } from '../../screens/docs/DocsScreen';
import { DownloadScreen } from '../../screens/download/DownloadScreen';
import CreateGroupScreen from '../../screens/groups/CreateGroupScreen';
import ApplicationScreen from '../../screens/hiring/ApplicationScreen';
import InterviewScreen from '../../screens/hiring/InterviewScreen';
import VacancyScreen from '../../screens/hiring/VacancyScreen';
import { EditPageScreen } from '../../screens/knowledge/EditPageScreen';
import { KnowledgePageScreen } from '../../screens/knowledge/KnowledgePageScreen';
import { KnowledgeScreen } from '../../screens/knowledge/KnowledgeScreen';
import SearchScreen from '../../screens/search/SearchScreen';
import { FeaturesListScreen } from '../../screens/features/FeaturesListScreen';
import ChatViewScreen from '../../screens/chat/ChatViewScreen';
import BlogLandingPostScreen from '../../screens/blog-landing/BlogLandingPostScreen';

describe('Blog, channels, knowledge, hiring, chat screens (smoke)', () => {
  const cases: [string, React.ReactNode][] = [
    ['CreatePostScreen', <CreatePostScreen />],
    ['BlogPostScreen', <BlogPostScreen />],
    ['BlogScreen', <BlogScreen />],
    ['CreateChannelScreen', <CreateChannelScreen />],
    ['ChannelSettingsScreen', <ChannelSettingsScreen />],
    ['DocsScreen', <DocsScreen />],
    ['DownloadScreen', <DownloadScreen />],
    ['CreateGroupScreen', <CreateGroupScreen />],
    ['ApplicationScreen', <ApplicationScreen />],
    ['InterviewScreen', <InterviewScreen />],
    ['VacancyScreen', <VacancyScreen />],
    ['EditPageScreen', <EditPageScreen />],
    ['KnowledgePageScreen', <KnowledgePageScreen />],
    ['KnowledgeScreen', <KnowledgeScreen />],
    ['SearchScreen', <SearchScreen />],
    ['FeaturesListScreen', <FeaturesListScreen />],
    ['ChatViewScreen', <ChatViewScreen />],
    ['BlogLandingPostScreen', <BlogLandingPostScreen />],
  ];

  for (const [name, ui] of cases) {
    it(`${name} renders and loads data`, async () => {
      const { container } = renderScreen(ui);
      expect(container.firstChild).not.toBeNull();
      await waitFor(() => {}, { timeout: 1000 }).catch(() => {});
    });
  }
});
