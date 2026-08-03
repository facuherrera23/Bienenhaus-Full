import { render } from 'preact';
import { Router } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';
import { Component } from 'preact';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { initAuth } from './store/app';
import { initSentry } from './lib/sentry';
import { queryClient } from './lib/query/client';
import '@bienenhaus/ui/tokens.css';
import './styles.css';

initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION || 'dev',
});

initAuth();

interface ErrorBoundaryState {
  error: Error | null;
}

class SentryErrorBoundary extends Component<{ children: any }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    import('./lib/sentry').then(({ captureException }) => captureException(error));
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Algo salió mal</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

render(
  <QueryClientProvider client={queryClient}>
    <SentryErrorBoundary>
      <Router hook={useHashLocation}>
        <App />
      </Router>
    </SentryErrorBoundary>
  </QueryClientProvider>,
  document.getElementById('app')!,
);
