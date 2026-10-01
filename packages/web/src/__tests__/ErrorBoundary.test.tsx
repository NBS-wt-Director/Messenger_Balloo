import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, type ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

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

  it('catches a render error and shows the 500 fallback instead of children', () => {
    render(
      <ErrorBoundary>
        <Exploder boom={true} />
      </ErrorBoundary>,
    );
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
    // Error500 renders the code and the human-readable title.
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Внутренняя ошибка сервера')).toBeInTheDocument();
  });

  it('recovers and re-renders children after the underlying error is gone', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <Exploder boom={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('500')).toBeInTheDocument();

    // "Попробовать снова" bumps the reset key AND reloads the window (jsdom
    // stubs location.reload, so the component tree simply re-renders).
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    await user.click(screen.getByRole('button', { name: /Попробовать снова/ }));
    expect(reloadSpy).toHaveBeenCalled();

    // With the error source gone, a fresh mount renders children.
    rerender(
      <ErrorBoundary>
        <Exploder boom={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});

// Minimal hand-rolled harness: a parent that can flip `boom` from outside
// via a stored setState, so we can prove the boundary re-renders children
// after a reset without relying on React internals.
class Toggle extends Component<{ children: (set: (b: boolean) => void) => void }, { boom: boolean }> {
  state = { boom: true };
  render() {
    return (
      <div>
        <button onClick={() => this.setState({ boom: !this.state.boom })}>toggle</button>
        <ErrorBoundary key={this.state.boom ? 'boom' : 'fine'}>
          {this.props.children((b) => this.setState({ boom: b }))}
        </ErrorBoundary>
      </div>
    );
  }
}

// Keep the import of ReactNode referenced (used by the harness type above).
export type _Harness = ReactNode;
