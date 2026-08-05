import { Component, type ComponentChildren } from 'preact';

export interface ErrorBoundaryProps {
  children: ComponentChildren;
  /**
   * Cuando cambia, resetea el estado de error. Útil para páginas:
   * pasar la location actual y recuperarse al navegar.
   */
  resetKey?: string;
  /** Callback opcional al capturar un error (logging, analytics, etc.) */
  onError?: (error: Error, componentStack?: string) => void;
  title?: string;
  description?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Error Boundary reutilizable (Preact class component).
 * Funciona sin Sentry: muestra un fallback y ofrece "Reintentar".
 * Si Sentry está inicializado (DSN configurado), reporta el error
 * vía `captureBoundaryError` de forma lazy.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string } | undefined) {
    this.props.onError?.(error, errorInfo?.componentStack);

    // Reporte a Sentry opcional: no-op seguro si no está inicializado.
    // Lazy import para no cargar @sentry/browser salvo que haya un error.
    void import('../lib/sentry').then(({ captureBoundaryError }) => {
      captureBoundaryError(error, errorInfo?.componentStack ?? '', 'ErrorBoundary');
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="card placeholder-card" role="alert">
          <h2>{this.props.title ?? 'Algo salió mal'}</h2>
          <p>{this.props.description ?? this.state.error.message}</p>
          <button type="button" className="btn btn--primary" onClick={this.handleReset}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
