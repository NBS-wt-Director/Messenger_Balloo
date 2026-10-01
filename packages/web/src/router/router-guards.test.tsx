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

const mocks = vi.hoisted(() => {
  const state = {
    user: null as { id: string; username: string } | null,
    isAuthenticated: false,
    setUserCalls: [] as unknown[],
    // Мок-сеттер мутирует состояние (как настоящий zustand-сеттер): без этого
    // после setChecking(false) user остаётся null и ProtectedRoute
    // уводит на /login даже при успешном getMe.
    setUser: (u: unknown) => {
      state.setUserCalls.push(u);
      state.user = (u as { id: string; username: string } | null) ?? null;
      state.isAuthenticated = !!u;
    },
  };
  return { state, getMe: vi.fn() };
});

// Реальные импорты гварда: useAuthStore из '@/store/authStore', api из '@/services/api'
// (раньше мокались '@/store' и '@/api' — таких модулей нет, моки не перехватывались).
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: typeof mocks.state) => unknown) => selector(mocks.state),
}));

vi.mock('@/services/api', () => ({
  api: { getMe: mocks.getMe },
}));

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
    mocks.state.user = null;
    mocks.state.isAuthenticated = false;
    mocks.state.setUserCalls = [];
    clearSessionCookie();
    // По умолчанию сессии нет: реальный api.getMe при отсутствии cookie
    // отвечает 401 (rejected promise).
    mocks.getMe.mockRejectedValue({ response: { status: 401 } });
  });

  it('авторизованного пропускает к children', () => {
    mocks.state.user = { id: 'u1', username: 'petya' };
    mocks.state.isAuthenticated = true;

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

  it('гость без cookie и без user → редирект на /login', async () => {
    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    // getMe вызывается один раз (попытка восстановления сессии), падает →
    // setUser(null) и редирект на /login.
    await waitFor(() => expect(screen.getByText('НА_ЛОГИНЕ')).toBeInTheDocument());
    expect(mocks.getMe).toHaveBeenCalledTimes(1);
    expect(mocks.state.setUserCalls).toContain(null);
    expect(screen.queryByText('ЗАЩИЩЁННЫЙ ЭКРАН')).not.toBeInTheDocument();
  });

  it('cookie есть, getMe успешен → сессия восстанавливается в store', async () => {
    document.cookie = 'access_token=jwt-token';
    const restored = { id: 'u2', username: 'vasya' };
    mocks.getMe.mockResolvedValueOnce(restored);

    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    await waitFor(() => expect(mocks.state.setUserCalls).toContain(restored));
    // На время восстановления не должны выкидывать на /login.
    expect(screen.queryByText('НА_ЛОГИНЕ')).not.toBeInTheDocument();
  });

  it('cookie есть, но getMe отдаёт 401 → редирект на /login', async () => {
    document.cookie = 'access_token=expired-jwt';
    mocks.getMe.mockRejectedValueOnce({ response: { status: 401 } });

    renderGuarded(
      <ProtectedRoute>
        <div>ЗАЩИЩЁННЫЙ ЭКРАН</div>
      </ProtectedRoute>,
      '/chat',
    );

    await waitFor(() => expect(screen.getByText('НА_ЛОГИНЕ')).toBeInTheDocument());
    expect(mocks.state.setUserCalls).toContain(null);
  });

  it('cookie есть, getMe падает по сети → редирект на /login (не висим в restoring)', async () => {
    document.cookie = 'access_token=any-jwt';
    mocks.getMe.mockRejectedValueOnce(new Error('Network Error'));

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
    mocks.state.user = null;
    mocks.state.isAuthenticated = false;
  });

  it('авторизованного уводит с /login на /chat', () => {
    mocks.state.user = { id: 'u1', username: 'petya' };
    mocks.state.isAuthenticated = true;

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
