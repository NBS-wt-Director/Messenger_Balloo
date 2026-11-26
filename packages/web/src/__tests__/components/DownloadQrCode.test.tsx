// Тикет 1795683301 (D2): QR на download.balloo.su раньше был CSS-имитацией
// (repeating-conic-gradient) и сканерами не читался. Требование владельца:
// QR ведёт на download.balloo.su. Тест фиксирует, что значение уходит в
// настоящий кодировщик `qrcode`, а не рисуется декоративным градиентом.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const toStringMock = vi.fn();

vi.mock('qrcode', () => ({
  default: { toString: (...args: unknown[]) => toStringMock(...args) },
}));

import { QRCode } from '../../screens/download/components/QRCode';

describe('QRCode (download.balloo.su)', () => {
  beforeEach(() => {
    toStringMock.mockReset();
  });

  it('кодирует значение через qrcode и рендерит <img>', async () => {
    toStringMock.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    const { container } = render(<QRCode value="https://download.balloo.su" />);

    await waitFor(() => {
      expect(toStringMock).toHaveBeenCalled();
    });

    expect(toStringMock.mock.calls[0][0]).toBe('https://download.balloo.su');
    expect(toStringMock.mock.calls[0][1]).toMatchObject({
      type: 'svg',
      errorCorrectionLevel: 'H',
    });

    // setSrc происходит в .then() после toString — ждём появления <img>,
    // а не только вызова кодировщика.
    const img = await waitFor(() => {
      const el = container.querySelector('img');
      expect(el).toBeTruthy();
      return el as HTMLImageElement;
    });
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    expect(img.getAttribute('alt')).toContain('https://download.balloo.su');
  });

  it('не рисует CSS-имитацию (нет repeating-conic-gradient)', () => {
    toStringMock.mockResolvedValue('<svg></svg>');
    const { container } = render(<QRCode value="https://download.balloo.su" />);
    expect(container.innerHTML).not.toContain('repeating-conic-gradient');
  });

  it('при ошибке кодирования показывает ссылку текстом, а не битый QR', async () => {
    toStringMock.mockRejectedValue(new Error('boom'));
    const { container, findByText } = render(<QRCode value="https://download.balloo.su" />);

    const link = await findByText('https://download.balloo.su');
    expect(link).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });
});
