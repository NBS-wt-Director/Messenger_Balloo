// Error Boundary — обработка ошибок React
// Catches rendering errors and shows fallback UI

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'var(--font-primary)',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Что-то пошло не так
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Произошла непредвиденная ошибка при рендеринге компонента.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '0',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Обновить страницу
          </button>
          {/* Development-only error details */}
          {false && this.state.error && (
            <details
              style={{
                marginTop: '1.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'left',
                maxWidth: '600px',
              }}
            >
              <summary>Details (dev)</summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                {this.state.error!.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
