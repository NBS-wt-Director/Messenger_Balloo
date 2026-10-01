// Тесты гвардов роутера (тикет №61).
//
// Проверяется инвариант доступов:
//  - ProtectedRoute: гость → /login; авторизованный → дети;
//    сессия в httpOnly-cookie → восстановление через getMe();
//    getMe 401 / сетевая ошибка → /login.
//  - GuestRoute: авторизованный → /chat; гость → дети.
//
// Лёгкие страницы и лэйауты мокаются — нас интересует только поведение гварда,
// а не содержимое экранов (иначе тест тянет за собой весь чат).
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string; username: string } | null,
    setUser: vi.fn(),
  },
  getMe: vi.fn(),
}));

vi.mock('@/store', () => ({
  useAuthStore: (selector: (s: typeof mocks.authState) => unknown) => selector(mocks.authState),
}));

vi.mock('@/api', () => ({
  api: { getMe: mocks.getMe },
}));

// Лэйауты и страницы тянут за собой API, WS и тяжёлые виджеты — для теста гвардов они не нужны.
vi.mock('@/components/layout/AuthLayout', () => ({ AuthLayout: () => null }));
vi.mock('@/components/layout/ChatLayout', () => ({ ChatLayout: () => null }));
vi.mock('@/pages/ChatPage', () => ({ ChatPage: () => null }));
vi.mock('@/pages/LoginPage', () => ({ LoginPage: () => null }));
vi.mock('@/pages/RegisterPage', () => ({ RegisterPage: () => null }));

import { GuestRoute, ProtectedRoute } from '@/router/index';

function renderGuarded(element: React.ReactElement, initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/chat" element={element} />
        <Route path="/login" element={<div>НА_ЛОГИНЕ</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function clearSessionCookie() {
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.user = null;
    clearSessionCookie();
  });

  it('авторизованного пропускает к children', () => {
    mocks.authState.user = { id: 'u1', username: 'petya' };

    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    expect(screen.getByText('ЗАЩИЩЁННЫЙ ЭКРАН')).toBeInTheDocument();
    expect(screen.queryByText('НА_ЛОГИНЕ')).not.toBeInTheDocument();
    expect(mocks.getMe).not.toHaveBeenCalled();
  });

  it('гость без cookie и без user → редирект на /login', () => {
    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    expect(screen.getByText('НА_ЛОГИНЕ')).toBeInTheDocument();
    expect(screen.queryByText('ЗАЩИЩЁННЫЙ ЭКРАН')).not.toBeInTheDocument();
    expect(mocks.getMe).not.toHaveBeenCalled();
  });

  it('cookie есть, getMe успешен → сессия восстанавливается в store', async () => {
    document.cookie = 'access_token=jwt-token';
    const restored = { id: 'u2', username: 'vasya', email: null };
    mocks.getMe.mockResolvedValue({ data: restored });

    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    await waitFor(() => expect(mocks.authState.setUser).toHaveBeenCalledWith(restored));
    // На время восстановления не должны выкидывать на /login.
    expect(screen.queryByText('НА_ЛОГИНЕ')).not.toBeInTheDocument();
  });

  it('cookie есть, но getMe отдаёт 401 → редирект на /login', async () => {
    document.cookie = 'access_token=expired-jwt';
    mocks.getMe.mockRejectedValue({ response: { status: 401 } });

    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    await waitFor(() => expect(screen.getByText('НА_ЛОГИНЕ')).toBeInTheDocument());
    expect(mocks.authState.setUser).not.toHaveBeenCalled();
  });

  it('cookie есть, getMe падает по сети → редирект на /login (не висим в restoring)', async () => {
    document.cookie = 'access_token=any-jwt';
    mocks.getMe.mockRejectedValue(new Error('Network Error'));

    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    await waitFor(() => expect(screen.getByText('НА_ЛОГИНЕ')).toBeInTheDocument());
  });
});

describe('GuestRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.user = null;
  });

  it('авторизованного уводит с /login на /chat', async () => {
    mocks.authState.user = { id: 'u1', username: 'petya' };

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>ФОРМА ВХОДА</div>
              </GuestRoute>
            }
          />
          <Route path="/chat" element={<div>ЧАТ</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('ЧАТ')).toBeInTheDocument();
    expect(screen.queryByText('ФОРМА ВХОДА')).not.toBeInTheDocument();
  });

  it('гость видит форму входа', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>ФОРМА ВХОДА</div>
              </GuestRoute>
            }
          />
          <Route path="/chat" element={<div>ЧАТ</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('ФОРМА ВХОДА')).toBeInTheDocument();
    expect(screen.queryByText('ЧАТ')).not.toBeInTheDocument();
  });
});
