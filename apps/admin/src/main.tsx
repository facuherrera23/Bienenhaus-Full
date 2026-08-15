// apps/admin/src/main.tsx
import { render } from 'preact';
import { Router } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initAuth, authLoading } from './store/app';
import { initSentry } from './lib/sentry';
import { queryClient } from './lib/query/client';

// ============================================================
// ✅ ESTILOS — Importar en orden (FASE 7 - FINAL)
// ============================================================
import '@bienenhaus/ui/tokens.css'; // 1. Tokens base
import './styles/redesign.css'; // FASE 3 layout moderno (sidebar más ancho, topbar más bajo, sombras suaves, radios refinados) — SÓLO diseño visual, no toca lógica
import './styles.css'; // 2. Estilos existentes (legacy)
import './styles/Login.module.css'; // 13. Login rediseñado
import './styles/Dashboard.module.css'; // 14. Dashboard rediseñado

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
