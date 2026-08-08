import { render } from 'preact';
import { Router } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initAuth, authLoading } from './store/app';
import { initSentry } from './lib/sentry';
import { queryClient } from './lib/query/client';
import '@bienenhaus/ui/tokens.css';
import './styles.css';
import './styles/shell.css';
import './styles/sidebar.css';
import './styles/topbar.css';

initSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'dev',
});

await initAuth();

function Root() {
    if (authLoading.value) {
        return <div className="app-loading">Cargando…</div>;
    }
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <Router hook={useHashLocation}>
                    <App />
                </Router>
            </ErrorBoundary>
        </QueryClientProvider>
    );
}

render(<Root />, document.getElementById('app')!);
