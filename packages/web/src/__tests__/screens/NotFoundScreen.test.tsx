// NotFoundScreen — тест отправки события на /api/client-errors (тик. 1791975722, В-1)
// Проверяем: при монтировании экрана вызывается fetch('/api/client-errors', { method: 'POST' }).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Моким fetch для проверки вызова
const mockFetch = vi.fn().mockResolvedValue({ ok: true });

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', mockFetch);
});

describe('NotFoundScreen — отправка client-error', () => {
  it('при монтировании вызывает POST /api/client-errors', async () => {
    // Динамический импорт после моков
    const { default: NotFoundScreen } = await import('../../screens/shared/NotFoundScreen');

    render(
      <MemoryRouter>
        <NotFoundScreen />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/client-errors');
    expect(opts.method).toBe('POST');

    const body = JSON.parse(opts.body);
    expect(body.code).toBe('not_found');
    expect(body).toHaveProperty('url');
    expect(body).toHaveProperty('userAgent');
  });

  it('рендерит код 404 и текст', async () => {
    const { default: NotFoundScreen } = await import('../../screens/shared/NotFoundScreen');

    render(
      <MemoryRouter>
        <NotFoundScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByText('Страница не найдена')).toBeDefined();
  });
});
