// Тикет 1795683301 (T1–T4, U10): пустое состояние историй, «Что это?»,
// демо-ролики, бейдж новых историй.
//
// Требование владельца: если историй нет — объяснение + 3 предзаписанных
// видео + кнопки «Загрузить свою историю»/«Настроить» + «Что это?»;
// если есть новые — все пункты «Истории» показывают бейдж.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StoriesScreen from '../../screens/stories/StoriesScreen';
import { StoriesEmptyState } from '../../screens/stories/StoriesEmptyState';
import { useStoriesStore } from '../../store/storiesStore';

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ stories: [], nextCursor: null })),
    post: vi.fn(() => Promise.resolve({})),
  },
}));

describe('StoriesScreen — пустое состояние (T1–T4)', () => {
  beforeEach(() => {
    useStoriesStore.setState({ hasUnviewed: false, unviewedCount: 0, loading: false });
  });

  it('показывает объяснение и призыв, когда историй нет', async () => {
    render(
      <MemoryRouter initialEntries={['/stories']}>
        <StoriesScreen />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/пока нет ни одной истории/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/вопиющую несправедливость/i)).toBeInTheDocument();
  });

  it('рендерит три демо-ролика без звука', async () => {
    render(
      <MemoryRouter initialEntries={['/stories']}>
        <StoriesScreen />
      </MemoryRouter>
    );

    await screen.findByText(/пока нет ни одной истории/i);
    const videos = document.querySelectorAll('video');
    expect(videos.length).toBe(3);
    videos.forEach((v) => {
      expect(v.muted).toBe(true);
      expect(v.getAttribute('src')).toMatch(/^\/demo-stories\/.+\.mp4$/);
    });
  });

  it('даёт загрузить историю и настроить приватность сразу', async () => {
    render(
      <MemoryRouter initialEntries={['/stories']}>
        <StoriesScreen />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Загрузить свою историю/i)).toBeInTheDocument();
    expect(screen.getByText(/Настроить приватность/i)).toBeInTheDocument();
  });

  it('«Что это?» открывает модалку с описанием экрана', async () => {
    render(
      <MemoryRouter initialEntries={['/stories']}>
        <StoriesScreen />
      </MemoryRouter>
    );

    const buttons = await screen.findAllByRole('button', { name: /Что это\?/i });
    fireEvent.click(buttons[0]);

    expect(
      await screen.findByRole('heading', { name: /Что такое истории/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Кто видит вашу историю/i)).toBeInTheDocument();
  });

  it('StoriesEmptyState: кнопка «Что это?» открывает модалку', () => {
    render(
      <MemoryRouter>
        <StoriesEmptyState onOpenDemo={() => {}} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Что это\?/i }));
    expect(
      screen.getByRole('heading', { name: /Что такое истории/i })
    ).toBeInTheDocument();
  });
});

describe('storiesStore — бейдж новых историй (U10)', () => {
  beforeEach(() => {
    useStoriesStore.setState({ hasUnviewed: false, unviewedCount: 0, loading: false });
  });

  it('markAllViewed сбрасывает бейдж', () => {
    useStoriesStore.setState({ hasUnviewed: true, unviewedCount: 3 });
    useStoriesStore.getState().markAllViewed();

    expect(useStoriesStore.getState().hasUnviewed).toBe(false);
    expect(useStoriesStore.getState().unviewedCount).toBe(0);
  });

  it('refresh выставляет бейдж по hasViewed из API', async () => {
    const { api } = await import('@/services/api');
    (api.get as any).mockResolvedValueOnce({
      stories: [
        { id: '1', hasViewed: true },
        { id: '2', hasViewed: false },
      ],
    });

    await useStoriesStore.getState().refresh();

    expect(useStoriesStore.getState().hasUnviewed).toBe(true);
    expect(useStoriesStore.getState().unviewedCount).toBe(1);
  });
});
