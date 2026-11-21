// Регрессия (21.11.2026): путь ЗАГРУЗКИ списка чатов.
//
// Существующий ChatList.test.tsx предзаполняет store (chats.length > 0),
// поэтому эффект загрузки выходит раньше и не выполняется — баг не ловился.
//
// GET /api/chats отдаёт { chats, pagination }, а НЕ массив
// (routes/chats.ts → chatController.getChats → chatService.getChats).
// Раньше ChatList вызывал .map на объекте → TypeError → список всегда пуст.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getChatsMock = vi.fn();
vi.mock('../../services/api', () => ({
  api: {
    getChats: (...args: unknown[]) => getChatsMock(...args),
  },
}));

import { ChatList } from '../../components/chat/ChatList';
import { useChatStore } from '../../store/chatStore';

function renderChatList() {
  return render(
    <MemoryRouter>
      <ChatList />
    </MemoryRouter>
  );
}

describe('ChatList — загрузка списка (формат ответа /api/chats)', () => {
  beforeEach(() => {
    // Пустой store → эффект загрузки действительно выполняется
    useChatStore.setState({ chats: [], activeChatId: null, activeChat: null });
    getChatsMock.mockReset();
  });

  it('разворачивает ответ { chats } и рендерит чаты', async () => {
    getChatsMock.mockResolvedValue({
      chats: [
        { id: 'c1', name: 'Рабочая группа', type: 'group' },
        { id: 'c2', name: 'Балу — новости и информация', type: 'channel' },
      ],
      pagination: { page: 1, limit: 50, total: 2 },
    });

    renderChatList();

    await waitFor(() => expect(screen.getByText('Рабочая группа')).toBeInTheDocument());
    expect(screen.getByText('Балу — новости и информация')).toBeInTheDocument();
    expect(getChatsMock).toHaveBeenCalled();
  });

  it('на пустом ответе показывает «Нет чатов» и не падает', async () => {
    getChatsMock.mockResolvedValue({ chats: [], pagination: {} });

    renderChatList();

    await waitFor(() => expect(screen.getByText('Нет чатов')).toBeInTheDocument());
  });
});
