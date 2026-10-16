import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginScreen from '../../screens/auth/LoginScreen';
import { I18nProvider } from '../../components/providers/I18nProvider';
import { useUIStore } from '@balloo/ui';

// jsdom: navigator.language = 'en' → принудительно ru для русских ожиданий
beforeEach(() => {
  useUIStore.getState().setLanguage('ru');
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <LoginScreen />
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('LoginScreen (сценарий авторизации)', () => {
  it('renders login title (С возвращением!)', () => {
    renderLogin();
    expect(
      screen.getByRole('heading', { level: 1, name: /с возвращением/i })
    ).toBeInTheDocument();
  });

  it('renders email and password form with submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^войти$/i })
    ).toBeInTheDocument();
  });

  it('renders OAuth tiles grid (6 провайдеров, 3 неактивных) — P20/P21 + 16.10.2026', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /яндекс/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mail\.ru/i })).toBeInTheDocument();
    // Rambler/Max/Госуслуги — место в сетке есть, кнопки неактивны
    expect(screen.getByRole('button', { name: /rambler/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /max/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /госуслуги/i })).toBeInTheDocument();
    // Сетка квадратов: 6 тайлов в контейнере .auth-oauth-grid
    expect(document.querySelector('.auth-oauth-grid')).toBeInTheDocument();
    expect(document.querySelectorAll('.auth-oauth-tile')).toHaveLength(6);
    const disabled = document.querySelectorAll('.auth-oauth-tile--disabled');
    expect(disabled).toHaveLength(3);
    expect(disabled[0]).toHaveAttribute('aria-disabled', 'true');
  });

  it('неактивный провайдер показывает подсказку про валидацию и не редиректит', () => {
    renderLogin();
    const rambler = screen.getByRole('button', { name: /rambler/i });
    expect(rambler).toHaveAttribute(
      'data-tooltip',
      'Проходим валидацию. Извините за неудобства.'
    );
    expect(rambler.getAttribute('aria-label')).toMatch(/валидац/i);
  });

  it('renders topbar menu dropdown (левое меню — меню, не кнопка на главную) — P23', () => {
    renderLogin();
    expect(document.querySelector('.topbar__dropdown')).toBeInTheDocument();
    expect(document.querySelectorAll('.topbar__dropdown-item').length).toBeGreaterThanOrEqual(7);
  });

  it('renders link to registration', () => {
    renderLogin();
    const registerLink = screen.getByRole('link', { name: /зарегистрироваться/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders link to password reset', () => {
    renderLogin();
    const resetLink = screen.getByRole('link', { name: /забыли пароль/i });
    expect(resetLink).toHaveAttribute('href', '/reset-password');
  });

  it('renders legal links (rules, privacy, cookies)', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: 'Правила' })).toHaveAttribute('href', '/rules');
    expect(
      screen.getByRole('link', { name: 'Конфиденциальность' })
    ).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Cookies' })).toHaveAttribute('href', '/cookies');
  });

  it('renders QR login block with link to add-device', () => {
    renderLogin();
    expect(
      screen.getByRole('button', { name: /войти через другое устройство/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/отсканируйте qr-код с экрана авторизованного устройства/i)
    ).toBeInTheDocument();
  });
});
