import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../components/chat/MessageInput';
import { ReplyPreview } from '../../components/chat/ReplyPreview';

describe('MessageInput (сценарий чата)', () => {
  const onSend = vi.fn();

  beforeEach(() => {
    onSend.mockClear();
  });

  it('renders textarea with placeholder', () => {
    render(<MessageInput onSend={onSend} />);
    expect(screen.getByPlaceholderText(/напишите сообщение/i)).toBeInTheDocument();
  });

  it('sends text message on Enter', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.change(textarea, { target: { value: 'Привет, мир!' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Привет, мир!', 'text');
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('does not send empty message', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only message', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send on Shift+Enter (newline)', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.change(textarea, { target: { value: 'line1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('trims whitespace before sending', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.change(textarea, { target: { value: '  hello  ' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('hello', 'text');
  });

  it('sends slash command with type=slash', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.change(textarea, { target: { value: '/poll_Вопрос;Да;Нет' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('/poll_Вопрос;Да;Нет', 'slash');
  });

  it('unknown slash command sent as plain text', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    fireEvent.change(textarea, { target: { value: '/unknown_cmd' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('/unknown_cmd', 'text');
  });

  it('emoji picker opens and inserts emoji', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    // Открыть панель эмодзи (кнопка 😊)
    fireEvent.click(screen.getByTitle('Эмодзи'));
    // Выбрать эмодзи 👍
    fireEvent.click(screen.getByText('👍'));

    expect((textarea as HTMLTextAreaElement).value).toBe('👍');
  });

  it('renders mockup slash-hint items (input-hint)', () => {
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/напишите сообщение/i);

    // Печать "/" открывает slash-подсказки (как в макете: input-hint)
    fireEvent.change(textarea, { target: { value: '/' } });

    // Hint-элементы: <code>/poll_</code> — текст описания
    expect(screen.getByText('/poll_')).toBeInTheDocument();
    expect(screen.getByText('/quiz_')).toBeInTheDocument();
    expect(screen.getByText('/list_active_')).toBeInTheDocument();
    expect(screen.getByText('/list_passive_')).toBeInTheDocument();
    expect(screen.getByText('/personali_')).toBeInTheDocument();
  });
});

// P34: reply-панель вынесена в ReplyPreview (по макету — A1.2 над полем ввода)
describe('ReplyPreview (панель ответа)', () => {
  it('renders author and content preview', () => {
    render(
      <ReplyPreview
        message={{ id: 'm1', author: 'Alice', content: 'Сообщение Alice' }}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Сообщение Alice')).toBeInTheDocument();
  });

  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    render(
      <ReplyPreview
        message={{ id: 'm1', author: 'Alice', content: 'msg' }}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('✕'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});