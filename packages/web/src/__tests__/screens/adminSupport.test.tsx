// Тесты раздела «Поддержка» в админ-дашборде (ответ В-33, тикет 1790572800-01)
// API: GET /api/admin/support/tickets[…], POST …/:id/reply

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getSupportTickets = vi.fn();
const getSupportTicket = vi.fn();
const replySupportTicket = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getSupportTickets: (...a: unknown[]) => getSupportTickets(...a),
    getSupportTicket: (...a: unknown[]) => getSupportTicket(...a),
    replySupportTicket: (...a: unknown[]) => replySupportTicket(...a),
  },
}));

import { AdminSupportScreen } from '../../screens/admin/AdminSupportScreen';

const TICKETS = {
  total: 2,
  page: 1,
  limit: 20,
  tickets: [
    {
      id: 't1',
      subject: 'Обращение в поддержку',
      status: 'open',
      priority: 'high',
      createdAt: 1750000000,
      updatedAt: 1750000300,
      messagesCount: 2,
      user: { id: 'u1', username: 'edb', displayName: 'Тест Тестов', email: 'edb@balloo.su' },
    },
    {
      id: 't2',
      subject: 'Обращение в поддержку',
      status: 'resolved',
      priority: 'normal',
      createdAt: 1750000000,
      updatedAt: 1750000100,
      messagesCount: 4,
      user: { id: 'u2', username: 'maria', displayName: 'Мария', email: null },
    },
  ],
};

const DETAIL = {
  id: 't1',
  subject: 'Обращение в поддержку',
  status: 'open',
  priority: 'high',
  user: { id: 'u1', username: 'edb', displayName: 'Тест Тестов', email: 'edb@balloo.su' },
  messages: [
    { id: 'm1', text: 'Здравствуйте! Опишите вашу проблему.', authorId: 'bot', isInternal: false, createdAt: 1750000000 },
    { id: 'm2', text: 'Не могу подключить Яндекс Диск', authorId: 'u1', isInternal: false, createdAt: 1750000300 },
  ],
};

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/admin/support']}>
      <AdminSupportScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getSupportTickets.mockResolvedValue(TICKETS);
  getSupportTicket.mockResolvedValue(DETAIL);
  replySupportTicket.mockResolvedValue({ id: 'm3', text: 'Ответ', authorId: 'admin', isInternal: false, createdAt: 1750000600 });
});

describe('AdminSupportScreen', () => {
  it('рендерит список тикетов с пользователем, статусом и приоритетом', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText('Тест Тестов')).toBeTruthy());
    expect(screen.getByText('Мария')).toBeTruthy();
    expect(screen.getByText('Открыт')).toBeTruthy();
    expect(screen.getByText('Решён')).toBeTruthy();
    expect(screen.getByText('Повышенный')).toBeTruthy();
  });

  it('фильтр по статусу уходит в API', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Тест Тестов')).toBeTruthy());

    fireEvent.click(screen.getByText('В работе'));
    await waitFor(() => {
      expect(getSupportTickets).toHaveBeenLastCalledWith({ status: 'in_progress' });
    });
  });

  it('клик по тикету открывает переписку', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Тест Тестов')).toBeTruthy());

    fireEvent.click(screen.getByText('Тест Тестов'));
    await waitFor(() => {
      expect(screen.getByText('Не могу подключить Яндекс Диск')).toBeTruthy();
    });
    expect(getSupportTicket).toHaveBeenCalledWith('t1');
  });

  it('админ отвечает в тикете', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Тест Тестов')).toBeTruthy());
    fireEvent.click(screen.getByText('Тест Тестов'));
    await waitFor(() => expect(screen.getByText('Не могу подключить Яндекс Диск')).toBeTruthy());

    const field = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'Попробуйте перепривязать аккаунт' } });
    fireEvent.click(screen.getByText('Отправить'));

    await waitFor(() => {
      expect(replySupportTicket).toHaveBeenCalledWith('t1', 'Попробуйте перепривязать аккаунт', false);
    });
  });

  it('внутренняя заметка передаётся флагом isInternal', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Тест Тестов')).toBeTruthy());
    fireEvent.click(screen.getByText('Тест Тестов'));
    await waitFor(() => expect(screen.getByText('Не могу подключить Яндекс Диск')).toBeTruthy());

    fireEvent.click(screen.getByLabelText('Внутренняя заметка'));
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'Проверить логи' },
    });
    fireEvent.click(screen.getByText('Отправить'));

    await waitFor(() => {
      expect(replySupportTicket).toHaveBeenCalledWith('t1', 'Проверить логи', true);
    });
  });

  it('ошибка загрузки показывается текстом', async () => {
    getSupportTickets.mockRejectedValueOnce(new Error('network'));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить тикеты поддержки')).toBeTruthy();
    });
  });
});
