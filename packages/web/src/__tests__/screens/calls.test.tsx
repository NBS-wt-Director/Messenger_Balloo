// Тесты экрана «Звонки» (/calls) — тикет 1792137287
// Макет: mockups/balloo-su/calls.html (принят 1.1.14 → 6.38).
// Ключевое требование: статусы — только цветопиктограммы (✓/✕), без текста «Принят»/«Пропущен» в чипах.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getCallHistory = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    getCallHistory: (...args: unknown[]) => getCallHistory(...args),
    get: (...args: unknown[]) => getCallHistory(...args),
  },
}));

import CallsScreen from '../../screens/calls/CallsScreen';

const CALLS = [
  {
    id: 'c1',
    chatName: 'Мария Андреева',
    chatAvatar: null,
    chatInitials: 'МА',
    type: 'video',
    direction: 'incoming',
    status: 'accepted',
    duration: '0:45:23',
    startTime: '12:30',
    date: '',
  },
  {
    id: 'c2',
    chatName: 'Ольга Смирнова',
    chatAvatar: null,
    chatInitials: 'ОС',
    type: 'video',
    direction: 'missed',
    status: 'missed',
    duration: '0:00:30',
    startTime: '15.07',
    date: '',
  },
];

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/calls']}>
      <CallsScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CallsScreen', () => {
  it('показывает заголовок и подзаголовок', async () => {
    getCallHistory.mockResolvedValue(CALLS);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Звонки')).toBeInTheDocument());
    expect(screen.getByText('История всех звонков')).toBeInTheDocument();
  });

  it('показывает список звонков с данными из API', async () => {
    getCallHistory.mockResolvedValue(CALLS);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Мария Андреева')).toBeInTheDocument());
    expect(screen.getByText('Ольга Смирнова')).toBeInTheDocument();
  });

  it('показывает цветопиктограмму ✓ для принятых звонков', async () => {
    getCallHistory.mockResolvedValue(CALLS);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Мария Андреева')).toBeInTheDocument());

    // Ищем элемент с символом ✓ внутри span с border-radius 50% (круглая пиктограмма)
    const allSpans = document.querySelectorAll('span[title="Принятый"]');
    expect(allSpans.length).toBeGreaterThanOrEqual(1);
    const checkSpan = allSpans[0];
    expect(checkSpan.textContent).toBe('✓');
  });

  it('показывает цветопиктограмму ✕ для пропущенных звонков', async () => {
    getCallHistory.mockResolvedValue(CALLS);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Ольга Смирнова')).toBeInTheDocument());

    // Ищем элемент с символом ✕ внутри span с title="Пропущенный"
    const allSpans = document.querySelectorAll('span[title="Пропущенный"]');
    expect(allSpans.length).toBeGreaterThanOrEqual(1);
    const xSpan = allSpans[0];
    expect(xSpan.textContent).toBe('✕');
  });

  it('НЕ показывает текст «Принят»/«Пропущен» как отдельный чип — только в подстроке', async () => {
    getCallHistory.mockResolvedValue(CALLS);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Мария Андреева')).toBeInTheDocument());

    // Подстрока содержит «Принятый» — это нормально.
    // Но НЕ должно быть отдельного чипа с текстом «Принятый»/«Пропущенный»
    // (т.е. статус отображается ТОЛЬКО через пиктограмму).
    // Проверяем что нет элемента с классом chip, содержащего только «Принятый»
    const chips = document.querySelectorAll('.chip');
    chips.forEach((chip) => {
      // chip для пиктограммы — допустим, но не должен содержать слово «Принят»/«Пропущен»
      // как текстовый контент (title — допустим)
      expect(chip.textContent?.trim()).toMatch(/✓|✕/);
    });
  });

  it('при пустом ответе API показывает empty state', async () => {
    getCallHistory.mockResolvedValue([]);
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText('У вас пока нет звонков')).toBeInTheDocument(),
    );
  });

  it('при ошибке загрузки показывает сообщение об ошибке', async () => {
    getCallHistory.mockRejectedValue(new Error('network'));
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText(/Не удалось загрузить звонки/)).toBeInTheDocument(),
    );
  });
});
