import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../../components/chat/MessageBubble';
import type { MessageWithSender } from '../../store/chatStore';

const baseMessage: MessageWithSender = {
  id: 'msg1',
  chatId: 'chat1',
  senderId: 'user1',
  type: 'text',
  content: 'Hello World',
  editCount: 0,
  deleted: false,
  status: 'sent',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

describe('MessageBubble', () => {
  it('renders text message content', () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders deleted message placeholder', () => {
    const deletedMsg = { ...baseMessage, deleted: true };
    render(<MessageBubble message={deletedMsg} isOwn={false} />);
    expect(screen.getByText('Сообщение удалено')).toBeInTheDocument();
  });

  it('renders system message', () => {
    const systemMsg = { ...baseMessage, type: 'system' as const, content: 'User joined' };
    render(<MessageBubble message={systemMsg} isOwn={false} />);
    expect(screen.getByText('User joined')).toBeInTheDocument();
  });

  it('renders edited indicator', () => {
    const editedMsg = { ...baseMessage, editCount: 1 };
    render(<MessageBubble message={editedMsg} isOwn={false} />);
    expect(screen.getByText('✏ Изменено')).toBeInTheDocument();
  });

  it('renders forwarded tag', () => {
    const forwardedMsg = { ...baseMessage, forwarded: true };
    render(<MessageBubble message={forwardedMsg} isOwn={false} />);
    expect(screen.getByText('↩ Переслано')).toBeInTheDocument();
  });

  it('renders AI tag', () => {
    const aiMsg = { ...baseMessage, ai: true };
    render(<MessageBubble message={aiMsg} isOwn={false} />);
    expect(screen.getByText('🤖 ИИ')).toBeInTheDocument();
  });

  it('renders reactions', () => {
    const msgWithReactions = {
      ...baseMessage,
      reactions: [
        { emoji: '👍', userId: 'user2' },
        { emoji: '👍', userId: 'user3' },
      ],
    };
    render(<MessageBubble message={msgWithReactions} isOwn={false} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders reply preview', () => {
    const msgWithReply = {
      ...baseMessage,
      replyTo: {
        id: 'msg0',
        content: 'Original message',
        sender: { username: 'alice' },
      },
    };
    render(<MessageBubble message={msgWithReply} isOwn={false} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  it('renders read ticks for own messages', () => {
    const ownMsg = { ...baseMessage, status: 'read' as const };
    const { container } = render(<MessageBubble message={ownMsg} isOwn={true} />);
    const ticks = container.querySelector('.msg-ticks');
    expect(ticks).toBeInTheDocument();
  });

  it('does not render read ticks for others messages', () => {
    const { container } = render(<MessageBubble message={baseMessage} isOwn={false} />);
    const ticks = container.querySelector('.msg-ticks');
    expect(ticks).not.toBeInTheDocument();
  });

  it('renders file attachment', () => {
    const fileMsg = {
      ...baseMessage,
      type: 'file' as const,
      content: '',
      attachment: { name: 'document.pdf', size: 1024 },
    };
    render(<MessageBubble message={fileMsg} isOwn={false} />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  // Тик. 1795456886 — вложения приходят массивом `attachments` (сервер:
  // messageService.ts:362-372), а не одиночным `attachment`.
  describe('вложения (массив attachments)', () => {
    it('одиночное изображение рендерится как <img> с url вложения', () => {
      const imgMsg = {
        ...baseMessage,
        type: 'image' as const,
        content: '',
        attachments: [{ id: 'a1', type: 'image', url: 'https://cdn/photo.jpg', name: 'photo.jpg', size: 2048 }],
      };
      const { container } = render(<MessageBubble message={imgMsg} isOwn={false} />);
      const img = container.querySelector('img.message__attachment-image') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe('https://cdn/photo.jpg');
    });

    it('одиночный файл рендерится карточкой с именем и размером', () => {
      const fileMsg = {
        ...baseMessage,
        type: 'file' as const,
        content: '',
        attachments: [{ id: 'a1', type: 'file', url: 'https://cdn/doc.pdf', name: 'doc.pdf', size: 2048 }],
      };
      render(<MessageBubble message={fileMsg} isOwn={false} />);
      expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      expect(screen.getByText('2 КБ')).toBeInTheDocument();
    });

    it('несколько вложений — collapsible-блок «📎 N вложений» (макет chats.html:245)', () => {
      const multi = {
        ...baseMessage,
        type: 'file' as const,
        content: '',
        attachments: [
          { id: 'a1', type: 'image', url: 'https://cdn/1.png', name: '1.png' },
          { id: 'a2', type: 'file', url: 'https://cdn/2.pdf', name: '2.pdf' },
          { id: 'a3', type: 'file', url: 'https://cdn/3.txt', name: '3.txt' },
        ],
      };
      const { container } = render(<MessageBubble message={multi} isOwn={false} />);
      expect(screen.getByText('📎 3 вложений')).toBeInTheDocument();
      expect(container.querySelector('.message__attachments')).toBeInTheDocument();
    });

    it('клик по изображению вызывает onFileView с вложением и индексом', () => {
      const onFileView = vi.fn();
      const imgMsg = {
        ...baseMessage,
        type: 'image' as const,
        content: '',
        attachments: [{ id: 'a1', type: 'image', url: 'https://cdn/photo.jpg', name: 'photo.jpg' }],
      };
      const { container } = render(
        <MessageBubble message={imgMsg} isOwn={false} onFileView={onFileView} />
      );
      fireEvent.click(container.querySelector('img.message__attachment-image')!);
      expect(onFileView).toHaveBeenCalledTimes(1);
      expect(onFileView.mock.calls[0][0]).toMatchObject({ url: 'https://cdn/photo.jpg' });
      expect(onFileView.mock.calls[0][1]).toBe(0);
    });

    it('текстовое вложение показывается иконкой 📝', () => {
      const txtMsg = {
        ...baseMessage,
        type: 'file' as const,
        content: '',
        attachments: [{ id: 'a1', type: 'text', url: 'https://cdn/notes.txt', name: 'notes.txt', size: 4096 }],
      };
      const { container } = render(<MessageBubble message={txtMsg} isOwn={false} />);
      expect(container.querySelector('.message__attachment-file-icon')?.textContent).toBe('📝');
      expect(screen.getByText('notes.txt')).toBeInTheDocument();
    });
  });

  it('renders poll message', () => {
    const pollMsg = {
      ...baseMessage,
      type: 'poll' as const,
      content: JSON.stringify({
        question: 'What?',
        options: [
          { text: 'Yes', votes: 2 },
          { text: 'No', votes: 1 },
        ],
        votes: 3,
        anonymous: false,
      }),
    };
    render(<MessageBubble message={pollMsg} isOwn={false} />);
    // По макету вопрос опроса рендерится с префиксом 📊
    expect(screen.getByText('📊 What?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  /**
   * Регрессия приёмки «два окна» (тик. 1793567633, 15.11.2026).
   *
   * baseMessage.createdAt = 1700000000000 — миллисекеды числом, а реальный
   * API отдаёт СЕКУНДЫ строкой: GET /api/chats/:id/messages →
   *   {"createdAt":"1794768916"}   (BigInt сериализуется строкой в app.ts)
   * new Date("1794768916") → Invalid Date, и в пузыре было видно «Invalid
   * Date» вместо времени. Прежний набор тестов время не проверял вообще,
   * поэтому дефект был зелёным.
   */
  describe('время сообщения в форме реального API', () => {
    it('секунды unix строкой рисуются как ЧЧ:ММ, а не «Invalid Date»', () => {
      const realShape = { ...baseMessage, createdAt: '1794768916' as any };
      render(<MessageBubble message={realShape} isOwn={false} />);

      const expected = new Date(1794768916 * 1000).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const el = screen.getByText(expected);
      expect(el).toBeInTheDocument();
      expect(el.textContent).toMatch(/^\d{2}:\d{2}$/);
      expect(document.body.textContent).not.toContain('Invalid Date');
    });

    it('секунды unix числом тоже дают корректное время', () => {
      const numericSeconds = { ...baseMessage, createdAt: 1794768916 as any };
      render(<MessageBubble message={numericSeconds} isOwn={false} />);

      expect(document.body.textContent).not.toContain('Invalid Date');
      const expected = new Date(1794768916 * 1000).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});
