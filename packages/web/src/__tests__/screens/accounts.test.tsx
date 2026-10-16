// Тесты экрана «Аккаунты» (/accounts) — тикет 1792124252
// Макет: mockups/balloo-su/accounts.html (принят 1.1.9 → 6.33).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getAccounts = vi.fn();
const switchAccount = vi.fn();
const unlinkAccount = vi.fn();
const setAccountNotifications = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getAccounts: (...args: unknown[]) => getAccounts(...args),
    switchAccount: (...args: unknown[]) => switchAccount(...args),
    unlinkAccount: (...args: unknown[]) => unlinkAccount(...args),
    setAccountNotifications: (...args: unknown[]) => setAccountNotifications(...args),
  },
}));

const setUser = vi.fn();
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: any) => unknown) =>
    selector({
      user: { id: 'u1', email: 'ivan@balloo.su', username: 'ivan', displayName: 'Иван Иванов', status: 'active', language: 'ru', theme: 'dark', isAdmin: false, isTwoFAEnabled: false },
      setUser: (...args: unknown[]) => setUser(...args),
    }),
}));

import AccountsScreen from '../../screens/profile/AccountsScreen';

const ACCOUNTS = [
  {
    userId: 'u1',
    displayName: 'Иван Иванов',
    email: 'ivan@balloo.su',
    username: 'ivan',
    avatarUrl: null,
    isActive: true,
    pushEnabled: true,
    connectedAt: 1783641600,
    chatsCount: 24,
    unreadCount: 12,
    accountStatus: 'active',
  },
  {
    userId: 'u2',
    displayName: 'Мария Андреева',
    email: 'maria@balloo.su',
    username: 'maria',
    avatarUrl: null,
    isActive: false,
    pushEnabled: true,
    connectedAt: 1783641600,
    chatsCount: 8,
    unreadCount: 3,
    accountStatus: 'active',
  },
];

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/accounts']}>
      <AccountsScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  switchAccount.mockResolvedValue({
    message: 'Аккаунт переключён',
    user: { id: 'u2', email: 'maria@balloo.su', username: 'maria', displayName: 'Мария Андреева', avatarUrl: null, role: 'user' },
  });
  unlinkAccount.mockResolvedValue({ message: 'Аккаунт отключён от устройства' });
  setAccountNotifications.mockResolvedValue({ pushEnabled: false });
});

describe('AccountsScreen', () => {
  it('рендерит чипы, статистику и карточки по данным API', async () => {
    getAccounts.mockResolvedValue({ accounts: ACCOUNTS });
    renderScreen();

    await waitFor(() => expect(screen.getByText('Иван Иванов (активный)')).toBeInTheDocument());
    expect(screen.getAllByText('Мария Андреева').length).toBeGreaterThan(0);
    // статистика: всего 2, уведомлений включено 2, активный — Иван
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);
    // у активного нет кнопки «Переключить», у другого есть
    expect(screen.getAllByRole('button', { name: 'Переключить' })).toHaveLength(1);
  });

  it('«Переключить» вызывает API и обновляет сессию', async () => {
    getAccounts.mockResolvedValue({ accounts: ACCOUNTS });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderScreen();
    await waitFor(() => expect(screen.getAllByText('Мария Андреева').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: 'Переключить' }));

    await waitFor(() => expect(switchAccount).toHaveBeenCalledWith('u2'));
    await waitFor(() => expect(setUser).toHaveBeenCalled());
    const arg = setUser.mock.calls[0][0];
    expect(arg.id).toBe('u2');
    expect(arg.isAdmin).toBe(false);
  });

  it('🔔 вызывает PATCH уведомлений и меняет иконку', async () => {
    getAccounts.mockResolvedValue({ accounts: ACCOUNTS });
    renderScreen();
    await waitFor(() => expect(screen.getAllByText('Мария Андреева').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByLabelText('Выключить уведомления Мария Андреева'));

    await waitFor(() => expect(setAccountNotifications).toHaveBeenCalledWith('u2', false));
    await waitFor(() =>
      expect(screen.getByLabelText('Включить уведомления Мария Андреева')).toBeInTheDocument(),
    );
  });

  it('«Отключить» убирает карточку неактивного аккаунта', async () => {
    getAccounts.mockResolvedValue({ accounts: ACCOUNTS });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderScreen();
    await waitFor(() => expect(screen.getAllByText('Мария Андреева').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: 'Отключить' }));

    await waitFor(() => expect(unlinkAccount).toHaveBeenCalledWith('u2'));
    await waitFor(() => expect(screen.queryAllByText('Мария Андреева')).toHaveLength(0));
  });

  it('при ошибке API показывает сообщение и не рисует карточки', async () => {
    getAccounts.mockRejectedValue(new Error('boom'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
    expect(screen.queryByText('Быстрое переключение')).not.toBeInTheDocument();
  });
});
