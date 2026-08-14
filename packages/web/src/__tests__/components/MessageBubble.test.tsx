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
    expect(screen.getByText('(изм.)')).toBeInTheDocument();
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
    expect(screen.getByText('What?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });
});
