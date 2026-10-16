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
    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith('chat-1', {
        type: 'file',
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
});
