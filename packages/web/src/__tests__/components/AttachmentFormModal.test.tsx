// Тесты формы не-файлового вложения (тик. 1795677071).
// Форма одна на опрос/квиз/списки/персонали: проверяем валидацию и данные.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentFormModal } from '../../components/chat/AttachmentFormModal';

function renderForm(type: 'poll' | 'quiz' | 'list_active' | 'list_passive' | 'personali') {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(<AttachmentFormModal open type={type} onClose={onClose} onAdd={onAdd} />);
  return { onAdd, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AttachmentFormModal', () => {
  it('без вопроса показывает ошибку и не добавляет вложение', () => {
    const { onAdd } = renderForm('poll');

    fireEvent.click(screen.getByRole('button', { name: /Добавить в сообщение/ }));

    expect(screen.getByText(/Укажите вопрос/)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('опрос: вопрос + варианты отдаются родителю как PollData', () => {
    const { onAdd } = renderForm('poll');

    fireEvent.change(screen.getByPlaceholderText(/Когда встречаемся/), {
      target: { value: 'Где встречаемся?' },
    });
    const inputs = screen.getAllByPlaceholderText(/Вариант \d/);
    fireEvent.change(inputs[0], { target: { value: 'В парке' } });
    fireEvent.change(inputs[1], { target: { value: 'В кафе' } });
    fireEvent.click(screen.getByRole('button', { name: /Добавить в сообщение/ }));

    expect(onAdd).toHaveBeenCalledWith('poll', {
      question: 'Где встречаемся?',
      options: ['В парке', 'В кафе'],
      multiple: false,
    });
  });

  it('квиз без отмеченного правильного ответа не добавляется', () => {
    const { onAdd } = renderForm('quiz');

    fireEvent.change(screen.getByPlaceholderText(/Когда встречаемся/), {
      target: { value: '2+2?' },
    });
    const inputs = screen.getAllByPlaceholderText(/Вариант \d/);
    fireEvent.change(inputs[0], { target: { value: '3' } });
    fireEvent.change(inputs[1], { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Добавить в сообщение/ }));

    expect(screen.getByText(/Отметьте правильный ответ/)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('квиз с правильным ответом передаёт correctIndex', () => {
    const { onAdd } = renderForm('quiz');

    fireEvent.change(screen.getByPlaceholderText(/Когда встречаемся/), {
      target: { value: '2+2?' },
    });
    const inputs = screen.getAllByPlaceholderText(/Вариант \d/);
    fireEvent.change(inputs[0], { target: { value: '3' } });
    fireEvent.change(inputs[1], { target: { value: '4' } });
    fireEvent.click(screen.getAllByTitle('Правильный ответ')[1]);
    fireEvent.click(screen.getByRole('button', { name: /Добавить в сообщение/ }));

    expect(onAdd).toHaveBeenCalledWith('quiz', {
      question: '2+2?',
      options: ['3', '4'],
      multiple: false,
      correctIndex: 1,
    });
  });

  it('активный список: заголовок + пункты отдаются как ListData', () => {
    const { onAdd } = renderForm('list_active');

    fireEvent.change(screen.getByPlaceholderText(/Что берём с собой/), {
      target: { value: 'Список дел' },
    });
    const inputs = screen.getAllByPlaceholderText(/Пункт \d/);
    fireEvent.change(inputs[0], { target: { value: 'Купить хлеб' } });
    fireEvent.click(screen.getByRole('button', { name: /Добавить в сообщение/ }));

    expect(onAdd).toHaveBeenCalledWith('list_active', {
      title: 'Список дел',
      items: ['Купить хлеб'],
    });
  });
});
