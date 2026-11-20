// Тесты экрана подтверждения входа (13-значный код) — тик. 1795101593.
// Проверяем: автоотправку кода при открытии, подсказку канала, ввод ровно
// 13 цифр, вызов verify2FA с email и повторную отправку.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const send2FACode = vi.fn().mockResolvedValue({ channel: 'email', expiresIn: 300, message: '' });
const verify2FA = vi.fn().mockResolvedValue({ success: true });

vi.mock('@/services/api', () => ({
  api: {
    send2FACode: (...args: unknown[]) => send2FACode(...args),
    verify2FA: (...args: unknown[]) => verify2FA(...args),
  },
}));

vi.mock('@/components/chrome/AppTopbar', () => ({
  AppTopbar: ({ title }: { title: string }) => <div data-testid="topbar">{title}</div>,
}));

vi.mock('@/components/chrome/AppFooter', () => ({
  AppFooter: () => <div data-testid="footer" />,
}));

import TwoFactorScreen from '../../screens/auth/TwoFactorScreen';

function renderLogin(email = 'user@test.balloo.ru') {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/two-factor', state: { email } }]}>
      <TwoFactorScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  send2FACode.mockResolvedValue({ channel: 'email', expiresIn: 300, message: '' });
});

describe('TwoFactorScreen (login, 13-значный код)', () => {
  it('при открытии автоматически запрашивает код на email из state', async () => {
    renderLogin('user@test.balloo.ru');
    await waitFor(() => expect(send2FACode).toHaveBeenCalledWith('user@test.balloo.ru'));
    expect(await screen.findByText(/Мы отправили код на user@test.balloo.ru/)).toBeInTheDocument();
  });

  it('показывает push-подсказку, если сервер выбрал канал push', async () => {
    send2FACode.mockResolvedValue({ channel: 'push', expiresIn: 300, message: '' });
    renderLogin();
    expect(await screen.findByText(/доверенное устройство/)).toBeInTheDocument();
  });

  it('кнопка «Подтвердить» активна только при 13 цифрах', async () => {
    renderLogin();
    const input = screen.getByTestId('twofa-code') as HTMLInputElement;
    const submit = screen.getByTestId('twofa-submit') as HTMLButtonElement;

    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: '123456789012' } });
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: '1234567890123' } });
    expect(input.value).toBe('1234567890123');
    expect(submit).not.toBeDisabled();
  });

  it('не пропускает нецифровые символы и обрезает до 13', async () => {
    renderLogin();
    const input = screen.getByTestId('twofa-code') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ab12 34-567890123456' } });
    expect(input.value).toBe('1234567890123');
  });

  it('по «Подтвердить» шлёт verify2FA с кодом и email', async () => {
    renderLogin('user@test.balloo.ru');
    const input = screen.getByTestId('twofa-code');
    fireEvent.change(input, { target: { value: '1234567890123' } });
    fireEvent.click(screen.getByTestId('twofa-submit'));

    await waitFor(() =>
      expect(verify2FA).toHaveBeenCalledWith('1234567890123', 'user@test.balloo.ru')
    );
  });

  it('после отправки кнопка повторной отправки уходит в обратный отсчёт (disabled)', async () => {
    renderLogin();
    await waitFor(() => expect(send2FACode).toHaveBeenCalledTimes(1));
    const resend = await screen.findByTestId('twofa-resend');
    expect(resend).toBeDisabled();
    expect(resend.textContent).toMatch(/Отправить снова \(\d+\)/);
  });
});
