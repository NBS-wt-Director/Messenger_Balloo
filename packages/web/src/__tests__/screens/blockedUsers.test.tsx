// Тесты экрана «Блокированные пользователи» — тикет 1792124254
// Макет: mockups/balloo-su/blocked-users.html (принят 1.1.13 → 6.37).
// Проверяем: список с реального GET /api/users/me/blocked (без моков в
// компоненте), пустое состояние, разблокировка, блокировка через модалку
// с реальным поиском.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const getBlockedUsers = vi.fn();
const unblockUser = vi.fn();
const blockUser = vi.fn();
const searchUsers = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getBlockedUsers: (...args: unknown[]) => getBlockedUsers(...args),
    unblockUser: (...args: unknown[]) => unblockUser(...args),
    blockUser: (...args: unknown[]) => blockUser(...args),
    searchUsers: (...args: unknown[]) => searchUsers(...args),
  },
}));

import BlockedUsersScreen from '../../screens/settings/BlockedUsersScreen';

const BLOCKED = [
  {
    id: 'u2',
    email: 'maria@balloo.su',
    username: 'maria',
    displayName: 'Мария Андреева',
    avatarUrl: null,
    status: 'active',
    blockedAt: 1783641600, // 10.07.2026
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  unblockUser.mockResolvedValue({ success: true });
  blockUser.mockResolvedValue({ success: true });
  searchUsers.mockResolvedValue([]);
});

describe('BlockedUsersScreen', () => {
  it('рендерит список с API: имя, @username, дата блокировки', async () => {
    getBlockedUsers.mockResolvedValue({ blocked: BLOCKED });
    render(<BlockedUsersScreen />);

    await waitFor(() => expect(screen.getByText('Мария Андреева')).toBeInTheDocument());
    expect(screen.getByText(/@maria/)).toBeInTheDocument();
    expect(screen.getByText(/Заблокирован: 10\.07\.2026/)).toBeInTheDocument();
    expect(getBlockedUsers).toHaveBeenCalled();
  });

  it('пустой ответ API → «Нет заблокированных пользователей»', async () => {
    getBlockedUsers.mockResolvedValue({ blocked: [] });
    render(<BlockedUsersScreen />);

    await waitFor(() =>
      expect(screen.getByText('Нет заблокированных пользователей')).toBeInTheDocument(),
    );
  });

  it('«Разблокировать» вызывает API и убирает строку', async () => {
    getBlockedUsers.mockResolvedValue({ blocked: BLOCKED });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<BlockedUsersScreen />);
    await waitFor(() => expect(screen.getByText('Мария Андреева')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Разблокировать' }));

    await waitFor(() => expect(unblockUser).toHaveBeenCalledWith('u2'));
    await waitFor(() =>
      expect(screen.getByText('Нет заблокированных пользователей')).toBeInTheDocument(),
    );
  });

  it('модалка: поиск через API и блокировка по клику', async () => {
    getBlockedUsers.mockResolvedValue({ blocked: [] });
    searchUsers.mockResolvedValue([{ id: 'u9', username: 'spammer', displayName: 'Спам Spam' }]);
    render(<BlockedUsersScreen />);
    await waitFor(() =>
      expect(screen.getByText('Нет заблокированных пользователей')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: /Заблокировать/ }));
    fireEvent.change(screen.getByPlaceholderText(/Поиск по имени/), {
      target: { value: 'spam' },
    });

    await waitFor(() => expect(searchUsers).toHaveBeenCalledWith('spam'));
    await waitFor(() => expect(screen.getByText('Спам Spam')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Спам Spam'));

    await waitFor(() => expect(blockUser).toHaveBeenCalledWith('u9'));
    await waitFor(() => expect(getBlockedUsers).toHaveBeenCalledTimes(2));
  });

  it('ошибка API → сообщение с кнопкой повтора, без моков-строк', async () => {
    getBlockedUsers.mockRejectedValue(new Error('сервер недоступен'));
    render(<BlockedUsersScreen />);

    await waitFor(() => expect(screen.getByText(/сервер недоступен/)).toBeInTheDocument());
    expect(screen.queryByText('Блокированный пользователь 1')).not.toBeInTheDocument();
  });
});
