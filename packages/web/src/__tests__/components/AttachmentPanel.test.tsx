// Тесты панели вложений — тикет 1792124253
// Макет: mockups/balloo-su/attachment-panel.html (принят 1.1.12 → 6.36).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const uploadFile = vi.fn();
const sendMessage = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    uploadFile: (...args: unknown[]) => uploadFile(...args),
    sendMessage: (...args: unknown[]) => sendMessage(...args),
  },
}));

import { AttachmentPanel } from '../../components/chat/AttachmentPanel';

function renderPanel(overrides: Partial<React.ComponentProps<typeof AttachmentPanel>> = {}) {
  const props = {
    open: true,
    chatId: 'chat-1',
    onClose: vi.fn(),
    onSent: vi.fn(),
    ...overrides,
  };
  render(<AttachmentPanel {...props} />);
  return props;
}

function makeFile(name = 'macos.png', type = 'image/png', size = 245760): File {
  return new File([new Uint8Array(size)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadFile.mockResolvedValue({ success: true, data: { url: 'https://cdn/macos.png', name: 'macos.png', size: 245760 } });
  sendMessage.mockResolvedValue({ id: 'm1' });
});

describe('AttachmentPanel', () => {
  it('открытая панель показывает заголовок и drop-зону', () => {
    renderPanel();
    expect(screen.getByText('📎 Вложения')).toBeInTheDocument();
    expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    expect(screen.getByText('Перетащите файлы сюда')).toBeInTheDocument();
  });

  it('выбор файла показывает footer с чипом; клик по чипу убирает файл', async () => {
    renderPanel();
    const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());
    const chip = screen.getByText(/macos\.png/);
    fireEvent.click(chip);
    await waitFor(() => expect(screen.queryByText('📎 Выбрано: 1')).not.toBeInTheDocument());
  });

  it('drop добавляет файлы в выбор', async () => {
    renderPanel();
    const zone = screen.getByTestId('drop-zone');
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile('spec.pdf', 'application/pdf')] } });

    await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());
    expect(screen.getByText(/spec\.pdf/)).toBeInTheDocument();
  });

  it('«Очистить» сбрасывает выбор', async () => {
    renderPanel();
    const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });
    await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Очистить' }));
    await waitFor(() => expect(screen.queryByText('📎 Выбрано: 1')).not.toBeInTheDocument());
  });

  it('«Отправить»: upload с chatId затем sendMessage с attachments, onSent+onClose', async () => {
    const props = renderPanel();
    const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
    const file = makeFile();
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Отправить/ }));

    await waitFor(() => expect(uploadFile).toHaveBeenCalledWith(file, 'chat-1'));
    // Тип сообщения определяется по вложению (тик. 1795456886): image/png → 'image'
    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith('chat-1', {
        type: 'image',
        content: '',
        attachments: [
          {
            type: 'image',
            url: 'https://cdn/macos.png',
            thumbnail: undefined,
            size: 245760,
            name: 'macos.png',
            width: undefined,
            height: undefined,
            duration: undefined,
          },
        ],
      }),
    );
    await waitFor(() => expect(props.onSent).toHaveBeenCalled());
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
  });

  it('текстовое вложение (.txt) отправляется как message type=file, attachment type=text', async () => {
    renderPanel();
    uploadFile.mockResolvedValue({
      success: true,
      data: { url: 'https://cdn/notes.txt', name: 'notes.txt', size: 4096 },
    });
    const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('notes.txt', 'text/plain', 4096)] } });
    await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Отправить/ }));

    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith(
        'chat-1',
        expect.objectContaining({
          type: 'file',
          attachments: [expect.objectContaining({ type: 'text', name: 'notes.txt' })],
        })
      )
    );
  });

  it('ошибка загрузки показывает сообщение и не шлёт сообщение', async () => {
    uploadFile.mockRejectedValue(new Error('недопустимый тип файла'));
    renderPanel();
    const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('x.exe', 'application/x-msdownload')] } });
    await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Отправить/ }));

    await waitFor(() => expect(screen.getByText(/недопустимый тип файла/)).toBeInTheDocument());
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('Esc закрывает панель', () => {
    const props = renderPanel();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('✕ закрывает панель', () => {
    const props = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(props.onClose).toHaveBeenCalled();
  });

  // Тикет 1795677071: единый массив вложений + не-файловые формы.
  describe('не-файловые вложения (1795677071)', () => {
    it('кнопка «Опрос» вызывает onNonFileAction("poll")', () => {
      const onNonFileAction = vi.fn();
      renderPanel({ onNonFileAction });
      fireEvent.click(screen.getByText('Опрос'));
      expect(onNonFileAction).toHaveBeenCalledWith('poll');
    });

    it('входящее вложение из формы попадает в выбор и сбрасывается через onIncomingConsumed', async () => {
      const onIncomingConsumed = vi.fn();
      const incomingNonFile = {
        kind: 'non-file' as const,
        id: 'nf1',
        type: 'poll' as const,
        data: { question: 'Вопрос?', options: ['Да', 'Нет'], multiple: false },
      };
      renderPanel({ incomingNonFile, onIncomingConsumed });
      await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());
      expect(screen.getAllByText(/Опрос/).length).toBeGreaterThan(0);
      expect(onIncomingConsumed).toHaveBeenCalled();
    });

    it('отправка не-файлового вложения: url пустой, data в attachments, тип сообщения poll', async () => {
      const incomingNonFile = {
        kind: 'non-file' as const,
        id: 'nf1',
        type: 'poll' as const,
        data: { question: 'Вопрос?', options: ['Да', 'Нет'], multiple: false },
      };
      renderPanel({ incomingNonFile, onIncomingConsumed: vi.fn() });
      await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Отправить/ }));

      await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
      const [, payload] = sendMessage.mock.calls[0];
      expect(payload.type).toBe('poll');
      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments[0]).toMatchObject({
        type: 'poll',
        url: '',
        data: { question: 'Вопрос?', options: ['Да', 'Нет'], multiple: false },
      });
    });

    it('файл + опрос в одном сообщении: оба вложения уходят, тип задаёт не-файловое', async () => {
      const incomingNonFile = {
        kind: 'non-file' as const,
        id: 'nf1',
        type: 'quiz' as const,
        data: { question: '2+2?', options: ['3', '4'], multiple: false, correctIndex: 1 },
      };
      renderPanel({ incomingNonFile, onIncomingConsumed: vi.fn() });
      await waitFor(() => expect(screen.getByText('📎 Выбрано: 1')).toBeInTheDocument());

      const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile('pic.png', 'image/png')] } });
      await waitFor(() => expect(screen.getByText('📎 Выбрано: 2')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Отправить/ }));

      await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
      const [, payload] = sendMessage.mock.calls[0];
      expect(payload.type).toBe('quiz');
      expect(payload.attachments).toHaveLength(2);
      expect(payload.attachments[0].type).toBe('image');
      expect(payload.attachments[1].type).toBe('quiz');
    });

    it('свыше 15 вложений показывает предупреждение о платности', async () => {
      renderPanel();
      const input = document.querySelector('input[type=file][multiple]') as HTMLInputElement;
      const files = Array.from({ length: 16 }, (_, i) => makeFile(`f${i}.png`, 'image/png', 10));
      fireEvent.change(input, { target: { files } });
      await waitFor(() => expect(screen.getByText('📎 Выбрано: 16')).toBeInTheDocument());
      expect(screen.getByText(/Сообщение будет платным: 21 баллов/)).toBeInTheDocument();
    });
  });
});
