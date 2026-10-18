// Тесты FileViewer — тикет 1792137290
// Макет: mockups/balloo-su/file-viewer.html (принят 1.1.17 → 6.41).
// Ключевое требование: изображение НЕ обрезается (object-fit:contain, без clip-path).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { FileViewer } from '../../components/chat/FileViewer';
import type { FileAttachment } from '../../components/chat/FileViewer';

const ATTACHMENTS: FileAttachment[] = [
  { id: 'a1', type: 'image', url: 'https://example.com/img1.jpg', name: 'photo1.jpg', size: 102400 },
  { id: 'a2', type: 'image', url: 'https://example.com/img2.png', name: 'photo2.png', size: 204800 },
];

describe('FileViewer', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит просмотрщик с toolbar', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    expect(screen.getByText('✕ Закрыть')).toBeInTheDocument();
    expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('показывает изображение с object-fit:contain (без clip-path)', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    const img = screen.getByRole('img', { name: /photo1/i });
    expect(img).toBeInTheDocument();
    // object-fit: contain
    expect(img.style.objectFit).toBe('contain');
    // clip-path НЕ должен быть
    expect(img.style.clipPath).toBeFalsy();
  });

  it('клик "Закрыть" вызывает onClose', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('✕ Закрыть'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Esc закрывает просмотрщик', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('стрелки ←/→ переключают файлы', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    // Стрелка вперёд
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Стрелка назад
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('показывает превью-ленту при нескольких файлах', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    // Должно быть 2 превью-миниатюры
    const thumbs = document.querySelectorAll('.file-thumb');
    expect(thumbs.length).toBe(2);
  });

  it('клик по превью переключает файл', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    const thumbs = document.querySelectorAll('.file-thumb');
    fireEvent.click(thumbs[1]);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('кнопка ℹ️ открывает панель свойств', () => {
    render(
      <FileViewer attachments={ATTACHMENTS} initialIndex={0} onClose={onClose} />
    );

    fireEvent.click(screen.getByTitle('Свойства файла'));
    expect(screen.getByText('Свойства файла')).toBeInTheDocument();
    expect(screen.getByText(/100.0 KB/)).toBeInTheDocument();
  });

  it('не-изображение показывает пиктограмму и кнопку скачать', () => {
    const pdfAttachment: FileAttachment[] = [
      { id: 'a1', type: 'document', url: 'https://example.com/doc.pdf', name: 'report.pdf', size: 512000 },
    ];
    render(
      <FileViewer attachments={pdfAttachment} initialIndex={0} onClose={onClose} />
    );

    // Имя файла видно в toolbar
    const nameEls = screen.getAllByText('report.pdf');
    expect(nameEls.length).toBeGreaterThanOrEqual(1);
    // Кнопка скачать
    expect(screen.getByText('📥 Скачать')).toBeInTheDocument();
  });
});
