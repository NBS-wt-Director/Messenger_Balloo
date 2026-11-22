// Регрессия 22.11.2026 (тик. 1795362308): прод падал в ErrorBoundary на
// #/chat, потому что GET /api/users/contacts отдаёт displayName: null
// (Prisma: displayName String?, username String?), а EmptyChatState вызывал
// contact.displayName.split(' ') напрямую.
//
// Contact-объекты с null-полями теперь рендерятся через displayNameOf/initialsOf
// и не должны бросать TypeError.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getMock = vi.fn();
vi.mock('../../services/api', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import { EmptyChatState } from '../../components/chat/EmptyChatState';
import { useChatStore } from '../../store/chatStore';

describe('EmptyChatState — контакт с null displayName', () => {
  beforeEach(() => {
    useChatStore.setState({ chats: [] });
    getMock.mockReset();
  });

  it('рендерит контакт без имени, не падая (displayName=null, username есть)', async () => {
    getMock.mockResolvedValue([
      { id: 'u1', username: 'vasya', displayName: null, avatarUrl: null, status: 'online' },
    ]);

    render(
      <MemoryRouter>
        <EmptyChatState />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('vasya')).toBeInTheDocument());
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('рендерит «Пользователь»/«??», если displayName и username null', async () => {
    getMock.mockResolvedValue([
      { id: 'u2', username: null, displayName: null, avatarUrl: null },
    ]);

    render(
      <MemoryRouter>
        <EmptyChatState />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Пользователь')).toBeInTheDocument());
    expect(screen.getByText('П')).toBeInTheDocument();
  });

  it('обычное имя даёт инициалы из двух слов', async () => {
    getMock.mockResolvedValue([
      { id: 'u3', username: 'ivan', displayName: 'Иван Петров', avatarUrl: null },
    ]);

    render(
      <MemoryRouter>
        <EmptyChatState />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Иван Петров')).toBeInTheDocument());
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });
});
