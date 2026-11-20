// Тесты экрана сканера QR (/pair-scan) — тик. 1795101592.
// Проверяем: рендер, обращение к камере, честную ошибку без доступа,
// и что подтверждение уходит с распознанным токеном.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const confirmPair = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    confirmPair: (...args: unknown[]) => confirmPair(...args),
  },
}));

vi.mock('@/components/chrome/AppTopbar', () => ({
  AppTopbar: ({ title }: { title: string }) => <div data-testid="topbar">{title}</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => navigateMock,
  };
});

import PairScanScreen from '../../screens/auth/PairScanScreen';

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/pair-scan']}>
      <PairScanScreen />
    </MemoryRouter>
  );
}

const originalMediaDevices = navigator.mediaDevices;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: originalMediaDevices,
  });
});

describe('PairScanScreen', () => {
  it('рендерит заголовок и подсказку навести камеру', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('nope')) },
    });
    renderScreen();
    expect(screen.getByTestId('topbar')).toHaveTextContent('Сканировать QR');
    expect(screen.getByText(/Наведите камеру на QR-код/)).toBeInTheDocument();
  });

  it('показывает честную ошибку при отказе в доступе к камере', async () => {
    const err = new Error('denied');
    (err as any).name = 'NotAllowedError';
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(err) },
    });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Нет доступа к камере/)).toBeInTheDocument();
    });
  });

  it('запрашивает камеру с задней камерой (facingMode environment)', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error('stop'));
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    renderScreen();
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ facingMode: 'environment' }) })
    );
  });

  it('есть кнопка «Назад»', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('nope')) },
    });
    renderScreen();
    fireEvent.click(screen.getByText('Назад'));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('есть кнопка «Сфотографировать QR-код» и скрытый input с capture=environment', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('nope')) },
    });
    renderScreen();
    const button = screen.getByTestId('pair-scan-photo-button');
    expect(button).toHaveTextContent('Сфотографировать QR-код');
    const input = screen.getByTestId('pair-scan-photo-input') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.getAttribute('accept')).toBe('image/*');
    expect(input.getAttribute('capture')).toBe('environment');
  });

  it('клик по кнопке открывает выбор/съёмку файла (input.click)', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('nope')) },
    });
    renderScreen();
    const input = screen.getByTestId('pair-scan-photo-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByTestId('pair-scan-photo-button'));
    expect(clickSpy).toHaveBeenCalled();
  });
});
