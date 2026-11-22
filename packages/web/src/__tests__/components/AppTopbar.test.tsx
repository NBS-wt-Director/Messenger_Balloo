// Тесты единой шапки (тик. 1795292000):
//   • правый блок: авторизованный (колокольчик + аватар) / гость («Войти»);
//   • нет аватарки → логотип компании;
//   • активная кнопка заголовка: режим обучения + бегущая строка уведомления.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@balloo/ui';

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

function renderTopbar(props: React.ComponentProps<typeof AppTopbar> = {}) {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={['/chat']}>
        <AppTopbar title="Чаты" {...props} />
      </MemoryRouter>
    </I18nProvider>
  );
}

beforeEach(() => {
  cleanup();
  useAuthStore.setState({ user: null, isAuthenticated: false });
  useUIStore.setState({ learningMode: false, notice: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AppTopbar — правый блок по авторизации', () => {
  it('гость: кнопка «Войти», общего меню-маскота есть, частного меню нет', () => {
    const { container } = renderTopbar();
    expect(screen.getByText('Войти')).toBeTruthy();
    // Общее меню (маскот) — для всех; частного (аватар) у гостя нет.
    expect(container.querySelector('#balloo-menu-btn .mascot')).not.toBeNull();
    expect(container.querySelector('#balloo-private-menu-btn')).toBeNull();
    expect(container.textContent).not.toContain('🔔');
  });

  it('авторизованный: частное меню (аватар) + общее (маскот) + колокольчик', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u1',
        email: 'a@b.c',
        username: 'bob',
        displayName: 'Боб',
        avatarUrl: 'https://cdn.balloo.su/a.png',
        status: 'online',
        language: 'ru',
        theme: 'dark',
        isAdmin: false,
        isTwoFAEnabled: false,
      } as any,
    });
    const { container } = renderTopbar();
    expect(container.querySelector('#balloo-private-menu-btn')).not.toBeNull();
    expect(container.querySelector('#balloo-menu-btn .mascot')).not.toBeNull();
    // Частное меню — левее общего (общее самое правое).
    const right = container.querySelector('.topbar__right') as HTMLElement;
    const html = right.innerHTML;
    expect(html.indexOf('balloo-private-menu-btn')).toBeLessThan(html.indexOf('balloo-menu-btn'));
  });

  it('авторизованный с аватаркой: аватар частного меню = аватарка пользователя', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u1',
        email: 'a@b.c',
        username: 'bob',
        displayName: 'Боб',
        avatarUrl: 'https://cdn.balloo.su/a.png',
        status: 'online',
        language: 'ru',
        theme: 'dark',
        isAdmin: false,
        isTwoFAEnabled: false,
      } as any,
    });
    const { container } = renderTopbar();
    const img = container.querySelector('#balloo-private-menu-btn img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://cdn.balloo.su/a.png');
  });

  it('авторизованный без аватарки: аватар частного меню = логотип компании', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u1',
        email: 'a@b.c',
        username: 'bob',
        displayName: 'Боб',
        avatarUrl: undefined,
        status: 'online',
        language: 'ru',
        theme: 'dark',
        isAdmin: false,
        isTwoFAEnabled: false,
      } as any,
    });
    const { container } = renderTopbar();
    const img = container.querySelector('#balloo-private-menu-btn img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/assets/logos/company-logo.png');
  });
});

describe('AppTopbar — активный заголовок', () => {
  it('клик по заголовку включает режим обучения и показывает справку', () => {
    renderTopbar();
    fireEvent.click(screen.getByText('Чаты'));
    expect(useUIStore.getState().learningMode).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Режим обучения' })).toBeTruthy();
  });

  it('клик по заголовку показывает бегущую строку, затем возвращает заголовок', () => {
    vi.useFakeTimers();
    renderTopbar();
    fireEvent.click(screen.getByText('Чаты'));

    // Бегущая строка заменила заголовок.
    expect(useUIStore.getState().notice).toBeTruthy();
    expect(document.querySelector('.topbar__ticker')).toBeTruthy();

    // По истечении времени показа возвращается заголовок.
    vi.advanceTimersByTime(6000);
    expect(useUIStore.getState().notice).toBeNull();
  });

  it('закрытие справки выключает режим обучения', () => {
    renderTopbar();
    fireEvent.click(screen.getByText('Чаты'));
    fireEvent.click(screen.getByText('Понятно'));
    expect(useUIStore.getState().learningMode).toBe(false);
  });
});
