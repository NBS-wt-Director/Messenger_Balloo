import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginScreen from '../../screens/auth/LoginScreen';

describe('LoginScreen (сценарий авторизации)', () => {
  it('renders login title', () => {
    render(<LoginScreen />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders link to registration', () => {
    render(<LoginScreen />);
    const registerLink = screen.getByText(/→$/);
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders legal links (rules, privacy, cookies)', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Правила').closest('a')).toHaveAttribute('href', '/rules');
    expect(screen.getByText('Конфиденциальность').closest('a')).toHaveAttribute('href', '/privacy');
    expect(screen.getByText('Cookies').closest('a')).toHaveAttribute('href', '/cookies');
  });
});
