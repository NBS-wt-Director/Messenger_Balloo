// Тесты экрана «Архив чатов» (/archive) — тикет 1792124251
// Макет: mockups/balloo-su/archive.html (принят 1.1.11 → 6.35).
// Ключевое условие приёмки владельца: список показывается если чаты есть,
// empty state — если нет; одновременно два блока не отображаются.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getArchived = vi.fn();
const restoreArchivedChat = vi.fn();
const deleteArchivedChat = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getArchived: (...args: unknown[]) => getArchived(...args),
    restoreArchivedChat: (...args: unknown[]) => restoreArchivedChat(...args),
    deleteArchivedChat: (...args: unknown[]) => deleteArchivedChat(...args),
  },
}));

import ArchiveScreen from '../../screens/chat/ArchiveScreen';

const CHATS = [
  {
    id: 'c1',
    name: 'Старый проект',
    lastMessage: '',
    lastMessageTime: 1783641600, // 10.07.2026 00:00 UTC
    unreadCount: 0,
  },
  {
    id: 'c2',
    name: 'Виктор Петров',
    lastMessage: '',
    lastMessageTime: 1783209600, // 05.07.2026 00:00 UTC
    unreadCount: 2,
  },
];

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/archive']}>
      <ArchiveScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  restoreArchivedChat.mockResolvedValue({ message: 'Чат восстановлен' });
  deleteArchivedChat.mockResolvedValue({ message: 'Чат удалён' });
});

describe('ArchiveScreen', () => {
  it('при непустом ответе API показывает список и НЕ показывает empty state', async () => {
    getArchived.mockResolvedValue({ chats: CHATS });
    renderScreen();

    await waitFor(() => expect(screen.getByText('Старый проект')).toBeInTheDocument());
    expect(screen.getByText('Виктор Петров')).toBeInTheDocument();
    expect(screen.getByText('Архивирован 10.07.2026')).toBeInTheDocument();
    expect(screen.queryByText('Нет архивированных чатов')).not.toBeInTheDocument();
  });

  it('при пустом ответе API показывает только empty state', async () => {
    getArchived.mockResolvedValue({ chats: [] });
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('Нет архивированных чатов')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Архивируйте чат через меню ⋮ → «В архив»'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Старый проект')).not.toBeInTheDocument();
  });

  it('«Восстановить» вызывает API и убирает чат из списка', async () => {
    getArchived.mockResolvedValue({ chats: CHATS });
    renderScreen();
    await waitFor(() => expect(screen.getByText('Старый проект')).toBeInTheDocument());

    fireEvent.click(screen.getAllByText('↩ Восстановить')[0]);

    await waitFor(() => expect(restoreArchivedChat).toHaveBeenCalledWith('c1'));
    await waitFor(() => expect(screen.queryByText('Старый проект')).not.toBeInTheDocument());
    expect(screen.getByText('Виктор Петров')).toBeInTheDocument();
  });

  it('после удаления последнего чата список сменяется empty state', async () => {
    getArchived.mockResolvedValue({ chats: [CHATS[0]] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Старый проект')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Удалить чат Старый проект'));

    await waitFor(() => expect(deleteArchivedChat).toHaveBeenCalledWith('c1'));
    await waitFor(() =>
      expect(screen.getByText('Нет архивированных чатов')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Старый проект')).not.toBeInTheDocument();
  });

  it('при ошибке загрузки показывает сообщение и не показывает ни список, ни empty state', async () => {
    getArchived.mockRejectedValue(new Error('network'));
    renderScreen();

    await waitFor(() => expect(screen.getByText(/Не удалось загрузить архив/)).toBeInTheDocument());
    expect(screen.queryByText('Нет архивированных чатов')).not.toBeInTheDocument();
  });
});
