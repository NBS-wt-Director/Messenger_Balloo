// Тесты экрана чата с поддержкой (/support) — тикет 1790572800-01
// ТЗ: mockups/balloo-su/support.md; макет mockups/balloo-su/support.html
//
// Проверяем: заголовок «Чат с поддержкой», хедер поддержки (🦊, «Техподдержка
// Balloo», онлайн + среднее время ответа, chip приоритета), рендер сообщений
// (автоответ с тегом «⚙ Автоответ», свои сообщения с ✓✓), отправку сообщения
// и отсутствие сырых ключей перевода.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@balloo/ui';

const getSupportChat = vi.fn();
const sendSupportMessage = vi.fn();
const getSupportStatus = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getSupportChat: (...args: unknown[]) => getSupportChat(...args),
    sendSupportMessage: (...args: unknown[]) => sendSupportMessage(...args),
    getSupportStatus: (...args: unknown[]) => getSupportStatus(...args),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: any) => unknown) =>
    selector({ isAuthenticated: true, user: { id: 'u1', username: 'edb', displayName: 'Тест Тестов' } }),
}));

import { SupportScreen } from '../../screens/support/SupportScreen';

const CHAT = {
  ticket: { id: 't1', subject: 'Обращение в поддержку', status: 'open', priority: 'high', createdAt: 1 },
  messages: [
    { id: 'm1', text: 'Здравствуйте! Опишите вашу проблему.', authorId: 'bot', isBot: true, createdAt: 1750000000 },
    { id: 'm2', text: 'Не могу подключить Яндекс Диск', authorId: 'u1', isBot: false, createdAt: 1750000300 },
  ],
  created: false,
};

function renderScreen() {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={['/support']}>
        <SupportScreen />
      </MemoryRouter>
    </I18nProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getSupportChat.mockResolvedValue(CHAT);
  getSupportStatus.mockResolvedValue({ online: true, avgResponseMinutes: 5 });
  sendSupportMessage.mockResolvedValue({
    id: 'm3',
    text: 'Ещё вопрос',
    authorId: 'u1',
    isBot: false,
    createdAt: 1750000600,
  });
});

describe('SupportScreen', () => {
  it('рендерит заголовок, хедер поддержки и статус', async () => {
    const { container } = renderScreen();

    expect(screen.getByText('Чат с поддержкой')).toBeTruthy();
    expect(screen.getByText('Техподдержка Balloo')).toBeTruthy();
    expect(container.querySelector('.avatar--ctx-new')?.textContent).toContain('🦊');

    await waitFor(() => {
      expect(container.textContent).toContain('Среднее время ответа: 5 мин');
    });
  });

  it('показывает приоритет тикета из ответа сервера', async () => {
    const { container } = renderScreen();
    await waitFor(() => {
      expect(container.textContent).toContain('Приоритет: Повышенный');
    });
  });

  it('рендерит автоответ с тегом «⚙ Автоответ» и своё сообщение с ✓✓', async () => {
    const { container } = renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Здравствуйте! Опишите вашу проблему.')).toBeTruthy();
    });
    expect(screen.getByText('Не могу подключить Яндекс Диск')).toBeTruthy();
    expect(screen.getByText('⚙ Автоответ')).toBeTruthy();
    expect(container.querySelector('.msg-ticks')).toBeTruthy();
  });

  it('отправляет сообщение и добавляет его в ленту', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Здравствуйте! Опишите вашу проблему.')).toBeTruthy());

    const field = container.querySelector('.input-area__field') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'Ещё вопрос' } });
    fireEvent.click(container.querySelector('.input-area__btn--send') as HTMLElement);

    await waitFor(() => {
      expect(sendSupportMessage).toHaveBeenCalledWith('Ещё вопрос');
      expect(screen.getByText('Ещё вопрос')).toBeTruthy();
    });
  });

  it('Enter отправляет, пустое поле — нет', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Здравствуйте! Опишите вашу проблему.')).toBeTruthy());

    const field = container.querySelector('.input-area__field') as HTMLTextAreaElement;
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(sendSupportMessage).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: 'Текст' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledWith('Текст'));
  });

  it('нет сырых ключей перевода в разметке', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Здравствуйте! Опишите вашу проблему.')).toBeTruthy());

    const raw = (container.textContent || '').match(/\b[a-z]+\.[a-zA-Z]+\b/g) ?? [];
    expect(raw).toEqual([]);
  });

  it('ошибка загрузки показывается, а не пустой экран', async () => {
    getSupportChat.mockRejectedValueOnce(new Error('network'));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить чат поддержки')).toBeTruthy();
    });
  });
});
