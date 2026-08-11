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
import '@bienenhaus/ui/tokens.css';                    // 1. Tokens base
import './styles/animations.module.css';              // 2. Animaciones globales
import './styles/buttons.module.css';                 // 3. Sistema de botones
import './styles/tables.module.css';                  // 4. Tablas premium
import './styles/forms.module.css';                   // 5. Formularios premium
import './styles/cards.module.css';                   // 6. Cards premium
import './styles/modals.module.css';                  // 7. Modales premium
import './styles/ui-kit.module.css';                  // 8. UI Kit premium
import './styles/micro-interactions.module.css';      // 9. Micro-interacciones
import './styles/performance.module.css';             // 10. Optimizaciones rendimiento ← NUEVO
import './styles/responsive.module.css';              // 11. Responsive refinado ← NUEVO
import './styles.css';                                // 12. Estilos existentes (legacy)
import './styles/Login.module.css';                   // 13. Login rediseñado
import './styles/Dashboard.module.css';               // 14. Dashboard rediseñado

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