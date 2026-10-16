// Тесты экрана «Добавить устройство» (/add-device) — тикет 1792124255
// Макет: mockups/balloo-su/add-device.html (принят 1.1.10 → 6.34).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const createPairToken = vi.fn();
const getPairStatus = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    createPairToken: (...args: unknown[]) => createPairToken(...args),
    getPairStatus: (...args: unknown[]) => getPairStatus(...args),
  },
}));

vi.mock('@/components/chrome/AppTopbar', () => ({
  AppTopbar: ({ title }: { title: string; right?: React.ReactNode }) => (
    <div data-testid="topbar"><span>{title}</span></div>
  ),
}));

vi.mock('@/components/chrome/AppFooter', () => ({
  AppFooter: () => <div data-testid="footer" />,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as object,
    useNavigate: () => navigateMock,
  };
});

import AddDeviceScreen from '../../screens/auth/AddDeviceScreen';

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/add-device']}>
      <AddDeviceScreen />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  createPairToken.mockResolvedValue({
    token: 'test-token-abc123',
    expiresIn: 60,
  });
  getPairStatus.mockResolvedValue({
    status: 'pending',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AddDeviceScreen', () => {
  it('рендерит заголовок "Добавить устройство"', () => {
    renderScreen();
    expect(screen.getByText('➕ Добавить устройство')).toBeInTheDocument();
  });

  it('рендерит AppTopbar с заголовком', () => {
    renderScreen();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
  });

  it('рендерит AppFooter', () => {
    renderScreen();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('рендерит кнопку «Обновить код»', () => {
    renderScreen();
    expect(screen.getByText('🔄 Обновить код')).toBeInTheDocument();
  });

  it('рендерит кнопку «Отмена»', () => {
    renderScreen();
    expect(screen.getByText('Отмена')).toBeInTheDocument();
  });

  it('рендерит карточку инструкции', () => {
    renderScreen();
    expect(screen.getByText('Как войти через другое устройство')).toBeInTheDocument();
  });

  it('рендерит карточку «Как это работает»', () => {
    renderScreen();
    expect(screen.getByText('Как это работает')).toBeInTheDocument();
  });

  it('рендерит карточку «Безопасность»', () => {
    renderScreen();
    expect(screen.getByText('Безопасность')).toBeInTheDocument();
  });

  it('рендерит QR-код с таймером 60 сек', () => {
    renderScreen();
    expect(screen.getByText(/QR-код действует/)).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('рендерит код balloo://pair/', () => {
    renderScreen();
    expect(screen.getByText(/balloo:\/\/pair\//)).toBeInTheDocument();
  });

  it('при mount вызывает createPairToken', async () => {
    renderScreen();
    await waitFor(() => {
      expect(createPairToken).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('при mount вызывает getPairStatus с токеном', async () => {
    renderScreen();
    await waitFor(() => {
      expect(getPairStatus).toHaveBeenCalledWith('test-token-abc123');
    }, { timeout: 3000 });
  });

  it('при нажатии «Обновить код» вызывает createPairToken', async () => {
    renderScreen();
    await waitFor(() => {
      expect(createPairToken).toHaveBeenCalled();
    }, { timeout: 3000 });
    vi.clearAllMocks();
    const refreshBtn = screen.getByText('🔄 Обновить код');
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(createPairToken).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('отображает текст инструкции по шагам', () => {
    renderScreen();
    expect(screen.getByText(/Откройте Balloo на устройстве/)).toBeInTheDocument();
    expect(screen.getByText(/Наведите камеру/)).toBeInTheDocument();
    expect(screen.getByText(/Готово!/)).toBeInTheDocument();
  });

  it('отображает пункты безопасности', () => {
    renderScreen();
    expect(screen.getByText(/Токен одноразовый/)).toBeInTheDocument();
    expect(screen.getByText(/Подтверждение требуется на обоих устройствах/)).toBeInTheDocument();
  });
});

describe('AddDeviceScreen — API interactions', () => {
  it('createPairToken возвращает токен и expiresIn', async () => {
    renderScreen();
    await waitFor(() => {
      expect(createPairToken).toHaveBeenCalled();
    }, { timeout: 3000 });
    expect(createPairToken).toHaveBeenLastCalledWith();
  });

  it('getPairStatus опрашивает статус pair-токена', async () => {
    renderScreen();
    await waitFor(() => {
      expect(getPairStatus).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('при сетевой ошибке в poll не падает', async () => {
    getPairStatus.mockRejectedValueOnce(new Error('Network error'));
    const { container } = renderScreen();
    await waitFor(() => {
      expect(getPairStatus).toHaveBeenCalled();
    }, { timeout: 3000 });
    expect(container.firstChild).not.toBeNull();
  });
});

describe('AddDeviceScreen — confirmed / expired', () => {
  it('при confirmed перенаправляет на /chat', async () => {
    getPairStatus.mockResolvedValueOnce({ status: 'confirmed' });
    renderScreen();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/chat', { replace: true });
    }, { timeout: 5000 });
  });

  it('при expired вызывает refreshQr', async () => {
    getPairStatus.mockResolvedValueOnce({ status: 'expired' });
    renderScreen();
    await waitFor(() => {
      expect(getPairStatus).toHaveBeenCalled();
    }, { timeout: 3000 });
    // После expired refreshQr вызывает createPairToken повторно
    await waitFor(() => {
      expect(createPairToken).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });
});
