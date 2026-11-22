// Клик по контакту = создание/открытие личного чата (тик. 1795369072).
// Раньше вызывался onNewChat → navigate('/chat') = no-op, контакт без id.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const getMock = vi.fn();
const createDirectMock = vi.fn();
vi.mock('../../services/api', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    createDirectChat: (...args: unknown[]) => createDirectMock(...args),
  },
}));

import { EmptyChatState } from '../../components/chat/EmptyChatState';
import { useChatStore } from '../../store/chatStore';

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/chat']}>
      <Routes>
        <Route path="/chat" element={<EmptyChatState />} />
        <Route path="/chat/:chatId" element={<div data-testid="chat-open">чат открыт</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EmptyChatState — клик по контакту открывает личный чат', () => {
  beforeEach(() => {
    useChatStore.setState({ chats: [], activeChatId: null, activeChat: null });
    getMock.mockReset();
    createDirectMock.mockReset();
  });

  it('создаёт direct-чат, кладёт его в store и уходит на /chat/:id', async () => {
    getMock.mockResolvedValue([
      { id: 'u1', username: 'vasya', displayName: 'Вася', avatarUrl: null },
    ]);
    createDirectMock.mockResolvedValue({ id: 'c1', type: 'direct', name: '', peer: null });

    renderWithRoute();

    const contact = await screen.findByText('Вася');
    fireEvent.click(contact);

    await waitFor(() => expect(createDirectMock).toHaveBeenCalledWith('u1'));
    await waitFor(() => expect(screen.getByTestId('chat-open')).toBeInTheDocument());
    expect(useChatStore.getState().chats.some((c) => c.id === 'c1')).toBe(true);
    expect(useChatStore.getState().activeChatId).toBe('c1');
  });
});
