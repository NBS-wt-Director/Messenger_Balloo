// Регресс-тест StoriesScreen (тикет 1795290222).
//
// Баг приёмки: `GET /api/stories` отдаёт объект `{ stories, nextCursor }`
// (storyService.getStories), а экран ждал массив `StoryUser[]` и делал
// `users.filter(...)` → TypeError → ErrorBoundary подменял всю страницу
// (шапку/подвал в т.ч.) на «Что-то пошло не так».
//
// Здесь форма ответа воспроизводится как на реальном сервере (объект с
// вложенным `user` у каждой истории) — smoke-мок так не умел.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const get = vi.fn();
const post = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

import StoriesScreen from '../../screens/stories/StoriesScreen';

describe('StoriesScreen — ответ GET /api/stories объектом { stories }', () => {
  it('разворачивает { stories } и рендерит автора истории (без падения)', async () => {
    get.mockResolvedValue({
      stories: [
        {
          id: 's1',
          userId: 'u1',
          type: 'image',
          mediaUrl: 'https://cdn.balloo.su/stories/1.jpg',
          thumbnail: null,
          createdAt: 1750000000,
          expiresAt: 1750003600,
          viewCount: 3,
          hasViewed: false,
          user: {
            id: 'u1',
            username: 'bob',
            displayName: 'Боб Бобов',
            avatarUrl: null,
          },
        },
      ],
      nextCursor: 1750000000,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/stories']}>
        <StoriesScreen />
      </MemoryRouter>
    );

    // Экран не должен «упасть» в фолбэк ErrorBoundary.
    expect(container.textContent).not.toContain('Что-то пошло не так');

    await waitFor(() => expect(screen.getByText('Боб Бобов')).toBeTruthy());
    expect(screen.getByText(/🖼️ Фото/)).toBeTruthy();
  });
});
