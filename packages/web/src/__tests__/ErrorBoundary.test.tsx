import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/providers/ErrorBoundary';

// Spy on console.error — React logs uncaught render errors via console.error.
// It pollutes output and is not what we assert on here.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Component that throws during render when `boom` is true.
function Exploder({ boom }: { boom: boolean }) {
  if (boom) throw new Error('render exploded');
  return <div>ok</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Exploder boom={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('catches a render error and shows the fallback instead of children', () => {
    render(
      <ErrorBoundary>
        <Exploder boom={true} />
      </ErrorBoundary>,
    );
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
    // Default fallback: заголовок «Что-то пошло не так» + кнопка перезагрузки.
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Обновить страницу/ })).toBeInTheDocument();
  });

  it('uses the custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>КАСТОМНЫЙ ФОЛБЭК</div>}>
        <Exploder boom={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('КАСТОМНЫЙ ФОЛБЭК')).toBeInTheDocument();
    expect(screen.queryByText('Что-то пошло не так')).not.toBeInTheDocument();
  });

  it('reports the error via the onError callback', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Exploder boom={true} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('render exploded');
  });

  it('recovers: click reloads the window (recovery = fresh page load), children render after error is gone', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    const { rerender, unmount } = render(
      <ErrorBoundary>
        <Exploder boom={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();

    // «Обновить страницу» перезагружает окно — в проде это и есть восстановление:
    // страница грузится заново с чистым деревом. (Локальный reset внутри теста
    // не восстанавливает рендер, пока дети бросают — клик по кнопке делает
    // setState({hasError:false}), render видит детей с тем же throw и снова
    // ловит ошибку. Это ожидаемое поведение boundary.)
    fireEvent.click(screen.getByRole('button', { name: /Обновить страницу/ }));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    // После исчезновения источника ошибки новая страница (fresh mount)
    // рендерит детей.
    unmount();
    render(
      <ErrorBoundary>
        <Exploder boom={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
